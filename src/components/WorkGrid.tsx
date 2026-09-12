import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Layers3, Smartphone, Search } from "lucide-react";

const PROJECTS = [
  {
    icon: Layers3,
    title: "Brand system",
    label: "COMPOSITE PROJECT",
    result: "A consistent brand system across the website and everyday collateral.",
  },
  {
    icon: Smartphone,
    title: "Mobile quote flow",
    label: "COMPOSITE PROJECT",
    result: "A quote request that works clearly and quickly on a phone.",
  },
  {
    icon: Search,
    title: "Search-led service site",
    label: "COMPOSITE PROJECT",
    result: "Service pages written for search intent, with copy the owner can edit.",
  },
];

export function WorkGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PROJECTS.map(({ icon: Icon, title, label, result }, index) => (
        <article key={title} className="group border border-white/10 bg-white/[0.02]">
          <div className={`${compact ? "min-h-40" : "min-h-52"} relative flex items-center justify-center overflow-hidden border-b border-white/10 bg-[#0a0620]`}>
            <span className="absolute left-4 top-4 font-mono text-[9px] tracking-widest text-[#DFBA73]">{label}</span>
            <span className="absolute right-4 top-4 font-display text-5xl text-white/5">0{index + 1}</span>
            <Icon className="size-10 text-[#FF3333] transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="p-5">
            <h3 className="font-display text-xl uppercase text-white">{title}</h3>
            <p className="mt-2 font-mono text-xs leading-relaxed text-white/60">{result}</p>
            <Link to="/case-study" className="mt-5 inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-[#DFBA73] hover:text-white">
              VIEW THE COMPOSITE CASE <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}