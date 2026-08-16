import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  X,
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
  type AdminInquiry,
  type AdminOrder,
} from "@/utils/admin.functions";
import type { PortfolioProject } from "@/utils/projects.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio Command Hub — theroyeffect.com" },
      {
        name: "description",
        content: "Studio owner management hub: current projects, client leads, portfolio editor, and billing.",
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

type MainView = "PROJECTS" | "INQUIRIES" | "PORTFOLIO" | "FINANCIALS";
type FilterTab = "ALL" | "PENDING_BALANCE" | "PAID_IN_FULL" | "RETAINERS" | "REFUNDED";

const MILESTONES = [
  { id: "brief_received", label: "1. Brief Received" },
  { id: "direction_locked", label: "2. Direction Locked" },
  { id: "design_build", label: "3. Design & Build" },
  { id: "in_review", label: "4. Review Rounds" },
  { id: "completed", label: "5. Completed & Live" },
];

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

  const [currentView, setCurrentView] = useState<MainView>("PROJECTS");
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // Modals state
  const [selectedBrief, setSelectedBrief] = useState<AdminBrief | null>(null);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

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
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["admin-orders", environment],
    queryFn: () => listOrders({ data: { environment } }),
    retry: false,
  });

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: () => listInquiries(),
    retry: false,
  });

  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ["admin-portfolio"],
    queryFn: () => listPortfolio(),
    retry: false,
  });

  // Stats
  const activeProjectsCount = (ordersData?.orders ?? []).length;
  const unreadInquiriesCount = (inquiriesData?.inquiries ?? []).filter((i) => i.status === "unread").length;
  const pendingBalanceTotal = (ordersData?.orders ?? [])
    .filter((o) => o.balance_due_cents > 0 && o.balance_status === "pending")
    .reduce((sum, o) => sum + o.balance_due_cents, 0);

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
  const toggleInquiryStatus = async (inquiryId: string, status: "unread" | "replied" | "archived") => {
    try {
      await updateInquiry({ data: { inquiryId, status } });
      toast.success(`Message marked as ${status}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
    } catch {
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

      const res = await upsertPortfolioProject({
        data: {
          id: projectForm.id,
          title: projectForm.title,
          tagline: projectForm.tagline,
          description: projectForm.description,
          url: projectForm.url,
          category: projectForm.category,
          metric: projectForm.metric || undefined,
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
    if (!confirm("Are you sure you want to remove this project from your showcase?")) return;
    try {
      await deletePortfolio({ data: { projectId } });
      toast.success("Project removed");
      await queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
    } catch {
      toast.error("Failed to delete project");
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!ordersData?.orders) return [];
    let list = ordersData.orders;

    if (filterTab === "PENDING_BALANCE") {
      list = list.filter((o) => o.balance_due_cents > 0 && o.balance_status === "pending");
    } else if (filterTab === "PAID_IN_FULL") {
      list = list.filter((o) => o.payment_status === "paid" && o.balance_due_cents === 0);
    } else if (filterTab === "RETAINERS") {
      list = list.filter((o) => o.purchase_kind === "subscription");
    } else if (filterTab === "REFUNDED") {
      list = list.filter((o) => o.amount_refunded > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.customer_email?.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.product_name?.toLowerCase().includes(q) ||
          o.stripe_session_id?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [ordersData?.orders, filterTab, searchQuery]);

  // CSV Export
  const exportCsv = () => {
    if (!ordersData?.orders || ordersData.orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = [
      "ID",
      "Date",
      "Product",
      "Customer Name",
      "Customer Email",
      "Amount Total",
      "Currency",
      "Payment Status",
      "Balance Due",
      "Balance Status",
      "Refunded",
    ];
    const rows = ordersData.orders.map((o) => [
      `"${o.id}"`,
      `"${o.created_at}"`,
      `"${o.product_name ?? ""}"`,
      `"${o.customer_name ?? ""}"`,
      `"${o.customer_email ?? ""}"`,
      (o.amount_total / 100).toFixed(2),
      o.currency,
      o.payment_status,
      (o.balance_due_cents / 100).toFixed(2),
      o.balance_status,
      (o.amount_refunded / 100).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `theroy_orders_${environment}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded");
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
            <span className="mt-1 block font-mono text-[10px] text-white/40">Commissions & Retainers</span>
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
            <p className="mt-2 font-display text-3xl text-white">{money(pendingBalanceTotal, "USD")}</p>
            <span className="mt-1 block font-mono text-[10px] text-white/40">Awaiting project completion</span>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Showcase Work
            </span>
            <p className="mt-2 font-display text-3xl text-white">
              {(portfolioData?.projects ?? []).length}
            </p>
            <span className="mt-1 block font-mono text-[10px] text-white/40">Live portfolio items</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-10 flex flex-wrap gap-3 border-b border-white/10 pb-4">
          {[
            { id: "PROJECTS", label: "CURRENT PROJECTS", icon: Briefcase },
            { id: "INQUIRIES", label: `CLIENT LEADS (${unreadInquiriesCount})`, icon: MessageSquare },
            { id: "PORTFOLIO", label: "PORTFOLIO MANAGER", icon: Eye },
            { id: "FINANCIALS", label: "FINANCIALS & CSV", icon: DollarSign },
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

        {/* ========================================================================= */}
        {/* VIEW 1: PROJECTS & COMMISSIONS */}
        {/* ========================================================================= */}
        {currentView === "PROJECTS" && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "ALL", label: "All Projects" },
                  { id: "PENDING_BALANCE", label: "Pending Balance" },
                  { id: "PAID_IN_FULL", label: "Paid in Full" },
                  { id: "RETAINERS", label: "Retainers" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id as FilterTab)}
                    className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                      filterTab === tab.id
                        ? "bg-[#FF3333] font-semibold text-black"
                        : "border border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search client or project…"
                  className="w-full border border-white/15 bg-white/[0.02] py-2 pl-9 pr-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none"
                />
              </div>
            </div>

            {ordersLoading && <p className="mt-8 font-mono text-xs text-white/40">Loading projects…</p>}

            {filteredOrders.length === 0 && !ordersLoading && (
              <div className="border border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="font-mono text-xs text-white/40">No projects match the current filter.</p>
              </div>
            )}

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-xl uppercase text-white">{order.product_name}</h3>
                        {order.is_deposit && (
                          <span className="border border-[#FF3333]/40 bg-[#FF3333]/10 px-2 py-0.5 font-mono text-[9px] text-[#FF3333]">
                            50% DEPOSIT
                          </span>
                        )}
                        <span className="border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/60">
                          {order.payment_status}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-white/50">
                        Client: <strong className="text-white">{order.customer_name || "Direct Client"}</strong> (
                        {order.customer_email ?? "No email"}) · Booked {date(order.created_at)}
                      </p>
                      <p className="mt-1 font-mono text-xs text-white/40">
                        Paid: {money(order.amount_total, order.currency)}
                        {order.balance_due_cents > 0 &&
                          ` · Remaining Balance: ${money(order.balance_due_cents, order.currency)} (${order.balance_status})`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {order.brief && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrief(order.brief ?? null)}
                          className="inline-flex items-center gap-1.5 border border-white/20 px-3 py-2 font-mono text-[11px] tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
                        >
                          <FileText className="size-3 text-[#FF3333]" />
                          INSPECT BRIEF
                        </button>
                      )}

                      {order.balance_due_cents > 0 && order.balance_status === "pending" && (
                        <button
                          type="button"
                          onClick={() => invoiceBalance(order.id)}
                          disabled={busy === order.id}
                          className="bg-[#FF3333] px-4 py-2 font-mono text-[11px] tracking-widest text-black disabled:opacity-50"
                        >
                          {busy === order.id ? "SENDING…" : "INVOICE BALANCE"}
                        </button>
                      )}

                      {order.balance_invoice_url && (
                        <a
                          href={order.balance_invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="border border-[#FF3333]/40 bg-[#FF3333]/10 px-3 py-2 font-mono text-[11px] tracking-widest text-[#FF3333] hover:bg-[#FF3333] hover:text-black"
                        >
                          VIEW INVOICE ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Milestone Progress Bar & Selector */}
                  {order.brief && (
                    <div className="mt-6 border-t border-white/10 pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                          Active Workflow Stage:
                        </span>
                        <select
                          value={order.brief.project_status || "brief_received"}
                          onChange={(e) => changeMilestone(order.brief!.id, e.target.value)}
                          className="border border-white/20 bg-[#030014] px-3 py-1.5 font-mono text-xs text-[#FF3333] focus:border-[#FF3333] focus:outline-none"
                        >
                          {MILESTONES.map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#030014] text-white">
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CLIENT MESSAGES & LEADS */}
        {/* ========================================================================= */}
        {currentView === "INQUIRIES" && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="font-display text-2xl uppercase text-white">CLIENT MESSAGES & INQUIRIES</h2>
              <span className="font-mono text-xs text-white/40">
                {(inquiriesData?.inquiries ?? []).length} Total Inbound Messages
              </span>
            </div>

            {inquiriesLoading && <p className="font-mono text-xs text-white/40">Loading inquiries…</p>}

            {(inquiriesData?.inquiries ?? []).length === 0 && !inquiriesLoading && (
              <div className="border border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="font-mono text-xs text-white/40">No contact messages received yet.</p>
              </div>
            )}

            {(inquiriesData?.inquiries ?? []).map((inquiry: AdminInquiry) => (
              <div
                key={inquiry.id}
                className={`border p-5 transition-colors ${
                  inquiry.status === "unread"
                    ? "border-[#FF3333]/50 bg-[#FF3333]/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg uppercase text-white">{inquiry.name}</span>
                      <span className="font-mono text-xs text-white/40">&lt;{inquiry.email}&gt;</span>
                      <span
                        className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                          inquiry.status === "unread"
                            ? "bg-[#FF3333] text-black font-bold"
                            : inquiry.status === "replied"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/10 text-white/50"
                        }`}
                      >
                        {inquiry.status}
                      </span>
                    </div>
                    {inquiry.project_type && (
                      <p className="mt-1 font-mono text-xs text-[#FF3333]">
                        Requested Service: {inquiry.project_type}
                      </p>
                    )}
                    <span className="mt-0.5 block font-mono text-[10px] text-white/30">
                      Received {date(inquiry.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${inquiry.email}?subject=Re: Project Inquiry (${inquiry.project_type || "Creative Design"})`}
                      onClick={() => toggleInquiryStatus(inquiry.id, "replied")}
                      className="inline-flex items-center gap-1.5 bg-[#FF3333] px-3 py-1.5 font-mono text-[11px] tracking-widest text-black transition-opacity hover:opacity-90"
                    >
                      <Mail className="size-3" />
                      REPLY (EMAIL)
                    </a>
                    {inquiry.status === "unread" && (
                      <button
                        type="button"
                        onClick={() => toggleInquiryStatus(inquiry.id, "replied")}
                        className="border border-white/20 px-3 py-1.5 font-mono text-[11px] tracking-widest text-white/70 hover:text-white"
                      >
                        MARK REPLIED
                      </button>
                    )}
                    {inquiry.status !== "archived" && (
                      <button
                        type="button"
                        onClick={() => toggleInquiryStatus(inquiry.id, "archived")}
                        className="border border-white/20 px-3 py-1.5 font-mono text-[11px] tracking-widest text-white/50 hover:text-white"
                      >
                        ARCHIVE
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/80">
                    {inquiry.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: PORTFOLIO SHOWCASE MANAGER */}
        {/* ========================================================================= */}
        {currentView === "PORTFOLIO" && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-2xl uppercase text-white">PORTFOLIO SHOWCASE MANAGER</h2>
                <p className="mt-1 font-mono text-xs text-white/50">
                  Add, update, or reorder the projects displayed in your live portfolio.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewProject}
                className="inline-flex items-center gap-2 bg-[#FF3333] px-5 py-2.5 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
              >
                <Plus className="size-3.5" />
                ADD NEW PROJECT
              </button>
            </div>

            {portfolioLoading && <p className="font-mono text-xs text-white/40">Loading portfolio items…</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              {(portfolioData?.projects ?? []).map((proj: PortfolioProject) => (
                <div
                  key={proj.id}
                  className="flex flex-col justify-between border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-xl uppercase text-white">{proj.title}</h3>
                          {proj.metric && (
                            <span className="bg-[#FF3333]/15 px-2 py-0.5 font-mono text-[10px] text-[#FF3333]">
                              {proj.metric}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-xs text-white/40">{proj.tagline}</p>
                      </div>
                      <span className="border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/60">
                        {proj.category}
                      </span>
                    </div>

                    <p className="mt-3 font-mono text-xs leading-relaxed text-white/60 line-clamp-3">
                      {proj.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {proj.tags.map((tag) => (
                        <span
                          key={tag}
                          className="border border-white/10 bg-white/[0.02] px-2 py-0.5 font-mono text-[9px] text-white/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-[#FF3333] hover:underline"
                    >
                      {proj.url.replace(/^https?:\/\//, "").slice(0, 24)}… ↗
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditProject(proj)}
                        className="inline-flex items-center gap-1 border border-white/15 px-2.5 py-1.5 font-mono text-[11px] text-white/80 hover:border-white hover:text-white"
                      >
                        <Edit2 className="size-3" />
                        EDIT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id)}
                        className="inline-flex items-center gap-1 border border-white/15 px-2.5 py-1.5 font-mono text-[11px] text-rose-400 hover:border-rose-400"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: FINANCIALS & CSV */}
        {/* ========================================================================= */}
        {currentView === "FINANCIALS" && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-2xl uppercase text-white">FINANCIALS & ACCOUNTING</h2>
                <p className="mt-1 font-mono text-xs text-white/50">
                  Export commission records and view balance invoicing history.
                </p>
              </div>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 bg-[#FF3333] px-5 py-2.5 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
              >
                <Download className="size-3.5" />
                EXPORT ALL AS CSV
              </button>
            </div>

            <div className="overflow-x-auto border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Paid</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(ordersData?.orders ?? []).map((o) => (
                    <tr key={o.id} className="hover:bg-white/[0.01]">
                      <td className="p-4 text-white/60">{date(o.created_at)}</td>
                      <td className="p-4 font-semibold text-white">{o.product_name}</td>
                      <td className="p-4 text-white/70">{o.customer_email ?? "—"}</td>
                      <td className="p-4 text-emerald-400">{money(o.amount_total, o.currency)}</td>
                      <td className="p-4 text-white/50">
                        {o.balance_due_cents > 0 ? money(o.balance_due_cents, o.currency) : "—"}
                      </td>
                      <td className="p-4">
                        <span className="border border-white/15 px-2 py-0.5 text-[9px] uppercase">
                          {o.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: BRIEF INSPECTION */}
      {/* ========================================================================= */}
      {selectedBrief && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-white/15 bg-[#030014] p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                  CLIENT PROJECT BRIEF
                </span>
                <h2 className="mt-1 font-display text-2xl uppercase text-white">
                  {selectedBrief.project_type}
                </h2>
                <p className="mt-1 font-mono text-xs text-white/50">
                  {selectedBrief.name} ({selectedBrief.email})
                  {selectedBrief.company ? ` · ${selectedBrief.company}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBrief(null)}
                className="border border-white/20 p-1.5 text-white/60 hover:border-white hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/40">Goals & Objectives</span>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-white/80">
                  {selectedBrief.goals}
                </p>
              </div>
              {selectedBrief.audience && (
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Target Audience</span>
                  <p className="mt-1 text-white/70">{selectedBrief.audience}</p>
                </div>
              )}
              {selectedBrief.deliverables && (
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Scope & Deliverables</span>
                  <p className="mt-1 text-white/70">{selectedBrief.deliverables}</p>
                </div>
              )}
              {selectedBrief.references_links && (
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">References & Assets</span>
                  <p className="mt-1 break-all text-[#FF3333] underline">{selectedBrief.references_links}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Budget</span>
                  <p className="mt-1 text-white">{selectedBrief.budget || "Not specified"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Timeline</span>
                  <p className="mt-1 text-white">{selectedBrief.timeline || "Not specified"}</p>
                </div>
              </div>

              {/* Studio Updates & Prototype Links for Client Portal */}
              <div className="border-t border-white/10 pt-5 space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[#FF3333] font-bold">
                  CLIENT PORTAL UPDATES &amp; DELIVERABLES (LIVE ON /ACCOUNT)
                </span>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40">
                    Studio Direction Note to Client
                  </label>
                  <textarea
                    rows={2}
                    defaultValue={selectedBrief.project_notes || ""}
                    id="modal-project-notes"
                    placeholder="e.g. Completed initial design direction in Figma; ready for your review."
                    className="mt-1 w-full resize-none border border-white/15 bg-white/[0.02] p-2 text-xs text-white focus:border-[#FF3333] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40">
                    Prototype &amp; Staging Links (one URL per line)
                  </label>
                  <textarea
                    rows={2}
                    defaultValue={selectedBrief.project_links || ""}
                    id="modal-project-links"
                    placeholder="https://www.figma.com/proto/...\nhttps://staging.lovable.app"
                    className="mt-1 w-full resize-none border border-white/15 bg-white/[0.02] p-2 text-xs text-white focus:border-[#FF3333] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      const notes = (document.getElementById("modal-project-notes") as HTMLTextAreaElement)?.value;
                      const links = (document.getElementById("modal-project-links") as HTMLTextAreaElement)?.value;
                      try {
                        const res = await updateMilestone({
                          data: {
                            briefId: selectedBrief.id,
                            projectStatus: selectedBrief.project_status || "brief_received",
                            projectNotes: notes,
                            projectLinks: links,
                          },
                        });
                        if (!res.success) throw new Error(res.error || "Update failed");
                        toast.success("Studio update synced to client dashboard");
                        await queryClient.invalidateQueries({ queryKey: ["admin-orders", environment] });
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to save update");
                      }
                    }}
                    className="bg-[#FF3333] px-4 py-2 font-mono text-xs font-semibold tracking-widest text-black hover:opacity-90"
                  >
                    SAVE &amp; PUSH TO CLIENT PORTAL
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
              {selectedBrief.pdf_url ? (
                <a
                  href={selectedBrief.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-[#FF3333]/40 bg-[#FF3333]/10 px-4 py-2 font-mono text-xs tracking-widest text-[#FF3333] hover:bg-[#FF3333] hover:text-black"
                >
                  DOWNLOAD BRIEF PDF ↓
                </a>
              ) : (
                <span className="font-mono text-xs text-white/40">No generated PDF file</span>
              )}
              <button
                type="button"
                onClick={() => setSelectedBrief(null)}
                className="border border-white/15 px-4 py-2 font-mono text-xs text-white/60 hover:text-white"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT PORTFOLIO PROJECT */}
      {/* ========================================================================= */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto border border-white/15 bg-[#030014] p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
                  PORTFOLIO SHOWCASE
                </span>
                <h2 className="mt-1 font-display text-2xl uppercase text-white">
                  {editingProject ? "EDIT PROJECT" : "ADD NEW PROJECT"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="border border-white/20 p-1.5 text-white/60 hover:border-white hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="mt-6 space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40">Project Title</label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="e.g. Zest Depot"
                  className="mt-1 w-full border border-white/15 bg-transparent p-2.5 text-white focus:border-[#FF3333] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40">Tagline</label>
                <input
                  type="text"
                  required
                  value={projectForm.tagline}
                  onChange={(e) => setProjectForm({ ...projectForm, tagline: e.target.value })}
                  placeholder="e.g. Retail brand system & commerce build"
                  className="mt-1 w-full border border-white/15 bg-transparent p-2.5 text-white focus:border-[#FF3333] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40">Category</label>
                  <select
                    value={projectForm.category}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        category: e.target.value as "Brand Identity" | "UI/UX" | "No-Code",
                      })
                    }
                    className="mt-1 w-full border border-white/15 bg-[#030014] p-2.5 text-white focus:border-[#FF3333] focus:outline-none"
                  >
                    <option value="Brand Identity">Brand Identity</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="No-Code">No-Code</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40">
                    Metric Badge (Optional)
                  </label>
                  <input
                    type="text"
                    value={projectForm.metric}
                    onChange={(e) => setProjectForm({ ...projectForm, metric: e.target.value })}
                    placeholder="e.g. 40% faster checkout"
                    className="mt-1 w-full border border-white/15 bg-transparent p-2.5 text-white focus:border-[#FF3333] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40">Live Project URL</label>
                <input
                  type="url"
                  required
                  value={projectForm.url}
                  onChange={(e) => setProjectForm({ ...projectForm, url: e.target.value })}
                  placeholder="https://example.com"
                  className="mt-1 w-full border border-white/15 bg-transparent p-2.5 text-white focus:border-[#FF3333] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={projectForm.tags}
                  onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                  placeholder="UI/UX, Brand Identity, No-Code Build"
                  className="mt-1 w-full border border-white/15 bg-transparent p-2.5 text-white focus:border-[#FF3333] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40">Description</label>
                <textarea
                  rows={3}
                  required
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Brief summary of the project scope and results..."
                  className="mt-1 w-full resize-none border border-white/15 bg-transparent p-2.5 text-white focus:border-[#FF3333] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={projectForm.isPublished}
                  onChange={(e) => setProjectForm({ ...projectForm, isPublished: e.target.checked })}
                  className="size-4 accent-[#FF3333]"
                />
                <label htmlFor="isPublished" className="text-xs text-white">
                  Publish to live website portfolio
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="border border-white/15 px-4 py-2 font-mono text-xs text-white/60 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-[#FF3333] px-5 py-2 font-mono text-xs font-semibold tracking-widest text-black hover:opacity-90"
                >
                  SAVE PROJECT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}


