import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import {
  PROJECT_STATUSES,
  MILESTONE_STATUSES,
  adminCreatePortalProject,
  adminDeleteMilestone,
  adminDeletePortalProject,
  adminListPortalProjects,
  adminSaveMilestone,
  adminUpdatePortalProject,
  type PortalProject,
} from "@/utils/portal.functions";

const inputCls =
  "w-full border border-white/10 bg-white/[0.02] px-3 py-2 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#FF3333] focus:outline-none";

const STATUS_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  in_progress: "In Progress",
  in_review: "In Review",
  delivered: "Delivered",
  complete: "Complete",
};

function ProjectRow({ project }: { project: PortalProject }) {
  const queryClient = useQueryClient();
  const updateProject = useServerFn(adminUpdatePortalProject);
  const deleteProject = useServerFn(adminDeletePortalProject);
  const saveMilestone = useServerFn(adminSaveMilestone);
  const deleteMilestone = useServerFn(adminDeleteMilestone);

  const [busy, setBusy] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", note: "", link: "" });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-portal"] });

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-white/10 bg-white/[0.01] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg uppercase text-white">{project.title}</p>
          <p className="mt-0.5 font-mono text-xs text-white/50">{project.client_email}</p>
          {project.summary && (
            <p className="mt-1 max-w-lg font-mono text-xs text-white/40">{project.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={project.status}
            disabled={busy}
            onChange={(e) =>
              void run(
                () =>
                  updateProject({
                    data: { id: project.id, status: e.target.value as never },
                  }),
                "Status updated",
              )
            }
            className="border border-white/15 bg-[#030014] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#FF3333] focus:outline-none"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Delete "${project.title}" and its milestones?`))
                void run(() => deleteProject({ data: { id: project.id } }), "Project deleted");
            }}
            className="border border-white/15 p-2 text-white/50 transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
            aria-label="Delete project"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Milestones */}
      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
        {project.milestones.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-2">
            <select
              value={m.status}
              disabled={busy}
              onChange={(e) =>
                void run(
                  () =>
                    saveMilestone({
                      data: {
                        id: m.id,
                        project_id: project.id,
                        title: m.title,
                        note: m.note ?? undefined,
                        link: m.link ?? undefined,
                        status: e.target.value as never,
                        position: m.position,
                      },
                    }),
                  "Milestone updated",
                )
              }
              className="border border-white/15 bg-[#030014] px-2 py-1 font-mono text-[11px] text-white focus:border-[#FF3333] focus:outline-none"
            >
              {MILESTONE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
            <span className="font-mono text-xs text-white/80">{m.title}</span>
            {m.link && (
              <a
                href={m.link}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-[#FF3333] underline"
              >
                link ↗
              </a>
            )}
            {m.note && <span className="font-mono text-[11px] text-white/40">— {m.note}</span>}
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(() => deleteMilestone({ data: { id: m.id } }), "Milestone deleted")
              }
              className="ml-auto text-white/30 transition-colors hover:text-[#FF3333]"
              aria-label={`Delete milestone ${m.title}`}
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}

        {/* Add milestone */}
        <form
          className="flex flex-wrap items-center gap-2 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newMilestone.title.trim()) return;
            void run(
              () =>
                saveMilestone({
                  data: {
                    project_id: project.id,
                    title: newMilestone.title.trim(),
                    note: newMilestone.note.trim() || undefined,
                    link: newMilestone.link.trim() || undefined,
                    status: "pending",
                    position: project.milestones.length,
                  },
                }),
              "Milestone added",
            ).then(() => setNewMilestone({ title: "", note: "", link: "" }));
          }}
        >
          <input
            type="text"
            placeholder="New milestone title…"
            value={newMilestone.title}
            onChange={(e) => setNewMilestone((s) => ({ ...s, title: e.target.value }))}
            className={`${inputCls} max-w-[220px]`}
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={newMilestone.note}
            onChange={(e) => setNewMilestone((s) => ({ ...s, note: e.target.value }))}
            className={`${inputCls} max-w-[200px]`}
          />
          <input
            type="url"
            placeholder="https:// deliverable link"
            value={newMilestone.link}
            onChange={(e) => setNewMilestone((s) => ({ ...s, link: e.target.value }))}
            className={`${inputCls} max-w-[220px]`}
          />
          <button
            type="submit"
            disabled={busy || !newMilestone.title.trim()}
            className="inline-flex items-center gap-1.5 border border-[#FF3333]/50 px-3 py-2 font-mono text-[10px] tracking-widest text-[#FF3333] transition-colors hover:bg-[#FF3333] hover:text-black disabled:opacity-40"
          >
            <Plus className="size-3" /> ADD
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminPortalView() {
  const queryClient = useQueryClient();
  const listProjects = useServerFn(adminListPortalProjects);
  const createProject = useServerFn(adminCreatePortalProject);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ client_email: "", title: "", summary: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-portal"],
    queryFn: () => listProjects(),
    retry: false,
  });

  const projects = data?.projects ?? [];

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createProject({
        data: {
          client_email: form.client_email.trim(),
          title: form.title.trim(),
          summary: form.summary.trim() || undefined,
          status: "onboarding",
        },
      });
      toast.success("Portal project created");
      setForm({ client_email: "", title: "", summary: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-portal"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create project");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="border border-white/10 bg-white/[0.02] p-5">
        <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
          NEW PORTAL PROJECT
        </span>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="email"
            required
            placeholder="Client email"
            value={form.client_email}
            onChange={(e) => setForm((s) => ({ ...s, client_email: e.target.value }))}
            className={`${inputCls} max-w-[240px]`}
          />
          <input
            type="text"
            required
            placeholder="Project title"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            className={`${inputCls} max-w-[240px]`}
          />
          <input
            type="text"
            placeholder="Summary (optional)"
            value={form.summary}
            onChange={(e) => setForm((s) => ({ ...s, summary: e.target.value }))}
            className={`${inputCls} min-w-[220px] flex-1`}
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 bg-[#FF3333] px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="size-3" /> {busy ? "CREATING…" : "CREATE"}
          </button>
        </div>
        <p className="mt-2 font-mono text-[10px] text-white/30">
          The client sees this project in their portal as soon as they sign in with this email.
        </p>
      </form>

      {isLoading && <p className="font-mono text-xs text-white/40">Loading portal projects…</p>}

      {!isLoading && projects.length === 0 && (
        <div className="border border-dashed border-white/10 py-16 text-center">
          <FolderKanban className="mx-auto size-8 text-white/20" />
          <p className="mt-3 font-mono text-xs text-white/40">
            No portal projects yet. Create one above to give a client live status visibility.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {projects.map((p) => (
          <ProjectRow key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
