import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Loader2, ExternalLink } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getMyPortal, type PortalProject } from "@/utils/portal.functions";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "Client Portal — theroyeffect.com" },
      {
        name: "description",
        content: "Your private client portal: live project status, milestones, and deliverables.",
      },
      { property: "og:title", content: "Client Portal — theroyeffect.com" },
      {
        property: "og:description",
        content: "Live project status, milestones, and deliverables.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalPage,
});

const STATUS_LABELS: Record<string, string> = {
  onboarding: "ONBOARDING",
  in_progress: "IN PROGRESS",
  in_review: "IN REVIEW",
  delivered: "DELIVERED",
  complete: "COMPLETE",
};

const date = (value: string) =>
  value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

function ProjectCard({ project }: { project: PortalProject }) {
  const done = project.milestones.filter((m) => m.status === "done").length;
  const total = project.milestones.length;
  const deliverables = project.milestones.filter((m) => m.link);

  return (
    <section className="border border-white/10 bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl uppercase leading-tight text-white">
            {project.title}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-white/40">
            Started {date(project.created_at)}
            {total > 0 ? ` · ${done}/${total} milestones complete` : ""}
          </p>
        </div>
        <span
          className={`border px-3 py-1 font-mono text-[10px] tracking-widest ${
            project.status === "complete" || project.status === "delivered"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : "border-[#FF3333]/50 bg-[#FF3333]/10 text-[#FF3333]"
          }`}
        >
          {STATUS_LABELS[project.status] ?? project.status.toUpperCase()}
        </span>
      </div>

      {project.summary && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60">{project.summary}</p>
      )}

      {total > 0 && (
        <ol className="mt-6 space-y-0 border-l border-white/10 pl-0">
          {project.milestones.map((m) => (
            <li key={m.id} className="relative flex gap-4 py-3 pl-6">
              <span className="absolute -left-[7px] top-4">
                {m.status === "done" ? (
                  <CheckCircle2 className="size-3.5 text-[#FF3333]" />
                ) : m.status === "active" ? (
                  <Loader2 className="size-3.5 animate-spin text-white" />
                ) : (
                  <Circle className="size-3.5 text-white/25" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-display text-sm uppercase ${
                      m.status === "pending" ? "text-white/40" : "text-white"
                    }`}
                  >
                    {m.title}
                  </span>
                  {m.status === "active" && (
                    <span className="bg-[#FF3333] px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-black">
                      IN PROGRESS
                    </span>
                  )}
                </div>
                {m.note && <p className="mt-1 font-mono text-xs text-white/50">{m.note}</p>}
                {m.link && (
                  <a
                    href={m.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 border border-[#FF3333]/40 bg-[#FF3333]/10 px-3 py-1.5 font-mono text-[11px] tracking-widest text-[#FF3333] transition-colors hover:bg-[#FF3333] hover:text-black"
                  >
                    VIEW DELIVERABLE <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {deliverables.length === 0 && total === 0 && (
        <p className="mt-4 font-mono text-xs text-white/40">
          Milestones will appear here as the project kicks off.
        </p>
      )}
    </section>
  );
}

function PortalPage() {
  const fetchPortal = useServerFn(getMyPortal);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["client-portal"],
    queryFn: () => fetchPortal(),
  });

  const projects = data?.projects ?? [];

  return (
    <main className="min-h-screen bg-[#030014] px-5 py-16 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Logo variant="compact" size="md" href="/" className="mb-6" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
              CLIENT PORTAL
            </span>
            <h1 className="mt-3 font-display text-3xl uppercase leading-[0.9] text-white sm:text-5xl">
              YOUR PROJECTS
            </h1>
            <p className="mt-2 font-mono text-xs text-white/40">
              Live status, milestones, and deliverables from the studio.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/account"
              className="border border-white/15 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
            >
              ACCOUNT &amp; BILLING
            </Link>
            <Link
              to="/"
              className="border border-white/15 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white/60 transition-colors hover:text-white"
            >
              BACK TO SITE
            </Link>
          </div>
        </div>

        {isLoading && (
          <p className="mt-12 font-mono text-xs text-white/40">Loading your projects…</p>
        )}

        {isError && (
          <div className="mt-12 border border-[#FF3333]/40 bg-[#FF3333]/5 p-6">
            <p className="font-mono text-xs tracking-widest text-[#FF3333]">
              COULDN'T LOAD YOUR PORTAL
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 border border-white/20 px-4 py-2 font-mono text-[11px] tracking-widest text-white/80 transition-colors hover:border-white/50 hover:text-white"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {data && projects.length === 0 && (
          <div className="mt-12 border border-dashed border-white/10 py-16 text-center">
            <p className="font-mono text-xs text-white/50">
              No projects in your portal yet. Once your commission kicks off, live milestones and
              deliverables will show up here.
            </p>
            <Link
              to="/account"
              className="mt-6 inline-block bg-[#FF3333] px-5 py-2.5 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
            >
              VIEW YOUR ACCOUNT →
            </Link>
          </div>
        )}

        <div className="mt-10 space-y-8">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </main>
  );
}
