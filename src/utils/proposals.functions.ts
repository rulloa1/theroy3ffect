import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    }) => input,
  )
  .handler(
    async ({
      data: input,
    }): Promise<{ success: boolean; proposal?: ProjectProposal; error?: string }> => {
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
          status: "sent",
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
  .handler(async ({ data: input }): Promise<{ success: boolean; error?: string }> => {
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

    // If currently draft or sent, update to viewed
    if (data.status === "draft" || data.status === "sent") {
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
