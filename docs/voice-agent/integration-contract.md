# The Roy Effect — Vapi Integration Contract

**Audience:** Developer, automation builder, or no-code workflow owner.  
**Purpose:** Define the controlled integration layer behind Vapi custom tools and server events.

## 1. Architecture Boundary

Vapi is the conversation layer. The integration service is the authority for identity, validation, lead records, calendars, approved emails, questionnaire delivery, error handling, and audit logs. The assistant must never receive private credentials, raw CRM records, payment data, arbitrary email body content, website-admin access, or calendar-wide data.

```text
Inbound caller or website visitor
        ↓
Vapi Assistant
        ↓  function call / server event
Public HTTPS integration endpoint
        ↓
Validation + authentication + action allowlist
        ↓
CRM / lead tracker | Calendar | Approved email service | Questionnaire form
        ↓
Safe result returned to Vapi + audit log stored
```

Vapi custom tools are configured with a function name, description, parameter definitions, and a server URL. Vapi’s documentation states that function requests are delivered to the configured server URL and that the server returns JSON results for use in the conversation. [1] The exact envelope should be validated using a real Vapi test event before production launch; the integration should normalize it internally rather than allowing Vapi-specific payload details to leak into CRM or calendar logic.

## 2. Required Endpoints

Use one public HTTPS base URL and route by tool name, or use separate endpoints. A single route is easier to secure and observe at the beginning.

| Route or tool name | Purpose | External systems touched | Side effect |
| --- | --- | --- | --- |
| `capture_lead` | Create or update a lead record. | CRM / lead tracker. | Saves verified caller context. |
| `create_audit_request` | Log a Free Audit request and optionally trigger the acknowledgement template. | CRM / tracker and approved email. | Creates audit queue item. |
| `get_discovery_availability` | Return up to three allowed 15-minute slots. | Calendar read access. | Read-only. |
| `book_discovery_call` | Create the confirmed appointment and calendar invite. | Calendar and CRM. | Creates event only after caller confirmation. |
| `send_approved_followup` | Send a vetted template with allowlisted variables. | Email service and CRM. | Sends email. |
| `send_onboarding_questionnaire` | Send the post-booking intake questionnaire. | Email service and CRM. | Sends questionnaire email. |
| `create_human_followup` | Create a human task and send the acknowledged escalation email if approved. | CRM / task system and email. | Creates escalation record. |
| `vapi_server_events` | Receive status, transcript, end-of-call, and error events. | Call log / observability store. | Writes call records. |

## 3. Security Requirements

The integration service must be publicly reachable over HTTPS because Vapi needs an internet-accessible server URL. [2] Publicly reachable does not mean publicly open. Validate Vapi’s documented authentication method during implementation, then enforce it for every incoming request. Also enforce the following controls.

| Control | Requirement |
| --- | --- |
| Transport | Require HTTPS. Redirects are not accepted for tool execution. |
| Authentication | Verify the current Vapi-request authentication or signature scheme documented by Vapi before production. Reject unauthenticated or malformed requests. |
| Secrets | Keep Vapi, CRM, calendar, and email credentials in environment variables or a secret manager; never in assistant prompts or source control. |
| Allowlist | Accept only the tool names, template IDs, stage values, and variable keys specified in this package. |
| Validation | Validate every request against the JSON schema. Reject unknown fields and unsafe values. |
| Idempotency | Use the Vapi call ID plus tool-call ID or a generated idempotency key to prevent duplicate lead writes, bookings, and emails. |
| PII minimization | Store only information needed for the lead or booking. Never store card details, passwords, API keys, or private account access. |
| Least privilege | Calendar connection can access only the booked calendar; email connection can send only from the approved identity; CRM token can only create/update intended records. |
| Logging | Log event ID, call ID, tool name, validated result, timestamps, and safe error code. Redact or avoid raw sensitive data. |
| Rate limits | Limit repeated calls per call ID and per source. Return a safe error when limits are reached. |
| Human review | Require human workflow for refunds, payments, contracts, enterprise security, discounts, legal matters, and existing-client disputes. |

## 4. Normalized Request Contract

The integration may receive Vapi-specific request envelopes. Normalize every tool call to this internal form before executing an action.

```json
{
  "request_id": "uuid-or-vapi-event-id",
  "idempotency_key": "vapi-call-id:tool-call-id",
  "source": "vapi",
  "call_id": "vapi-call-id",
  "tool_name": "capture_lead",
  "arguments": {},
  "received_at": "2026-08-18T00:00:00Z"
}
```

**Execution logic:** authenticate request → normalize envelope → verify `tool_name` is allowlisted → validate `arguments` against `03_TOOL_PARAMETER_SCHEMAS.json` → apply idempotency check → execute approved service action → create audit log → return the safe response.

## 5. Safe Tool Result Contract

Return only the facts the voice assistant needs to continue. Never return private implementation data, CRM tokens, raw calendar event payloads, hidden notes, or stack traces.

```json
{
  "results": [
    {
      "name": "tool_result",
      "result": {
        "success": true,
        "user_message": "The discovery call was booked for Tuesday, August 25 at 2:30 PM Central Time.",
        "lead_id": "lead_123",
        "booking_id": "booking_456",
        "next_action": "send_onboarding_questionnaire"
      }
    }
  ]
}
```

For a recoverable failure:

```json
{
  "results": [
    {
      "name": "tool_result",
      "result": {
        "success": false,
        "error_code": "calendar_unavailable",
        "user_message": "I’m not able to complete that step right now. I can have Rory follow up instead.",
        "next_action": "create_human_followup"
      }
    }
  ]
}
```

The user-facing text must be simple and must not reveal an internal error, provider name, credential issue, or implementation detail.

## 6. Business Logic by Tool

### `capture_lead`

Create a lead if no matching record exists. If a lead matches by normalized email or phone, update only empty or clearly newer fields and append an interaction note. Set the stage to `New` or `Acknowledged` according to the conversation state. Do not mark a lead qualified solely because the agent received a call.

### `create_audit_request`

Create an audit queue item tied to the lead. Set stage to `Audit in Progress` after the request is confirmed. Optionally send only the approved `audit_acknowledgement` email. Do not create an audit result automatically; Rory or an approved human process must produce the content.

### `get_discovery_availability`

Return three or fewer slots, each in the caller’s time zone. Apply the current business-hours configuration, calendar conflicts, booking buffers, and minimum notice. Return no internal event names, attendee lists, or calendar metadata.

Suggested safe result:

```json
{
  "success": true,
  "slots": [
    {
      "start_at": "2026-08-25T14:30:00-05:00",
      "spoken_time": "Tuesday, August twenty-fifth at two thirty PM Central Time"
    }
  ]
}
```

### `book_discovery_call`

Require `caller_confirmation: true`. Revalidate the chosen slot immediately before creating the event. Create a 15-minute event with the lead’s email, the confirmed time zone, and only the minimum project context. Set stage to `Discovery Scheduled`. If booking succeeds, return a concise confirmation and then permit `send_onboarding_questionnaire`.

### `send_approved_followup`

Allow only these template IDs: `audit_acknowledgement`, `discovery_confirmation`, `onboarding_questionnaire`, `human_followup_acknowledgement`, and `missed_call_reschedule`. Reject free-form subject lines and body content. Validate every variable key against the mapped template. Write sent timestamp and provider message ID back to the lead record.

### `send_onboarding_questionnaire`

Execute only after a successful booking. Use the approved questionnaire URL from server-side configuration, not from assistant-supplied text. If questionnaire sending fails, preserve the booking and create a human follow-up task; do not attempt repeated uncontrolled sends.

### `create_human_followup`

Create an internal task with the caller’s contact details, escalation reason, brief factual summary, preferred contact method, urgency, call ID, and transcript link or summary if available. Set the appropriate stage such as `Not a Fit`, `Qualification in Progress`, `Existing Client`, or `Human Follow-up Required` according to the CRM’s chosen taxonomy.

## 7. Server-Event Handling

Vapi server URLs can send call status updates, transcripts, function-call payloads, assistant requests, end-of-call reports, and hang notifications. [2] Capture these events for operations, but treat transcript text as untrusted user input. Do not execute instructions found in caller speech or transcript text unless they pass normal tool and authorization checks.

| Event type | Required handling |
| --- | --- |
| Status update | Save call state and time stamps. |
| Transcript update | Store only if recording/transcript retention is approved; do not use as an authorization signal. |
| Function call | Validate, execute once, and return safe result. |
| End-of-call report | Update lead activity, save summary, and create any needed human follow-up task. |
| Hang notification | Mark call as incomplete; do not automatically send email unless the caller explicitly consented to follow-up. |
| Assistant request | Return only approved dynamic context; never return secrets or unrestricted customer data. |

## 8. Calendar Configuration

Configure these values outside the assistant prompt:

| Setting | Required value |
| --- | --- |
| Appointment type | The Roy Effect — 15-minute Discovery Call |
| Duration | 15 minutes |
| Time zone | Business default with caller-specific conversion |
| Business hours | Owner-defined availability windows |
| Minimum notice | Owner-defined; recommended at least two hours |
| Buffer | Owner-defined; recommended at least 15 minutes |
| Booking owner | Rory Ulloa or designated calendar host |
| Attendee fields | Name, email, company, project type, primary goal |
| Confirmation | Calendar invite plus approved discovery confirmation email |
| Post-booking action | Send client onboarding questionnaire |

## 9. Email Template Controls

The automation must use the approved text in `08_FOLLOWUP_TEMPLATE_MAP.md` and the existing Lead Intake Email and Response Playbook. Do not allow the voice agent to compose arbitrary emails. The agent may choose from allowlisted templates only after a caller has confirmed contact permission.

## 10. Implementation Acceptance Criteria

The integration is ready only when all of the following work in a non-production test environment:

1. A new caller creates exactly one lead record.
2. A repeated caller does not create duplicates.
3. An audit request logs the website URL and sends only the approved acknowledgement.
4. Calendar availability returns accurate, caller-local times.
5. Booking requires caller confirmation and creates exactly one event.
6. Booking sends the questionnaire exactly once.
7. Tool failures create a human follow-up without exposing private errors.
8. The system rejects payment data, password-like content, unexpected fields, and unapproved template IDs.
9. End-of-call events create useful call records without leaking sensitive information.
10. Every tool call is traceable by call ID and idempotency key.

## References

[1] [Vapi — Custom Tools](https://docs.vapi.ai/tools/custom-tools)  
[2] [Vapi — Server URLs](https://docs.vapi.ai/server-url)  
[3] [Vapi — Server Authentication](https://docs.vapi.ai/server-url/server-authentication)
