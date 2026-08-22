import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bot,
  Briefcase,
  DollarSign,
  Eye,
  FileCheck,
  FileText,
  MessageSquare,
  Users,
  X,
  Radar,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { getStripeEnvironment } from "@/lib/stripe";
import { Logo } from "@/components/Logo";

import {
  adminDeletePortfolioProject,
  adminListInquiries,
  adminListOrders,
  adminListPortfolioProjects,
  adminSendBalanceInvoice,
  adminUpdateInquiryStatus,
  adminUpdateProjectMilestone,
  adminUpsertPortfolioProject,
  type AdminBrief,
  type AdminOrder,
} from "@/utils/admin.functions";
import type { PortfolioProject } from "@/utils/projects.functions";
import {
  adminListProposals,
  adminCreateProposal,
  adminDeleteProposal,
  type ProjectProposal,
  DEFAULT_TERMS,
} from "@/utils/proposals.functions";

import { AdminProjectsView, type FilterTab } from "@/components/admin/AdminProjectsView";
import { AdminInquiriesView } from "@/components/admin/AdminInquiriesView";
import { AdminProposalsView } from "@/components/admin/AdminProposalsView";
import { AdminPortfolioCMS } from "@/components/admin/AdminPortfolioCMS";
import { AdminFinancialsView } from "@/components/admin/AdminFinancialsView";
import { AdminPipelineView } from "@/components/admin/AdminPipelineView";
import { AdminAutopilotView } from "@/components/admin/AdminAutopilotView";
import { AdminProspectsView } from "@/components/admin/AdminProspectsView";
import {
  adminListProspects,
  adminFindProspects,
  adminScanPending,
  adminDraftOutreach,
  adminSaveProspectDraft,
  adminSendOutreach,
  adminUpdateProspect,
  adminGenerateVariants,
  adminSelectVariant,
  adminSyncProspectCrm,
  adminProspectAnalytics,
} from "@/utils/prospects.functions";

import {
  adminListPipeline,
  adminUpdateLeadStage,
  adminUpdateBookingStatus,
  adminResolveFollowup,
} from "@/utils/crm.functions";
import {
  adminGetAutopilot,
  adminRunAutopilot,
  adminSetAutopilotStatus,
  adminApproveDraft,
  adminDismissDraft,
  adminRetryDraft,
  adminUpdateDraft,
} from "@/utils/automation.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio Command Hub — theroyeffect.com" },
      {
        name: "description",
        content:
          "Studio owner management hub: current projects, client leads, portfolio editor, and billing.",
      },
      { property: "og:title", content: "Studio Command Hub — theroyeffect.com" },
      { property: "og:description", content: "Studio owner dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );

const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

type MainView =
  | "PROJECTS"
  | "PIPELINE"
  | "AUTOPILOT"
  | "PROSPECTS"
  | "INQUIRIES"
  | "PROPOSALS"
  | "PORTFOLIO"
  | "FINANCIALS";

function AdminPage() {
  const environment = getStripeEnvironment();
  const queryClient = useQueryClient();

  const listOrders = useServerFn(adminListOrders);
  const sendInvoice = useServerFn(adminSendBalanceInvoice);
  const updateMilestone = useServerFn(adminUpdateProjectMilestone);
  const listInquiries = useServerFn(adminListInquiries);
  const updateInquiry = useServerFn(adminUpdateInquiryStatus);
  const listPortfolio = useServerFn(adminListPortfolioProjects);
  const upsertPortfolio = useServerFn(adminUpsertPortfolioProject);
  const deletePortfolio = useServerFn(adminDeletePortfolioProject);
  const listProposals = useServerFn(adminListProposals);
  const createProposal = useServerFn(adminCreateProposal);
  const deleteProposal = useServerFn(adminDeleteProposal);
  const listPipeline = useServerFn(adminListPipeline);
  const updateLeadStage = useServerFn(adminUpdateLeadStage);
  const updateBookingStatus = useServerFn(adminUpdateBookingStatus);
  const resolveFollowup = useServerFn(adminResolveFollowup);
  const getAutopilot = useServerFn(adminGetAutopilot);
  const runAutopilot = useServerFn(adminRunAutopilot);
  const setAutopilotStatus = useServerFn(adminSetAutopilotStatus);
  const approveDraftFn = useServerFn(adminApproveDraft);
  const dismissDraftFn = useServerFn(adminDismissDraft);
  const retryDraftFn = useServerFn(adminRetryDraft);
  const updateDraftFn = useServerFn(adminUpdateDraft);
  const listProspects = useServerFn(adminListProspects);
  const findProspects = useServerFn(adminFindProspects);
  const scanPendingFn = useServerFn(adminScanPending);
  const draftOutreachFn = useServerFn(adminDraftOutreach);
  const saveProspectDraftFn = useServerFn(adminSaveProspectDraft);
  const sendOutreachFn = useServerFn(adminSendOutreach);
  const updateProspectFn = useServerFn(adminUpdateProspect);
  const generateVariantsFn = useServerFn(adminGenerateVariants);
  const selectVariantFn = useServerFn(adminSelectVariant);
  const syncProspectCrmFn = useServerFn(adminSyncProspectCrm);
  const prospectAnalyticsFn = useServerFn(adminProspectAnalytics);


  const [currentView, setCurrentView] = useState<MainView>("PROJECTS");
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // Modals state
  const [selectedBrief, setSelectedBrief] = useState<AdminBrief | null>(null);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Proposal form state
  const [proposalForm, setProposalForm] = useState<{
    briefId?: string;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    projectTitle: string;
    scopeDeliverables: string;
    timelineWeeks: string;
    totalPriceDollars: number;
    terms: string;
  }>({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    projectTitle: "",
    scopeDeliverables:
      "• Visual Direction Sprint (Type, Color, UI Language)\n• Full Mobile & Desktop Screen Designs in Figma\n• Complete Production Build & Interactive Animations\n• Stripe eCommerce / Payment Integration\n• SEO Meta Architecture & Performance Optimization\n• 2 Comprehensive Revision Rounds",
    timelineWeeks: "2–3 Weeks",
    totalPriceDollars: 5000,
    terms: DEFAULT_TERMS,
  });

  // Form state for editing/adding projects
  const [projectForm, setProjectForm] = useState<{
    id?: string;
    title: string;
    tagline: string;
    description: string;
    url: string;
    category: "Brand Identity" | "UI/UX" | "No-Code";
    metric: string;
    tags: string;
    isPublished: boolean;
  }>({
    title: "",
    tagline: "",
    description: "",
    url: "",
    category: "UI/UX",
    metric: "",
    tags: "",
    isPublished: true,
  });

  // Queries
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ["admin-orders", environment],
    queryFn: () => listOrders({ data: { environment } }),
    retry: false,
  });

  const { data: inquiriesData } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: () => listInquiries(),
    retry: false,
  });

  const { data: proposalsData } = useQuery({
    queryKey: ["admin-proposals"],
    queryFn: () => listProposals(),
    retry: false,
  });

  const { data: pipelineData } = useQuery({
    queryKey: ["admin-pipeline"],
    queryFn: () => listPipeline(),
    retry: false,
  });

  const { data: autopilotData } = useQuery({
    queryKey: ["admin-autopilot"],
    queryFn: () => getAutopilot(),
    retry: false,
  });

  const refreshAutopilot = () => queryClient.invalidateQueries({ queryKey: ["admin-autopilot"] });

  const runAutopilotScan = async () => {
    setBusy("autopilot-run");
    try {
      const result = await runAutopilot();
      if (result.status === "paused") toast.error(result.message ?? "Autopilot paused");
      else if (result.status === "skipped_locked") toast.info("A scan is already running.");
      else toast.success(`Scan complete — ${result.drafted} new draft(s).`);
      await refreshAutopilot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setBusy(null);
    }
  };

  const toggleAutopilot = async (paused: boolean) => {
    setBusy("autopilot-toggle");
    try {
      await setAutopilotStatus({ data: { paused } });
      toast.success(paused ? "Autopilot paused" : "Autopilot resumed");
      await refreshAutopilot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update autopilot");
    } finally {
      setBusy(null);
    }
  };

  const approveDraft = async (id: string) => {
    setBusy(id);
    try {
      const result = await approveDraftFn({ data: { id } });
      if (result.ok) toast.success("Follow-up sent.");
      else toast.error(result.message ?? "Not sent");
      await refreshAutopilot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Send failed");
      await refreshAutopilot();
    } finally {
      setBusy(null);
    }
  };

  const dismissDraft = async (id: string) => {
    setBusy(id);
    try {
      await dismissDraftFn({ data: { id } });
      await refreshAutopilot();
    } finally {
      setBusy(null);
    }
  };

  const retryDraft = async (id: string) => {
    setBusy(id);
    try {
      await retryDraftFn({ data: { id } });
      await refreshAutopilot();
    } finally {
      setBusy(null);
    }
  };

  const saveDraft = async (id: string, subject: string, body: string) => {
    setBusy(id);
    try {
      await updateDraftFn({ data: { id, subject, body } });
      toast.success("Draft updated.");
      await refreshAutopilot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save draft");
    } finally {
      setBusy(null);
    }
  };


  const { data: prospectsData } = useQuery({
    queryKey: ["admin-prospects"],
    queryFn: () => listProspects(),
    retry: false,
  });

  const refreshProspects = () => queryClient.invalidateQueries({ queryKey: ["admin-prospects"] });

  const findProspectsFor = async (industry: string) => {
    setBusy("find");
    try {
      const result = await findProspects({ data: { industry } });
      toast.success(
        `Found ${result.found} businesses — ${result.added} new, ${result.scanned} sites checked.`,
      );
      await refreshProspects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setBusy(null);
    }
  };

  const scanPendingSites = async () => {
    setBusy("scan");
    try {
      const { scanned } = await scanPendingFn();
      toast.success(`Checked ${scanned} more site(s).`);
      await refreshProspects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Site check failed");
    } finally {
      setBusy(null);
    }
  };

  const draftProspectEmail = async (id: string) => {
    setBusy(`draft-${id}`);
    try {
      await draftOutreachFn({ data: { id } });
      toast.success("Draft ready for your review.");
      await refreshProspects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not write the draft");
      await refreshProspects();
    } finally {
      setBusy(null);
    }
  };

  const saveProspectDraft = async (
    id: string,
    subject: string,
    body: string,
    contactEmail: string | null,
  ) => {
    setBusy(`save-${id}`);
    try {
      await saveProspectDraftFn({ data: { id, subject, body, contactEmail } });
      toast.success("Draft saved.");
      await refreshProspects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the draft");
    } finally {
      setBusy(null);
    }
  };

  const sendProspectEmail = async (id: string) => {
    setBusy(`send-${id}`);
    try {
      const result = await sendOutreachFn({ data: { id } });
      if (result.ok) toast.success("Email sent.");
      else toast.error(`Not delivered: ${result.reason}`);
      await refreshProspects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Send failed");
      await refreshProspects();
    } finally {
      setBusy(null);
    }
  };

  const updateProspect = async (
    id: string,
    patch: { status?: string; contactEmail?: string | null },
  ) => {
    try {
      await updateProspectFn({ data: { id, ...patch } as never });
      await refreshProspects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update prospect");
    }
  };

  const { data: portfolioData } = useQuery({
    queryKey: ["admin-portfolio"],
    queryFn: () => listPortfolio(),
    retry: false,
  });

  // Stats
  const activeProjectsCount = (ordersData?.orders ?? []).length;
  const unreadInquiriesCount = (inquiriesData?.inquiries ?? []).filter(
    (i) => i.status === "unread",
  ).length;
  const pendingBalanceTotal = (ordersData?.orders ?? [])
    .filter((o) => o.balance_due_cents > 0 && o.balance_status === "pending")
    .reduce((sum, o) => sum + o.balance_due_cents, 0);

  const refreshPipeline = () => queryClient.invalidateQueries({ queryKey: ["admin-pipeline"] });

  const changeLeadStage = async (leadId: string, stage: string) => {
    const res = await updateLeadStage({ data: { leadId, stage } });
    if (!res.success) throw new Error(res.error || "Update failed");
    await refreshPipeline();
  };

  const changeBookingStatus = async (bookingId: string, status: string) => {
    const res = await updateBookingStatus({ data: { bookingId, status } });
    if (!res.success) throw new Error(res.error || "Update failed");
    await refreshPipeline();
  };

  const closeFollowup = async (followupId: string, status: string) => {
    const res = await resolveFollowup({ data: { followupId, status } });
    if (!res.success) throw new Error(res.error || "Update failed");
    await refreshPipeline();
  };

  // Invoicing Action
  const invoiceBalance = async (orderId: string) => {
    setBusy(orderId);
    try {
      const result = await sendInvoice({ data: { orderId, environment } });
      if ("error" in result) throw new Error(result.error);
      toast.success("Balance invoice sent via Stripe");
      await queryClient.invalidateQueries({ queryKey: ["admin-orders", environment] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send invoice");
    } finally {
      setBusy(null);
    }
  };

  // Milestone Update Action
  const changeMilestone = async (briefId: string, newStatus: string) => {
    try {
      const res = await updateMilestone({ data: { briefId, projectStatus: newStatus } });
      if (!res.success) throw new Error(res.error || "Update failed");
      toast.success("Project milestone updated");
      await queryClient.invalidateQueries({ queryKey: ["admin-orders", environment] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update milestone");
    }
  };

  // Inquiry Status Action
  const toggleInquiryStatus = async (
    inquiryId: string,
    status: "unread" | "replied" | "archived",
  ) => {
    try {
      await updateInquiry({ data: { inquiryId, status } });
      toast.success(`Message marked as ${status}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
    } catch (_err) {
      toast.error("Failed to update message status");
    }
  };

  // Portfolio Project Actions
  const handleOpenEditProject = (project: PortfolioProject) => {
    setEditingProject(project);
    setProjectForm({
      id: project.id,
      title: project.title,
      tagline: project.tagline,
      description: project.description,
      url: project.url,
      category: project.category,
      metric: project.metric || "",
      tags: project.tags.join(", "),
      isPublished: project.is_published ?? true,
    });
    setIsNewProjectModalOpen(true);
  };

  const handleOpenNewProject = () => {
    setEditingProject(null);
    setProjectForm({
      title: "",
      tagline: "",
      description: "",
      url: "https://",
      category: "Brand Identity",
      metric: "",
      tags: "UI/UX, Brand Identity, No-Code",
      isPublished: true,
    });
    setIsNewProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title || !projectForm.description) {
      toast.error("Title and description are required");
      return;
    }
    try {
      const tagsArray = projectForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await upsertPortfolio({
        data: {
          ...(projectForm.id ? { id: projectForm.id } : {}),
          title: projectForm.title,
          tagline: projectForm.tagline,
          description: projectForm.description,
          url: projectForm.url,
          category: projectForm.category,
          ...(projectForm.metric ? { metric: projectForm.metric } : {}),
          tags: tagsArray,
          isPublished: projectForm.isPublished,
        },
      });

      if (!res.success) throw new Error(res.error || "Save failed");
      toast.success(editingProject ? "Project updated" : "New project added to showcase");
      setIsNewProjectModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save project");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deletePortfolio({ data: { projectId } });
      toast.success("Project removed");
      await queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
    } catch (_err) {
      toast.error("Failed to delete project");
    }
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalForm.clientName || !proposalForm.clientEmail || !proposalForm.projectTitle) {
      toast.error("Client name, email, and project title are required");
      return;
    }
    try {
      const res = await createProposal({
        data: {
          ...(proposalForm.briefId ? { briefId: proposalForm.briefId } : {}),
          clientName: proposalForm.clientName,
          clientEmail: proposalForm.clientEmail,
          ...(proposalForm.clientCompany ? { clientCompany: proposalForm.clientCompany } : {}),
          projectTitle: proposalForm.projectTitle,
          scopeDeliverables: proposalForm.scopeDeliverables,
          timelineWeeks: proposalForm.timelineWeeks,
          totalPriceCents: Math.round(proposalForm.totalPriceDollars * 100),
          terms: proposalForm.terms,
        },
      });

      if (!res.success) throw new Error(res.error || "Failed to create proposal");
      toast.success("Proposal created and client link generated!");
      setIsProposalModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-proposals"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating proposal");
    }
  };

  const handleDeleteProposalItem = async (id: string) => {
    try {
      const res = await deleteProposal({ data: { id } });
      if (!res.success) throw new Error(res.error || "Delete failed");
      toast.success("Proposal deleted");
      await queryClient.invalidateQueries({ queryKey: ["admin-proposals"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting proposal");
    }
  };

  const handleOpenProposalFromBrief = (brief: AdminBrief) => {
    setProposalForm({
      briefId: brief.id,
      clientName: brief.name,
      clientEmail: brief.email,
      clientCompany: brief.company || "",
      projectTitle: `${brief.project_type} — Custom Scope Agreement`,
      scopeDeliverables:
        brief.deliverables ||
        "• Visual Direction Sprint (Type, Color, UI Language)\n• Custom Screen Designs in Figma (Desktop & Mobile)\n• Interactive WebGL Animations & Build Handover\n• Stripe eCommerce Integration\n• 2 Comprehensive Revision Rounds",
      timelineWeeks: brief.timeline || "2–3 Weeks",
      totalPriceDollars: brief.budget && brief.budget.includes("10,000") ? 10000 : 5000,
      terms: DEFAULT_TERMS,
    });
    setSelectedBrief(null);
    setIsProposalModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-16 md:px-10">
      <Toaster />
      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <Logo variant="compact" size="md" href="/" className="mb-6" />
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-8">
          <div>
            <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
              STUDIO COMMAND HUB
            </span>
            <h1 className="mt-2 font-display text-3xl uppercase leading-[0.9] text-white sm:text-5xl md:text-6xl">
              DASHBOARD
            </h1>
            <p className="mt-2 font-mono text-xs text-white/50">
              Manage client projects, review inbound messages, update portfolio work & billing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/account"
              className="border border-white/15 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white/70 transition-colors hover:border-white hover:text-white"
            >
              ← CLIENT ACCOUNT
            </Link>
            <Link
              to="/"
              className="border border-white/15 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white/70 transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
            >
              LIVE SITE ↗
            </Link>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Active Projects
            </span>
            <p className="mt-2 font-display text-3xl text-white">{activeProjectsCount}</p>
            <span className="mt-1 block font-mono text-[10px] text-white/40">
              Commissions & Retainers
            </span>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              New Inquiries
            </span>
            <p className="mt-2 font-display text-3xl text-[#FF3333]">{unreadInquiriesCount}</p>
            <span className="mt-1 block font-mono text-[10px] text-white/40">
              {unreadInquiriesCount === 0 ? "Inbox up to date" : "Unread client messages"}
            </span>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Pending Balances
            </span>
            <p className="mt-2 font-display text-3xl text-white">
              {money(pendingBalanceTotal, "USD")}
            </p>
            <span className="mt-1 block font-mono text-[10px] text-white/40">
              Awaiting project completion
            </span>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Showcase Work
            </span>
            <p className="mt-2 font-display text-3xl text-white">
              {(portfolioData?.projects ?? []).length}
            </p>
            <span className="mt-1 block font-mono text-[10px] text-white/40">
              Live portfolio items
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-10 flex flex-wrap gap-3 border-b border-white/10 pb-4">
          {[
            { id: "PROJECTS", label: "CURRENT PROJECTS", icon: Briefcase },
            {
              id: "PIPELINE",
              label: `LEAD PIPELINE (${(pipelineData?.leads ?? []).length})`,
              icon: Users,
            },
            {
              id: "AUTOPILOT",
              label: `FOLLOW-UP AUTOPILOT (${(autopilotData?.drafts ?? []).filter((d) => d.status === "draft").length})`,
              icon: Bot,
            },
            {
              id: "PROSPECTS",
              label: `PROSPECT FINDER (${(prospectsData?.prospects ?? []).filter((p) => p.pain_score >= 20 && p.status === "new").length})`,
              icon: Radar,
            },
            {
              id: "INQUIRIES",
              label: `CLIENT LEADS (${unreadInquiriesCount})`,
              icon: MessageSquare,
            },
            {
              id: "PROPOSALS",
              label: `PROPOSALS & CONTRACTS (${(proposalsData ?? []).length})`,
              icon: FileCheck,
            },
            { id: "PORTFOLIO", label: "PORTFOLIO MANAGER", icon: Eye },
            { id: "FINANCIALS", label: "FINANCIALS & STATS", icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentView(tab.id as MainView)}
                className={`flex items-center gap-2 px-5 py-3 font-mono text-xs tracking-widest transition-all ${
                  isActive
                    ? "bg-[#FF3333] font-bold text-black shadow-lg"
                    : "border border-white/10 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {ordersError && (
          <p className="mt-10 font-mono text-xs text-amber-300">
            You don’t have admin access on this account. Please sign in as an admin.
          </p>
        )}

        {/* Dynamic Views */}
        <div className="mt-8">
          {currentView === "PROJECTS" && (
            <AdminProjectsView
              orders={ordersData?.orders ?? []}
              filterTab={filterTab}
              setFilterTab={setFilterTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSendInvoice={invoiceBalance}
              onUpdateMilestone={changeMilestone}
              onViewBrief={(b) => setSelectedBrief(b)}
              onCreateProposalFromBrief={handleOpenProposalFromBrief}
              busy={busy}
              money={money}
              date={date}
            />
          )}

          {currentView === "AUTOPILOT" && (
            <AdminAutopilotView
              state={autopilotData}
              busy={busy}
              onRun={runAutopilotScan}
              onTogglePause={toggleAutopilot}
              onApprove={approveDraft}
              onDismiss={dismissDraft}
              onRetry={retryDraft}
              onSave={saveDraft}
              date={date}
            />
          )}

          {currentView === "PROSPECTS" && (
            <AdminProspectsView
              prospects={prospectsData?.prospects ?? []}
              busy={busy}
              onFind={findProspectsFor}
              onScanPending={scanPendingSites}
              onDraft={draftProspectEmail}
              onSaveDraft={saveProspectDraft}
              onSend={sendProspectEmail}
              onUpdate={updateProspect}
              date={date}
            />
          )}

          {currentView === "PIPELINE" && (
            <AdminPipelineView
              leads={pipelineData?.leads ?? []}
              onUpdateStage={changeLeadStage}
              onUpdateBooking={changeBookingStatus}
              onResolveFollowup={closeFollowup}
              date={date}
            />
          )}

          {currentView === "INQUIRIES" && (
            <AdminInquiriesView
              inquiries={inquiriesData?.inquiries ?? []}
              briefs={ordersData?.briefs ?? []}
              onUpdateInquiryStatus={toggleInquiryStatus}
              onViewBrief={(b) => setSelectedBrief(b)}
              date={date}
            />
          )}

          {currentView === "PROPOSALS" && (
            <AdminProposalsView
              proposals={proposalsData ?? []}
              onCreateProposal={() => {
                setProposalForm({
                  clientName: "",
                  clientEmail: "",
                  clientCompany: "",
                  projectTitle: "Custom Design + Build Scope",
                  scopeDeliverables:
                    "• Visual Direction Sprint (Type, Color, UI Language)\n• Full Mobile & Desktop Screen Designs in Figma\n• Complete Production Build & Interactive Animations\n• Stripe eCommerce / Payment Integration\n• SEO Meta Architecture & Performance Optimization\n• 2 Comprehensive Revision Rounds",
                  timelineWeeks: "2–3 Weeks",
                  totalPriceDollars: 5000,
                  terms: DEFAULT_TERMS,
                });
                setIsProposalModalOpen(true);
              }}
              onDeleteProposal={handleDeleteProposalItem}
              money={money}
              date={date}
            />
          )}

          {currentView === "PORTFOLIO" && (
            <AdminPortfolioCMS
              projects={portfolioData?.projects ?? []}
              onOpenNewModal={handleOpenNewProject}
              onEditProject={handleOpenEditProject}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {currentView === "FINANCIALS" && (
            <AdminFinancialsView orders={ordersData?.orders ?? []} money={money} date={date} />
          )}
        </div>

        {/* MODAL 1: BRIEF DETAIL VIEWER */}
        {selectedBrief && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-white/15 bg-[#030014] p-6 shadow-2xl">
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                    PROJECT BRIEF INTAKE
                  </span>
                  <h2 className="mt-1 font-display text-2xl uppercase text-white">
                    {selectedBrief.name}
                  </h2>
                  <p className="font-mono text-xs text-white/50">{selectedBrief.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBrief(null)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4 font-mono text-xs text-white/80">
                <div>
                  <span className="text-[#FF3333]">PROJECT TYPE:</span> {selectedBrief.project_type}
                </div>
                <div>
                  <span className="text-[#FF3333]">GOALS:</span> {selectedBrief.goals}
                </div>
                {selectedBrief.audience && (
                  <div>
                    <span className="text-[#FF3333]">TARGET AUDIENCE:</span>{" "}
                    {selectedBrief.audience}
                  </div>
                )}
                {selectedBrief.deliverables && (
                  <div>
                    <span className="text-[#FF3333]">DELIVERABLES:</span>{" "}
                    {selectedBrief.deliverables}
                  </div>
                )}
                {selectedBrief.budget && (
                  <div>
                    <span className="text-[#FF3333]">BUDGET RANGE:</span> {selectedBrief.budget}
                  </div>
                )}
                {selectedBrief.timeline && (
                  <div>
                    <span className="text-[#FF3333]">TIMELINE:</span> {selectedBrief.timeline}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  onClick={() => handleOpenProposalFromBrief(selectedBrief)}
                  className="bg-[#FF3333] px-4 py-2 font-mono text-xs font-bold text-black hover:opacity-90"
                >
                  GENERATE PROPOSAL FROM BRIEF →
                </button>
                <button
                  onClick={() => setSelectedBrief(null)}
                  className="border border-white/15 px-4 py-2 font-mono text-xs text-white/60 hover:text-white"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: ADD / EDIT PORTFOLIO PROJECT */}
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto border border-white/15 bg-[#030014] p-6 shadow-2xl">
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                    PORTFOLIO CMS
                  </span>
                  <h2 className="mt-1 font-display text-2xl uppercase text-white">
                    {editingProject ? "Edit Showcase Project" : "Add Showcase Project"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="mt-6 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[10px] text-white/40">PROJECT TITLE</label>
                  <input
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">TAGLINE</label>
                  <input
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={projectForm.tagline}
                    onChange={(e) => setProjectForm({ ...projectForm, tagline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">CATEGORY</label>
                  <select
                    className="mt-1 w-full border border-white/15 bg-[#030014] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={projectForm.category}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        category: e.target.value as "Brand Identity" | "UI/UX" | "No-Code",
                      })
                    }
                  >
                    <option value="Brand Identity">Brand Identity</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="No-Code">No-Code</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">LIVE DEMO URL</label>
                  <input
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={projectForm.url}
                    onChange={(e) => setProjectForm({ ...projectForm, url: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">DESCRIPTION</label>
                  <textarea
                    rows={3}
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">
                    FEATURE METRIC (OPTIONAL)
                  </label>
                  <input
                    placeholder="e.g. 40% faster checkout"
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={projectForm.metric}
                    onChange={(e) => setProjectForm({ ...projectForm, metric: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">TAGS (COMMA SEPARATED)</label>
                  <input
                    placeholder="UI/UX, Brand Identity, No-Code Build"
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={projectForm.tags}
                    onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                  <button
                    type="submit"
                    className="bg-[#FF3333] px-4 py-2 font-mono text-xs font-bold text-black hover:opacity-90"
                  >
                    SAVE PROJECT →
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(false)}
                    className="border border-white/15 px-4 py-2 font-mono text-xs text-white/60 hover:text-white"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: CREATE PROPOSAL */}
        {isProposalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto border border-white/15 bg-[#030014] p-6 shadow-2xl">
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                    1-CLICK PROPOSAL GENERATOR
                  </span>
                  <h2 className="mt-1 font-display text-2xl uppercase text-white">
                    Create Scope Agreement
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProposal} className="mt-6 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[10px] text-white/40">CLIENT NAME</label>
                  <input
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={proposalForm.clientName}
                    onChange={(e) =>
                      setProposalForm({ ...proposalForm, clientName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">CLIENT EMAIL</label>
                  <input
                    type="email"
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={proposalForm.clientEmail}
                    onChange={(e) =>
                      setProposalForm({ ...proposalForm, clientEmail: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">COMPANY NAME (OPTIONAL)</label>
                  <input
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={proposalForm.clientCompany}
                    onChange={(e) =>
                      setProposalForm({ ...proposalForm, clientCompany: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">PROJECT TITLE</label>
                  <input
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={proposalForm.projectTitle}
                    onChange={(e) =>
                      setProposalForm({ ...proposalForm, projectTitle: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40">SCOPE DELIVERABLES</label>
                  <textarea
                    rows={4}
                    className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                    value={proposalForm.scopeDeliverables}
                    onChange={(e) =>
                      setProposalForm({ ...proposalForm, scopeDeliverables: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-white/40">TIMELINE</label>
                    <input
                      className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                      value={proposalForm.timelineWeeks}
                      onChange={(e) =>
                        setProposalForm({ ...proposalForm, timelineWeeks: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40">TOTAL PRICE ($ USD)</label>
                    <input
                      type="number"
                      className="mt-1 w-full border border-white/15 bg-white/[0.02] p-2 text-white focus:border-[#FF3333] focus:outline-none"
                      value={proposalForm.totalPriceDollars}
                      onChange={(e) =>
                        setProposalForm({
                          ...proposalForm,
                          totalPriceDollars: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                  <button
                    type="submit"
                    className="bg-[#FF3333] px-4 py-2 font-mono text-xs font-bold text-black hover:opacity-90"
                  >
                    GENERATE &amp; SHARE PROPOSAL →
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProposalModalOpen(false)}
                    className="border border-white/15 px-4 py-2 font-mono text-xs text-white/60 hover:text-white"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
