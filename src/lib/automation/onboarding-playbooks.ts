/** Client-safe definitions for the purchase → project setup agent. */

export interface OnboardingPlaybook {
  label: string;
  goal: string;
  projectTitle: (name: string, product: string) => string;
  milestones: { title: string; note: string; dueInDays: number }[];
}

export const ONBOARDING_PLAYBOOKS: Record<string, OnboardingPlaybook> = {
  discovery: {
    label: "Paid discovery call",
    goal: "Get the call prepared: gather context before the call and agree the scope right after it.",
    projectTitle: (name) => `${name} — Discovery`,
    milestones: [
      { title: "Discovery call", note: "Paid and scheduled.", dueInDays: 0 },
      { title: "Kickoff questionnaire", note: "Goals, audience and references collected.", dueInDays: 2 },
      { title: "Scope recap & proposal", note: "Written scope and price sent for approval.", dueInDays: 5 },
    ],
  },
  commission: {
    label: "Commission (deposit or paid in full)",
    goal: "Move a paid commission from brief to launch with a clear design sign-off gate.",
    projectTitle: (name, product) => `${name} — ${product}`,
    milestones: [
      { title: "Brief received", note: "Project brief submitted and reviewed.", dueInDays: 2 },
      { title: "Design direction", note: "Type, colour and layout direction presented.", dueInDays: 7 },
      { title: "Design sign-off", note: "Client approves the design before build starts.", dueInDays: 12 },
      { title: "Build", note: "Approved design built and tested on all screens.", dueInDays: 21 },
      { title: "Launch", note: "Go live, handover and final balance.", dueInDays: 28 },
    ],
  },
  retainer: {
    label: "Monthly retainer",
    goal: "Start the care plan with agreed monthly priorities and a first visible win.",
    projectTitle: (name) => `${name} — Retainer`,
    milestones: [
      { title: "Care plan kickoff", note: "Access, priorities and reporting agreed.", dueInDays: 3 },
      { title: "First improvement shipped", note: "First change live on the site.", dueInDays: 10 },
      { title: "Monthly review", note: "What shipped, what's next.", dueInDays: 30 },
    ],
  },
};

export type OnboardingTrigger = keyof typeof ONBOARDING_PLAYBOOKS;

export const ONBOARDING_STATUSES = ["pending", "ready", "approved", "failed", "dismissed"] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];
