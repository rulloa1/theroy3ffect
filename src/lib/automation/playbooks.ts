export const FOLLOWUP_PLAYBOOKS = {
  new_lead_no_contact: {
    label: "New lead, no contact yet",
    goal: "Thank them for reaching out, restate what they said they need, and ask them to book a free discovery call.",
    ctaLabel: "Book a discovery call",
    ctaPath: "/book",
  },
  inquiry_unanswered: {
    label: "Contact form inquiry unanswered",
    goal: "Reply to their message personally, acknowledge the specific project they described, and invite them to book a call.",
    ctaLabel: "Book a discovery call",
    ctaPath: "/book",
  },
  audit_pending: {
    label: "Free audit requested",
    goal: "Confirm the audit is underway, name the site they asked about and the bottleneck they mentioned, and set expectations for a short call to walk through findings.",
    ctaLabel: "Book your audit walkthrough",
    ctaPath: "/book",
  },
  booking_no_show: {
    label: "Missed discovery call",
    goal: "Warm, no-guilt note about the missed call and a direct invitation to pick a new time.",
    ctaLabel: "Pick a new time",
    ctaPath: "/book",
  },
  post_call_no_proposal: {
    label: "Call happened, no proposal yet",
    goal: "Recap the call at a high level, confirm scope direction, and tell them a scoped proposal is coming — ask for anything still missing.",
    ctaLabel: "See services and pricing",
    ctaPath: "/pricing",
  },
  abandoned_deposit: {
    label: "Checkout started, deposit unpaid",
    goal: "Gentle nudge that their deposit checkout is still open, restate what the tier includes, and offer to answer questions before they pay.",
    ctaLabel: "Finish your booking",
    ctaPath: "/pricing",
  },
} as const;

export type PlaybookKey = keyof typeof FOLLOWUP_PLAYBOOKS;

export const SITE_URL = "https://www.theroyeffect.com";
