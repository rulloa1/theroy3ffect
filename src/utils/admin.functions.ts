import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

const env = (value: unknown): StripeEnv => (value === "live" ? "live" : "sandbox");

async function assertAdmin(context: {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
}) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Forbidden");
}

export interface AdminBrief {
  id: string;
  name: string;
  email: string;
  company: string | null;
  project_type: string;
  goals: string;
  audience: string | null;
  deliverables: string | null;
  references_links: string | null;
  budget: string | null;
  timeline: string | null;
  extra: string | null;
  pdf_path: string | null;
  pdf_url?: string | null;
  project_status?: string | null;
  project_notes?: string | null;
  project_links?: string | null;
  stripe_session_id: string | null;
  created_at: string;
}

export interface AdminOrder {
  id: string;
  stripe_session_id: string;
  customer_email: string | null;
  customer_name: string | null;
  product_name: string | null;
  amount_total: number;
  currency: string;
  payment_status: string;
  purchase_kind: string;
  is_deposit: boolean;
  balance_due_cents: number;
  balance_status: string;
  balance_invoice_url: string | null;
  amount_refunded: number;
  created_at: string;
  brief?: AdminBrief | null;
}

export interface AdminInquiry {
  id: string;
  name: string;
  email: string;
  project_type: string | null;
  message: string;
  status: "unread" | "replied" | "archived";
  created_at: string;
}

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => ({ environment: env(data.environment) }))
  .handler(async ({ data, context }): Promise<{ orders: AdminOrder[]; briefs: AdminBrief[] }> => {
    await assertAdmin(context as never);
    
    const [ordersResult, briefsResult] = await Promise.all([
      context.supabase
        .from("orders")
        .select(
          "id, stripe_session_id, customer_email, customer_name, product_name, amount_total, currency, payment_status, purchase_kind, is_deposit, balance_due_cents, balance_status, balance_invoice_url, amount_refunded, created_at",
        )
        .eq("environment", data.environment)
        .order("created_at", { ascending: false })
        .limit(100),
      context.supabase
        .from("project_briefs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const briefs = (briefsResult.data ?? []) as AdminBrief[];
    const briefMap = new Map<string, AdminBrief>();
    for (const b of briefs) {
      if (b.stripe_session_id) briefMap.set(b.stripe_session_id, b);
      if (b.email) briefMap.set(b.email.toLowerCase(), b);
    }

    const orders: AdminOrder[] = ((ordersResult.data ?? []) as any[]).map((order) => ({
      ...order,
      brief:
        briefMap.get(order.stripe_session_id) ||
        (order.customer_email ? briefMap.get(order.customer_email.toLowerCase()) : null) ||
        null,
    }));

    return { orders, briefs };
  });

export const adminGetBriefDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { briefId: string }) => ({ briefId: data.briefId }))
  .handler(async ({ data, context }): Promise<{ brief: AdminBrief | null; pdfUrl: string | null }> => {
    await assertAdmin(context as never);
    const { data: brief } = await context.supabase
      .from("project_briefs")
      .select("*")
      .eq("id", data.briefId)
      .maybeSingle();

    if (!brief) return { brief: null, pdfUrl: null };

    let pdfUrl: string | null = null;
    if (brief.pdf_path) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: signed } = await supabaseAdmin.storage
          .from("brief-pdfs")
          .createSignedUrl(brief.pdf_path, 3600);
        pdfUrl = signed?.signedUrl ?? null;
      } catch {}
    }

    return { brief: brief as AdminBrief, pdfUrl };
  });

export const adminUpdateProjectMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { briefId: string; projectStatus: string; projectNotes?: string; projectLinks?: string }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean; error?: string }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("project_briefs")
      .update({
        project_status: data.projectStatus,
        ...(data.projectNotes !== undefined ? { project_notes: data.projectNotes } : {}),
        ...(data.projectLinks !== undefined ? { project_links: data.projectLinks } : {}),
      })
      .eq("id", data.briefId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  });

export const adminListInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ inquiries: AdminInquiry[] }> => {
    await assertAdmin(context as never);
    try {
      const { data, error } = await context.supabase
        .from("contact_inquiries" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error || !data) return { inquiries: [] };
      return { inquiries: data as AdminInquiry[] };
    } catch {
      return { inquiries: [] };
    }
  });

export const adminUpdateInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { inquiryId: string; status: "unread" | "replied" | "archived" }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("contact_inquiries" as any)
      .update({ status: data.status })
      .eq("id", data.inquiryId);
    return { success: true };
  });

export const adminListPortfolioProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { getPublicShowcaseProjects } = await import("./projects.functions");
    const projects = await getPublicShowcaseProjects();
    return { projects };
  });

export const adminUpsertPortfolioProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    id?: string;
    title: string;
    tagline: string;
    description: string;
    url: string;
    category: "Brand Identity" | "UI/UX" | "No-Code";
    metric?: string;
    tags: string[];
    sortOrder?: number;
    isPublished?: boolean;
  }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean; error?: string }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const projectId = data.id && !data.id.startsWith("default-") ? data.id : crypto.randomUUID();
    const { error } = await supabaseAdmin
      .from("showcase_projects" as any)
      .upsert({
        id: projectId,
        title: data.title,
        tagline: data.tagline,
        description: data.description,
        url: data.url,
        category: data.category,
        metric: data.metric || null,
        tags: data.tags,
        sort_order: data.sortOrder ?? 0,
        is_published: data.isPublished ?? true,
        updated_at: new Date().toISOString(),
      });

    if (error) return { success: false, error: error.message };
    return { success: true };
  });

export const adminDeletePortfolioProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data, context }): Promise<{ success: boolean }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("showcase_projects" as any)
      .delete()
      .eq("id", data.projectId);
    return { success: true };
  });


/**
 * Invoices the remaining balance on a deposit order. Creates (or reuses) the
 * customer, adds a single line item for the outstanding amount, finalizes and
 * emails the hosted invoice.
 */
export const adminSendBalanceInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; environment: StripeEnv }) => ({
    orderId: data.orderId,
    environment: env(data.environment),
  }))
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    await assertAdmin(context as never);

    const { data: order } = await context.supabase
      .from("orders")
      .select(
        "id, stripe_customer_id, customer_email, customer_name, product_name, balance_due_cents, balance_status, currency",
      )
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order) return { error: "Order not found" };
    if (order.balance_due_cents <= 0) return { error: "This order has no outstanding balance." };
    if (order.balance_status === "invoiced" || order.balance_status === "paid")
      return { error: "The balance has already been invoiced." };

    try {
      const stripe = createStripeClient(data.environment);

      let customerId = order.stripe_customer_id;
      if (!customerId) {
        if (!order.customer_email) return { error: "No customer email on this order." };
        const created = await stripe.customers.create({
          email: order.customer_email,
          ...(order.customer_name ? { name: order.customer_name } : {}),
        });
        customerId = created.id;
      }

      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: 7,
        description: `Remaining balance — ${order.product_name ?? "Commission"}`,
        auto_advance: false,
        metadata: { order_id: order.id, kind: "deposit_balance" },
      });

      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        amount: order.balance_due_cents,
        currency: order.currency,
        description: `Remaining 50% balance — ${order.product_name ?? "Commission"}`,
      });

      const finalized = await stripe.invoices.finalizeInvoice(invoice.id as string);
      await stripe.invoices.sendInvoice(invoice.id as string);

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("orders")
        .update({
          balance_status: "invoiced",
          balance_invoice_id: finalized.id,
          balance_invoice_url: finalized.hosted_invoice_url ?? null,
        })
        .eq("id", order.id);

      return { url: finalized.hosted_invoice_url ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
