# Vapi voice concierge — wiring guide

## 1. Tool server URL

All seven tools from `03_TOOL_PARAMETER_SCHEMAS.json` point at one endpoint:

```
https://www.theroyeffect.com/api/public/vapi
```

Add this header to every tool's server config (value = the `VAPI_SERVER_SECRET`
stored in this project's backend secrets):

```
x-vapi-secret: <VAPI_SERVER_SECRET>
```

Requests without a matching secret get `401`. Every call is written to the
`voice_agent_logs` table with its arguments and result.

Supported tool names: `capture_lead`, `create_audit_request`,
`get_discovery_availability`, `book_discovery_call`, `send_approved_followup`,
`send_onboarding_questionnaire`, `create_human_followup`.

## 2. Where data lands

| Tool | Table |
| --- | --- |
| capture_lead | `voice_leads` (deduped by email) |
| create_audit_request | `voice_audit_requests` + lead stage `audit_in_progress` |
| book_discovery_call | `voice_bookings` (15 min, double-booking blocked) |
| create_human_followup | `voice_followups` |
| all | `voice_agent_logs` |

Emails go through the existing Lovable email setup: the lead gets an approved
template (`voice-agent-followup`), Rory gets a notification
(`voice-agent-notification`) at rory@theroyeffect.com.

Availability is generated Mon–Fri at 10:00, 13:00 and 15:00 Central, up to three
open slots, skipping anything already booked.

## 3. Website voice widget

Set these two env vars (public, from the Vapi dashboard) and the floating
"Talk to us" button appears sitewide:

```
VITE_VAPI_PUBLIC_KEY=<vapi public key>
VITE_VAPI_ASSISTANT_ID=<assistant id>
```

Without them the widget renders nothing.

## 4. Assistant config

Paste the system prompt from `01_ASSISTANT_SYSTEM_PROMPT.md` and use
`05_ASSISTANT_CONFIG_TEMPLATE.json`, replacing the tool ID placeholders with the
IDs of the tools created in step 1.
