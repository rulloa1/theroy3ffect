# The Roy Effect — Vapi Call Flows and Lead State Machine

## 1. Purpose

This document defines what the Vapi assistant should do for each inbound call type. It is the operating map behind the system prompt, custom tools, and CRM stages. The assistant’s success is not measured by call length; it is measured by a correct next step, accurate lead capture, and a clean handoff when human judgment is required.

## 2. Lead Stages

Use these stages consistently in the CRM or tracker. The integration may use different internal labels, but it should map back to this vocabulary.

| Stage | Meaning | How entered | Required next action |
| --- | --- | --- | --- |
| New | Caller information captured but no confirmation sent. | `capture_lead` succeeds. | Acknowledge or qualify. |
| Acknowledged | Caller received an approved acknowledgement. | Approved template sent. | Qualify, audit, or invite to discovery. |
| Awaiting Information | Key details are missing. | Agent or human requests URL, contact, scope, or scheduling detail. | Follow up once. |
| Audit in Progress | A Free Audit request is confirmed and logged. | `create_audit_request` succeeds. | Rory reviews site and sends audit. |
| Audit Delivered | Human has sent the approved audit response. | Manual status update. | Invite to discovery or nurture. |
| Discovery Invited | The caller was offered a discovery call. | Agent provides booking options or link. | Wait for selection or follow up. |
| Discovery Scheduled | Appointment exists and confirmation was sent. | `book_discovery_call` succeeds. | Send onboarding questionnaire. |
| Discovery Scheduled — Intake Received | Questionnaire is submitted. | Form / CRM automation. | Rory reviews before call. |
| Qualification in Progress | Discovery completed; information or decision is still pending. | Human update after call. | Request missing information. |
| Proposal in Progress | The project has enough information for written scope. | Human update. | Deliver scope on committed date. |
| Proposal Sent | Written scope has been delivered. | Human update. | Follow-up / decision. |
| Won | Project accepted and proper commercial step completed. | Human or payment-verified update. | Project kickoff. |
| Nurture | Potential fit but not active now. | Human or agent follow-up logic. | Revisit at approved date. |
| Dormant | Nurture sequence completed without engagement. | Follow-up sequence ends. | No unsolicited repeat contact unless policy allows. |
| Not a Fit | Need, timing, authority, service, or budget does not align. | Agent escalates; human confirms. | Close or refer. |
| Human Follow-up Required | Agent cannot safely or properly resolve the matter. | `create_human_followup` succeeds. | Human response by assigned owner. |

## 3. Main Inbound Routes

### Route A — New Project Inquiry

**Caller signals:** “I need a website,” “I need a redesign,” “Can you help with branding?”, “What do you do?”

```text
Greet → identify intent → explain matching service briefly
      → ask primary goal → ask audience or target buyer
      → ask deadline → ask budget range when appropriate
      → capture lead → invite discovery / check availability
      → caller confirms → book → send questionnaire → close
```

**Minimum data before booking:** name, email, primary goal, project type, time zone, selected slot, and explicit booking confirmation. Company, phone number, website URL, audience, timeline, budget, and decision authority should be captured when available, but the agent must not make the call feel like a form interrogation.

**Agent response if the lead is too early:** “It sounds like the project is still taking shape. I can log your details and have Rory follow up with the best next step.” Then create a human follow-up or nurture record, based on caller consent.

### Route B — Free Audit Request

**Caller signals:** “Can you look at my site?”, “I need an audit,” “My site isn’t converting,” “My website looks dated.”

```text
Greet → confirm website URL → confirm name + email
      → capture primary bottleneck → gather optional priority page/context
      → repeat URL + email → caller confirms
      → create audit request → optionally send acknowledgement → close
```

**Guardrail:** The agent never tells the caller that a page is slow, non-compliant, poorly optimized, inaccessible, or underperforming. It collects the request and lets Rory provide any substantive assessment.

### Route C — Pricing Question

**Caller signals:** “How much is a website?”, “What do you charge?”, “Can you give me a quote?”

```text
State approved starting price → say final scope depends on project factors
                          → ask one qualification question
                          → capture lead or offer discovery
```

**Approved starting-price sequence:** Brand Sprint from $2,500; Website/UI-UX from $5,000; Design + Build from $8,000; Retainer at $3,000/month. Do not say “your project will cost” or offer a discount.

### Route D — Existing Client or Project Issue

**Caller signals:** “I’m already a client,” “My site is down,” “I need a change,” “I have a billing question,” “I need my login.”

```text
Verify caller name + contact → ask for brief issue category
                            → create human follow-up
                            → provide safe acknowledgement → close
```

**Do not:** authenticate account changes by conversation alone; request credentials; share project information; promise a resolution or timeline; troubleshoot a production issue beyond recording the report.

### Route E — Billing, Payment, Refund, or Subscription

**Caller signals:** “I was charged,” “Can I pay?”, “I want a refund,” “Cancel my retainer.”

```text
State that payment details cannot be handled by the voice agent
      → collect safe contact details and a brief issue summary
      → create human follow-up with billing reason
      → close
```

### Route F — Out of Scope, Complaint, or High Frustration

**Caller signals:** unrelated request, legal demand, vendor security review, complaint, profanity, repeated tool failure.

```text
Acknowledge briefly → do not debate or guess
                  → create human follow-up or transfer
                  → close with factual next step
```

## 4. Booking State Machine

| Current state | Trigger | Assistant action | Tool action | Next state |
| --- | --- | --- | --- | --- |
| Qualified conversation | Caller asks to book or agent identifies likely fit. | Ask time zone and preference. | None. | Availability requested. |
| Availability requested | Minimum schedule data available. | Tell caller you are checking options. | `get_discovery_availability`. | Options offered. |
| Options offered | Tool returns slots. | Offer up to three slots. | None. | Selection pending. |
| Selection pending | Caller selects a slot. | Repeat date, time, zone, name, and email; ask for confirmation. | None. | Confirmation pending. |
| Confirmation pending | Caller clearly says yes. | State that you are booking the time. | `book_discovery_call`. | Booked or booking failed. |
| Booked | Tool confirms event creation. | Confirm appointment; tell caller questionnaire is coming. | `send_onboarding_questionnaire`. | Discovery Scheduled. |
| Booking failed | Tool error / slot no longer available. | Offer to have Rory follow up or retrieve new slots once. | `create_human_followup` or retry availability once. | Human Follow-up Required or options offered. |

## 5. Required Confirmations

The agent must get explicit confirmation before taking any of these actions:

| Action | Required confirmation language |
| --- | --- |
| Creating a lead with follow-up | “Is it okay for Rory to follow up at [email / phone]?” |
| Submitting a Free Audit request | “I have [website] and [email]. Would you like me to submit the audit request?” |
| Booking an appointment | “Would you like me to book [date, time, time zone]?” |
| Sending the questionnaire | No separate confirmation is needed after a successful booking if the discovery confirmation made clear that it will be sent. |
| Escalation to human follow-up | “I’ll have Rory follow up at [contact method]. Is that the best way to reach you?” |

## 6. Human Escalation Matrix

| Caller situation | Agent action | Human follow-up priority |
| --- | --- | --- |
| Requests Rory directly | Create follow-up; collect purpose and contact. | Routine unless time-sensitive. |
| Custom quote, discount, enterprise scope, contract issue | Escalate; do not negotiate. | Routine / time-sensitive based on caller. |
| Existing project question | Escalate with project name and issue. | Time-sensitive if launch or outage is stated. |
| Billing / refund / cancel | Escalate; do not accept payment details. | Time-sensitive. |
| Website may be down or broken | Escalate with URL and stated impact. | Urgent if active business impact is stated. |
| Tool fails twice | Stop retrying; create follow-up. | Routine unless booking deadline is stated. |
| Caller angry or complains | Acknowledge; escalate; do not argue. | Time-sensitive. |
| Sensitive information offered | Stop collection; direct caller not to share it; escalate if needed. | Routine. |

## 7. End-of-Call Record

For every completed call, write or update this minimum record using the end-of-call report and tool results:

| Field | Requirement |
| --- | --- |
| Vapi call ID | Required. |
| Date/time and call duration | Required. |
| Source / phone number / web session | Required where available. |
| Caller name and confirmed contact method | Required if collected. |
| Intent | New project; audit; pricing; booking; existing client; billing; other. |
| Lead stage | Required. |
| Key facts | Goal, service, timeline, website, budget, and decision authority only if stated. |
| Tools called and result | Required. |
| Follow-up owner and due date | Required for unresolved requests. |
| Consent to follow up | Required if the conversation triggers email or post-call contact. |

## 8. Call Quality Signals

A strong call has one clear outcome: the agent logged a consented lead, submitted an audit request, booked a correctly confirmed discovery call, sent the questionnaire after booking, or created a human follow-up task. A weak call leaves no owner, no next action, an unconfirmed booking, an inaccurate claim, or an unlogged complaint.
