import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { SHOWCASE_WORK, type ShowcaseWorkEntry } from "@/lib/site-content";

function WorkCard({ entry, index, compact }: { entry: ShowcaseWorkEntry; index: number; compact: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const showImage = entry.image !== null && !imageFailed;

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setImageFailed(true);
  }, []);

  return (
    <article className="group border border-white/10 bg-white/[0.02] transition-colors hover:border-[#DFBA73]/60">
      <div className={`${compact ? "aspect-[4/3] max-h-56" : "aspect-[4/3]"} relative w-full overflow-hidden bg-[#0a0620]`}>
        {showImage ? (
          <>
            <img
              ref={imgRef}
              src={entry.image ?? ""}
              alt={entry.alt}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#030014]/90 to-transparent px-4 pb-3 pt-10 font-mono text-[9px] tracking-widest text-[#DFBA73]">
              {entry.eyebrow}
            </span>
          </>
        ) : (
          <>
            <span className="absolute left-4 top-4 font-mono text-[9px] tracking-widest text-[#DFBA73]">{entry.eyebrow}</span>
            <span className="absolute bottom-2 right-4 font-display text-6xl text-white/5">0{index + 1}</span>
          </>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl uppercase text-white">{entry.title}</h3>
        <p className="mt-2 font-mono text-xs leading-relaxed text-white/60">{entry.result}</p>
        <Link to="/case-study" className="mt-5 inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-[#DFBA73] hover:text-white">
          SEE HOW I WORK <ArrowUpRight className="size-3" />
        </Link>
      </div>
    </article>
  );
}

export function WorkGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {SHOWCASE_WORK.map((entry, index) => (
          <WorkCard key={entry.slug} entry={entry} index={index} compact={compact} />
        ))}
      </div>
      <p className="mt-5 font-mono text-[11px] text-white/40">
        Named client work is added with written permission — I&apos;ll walk you through live projects on the call.
      </p>
    </div>
  );
}
