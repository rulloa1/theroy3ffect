import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/utils/require-admin";

export interface ProjectProposal {
  id: string;
  brief_id?: string | null;
  share_token: string;
  client_name: string;
  client_email: string;
  client_company?: string | null;
  project_title: string;
  scope_deliverables: string;
  timeline_weeks: string;
  total_price_cents: number;
  deposit_cents: number;
  balance_cents: number;
  terms: string;
  status: "draft" | "sent" | "viewed" | "signed" | "archived";
  client_signed_at?: string | null;
  client_signature_name?: string | null;
  created_at: string;
}

export const DEFAULT_TERMS = `1. SCOPE & DELIVERABLES: The Roy Effect ("Studio") will perform the deliverables described in this agreement. Any work outside this scope will be quoted separately.
2. REVISION ROUNDS: Scope includes two (2) comprehensive revision rounds for visual direction and screen mockups.
3. INTELLECTUAL PROPERTY: Upon final payment in full, all custom design assets, code, and deliverables transfer 100% to the Client. Studio reserves the right to display the completed work in its portfolio.
4. PAYMENT SCHEDULE: A 50% deposit is due prior to directional kickoff. The remaining 50% balance is due upon project completion prior to domain cutover or final production handover.
5. CONFIDENTIALITY: Studio agrees to keep all proprietary client business data strictly confidential.`;

/** List all proposals for studio admin */
export const adminListProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProjectProposal[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("project_proposals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn(
        "adminListProposals query fallback (table might be initializing):",
        error.message,
      );
      return [];
    }

    return (data ?? []) as unknown as ProjectProposal[];
  });

/** Create a new proposal */
export const adminCreateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      briefId?: string;
      clientName: string;
      clientEmail: string;
      clientCompany?: string;
      projectTitle: string;
      scopeDeliverables: string;
      timelineWeeks: string;
      totalPriceCents: number;
      depositCents?: number;
      terms?: string;
      /** Save as a draft (default) or publish immediately as sent. */
      status?: "draft" | "sent";
    }) => input,
  )
  .handler(
    async ({
      context,
      data: input,
    }): Promise<{ success: boolean; proposal?: ProjectProposal; error?: string }> => {
      await assertAdmin(context);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // Full 32-char hex token (128-bit) — unguessable share link secret.
      // Must stay >= 20 chars to satisfy the public shareTokenSchema validator.
      const token = crypto.randomUUID().replace(/-/g, "");
      const deposit = input.depositCents ?? Math.round(input.totalPriceCents * 0.5);
      const balance = input.totalPriceCents - deposit;

      const { data, error } = await supabaseAdmin
        .from("project_proposals")
        .insert({
          brief_id: input.briefId || null,
          share_token: token,
          client_name: input.clientName,
          client_email: input.clientEmail,
          client_company: input.clientCompany || null,
          project_title: input.projectTitle,
          scope_deliverables: input.scopeDeliverables,
          timeline_weeks: input.timelineWeeks || "2–3 Weeks",
          total_price_cents: input.totalPriceCents,
          deposit_cents: deposit,
          balance_cents: balance,
          terms: input.terms || DEFAULT_TERMS,
          status: input.status === "sent" ? "sent" : "draft",
        })
        .select("*")
        .single();

      if (error) {
        console.error("adminCreateProposal error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, proposal: data as ProjectProposal };
    },
  );

/** Delete a proposal */
export const adminDeleteProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data: input }): Promise<{ success: boolean; error?: string }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_proposals").delete().eq("id", input.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  });

const shareTokenSchema = z
  .string()
  .trim()
  .min(20)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

/** Public fetcher to view proposal by share token */
export const getPublicProposal = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => ({ token: shareTokenSchema.parse(data?.token) }))
  .handler(async ({ data: { token } }): Promise<ProjectProposal | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("project_proposals")
      .select("*")
      .eq("share_token", token)
      .maybeSingle();

    if (error || !data) return null;

    // Only a published proposal becomes "viewed". Drafts stay drafts so an
    // admin preview never publishes an unfinished proposal to the client.
    if (data.status === "sent") {
      await supabaseAdmin
        .from("project_proposals")
        .update({ status: "viewed" })
        .eq("share_token", token);
    }

    return data as unknown as ProjectProposal;
  });

/** Public function for client to digitally sign proposal */
export const signPublicProposal = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; signatureName: string }) => ({
    token: shareTokenSchema.parse(input?.token),
    signatureName: z.string().trim().min(2).max(120).parse(input?.signatureName),
  }))
  .handler(async ({ data: input }): Promise<{ success: boolean; error?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("project_proposals")
      .update({
        status: "signed",
        client_signature_name: input.signatureName,
        client_signed_at: new Date().toISOString(),
      })
      .eq("share_token", input.token)
      .neq("status", "signed");

    if (error) {
      console.error("signPublicProposal error:", error.message);
      return { success: false, error: "Could not sign this proposal." };
    }

    return { success: true };
  });


/** Public server function to generate & return downloadable PDF bytes for a proposal */
export const downloadSignedProposalPdf = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: shareTokenSchema.parse(input?.token) }))

  .handler(
    async ({
      data: input,
    }): Promise<{ success: boolean; pdfBase64?: string; filename?: string; error?: string }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: proposal, error } = await supabaseAdmin
        .from("project_proposals")
        .select("*")
        .eq("share_token", input.token)
        .maybeSingle();

      if (error || !proposal) {
        return { success: false, error: "Proposal not found" };
      }

      try {
        const { buildSignedProposalPdf } = await import("@/lib/proposal-pdf.server");
        const pdfBytes = await buildSignedProposalPdf({
          clientName: proposal.client_name,
          clientEmail: proposal.client_email,
          clientCompany: proposal.client_company,
          projectTitle: proposal.project_title,
          scopeDeliverables: proposal.scope_deliverables,
          timelineWeeks: proposal.timeline_weeks,
          totalPriceCents: proposal.total_price_cents,
          depositCents: proposal.deposit_cents,
          balanceCents: proposal.balance_cents,
          terms: proposal.terms,
          clientSignatureName: proposal.client_signature_name,
          clientSignedAt: proposal.client_signed_at,
          shareToken: proposal.share_token,
        });

        const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
        const safeTitle = proposal.project_title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30);
        const filename = `proposal-${safeTitle}-${proposal.share_token.slice(0, 6)}.pdf`;

        return { success: true, pdfBase64, filename };
      } catch (err) {
        console.error("Proposal PDF generation error:", err);
        return { success: false, error: "Could not generate PDF" };
      }
    },
  );

const SITE_URL = "https://www.theroyeffect.com";

const updateInput = z.object({
  id: z.string().uuid(),
  clientName: z.string().trim().min(1).max(160),
  clientEmail: z.string().trim().email().max(255),
  clientCompany: z.string().trim().max(160).optional(),
  projectTitle: z.string().trim().min(1).max(200),
  scopeDeliverables: z.string().trim().min(1).max(8000),
  timelineWeeks: z.string().trim().min(1).max(120),
  totalPriceCents: z.number().int().min(0).max(100_000_000),
  depositCents: z.number().int().min(0).max(100_000_000).optional(),
  terms: z.string().trim().min(1).max(20000),
});

/** Update a draft/sent proposal's scope, timeline and pricing */
export const adminUpdateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateInput.parse(input))
  .handler(async ({ context, data }): Promise<{ success: boolean; error?: string }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const deposit = data.depositCents ?? Math.round(data.totalPriceCents * 0.5);
    const { error } = await supabaseAdmin
      .from("project_proposals")
      .update({
        client_name: data.clientName,
        client_email: data.clientEmail.toLowerCase(),
        client_company: data.clientCompany || null,
        project_title: data.projectTitle,
        scope_deliverables: data.scopeDeliverables,
        timeline_weeks: data.timelineWeeks,
        total_price_cents: data.totalPriceCents,
        deposit_cents: deposit,
        balance_cents: data.totalPriceCents - deposit,
        terms: data.terms,
      })
      .eq("id", data.id)
      .neq("status", "signed");

    if (error) return { success: false, error: error.message };
    return { success: true };
  });

/** Publish a proposal to the client: mark sent and email the secure link */
export const adminSendProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ({ id: z.string().uuid().parse((input as { id: string })?.id) }))
  .handler(
    async ({ context, data }): Promise<{ success: boolean; emailed?: boolean; error?: string }> => {
      await assertAdmin(context);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: proposal, error } = await supabaseAdmin
        .from("project_proposals")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();

      if (error || !proposal) return { success: false, error: "Proposal not found" };

      if (proposal.status === "signed") {
        return { success: false, error: "This proposal is already signed." };
      }

      if (proposal.status !== "sent") {
        await supabaseAdmin
          .from("project_proposals")
          .update({ status: "sent" })
          .eq("id", data.id)
          .neq("status", "signed");
      }

      let emailed = false;
      try {
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const res = await sendTemplateEmail("proposal-ready", proposal.client_email, {
          templateData: {
            client_name: proposal.client_name,
            project_title: proposal.project_title,
            timeline_weeks: proposal.timeline_weeks,
            total_price: `$${(proposal.total_price_cents / 100).toLocaleString("en-US")}`,
            deposit_price: `$${(proposal.deposit_cents / 100).toLocaleString("en-US")}`,
            proposal_url: `${SITE_URL}/proposal/${proposal.share_token}`,
            portal_url: `${SITE_URL}/portal`,
          },
          // Bucketed per minute so an edited proposal can be re-sent, while
          // accidental double-clicks within the same minute stay deduped.
          idempotencyKey: `proposal-sent-${proposal.id}-${Math.floor(Date.now() / 60_000)}`,
          replyTo: "rory@theroyeffect.com",
        });
        emailed = res.sent;
      } catch (err) {
        console.error("adminSendProposal email error:", err);
      }

      return { success: true, emailed };
    },
  );

/** Proposals visible to the signed-in client in their portal */
export const getMyProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProjectProposal[]> => {
    const email = (context.claims as { email?: string } | undefined)?.email;
    if (!email) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("project_proposals")
      .select("*")
      .ilike("client_email", email)
      .in("status", ["sent", "viewed", "signed"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getMyProposals error:", error.message);
      return [];
    }
    return (data ?? []) as unknown as ProjectProposal[];
  });
