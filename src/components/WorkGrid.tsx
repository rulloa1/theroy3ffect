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
    <article className="group border border-white/10 bg-white/[0.02] transition-colors hover:border-[#dfba73]/60">
      <div className={`${compact ? "aspect-[4/3] max-h-56" : "aspect-[4/3]"} relative w-full overflow-hidden bg-[#16130f]`}>
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
            <span className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0a0a]/90 to-transparent px-4 pb-3 pt-10 font-mono text-[9px] tracking-widest text-[#dfba73]">
              {entry.eyebrow}
            </span>
          </>
        ) : (
          <div className="absolute inset-0 overflow-hidden bg-[#16130f]" role="img" aria-label={entry.alt}>
            <div className="absolute inset-x-[12%] top-[18%] h-[58%] border border-[#dfba73]/50 bg-[#0a0a0a] shadow-[18px_18px_0_rgba(255,51,51,0.18)]" />
            <div className="absolute left-[18%] top-[29%] h-2 w-[18%] bg-[#dfba73]" />
            <div className="absolute left-[18%] top-[39%] h-5 w-[48%] bg-white/90" />
            <div className="absolute left-[18%] top-[51%] h-3 w-[35%] bg-white/30" />
            <div className="absolute bottom-2 right-4 font-display text-6xl text-white/5">0{index + 1}</div>
            <span className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0a0a] to-transparent px-4 pb-3 pt-10 font-mono text-[10px] tracking-widest text-[#dfba73]">{entry.eyebrow}</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl uppercase text-white">{entry.title}</h3>
        <p className="mt-2 font-mono text-base leading-[1.6] text-white/90">{entry.result}</p>
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
      <p className="mt-5 font-mono text-[15px] leading-[1.6] text-white/90">
        Named client work is added with written permission — I&apos;ll walk you through live projects on the call.
      </p>
      <Link to="/case-study" className="mt-4 inline-flex min-h-11 items-center gap-2 py-2 font-mono text-[15px] tracking-widest text-[#dfba73] transition-colors hover:text-white">
        SEE HOW I WORK <ArrowUpRight className="size-4" />
      </Link>
    </div>
  );
}
