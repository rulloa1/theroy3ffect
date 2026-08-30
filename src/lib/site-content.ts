// Shared, client-safe editorial content used by both the drawer panels and the
// standalone indexable /services and /pricing routes.

export interface ServiceEntry {
  slug: string;
  name: string;
  summary: string;
  from: string;
  deliverables: string[];
}

export const SERVICES: ServiceEntry[] = [
  {
    slug: "brand-identity",
    name: "Brand identity & visual systems",
    summary:
      "Strategy, logo system and guidelines for early-stage teams and personal brands that need a coherent look before they scale.",
    from: "$2,500",
    deliverables: [
      "Brand strategy workshop",
      "Logo system + variations",
      "Color palette & typography",
      "Written brand guidelines",
      "Two revision rounds",
    ],
  },
  {
    slug: "web-design-uiux",
    name: "Web design & UI/UX",
    summary:
      "Full visual design for websites, apps and digital products — wireframes through high-fidelity, responsive screens and a clickable prototype.",
    from: "$5,000",
    deliverables: [
      "UX audit & wireframes",
      "High-fidelity UI design",
      "Responsive mobile → desktop screens",
      "Clickable prototype",
      "Three revision rounds",
    ],
  },
  {
    slug: "design-and-build",
    name: "Design + no-code build",
    summary:
      "End-to-end: I design it and I ship it. Production build on a modern no-code / AI-assisted stack with forms, payments, analytics and SEO wired up.",
    from: "$8,000",
    deliverables: [
      "Everything in web design",
      "No-code / AI-assisted development",
      "CMS, forms & payments",
      "Launch, analytics & SEO basics",
    ],
  },
  {
    slug: "design-retainer",
    name: "Design retainer",
    summary:
      "A monthly creative-direction and design partnership for teams that ship continuously and need design capacity without a hire.",
    from: "$3,000/mo",
    deliverables: [
      "Ongoing design & build capacity",
      "Priority turnaround",
      "Design system upkeep",
      "Monthly strategy call",
    ],
  },
];

export interface ProcessStep {
  step: string;
  title: string;
  body: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Brief & scope",
    body: "You send a short brief — goals, audience, timeline, budget. I come back with a fixed scope, a price, and a start date. Nothing begins until both are agreed in writing.",
  },
  {
    step: "02",
    title: "Direction",
    body: "One focused round of visual direction: type, colour, layout language and the tone of the interface. We lock a single direction before any production work starts.",
  },
  {
    step: "03",
    title: "Design",
    body: "Full screens designed responsively, mobile through desktop, with real content instead of placeholder text. Revision rounds are set by your tier — two on a Brand Sprint, three on web design and design + build.",
  },
  {
    step: "04",
    title: "Build & launch",
    body: "I build the approved design as a live, responsive site — forms, payments, analytics and SEO basics wired up — then hand over access and a short walkthrough.",
  },
  {
    step: "05",
    title: "After launch",
    body: "Post-launch support is included for the first two weeks. Teams that keep shipping move onto a monthly retainer for continuous design and build work.",
  },
];
