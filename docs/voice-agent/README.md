# The Roy Effect — Vapi Voice-Agent Implementation Package

**Purpose:** This package equips a Vapi voice agent to answer qualified prospect questions, capture leads, route Free Audit requests, book discovery calls, deliver approved follow-up, and send the client onboarding questionnaire. The initial scope is **inbound calls and website voice/chat sessions**. Outbound calling is intentionally excluded until the business has confirmed consent, local rules, and its follow-up policy.

## What This Agent Will Do

The agent acts as **The Roy Effect’s inbound lead-intake concierge**. It identifies the caller’s objective, gives concise and accurate information about approved services and starting prices, gathers qualification information, checks availability, books a 15-minute discovery call, logs a lead, and triggers only approved follow-up templates. It can send callers to the Free Audit flow or the intake questionnaire, but it never promises a custom price, accepts payment information, or starts project work.

The agent is grounded in the public operating model for The Roy Effect: Brand Sprint from $2,500, Website/UI-UX from $5,000, Design + Build from $8,000, and an ongoing $3,000/month retainer. It recognizes that the business uses a written-scope process before work begins. [1]

> **Do not give the agent direct access to payment credentials, website-admin credentials, domain/DNS access, or arbitrary email sending.** All actions must pass through the controlled integration layer described in this package.

## Package Contents

| File | Give it to / use it in | Purpose |
| --- | --- | --- |
| `01_ASSISTANT_SYSTEM_PROMPT.md` | Vapi Assistant → System Prompt | Main call behavior, guardrails, workflows, and language. |
| `02_KNOWLEDGE_BASE.md` | Vapi knowledge source or the assistant prompt | Approved business facts, services, pricing, policies, and FAQ answers. |
| `03_TOOL_PARAMETER_SCHEMAS.json` | Vapi Tools → create function tools | Tool names, descriptions, and parameter schemas. |
| `04_INTEGRATION_CONTRACT.md` | Developer or automation builder | Controlled backend contract for CRM, calendar, email, and intake actions. |
| `05_ASSISTANT_CONFIG_TEMPLATE.json` | Vapi API or dashboard configuration reference | Assistant-level configuration skeleton with placeholders. |
| `06_CALL_FLOWS_AND_STATE_MACHINE.md` | Vapi build review and agent testing | Intent routes, lead stages, decision logic, and human escalation paths. |
| `07_TEST_PLAN.md` | Vapi testing / simulation process | Acceptance tests before publishing. |
| `08_FOLLOWUP_TEMPLATE_MAP.md` | Email/CRM automation | Approved message IDs and field mappings. |
| `SETUP_CHECKLIST.md` | Operator checklist | Launch sequence, secrets, testing, and go-live controls. |

## Choose an Integration Path Before Launching

Vapi assistants can use a first message and system prompt, and Vapi custom tools can send function requests to a publicly accessible server URL. Vapi server URLs can receive status updates, transcript updates, function calls, assistant requests, and end-of-call reports. [2] [3] The agent can be launched without full automation, but it cannot reliably book calls, update a lead tracker, or send forms until one of the following integration paths exists.

| Approach | How it works | Tradeoffs | Cost | Setup complexity |
| --- | --- | --- | --- | --- |
| **Starter: dashboard plus no-code automation** | Vapi function requests are received by a webhook workflow that writes to a sheet/CRM, sends approved emails, and creates calendar bookings. | Fastest path; works well for one operator. It becomes harder to test, version, and extend as workflows grow. | Vapi and automation-platform usage; no custom server to maintain. | Low to medium. |
| **Production: hosted integration service** | A small secure service receives Vapi events and tool calls, validates requests, writes to a database/CRM, checks calendar availability, sends templated email, and logs all outcomes. | Best control, auditability, retry behavior, and room to scale. Requires engineering setup and secret management. | Hosting plus Vapi and connected-service usage. | Medium to high. |

The starter path is appropriate when Rory is the only operator and manual review remains acceptable. The production path is appropriate when calls are frequent, multiple staff members need access, calendar/email logic becomes complex, or reliable audit trails are required. Vapi’s documentation describes server URLs as suitable for cloud servers, serverless functions, and workflow orchestrators. [3]

## Required Accounts, IDs, and Secrets

Collect these before implementation. Do not paste secrets into prompts, email, client documents, or source control.

| Item | Needed for | Owner / storage expectation |
| --- | --- | --- |
| Vapi account and private API key | Assistant creation, phone-number setup, API use. | Store in a server-side secret manager. |
| Vapi phone number or telephony connection | Inbound phone calls. | Configure in Vapi; associate only with the approved assistant. |
| Public HTTPS integration URL | Custom tool and server-event delivery. | Controlled server or approved no-code webhook endpoint. |
| CRM or lead-tracker credentials | Create/update lead records. | Stored only in the integration layer. |
| Calendar credential | Read availability and create discovery calls. | Least-privilege calendar access. |
| Email service credential | Send approved templates. | Transactional or work-email integration; allowlisted templates only. |
| Questionnaire URL | Send client onboarding form after booking. | Published and tested URL. |
| Calendar booking rules | Duration, availability windows, time zone, buffers, owner. | Documented in the integration configuration. |
| Human escalation number / email | Transfer or follow-up when the agent cannot resolve a request. | Tested before go-live. |

## Vapi Dashboard Setup Order

1. Create a new Assistant in Vapi and name it `The Roy Effect — Inbound Lead Concierge`.
2. Select a natural, professional English voice and a supported English transcriber. Add product names and pronunciation hints: `The Roy Effect`, `Rory Ulloa`, `UI/UX`, `Webflow`, `Framer`, `TanStack`, and `theroyeffect.com`.
3. Add the first message and system prompt from `01_ASSISTANT_SYSTEM_PROMPT.md`.
4. Add the business knowledge from `02_KNOWLEDGE_BASE.md` using the knowledge method available in the current Vapi account, or include the concise version in the system prompt until a knowledge source is connected.
5. Create the custom function tools using `03_TOOL_PARAMETER_SCHEMAS.json`, point each at the controlled integration URL, and validate each tool with a test call. Vapi documents custom tools as functions with a name, description, parameters, and server URL. [4]
6. Add the tool IDs or tool configurations to the assistant model configuration. Vapi’s assistant API describes an assistant as a reusable configuration containing the model, voice, transcriber, tools, prompts, and call behavior. [5]
7. Connect the approved inbound number or web-call widget, then test every scenario in `07_TEST_PLAN.md`.
8. Publish only after all required tests pass, the lead tracker is receiving records, booking confirmations arrive correctly, and the escalation route has been verified.

## First Message

Use this first message exactly for inbound calls:

> “Thanks for calling The Roy Effect. I’m the studio’s virtual concierge. Are you calling about a new website, brand, design project, or an existing project?”

## Operating Boundaries

The agent must not: accept card numbers or bank details; promise delivery dates before scope approval; negotiate discounts; quote a custom price; state that an audit proves a technical, legal, accessibility, SEO, conversion, or security issue; provide legal, tax, medical, or financial advice; send unapproved email copy; collect passwords or API keys; or proceed with actions after the caller has asked to stop.

The agent must transfer or create a human follow-up task when the caller asks for Rory, requests a custom quote or enterprise arrangement, reports a billing issue, discusses a current project dispute, requests a sensitive-data action, needs a refund, or becomes frustrated after one clear recovery attempt.

## References

[1] [The Roy Effect — service offer, investment, payments, and published process](https://www.theroyeffect.com/)  
[2] [Vapi — Assistants quickstart](https://docs.vapi.ai/assistants/quickstart)  
[3] [Vapi — Server URLs](https://docs.vapi.ai/server-url)  
[4] [Vapi — Custom Tools](https://docs.vapi.ai/tools/custom-tools)  
[5] [Vapi — Create Assistant API reference](https://docs.vapi.ai/api-reference/assistants/create)
