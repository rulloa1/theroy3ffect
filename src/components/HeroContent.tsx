import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScrambleText } from "./ScrambleText";

const WORDS = ["PURPOSE", "IMPACT", "INTENT"];
const HEADLINES = [
  "MAKE YOUR BUSINESS IMPOSSIBLE TO IGNORE.",
  "YOUR NEXT WEBSITE STARTS HERE.",
  "YOUR BUSINESS NEEDS A WEBSITE.",
];
const BIO =
  "I'm Rory Ulloa — Creative Director, UI/UX Designer & No-Code Developer based in Houston, Texas, crafting high-impact web design that makes your brand impossible to ignore.";

export function HeroContent() {
  const [wordIndex, setWordIndex] = useState(0);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [bioKey, setBioKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
      setHeadlineIndex((i) => (i + 1) % HEADLINES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setBioKey((k) => k + 1), 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none relative z-20 flex w-full flex-1 flex-col items-center justify-center px-5 pt-24 text-center md:justify-end md:pb-[26vh] md:pt-0">
      {/* High Impact Banner Kicker */}
      <motion.div
        key={`headline-${headlineIndex}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 inline-flex items-center gap-2 border border-[#DFBA73]/40 bg-[#DFBA73]/10 px-3.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.25em] text-[#F6DC9A] uppercase sm:text-xs"
      >
        <span className="text-[#FF3333]">★</span> {HEADLINES[headlineIndex]}
      </motion.div>

      <h1 className="flex w-full flex-col items-center leading-[0.82]">
        <span className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/70 sm:text-xs sm:tracking-[0.35em]">
          Rory Ulloa — Creative Director &amp; UI/UX Designer
        </span>
        <span className="text-stroke-thin font-display text-[8vw] uppercase tracking-[0.18em] sm:text-[6.5vw] sm:tracking-[0.22em] md:[-webkit-text-stroke:2px_white]">
          DESIGN WITH
        </span>
        <ScrambleText
          text={WORDS[wordIndex]!}
          className="font-display text-[17vw] uppercase leading-[0.78] tracking-tight text-[#FF3333] sm:text-[14vw]"
        />
      </h1>

      {/* 3 Core Business Pillars Badges */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 font-mono text-[10px] font-semibold tracking-wider text-white/80 sm:text-xs">
        <span className="border border-white/15 bg-white/[0.03] px-3 py-1 text-[#F6DC9A]">
          ❖ UI/UX DESIGN
        </span>
        <span className="border border-white/15 bg-white/[0.03] px-3 py-1 text-[#FF3333]">
          ❖ NO-CODE WEBSITE DEVELOPMENT
        </span>
        <span className="border border-white/15 bg-white/[0.03] px-3 py-1 text-white">
          ❖ CREATIVE DIRECTION
        </span>
      </div>

      <motion.p
        key={bioKey}
        className="mt-4 max-w-lg font-mono text-[11px] leading-relaxed text-white/70 sm:text-xs"
      >
        {BIO.split("").map((ch, i) => (
          <motion.span
            key={`${bioKey}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.015, duration: 0.04 }}
          >
            {ch}
          </motion.span>
        ))}
      </motion.p>

      {/* Slogan Punchline */}
      <div className="mt-3 font-mono text-[10px] font-bold tracking-[0.3em] text-[#DFBA73] uppercase">
        YOUR IDEA. <span className="text-[#FF3333]">YOUR BRAND.</span> YOUR IMPACT.
      </div>
    </div>
  );
}
