/**
 * Builds a per-recipient context block from the client's real records —
 * portal projects, milestones, proposals, orders — so AI-drafted emails
 * reference their actual engagement instead of a generic template.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface ClientProjectContext {
  projects: Array<{
    title: string;
    status: string;
    summary: string | null;
    nextStep: string | null;
    startDate: string | null;
    targetDate: string | null;
    pendingMilestones: string[];
    completedMilestones: string[];
  }>;
  latestProposal: {
    projectTitle: string;
    status: string;
    timelineWeeks: string;
    totalPriceCents: number;
    depositCents: number;
    balanceCents: number;
    sentAt: string | null;
  } | null;
}

const EMAILS_PER_QUERY = 25;

/**
 * Fetches project context for a batch of recipient emails (case-insensitive).
 * Returns a map keyed by lowercased email; recipients with no records are absent.
 */
export async function fetchClientContextByEmail(
  db: Db,
  emails: string[],
): Promise<Map<string, ClientProjectContext>> {
  const map = new Map<string, ClientProjectContext>();
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))].slice(
    0,
    EMAILS_PER_QUERY,
  );
  if (unique.length === 0) return map;

  // PostgREST `in` filters are case-sensitive for text, so match each email
  // case-insensitively with an `or` group.
  const orFilter = unique.map((e) => `client_email.ilike.${e}`).join(",");

  const [{ data: projects }, { data: proposals }] = await Promise.all([
    db
      .from("client_projects")
      .select("id, client_email, title, summary, status, next_step, start_date, target_date")
      .or(orFilter)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("project_proposals")
      .select(
        "client_email, project_title, status, timeline_weeks, total_price_cents, deposit_cents, balance_cents, created_at",
      )
      .or(unique.map((e) => `client_email.ilike.${e}`).join(","))
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const projectList = (projects ?? []) as Array<{
    id: string;
    client_email: string;
    title: string;
    summary: string | null;
    status: string;
    next_step: string | null;
    start_date: string | null;
    target_date: string | null;
  }>;

  const projectIds = projectList.map((p) => p.id);
  const milestonesByProject = new Map<string, { pending: string[]; completed: string[] }>();
  if (projectIds.length > 0) {
    const { data: milestones } = await db
      .from("client_milestones")
      .select("project_id, title, status, position")
      .in("project_id", projectIds)
      .order("position", { ascending: true })
      .limit(200);
    for (const m of (milestones ?? []) as Array<{
      project_id: string;
      title: string;
      status: string;
    }>) {
      const bucket = milestonesByProject.get(m.project_id) ?? { pending: [], completed: [] };
      if (m.status === "completed") bucket.completed.push(m.title);
      else bucket.pending.push(m.title);
      milestonesByProject.set(m.project_id, bucket);
    }
  }

  const latestProposalByEmail = new Map<string, ClientProjectContext["latestProposal"]>();
  for (const p of (proposals ?? []) as Array<{
    client_email: string;
    project_title: string;
    status: string;
    timeline_weeks: string;
    total_price_cents: number;
    deposit_cents: number;
    balance_cents: number;
    created_at: string;
  }>) {
    const key = p.client_email.trim().toLowerCase();
    if (latestProposalByEmail.has(key)) continue; // newest first — keep the first seen
    latestProposalByEmail.set(key, {
      projectTitle: p.project_title,
      status: p.status,
      timelineWeeks: p.timeline_weeks,
      totalPriceCents: p.total_price_cents,
      depositCents: p.deposit_cents,
      balanceCents: p.balance_cents,
      sentAt: p.created_at,
    });
  }

  for (const p of projectList) {
    const key = p.client_email.trim().toLowerCase();
    const entry = map.get(key) ?? { projects: [], latestProposal: latestProposalByEmail.get(key) ?? null };
    const ms = milestonesByProject.get(p.id);
    entry.projects.push({
      title: p.title,
      status: p.status,
      summary: p.summary,
      nextStep: p.next_step,
      startDate: p.start_date,
      targetDate: p.target_date,
      pendingMilestones: ms?.pending ?? [],
      completedMilestones: ms?.completed ?? [],
    });
    map.set(key, entry);
  }

  // Recipients with a proposal but no project still get proposal context.
  for (const [email, proposal] of latestProposalByEmail) {
    if (!map.has(email)) map.set(email, { projects: [], latestProposal: proposal });
  }

  return map;
}

/** Serializes client context for the AI prompt, or null when there is nothing real to reference. */
export function clientContextForPrompt(ctx: ClientProjectContext | undefined): string | null {
  if (!ctx) return null;
  if (ctx.projects.length === 0 && !ctx.latestProposal) return null;
  return JSON.stringify({
    theirProjectsWithUs: ctx.projects.map((p) => ({
      title: p.title,
      status: p.status,
      summary: p.summary,
      nextStep: p.nextStep,
      startDate: p.startDate,
      targetDate: p.targetDate,
      milestonesDone: p.completedMilestones,
      milestonesRemaining: p.pendingMilestones,
    })),
    latestProposalWeSent: ctx.latestProposal,
  });
}
