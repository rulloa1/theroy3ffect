import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export interface PortalMilestone {
  id: string;
  project_id: string;
  title: string;
  note: string | null;
  link: string | null;
  status: string;
  position: number;
  updated_at: string;
}

export interface PortalProject {
  id: string;
  user_id: string | null;
  client_email: string;
  title: string;
  summary: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  milestones: PortalMilestone[];
}

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const db = context.supabase as AnyClient;
  const { data } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

function toProject(row: Record<string, unknown>): PortalProject {
  const milestones = Array.isArray(row["client_milestones"])
    ? (row["client_milestones"] as Record<string, unknown>[])
    : [];
  return {
    id: String(row["id"]),
    user_id: typeof row["user_id"] === "string" ? row["user_id"] : null,
    client_email: String(row["client_email"] ?? ""),
    title: String(row["title"] ?? "Project"),
    summary: typeof row["summary"] === "string" ? row["summary"] : null,
    status: String(row["status"] ?? "onboarding"),
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
        updated_at: String(m["updated_at"] ?? ""),
      }))
      .sort((a, b) => a.position - b.position || a.updated_at.localeCompare(b.updated_at)),
  };
}

/** Everything the signed-in client can see in their portal. RLS scopes to their own rows. */
export const getMyPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ projects: PortalProject[] }> => {
    const db = context.supabase as AnyClient;
    const { data, error } = await db
      .from("client_projects")
      .select("*, client_milestones(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { projects: (data ?? []).map(toProject) };
  });

// ---------- Admin management ----------

export const adminListPortalProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ projects: PortalProject[] }> => {
    await assertAdmin(context);
    const db = context.supabase as AnyClient;
    const { data, error } = await db
      .from("client_projects")
      .select("*, client_milestones(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { projects: (data ?? []).map(toProject) };
  });

const projectInput = z.object({
  client_email: z.string().trim().email().max(255),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(2000).optional(),
  status: z.enum(PROJECT_STATUSES).default("onboarding"),
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
      updated_at: new Date().toISOString(),
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
