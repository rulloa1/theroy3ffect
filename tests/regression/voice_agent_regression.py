#!/usr/bin/env python3
"""End-to-end regression test for the voice concierge.

Covers:
  1. Widget renders on the site and clicking "Talk to us" initiates a Vapi web
     call with the configured public key + assistant id (the outbound call is
     intercepted, so no real minutes are billed).
  2. The /api/public/vapi webhook rejects unauthenticated requests and handles
     the full tool path: capture_lead -> create_audit_request ->
     get_discovery_availability -> book_discovery_call (incl. double-booking
     protection) -> create_human_followup, plus unknown-tool fallback.
  3. Rows really landed in the database, then all test rows are deleted.

Usage:
    python3 tests/regression/voice_agent_regression.py [--base-url http://localhost:8080]

Required env: VAPI_SERVER_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Optional env: VITE_VAPI_PUBLIC_KEY, VITE_VAPI_ASSISTANT_ID (read from .env when absent)
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
FAILURES: list[str] = []
CHECKS = 0


def load_dotenv() -> None:
    for name in (".env", ".env.production"):
        path = ROOT / name
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def check(label: str, ok: bool, detail: str = "") -> None:
    global CHECKS
    CHECKS += 1
    print(f"{'PASS' if ok else 'FAIL'}  {label}{f' :: {detail}' if detail and not ok else ''}")
    if not ok:
        FAILURES.append(label)


# --------------------------------------------------------------------------- #
# 1. Widget / browser
# --------------------------------------------------------------------------- #
async def test_widget(base_url: str) -> None:
    print("\n== Widget ==")
    captured: list[dict] = []
    console_errors: list[str] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            permissions=["microphone"],
        )
        page = await context.new_page()
        page.on(
            "console",
            lambda m: console_errors.append(m.text) if m.type == "error" else None,
        )

        async def intercept(route, request):
            body = None
            try:
                body = request.post_data_json
            except Exception:
                body = request.post_data
            captured.append({"url": request.url, "headers": request.headers, "body": body})
            await route.fulfill(
                status=200,
                content_type="application/json",
                # Stop before a real WebRTC session; the SDK will simply error out.
                body=json.dumps({"id": "test-call", "type": "webCall", "webCallUrl": None}),
            )

        await context.route("**://api.vapi.ai/**", intercept)
        await context.route("**://*.daily.co/**", lambda route: route.abort())

        await page.goto(base_url, wait_until="domcontentloaded")
        button = page.get_by_role("button", name="Talk to the studio concierge")
        await button.wait_for(state="visible", timeout=15000)
        check("widget button is rendered", True)

        await button.click()
        for _ in range(60):
            if captured:
                break
            await page.wait_for_timeout(250)

        check("clicking the widget initiates a Vapi web call", bool(captured))
        if captured:
            call = captured[0]
            check("call request targets api.vapi.ai/call/web", "/call/web" in call["url"], call["url"])
            auth = call["headers"].get("authorization", "")
            expected_key = os.environ.get("VITE_VAPI_PUBLIC_KEY", "")
            check("call is authorized with the public key", bool(expected_key) and expected_key in auth)
            body = call["body"] if isinstance(call["body"], dict) else {}
            assistant = body.get("assistantId") or body.get("assistant_id")
            check(
                "call targets the configured assistant",
                assistant == os.environ.get("VITE_VAPI_ASSISTANT_ID"),
                str(assistant),
            )

        fatal = [e for e in console_errors if "is not a constructor" in e or "did not expose" in e]
        check("no SDK constructor errors in console", not fatal, "; ".join(fatal))

        await browser.close()


# --------------------------------------------------------------------------- #
# 2. Webhook
# --------------------------------------------------------------------------- #
def tool_payload(name: str, args: dict, call_id: str) -> dict:
    return {
        "message": {
            "type": "tool-calls",
            "call": {"id": call_id},
            "toolCallList": [
                {"id": str(uuid.uuid4()), "function": {"name": name, "arguments": json.dumps(args)}}
            ],
        }
    }


def post(url: str, payload: dict, secret: str | None) -> requests.Response:
    headers = {"Content-Type": "application/json"}
    if secret:
        headers["x-vapi-secret"] = secret
    return requests.post(url, json=payload, headers=headers, timeout=60)


def result_text(response: requests.Response) -> str:
    try:
        data = response.json()
    except ValueError:
        return response.text
    results = data.get("results") or []
    if results:
        return json.dumps(results[0].get("result", results[0]))
    return json.dumps(data)


def test_webhook(base_url: str, secret: str, email: str) -> None:
    print("\n== Webhook ==")
    url = f"{base_url.rstrip('/')}/api/public/vapi"
    call_id = f"regression-{uuid.uuid4()}"

    r = post(url, tool_payload("capture_lead", {"full_name": "X"}, call_id), None)
    check("unauthenticated POST is rejected", r.status_code == 401, str(r.status_code))

    r = post(
        url,
        tool_payload(
            "capture_lead",
            {
                "full_name": "Regression Bot",
                "email": email,
                "phone": "+12813230450",
                "project_type": "website_uiux",
                "primary_goal": "Automated regression run",
                "consent_to_follow_up": True,
            },
            call_id,
        ),
        secret,
    )
    body = result_text(r)
    check("capture_lead succeeds", r.status_code == 200 and "error" not in body.lower(), body)

    r = post(
        url,
        tool_payload(
            "create_audit_request",
            {
                "full_name": "Regression Bot",
                "email": email,
                "website_url": "https://example.com",
                "primary_bottleneck": "Automated regression run",
                "consent_to_email": True,
            },
            call_id,
        ),
        secret,
    )
    check("create_audit_request succeeds", r.status_code == 200 and "error" not in result_text(r).lower(), result_text(r))

    r = post(url, tool_payload("get_discovery_availability", {"time_zone": "America/Chicago"}, call_id), secret)
    avail = result_text(r)
    check("get_discovery_availability returns slots", r.status_code == 200 and "slot" in avail.lower(), avail)

    slot = (datetime.now(timezone.utc) + timedelta(days=400)).replace(
        minute=0, second=0, microsecond=0
    ).isoformat()
    booking_args = {
        "full_name": "Regression Bot",
        "email": email,
        "slot_start": slot,
        "time_zone": "America/Chicago",
        "notes": "Automated regression run",
    }
    r = post(url, tool_payload("book_discovery_call", booking_args, call_id), secret)
    check("book_discovery_call schedules the slot", r.status_code == 200 and "error" not in result_text(r).lower(), result_text(r))

    r = post(
        url,
        tool_payload("book_discovery_call", {**booking_args, "email": f"dup-{email}"}, call_id),
        secret,
    )
    check("double-booking the same slot is rejected", "unavailable" in result_text(r).lower(), result_text(r))

    r = post(
        url,
        tool_payload(
            "create_human_followup",
            {
                "full_name": "Regression Bot",
                "email": email,
                "reason": "regression",
                "urgency": "low",
                "summary": "Automated regression run",
            },
            call_id,
        ),
        secret,
    )
    check("create_human_followup succeeds", r.status_code == 200 and "error" not in result_text(r).lower(), result_text(r))

    r = post(url, tool_payload("definitely_not_a_tool", {}, call_id), secret)
    check("unknown tool returns a safe fallback", r.status_code == 200, result_text(r))

    r = post(url, {"message": {"type": "status-update", "call": {"id": call_id}}}, secret)
    check("non-tool events are acknowledged", r.status_code == 200, str(r.status_code))

    return call_id


# --------------------------------------------------------------------------- #
# 3. Database verification + cleanup
# --------------------------------------------------------------------------- #
def rest(method: str, table: str, params: str) -> requests.Response:
    base = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return requests.request(
        method,
        f"{base}/rest/v1/{table}?{params}",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        timeout=60,
    )


def verify_and_cleanup(email: str, call_id: str) -> None:
    print("\n== Database ==")
    dup = f"dup-{email}"
    expectations = [
        ("voice_leads", f"email=in.(\"{email}\",\"{dup}\")", True),
        ("voice_audit_requests", f"email=eq.{email}", True),
        ("voice_bookings", f"email=in.(\"{email}\",\"{dup}\")", True),
        ("voice_followups", f"email=eq.{email}", True),
        ("voice_agent_logs", f"call_id=eq.{call_id}", True),
    ]
    for table, filt, expect_rows in expectations:
        r = rest("GET", table, f"select=id&{filt}")
        rows = r.json() if r.ok else []
        check(f"{table} has rows", r.ok and (len(rows) > 0) == expect_rows, f"{r.status_code} {r.text[:200]}")

    for table, filt, _ in expectations:
        r = rest("DELETE", table, filt)
        check(f"{table} test rows cleaned up", r.ok, f"{r.status_code} {r.text[:200]}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.environ.get("REGRESSION_BASE_URL", "http://localhost:8080"))
    parser.add_argument("--skip-widget", action="store_true")
    args = parser.parse_args()

    load_dotenv()
    for required in ("VAPI_SERVER_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"):
        if not os.environ.get(required):
            print(f"Missing required env var: {required}")
            return 2

    email = f"regression+{uuid.uuid4().hex[:10]}@theroyeffect.com"
    print(f"Base URL: {args.base_url}\nTest identity: {email}")

    if not args.skip_widget:
        asyncio.run(test_widget(args.base_url))

    call_id = test_webhook(args.base_url, os.environ["VAPI_SERVER_SECRET"], email)
    verify_and_cleanup(email, call_id)

    print(f"\n{CHECKS - len(FAILURES)}/{CHECKS} checks passed")
    if FAILURES:
        print("Failed: " + ", ".join(FAILURES))
        return 1
    print("Voice concierge regression: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
