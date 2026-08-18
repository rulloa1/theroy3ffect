import { useState } from "react";
import { Edit2, ExternalLink, Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import type { PortfolioProject } from "@/utils/projects.functions";

export interface AdminPortfolioCMSProps {
  projects: PortfolioProject[];
  onOpenNewModal: () => void;
  onEditProject: (project: PortfolioProject) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
}

export function AdminPortfolioCMS({
  projects,
  onOpenNewModal,
  onEditProject,
  onDeleteProject,
}: AdminPortfolioCMSProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-display text-xl uppercase text-white">Work Showcase CMS</h2>
          <p className="mt-1 font-mono text-xs text-white/50">
            Manage showcase projects, client links, tags, and display ordering.
          </p>
        </div>
        <button
          onClick={onOpenNewModal}
          className="inline-flex items-center gap-2 bg-[#FF3333] px-4 py-2 font-mono text-xs font-bold tracking-widest text-black transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          ADD WORK SHOWCASE
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="flex flex-col justify-between border border-white/10 bg-white/[0.01] p-5 transition-colors hover:border-white/20"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-lg uppercase tracking-wide text-white">
                  {proj.title}
                </span>
                <span className="border border-[#FF3333]/40 bg-[#FF3333]/10 px-2 py-0.5 font-mono text-[9px] text-[#FF3333]">
                  {proj.category}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-white/70">{proj.tagline}</p>
              <p className="mt-3 font-mono text-xs text-white/50 line-clamp-3">
                {proj.description}
              </p>

              {proj.metric && (
                <div className="mt-3 inline-block border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-400">
                  ⚡ {proj.metric}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1">
                {proj.tags.map((t) => (
                  <span
                    key={t}
                    className="border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-white/60"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditProject(proj)}
                  className="inline-flex items-center gap-1 border border-white/15 px-2.5 py-1 font-mono text-[10px] text-white hover:border-[#FF3333]"
                >
                  <Edit2 className="size-3 text-[#FF3333]" />
                  EDIT
                </button>
                <a
                  href={proj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-white/15 px-2.5 py-1 font-mono text-[10px] text-white/70 hover:text-white"
                >
                  <ExternalLink className="size-3" />
                  VISIT
                </a>
              </div>

              <button
                onClick={async () => {
                  if (confirm(`Delete showcase project "${proj.title}"?`)) {
                    await onDeleteProject(proj.id);
                    toast.success("Showcase project deleted");
                  }
                }}
                className="p-1 text-white/40 hover:text-red-400"
                title="Delete project"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
