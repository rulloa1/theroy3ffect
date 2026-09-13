import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/utils/require-admin";

/** New portal tables are not yet in the generated Database types. */
type AnyClient = { from: (table: string) => any };

export const PROJECT_STATUSES = [
  "onboarding",
  "in_progress",
  "in_review",
  "delivered",
  "complete",
] as const;
export const MILESTONE_STATUSES = ["pending", "active", "done"] as const;
export const STAGE_TYPES = ["design", "build"] as const;

export interface ProjectApproval {
  id: string;
  project_id: string;
  milestone_id: string;
  stage_type: "design" | "build";
  status: "awaiting_review" | "approved" | "changes_requested" | "superseded";
  review_url: string | null;
  review_note: string | null;
  client_feedback: string | null;
  decided_by_email: string | null;
  requested_at: string;
  decided_at: string | null;
}

export interface PortalMilestone {
  id: string;
  project_id: string;
  title: string;
  note: string | null;
  link: string | null;
  status: string;
  position: number;
  due_date: string | null;
  completed_at: string | null;
  updated_at: string;
  stage_type: "design" | "build";
  approvals: ProjectApproval[];
}

export interface PortalProject {
  id: string;
  user_id: string | null;
  client_email: string;
  title: string;
  summary: string | null;
  status: string;
  start_date: string | null;
  target_date: string | null;
  next_step: string | null;
  created_at: string;
  updated_at: string;
  milestones: PortalMilestone[];
}

export interface PortalInvoice {
  id: string;
  kind: "commission" | "retainer";
  description: string;
  amount_cents: number;
  currency: string;
  status: string;
  issued_at: string;
  hosted_url: string | null;
  balance_due_cents: number;
}

function toProject(row: Record<string, unknown>): PortalProject {
  const milestones = Array.isArray(row["client_milestones"])
    ? (row["client_milestones"] as Record<string, unknown>[])
    : [];
  const approvals = Array.isArray(row["project_approvals"])
    ? (row["project_approvals"] as Record<string, unknown>[])
    : [];
  const mappedApprovals: ProjectApproval[] = approvals.map((a) => ({
    id: String(a["id"]),
    project_id: String(a["project_id"]),
    milestone_id: String(a["milestone_id"]),
    stage_type: a["stage_type"] === "design" ? "design" : "build",
    status: String(a["status"] ?? "awaiting_review") as ProjectApproval["status"],
    review_url: typeof a["review_url"] === "string" ? a["review_url"] : null,
    review_note: typeof a["review_note"] === "string" ? a["review_note"] : null,
    client_feedback: typeof a["client_feedback"] === "string" ? a["client_feedback"] : null,
    decided_by_email: typeof a["decided_by_email"] === "string" ? a["decided_by_email"] : null,
    requested_at: String(a["requested_at"] ?? ""),
    decided_at: typeof a["decided_at"] === "string" ? a["decided_at"] : null,
  }));
  return {
    id: String(row["id"]),
    user_id: typeof row["user_id"] === "string" ? row["user_id"] : null,
    client_email: String(row["client_email"] ?? ""),
    title: String(row["title"] ?? "Project"),
    summary: typeof row["summary"] === "string" ? row["summary"] : null,
    status: String(row["status"] ?? "onboarding"),
    start_date: typeof row["start_date"] === "string" ? row["start_date"] : null,
    target_date: typeof row["target_date"] === "string" ? row["target_date"] : null,
    next_step: typeof row["next_step"] === "string" ? row["next_step"] : null,
    created_at: String(row["created_at"] ?? ""),
    updated_at: String(row["updated_at"] ?? ""),
    milestones: milestones
      .map((m) => ({
        id: String(m["id"]),
        project_id: String(m["project_id"]),
        title: String(m["title"] ?? ""),
        note: typeof m["note"] === "string" ? m["note"] : null,
        link: typeof m["link"] === "string" ? m["link"] : null,
        status: String(m["status"] ?? "pending"),
        position: Number(m["position"] ?? 0),
        due_date: typeof m["due_date"] === "string" ? m["due_date"] : null,
        completed_at: typeof m["completed_at"] === "string" ? m["completed_at"] : null,
        updated_at: String(m["updated_at"] ?? ""),
        stage_type: m["stage_type"] === "design" ? "design" as const : "build" as const,
        approvals: mappedApprovals
          .filter((a) => a.milestone_id === String(m["id"]))
          .sort((a, b) => b.requested_at.localeCompare(a.requested_at)),
      }))
      .sort((a, b) => a.position - b.position || a.updated_at.localeCompare(b.updated_at)),
  };
}

/** Everything the signed-in client can see in their portal. RLS scopes to their own rows. */
export const getMyPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ projects: PortalProject[]; invoices: PortalInvoice[]; email: string }> => {
      const db = context.supabase as AnyClient;
      const [projectsRes, ordersRes, invoicesRes] = await Promise.all([
        db.from("client_projects").select("*, client_milestones(*), project_approvals(*)").order("created_at", {
          ascending: false,
        }),
        db
          .from("orders")
          .select(
            "id, product_name, tier_label, amount_total, currency, payment_status, created_at, is_deposit, balance_due_cents, balance_status, balance_paid_cents",
          )
          .order("created_at", { ascending: false })
          .limit(50),
        db
          .from("subscription_invoices")
          .select(
            "id, description, amount_due, amount_paid, currency, status, created_at, hosted_invoice_url",
          )
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (projectsRes.error) throw new Error(projectsRes.error.message);

      const invoices: PortalInvoice[] = [
        ...((ordersRes.data ?? []) as Record<string, unknown>[]).map((o) => {
          const balancePaid = o["balance_status"] === "paid";
          const balanceDue = Number(o["balance_due_cents"] ?? 0);
          return {
            id: String(o["id"]),
            kind: "commission" as const,
            description: String(o["tier_label"] || o["product_name"] || "Commission"),
            amount_cents:
              Number(o["amount_total"] ?? 0) +
              (balancePaid ? Number(o["balance_paid_cents"] ?? balanceDue) : 0),
            currency: String(o["currency"] ?? "usd"),
            status: o["is_deposit"]
              ? balancePaid
                ? "paid_in_full"
                : "deposit_paid"
              : String(o["payment_status"] ?? "paid"),
            issued_at: String(o["created_at"] ?? ""),
            hosted_url: null,
            balance_due_cents: balancePaid ? 0 : balanceDue,
          };
        }),
        ...((invoicesRes.data ?? []) as Record<string, unknown>[]).map((i) => ({
          id: String(i["id"]),
          kind: "retainer" as const,
          description: String(i["description"] || "Retainer invoice"),
          amount_cents: Number(i["amount_paid"] ?? i["amount_due"] ?? 0),
          currency: String(i["currency"] ?? "usd"),
          status: String(i["status"] ?? "open"),
          issued_at: String(i["created_at"] ?? ""),
          hosted_url:
            typeof i["hosted_invoice_url"] === "string" ? i["hosted_invoice_url"] : null,
          balance_due_cents: 0,
        })),
      ].sort((a, b) => b.issued_at.localeCompare(a.issued_at));

      return {
        projects: (projectsRes.data ?? []).map(toProject),
        invoices,
        email: String((context.claims as { email?: string } | undefined)?.email ?? ""),
      };
    },
  );

// ---------- Admin management ----------

export const adminListPortalProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ projects: PortalProject[] }> => {
    await assertAdmin(context);
    const db = context.supabase as AnyClient;
    const { data, error } = await db
      .from("client_projects")
      .select("*, client_milestones(*), project_approvals(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { projects: (data ?? []).map(toProject) };
  });

const projectInput = z.object({
  client_email: z.string().trim().email().max(255),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(2000).optional(),
  status: z.enum(PROJECT_STATUSES).default("onboarding"),
  start_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  target_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  next_step: z.string().trim().max(400).optional(),
});

export const adminCreatePortalProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => projectInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase as AnyClient;
    const { error } = await db.from("client_projects").insert({
      client_email: data.client_email.toLowerCase(),
      title: data.title,
      summary: data.summary || null,
      status: data.status,
      start_date: data.start_date || null,
      target_date: data.target_date || null,
      next_step: data.next_step || null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdatePortalProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    projectInput.partial().extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase as AnyClient;
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.client_email) update["client_email"] = data.client_email.toLowerCase();
    if (data.title) update["title"] = data.title;
    if (data.summary !== undefined) update["summary"] = data.summary || null;
    if (data.status) update["status"] = data.status;
    if (data.start_date !== undefined) update["start_date"] = data.start_date || null;
    if (data.target_date !== undefined) update["target_date"] = data.target_date || null;
    if (data.next_step !== undefined) update["next_step"] = data.next_step || null;
    const { error } = await db.from("client_projects").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePortalProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase as AnyClient;
    const { error } = await db.from("client_projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const milestoneInput = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  note: z.string().trim().max(2000).optional(),
  link: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || /^https?:\/\//i.test(v), "Link must start with http(s)://")
    .optional(),
  status: z.enum(MILESTONE_STATUSES).default("pending"),
  position: z.number().int().min(0).max(999).default(0),
  due_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  stage_type: z.enum(STAGE_TYPES).default("build"),
});

export const adminSaveMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => milestoneInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase as AnyClient;
    const row = {
      project_id: data.project_id,
      title: data.title,
      note: data.note || null,
      link: data.link || null,
      status: data.status,
      position: data.position,
      due_date: data.due_date || null,
      completed_at: data.status === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      stage_type: data.stage_type,
    };
    const { error } = data.id
      ? await db.from("client_milestones").update(row).eq("id", data.id)
      : await db.from("client_milestones").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const db = context.supabase as AnyClient;
    const { error } = await db.from("client_milestones").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const reviewInput = z.object({
  milestoneId: z.string().uuid(),
  reviewUrl: z.string().trim().url().refine((v) => /^https?:\/\//i.test(v), "Review link must use http(s)"),
  reviewNote: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const adminRequestMilestoneApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => reviewInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: milestone, error: milestoneError } = await supabaseAdmin
      .from("client_milestones")
      .select("id, project_id, title, stage_type, client_projects!inner(title, client_email)")
      .eq("id", data.milestoneId)
      .maybeSingle();
    if (milestoneError || !milestone) throw new Error("Milestone not found");
    const project = milestone.client_projects as unknown as { title: string; client_email: string };

    const { data: openApproval } = await supabaseAdmin.from("project_approvals")
      .select("id").eq("milestone_id", milestone.id).eq("status", "awaiting_review").maybeSingle();
    const approvalQuery = openApproval
      ? supabaseAdmin.from("project_approvals").update({
          stage_type: milestone.stage_type === "design" ? "design" : "build",
          review_url: data.reviewUrl,
          review_note: data.reviewNote || null,
        }).eq("id", openApproval.id).select("id").single()
      : supabaseAdmin.from("project_approvals").insert({
          project_id: milestone.project_id,
          milestone_id: milestone.id,
          stage_type: milestone.stage_type === "design" ? "design" : "build",
          status: "awaiting_review",
          review_url: data.reviewUrl,
          review_note: data.reviewNote || null,
        }).select("id").single();
    const { data: approval, error } = await approvalQuery;
    if (error) throw new Error(error.message);

    let emailed = false;
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const result = await sendTemplateEmail("approval-review-ready", project.client_email, {
        idempotencyKey: `approval-review-ready-${approval.id}`,
        replyTo: "rory@theroyeffect.com",
        templateData: {
          clientName: project.client_email.split("@")[0] || "there",
          projectTitle: project.title,
          stageTitle: milestone.title,
          reviewNote: data.reviewNote || "",
          approvalUrl: `https://www.theroyeffect.com/projects/${milestone.project_id}?approval=${approval.id}`,
        },
      });
      emailed = result.sent;
      if (emailed) await supabaseAdmin.from("project_approvals").update({ client_notified_at: new Date().toISOString() }).eq("id", approval.id);
    } catch (emailError) {
      console.error("Approval review email failed", emailError);
    }
    return { ok: true, approvalId: approval.id as string, emailed };
  });

const decisionInput = z.object({
  approvalId: z.string().uuid(),
  decision: z.enum(["approved", "changes_requested"]),
  feedback: z.string().trim().max(3000).optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.decision === "changes_requested" && !value.feedback) {
    ctx.addIssue({ code: "custom", path: ["feedback"], message: "Tell me what should change." });
  }
});

export const decideMilestoneApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => decisionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = String((context.claims as { email?: string } | undefined)?.email ?? "").toLowerCase();
    const { data: approval, error } = await supabaseAdmin.from("project_approvals")
      .select("id, status, project_id, milestone_id, client_projects!inner(title, client_email, user_id), client_milestones!inner(title)")
      .eq("id", data.approvalId).maybeSingle();
    if (error || !approval) throw new Error("Approval request not found");
    const project = approval.client_projects as unknown as { title: string; client_email: string; user_id: string | null };
    if (project.user_id !== context.userId && project.client_email.toLowerCase() !== email) {
      throw new Error("You do not have access to this approval request");
    }
    if (approval.status !== "awaiting_review") return { ok: true, unchanged: true };

    const now = new Date().toISOString();
    const { data: changed, error: updateError } = await supabaseAdmin.from("project_approvals").update({
      status: data.decision,
      client_feedback: data.feedback || null,
      decided_by_user_id: context.userId,
      decided_by_email: email,
      decided_at: now,
    }).eq("id", approval.id).eq("status", "awaiting_review").select("id").maybeSingle();
    if (updateError) throw new Error(updateError.message);
    if (!changed) return { ok: true, unchanged: true };

    await supabaseAdmin.from("client_milestones").update({
      status: data.decision === "approved" ? "done" : "active",
      completed_at: data.decision === "approved" ? now : null,
      updated_at: now,
    }).eq("id", approval.milestone_id);

    const milestone = approval.client_milestones as unknown as { title: string };
    let emailed = false;
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const result = await sendTemplateEmail("approval-decision", "rory@theroyeffect.com", {
        idempotencyKey: `approval-decision-${approval.id}-${data.decision}`,
        replyTo: email || project.client_email,
        templateData: {
          clientEmail: email || project.client_email,
          projectTitle: project.title,
          stageTitle: milestone.title,
          decision: data.decision,
          feedback: data.feedback || "",
          adminUrl: "https://www.theroyeffect.com/admin",
        },
      });
      emailed = result.sent;
      if (emailed) await supabaseAdmin.from("project_approvals").update({ owner_notified_at: now }).eq("id", approval.id);
    } catch (emailError) {
      console.error("Approval decision email failed", emailError);
    }
    return { ok: true, unchanged: false, emailed };
  });

// ---------- Client profile & onboarding ----------

export const CONTACT_METHODS = ["email", "phone", "text", "slack"] as const;

export interface ClientProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  time_zone: string | null;
  preferred_contact: string;
  notes: string | null;
  onboarding_completed_at: string | null;
}

const PROFILE_COLUMNS =
  "id, email, full_name, company, phone, website, city, time_zone, preferred_contact, notes, onboarding_completed_at";

function toProfile(row: Record<string, unknown> | null, fallbackEmail: string): ClientProfile {
  const str = (key: string) => (typeof row?.[key] === "string" ? (row[key] as string) : null);
  return {
    id: String(row?.["id"] ?? ""),
    email: str("email") ?? fallbackEmail ?? null,
    full_name: str("full_name"),
    company: str("company"),
    phone: str("phone"),
    website: str("website"),
    city: str("city"),
    time_zone: str("time_zone"),
    preferred_contact: str("preferred_contact") ?? "email",
    notes: str("notes"),
    onboarding_completed_at: str("onboarding_completed_at"),
  };
}

/** The signed-in client's own contact details. */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ profile: ClientProfile }> => {
    const db = context.supabase as AnyClient;
    const email = String((context.claims as { email?: string } | undefined)?.email ?? "");
    const { data, error } = await db
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: toProfile(data as Record<string, unknown> | null, email) };
  });

const profileInput = z.object({
  full_name: z.string().trim().min(1, "Your name is required").max(120),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  time_zone: z.string().trim().max(60).optional().or(z.literal("")),
  preferred_contact: z.enum(CONTACT_METHODS).default("email"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  complete_onboarding: z.boolean().optional(),
});

/** Save the signed-in client's contact details (and mark onboarding done). */
export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => profileInput.parse(input))
  .handler(async ({ data, context }): Promise<{ profile: ClientProfile }> => {
    const db = context.supabase as AnyClient;
    const email = String((context.claims as { email?: string } | undefined)?.email ?? "");
    const existing = await db
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", context.userId)
      .maybeSingle();
    const alreadyDone =
      typeof existing.data?.["onboarding_completed_at"] === "string"
        ? (existing.data["onboarding_completed_at"] as string)
        : null;

    const patch = {
      full_name: data.full_name,
      company: data.company || null,
      phone: data.phone || null,
      website: data.website || null,
      city: data.city || null,
      time_zone: data.time_zone || null,
      preferred_contact: data.preferred_contact,
      notes: data.notes || null,
      onboarding_completed_at:
        alreadyDone ?? (data.complete_onboarding ? new Date().toISOString() : null),
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error } = await db
      .from("profiles")
      .update(patch)
      .eq("id", context.userId)
      .select(PROFILE_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: toProfile(saved as Record<string, unknown> | null, email) };
  });

/** Admin: contact details for every client with a portal project. */
export const adminListClientProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ profiles: ClientProfile[] }> => {
    await assertAdmin(context);
    const db = context.supabase as AnyClient;
    const { data, error } = await db
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return {
      profiles: ((data ?? []) as Record<string, unknown>[]).map((r) => toProfile(r, "")),
    };
  });
