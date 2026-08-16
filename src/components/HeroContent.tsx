import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScrambleText } from "./ScrambleText";

const WORDS = ["PURPOSE", "IMPACT", "INTENT"];
const BIO =
  "I'm Rory — a freelance UI/UX designer crafting bold, high-contrast digital experiences that are intuitive, impactful, and built to stand out.";

export function HeroContent() {
  const [wordIndex, setWordIndex] = useState(0);
  const [bioKey, setBioKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % WORDS.length), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setBioKey((k) => k + 1), 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none relative z-20 flex w-full flex-1 flex-col items-center justify-end px-5 pb-[28vh] text-center">
      <h1 className="flex w-full flex-col items-center leading-[0.82]">
        <span className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-white/60 sm:text-xs">
          Rory Ulloa — Freelance UI/UX Designer &amp; No-Code Developer
        </span>
        <span className="text-stroke-thin font-display text-[6.5vw] uppercase tracking-[0.22em] md:[-webkit-text-stroke:2px_white]">
          DESIGN WITH
        </span>
        <ScrambleText
          text={WORDS[wordIndex]!}
          className="font-display text-[14vw] uppercase leading-[0.78] tracking-tight text-[#FF3333]"
        />
      </h1>


      <motion.p
        key={bioKey}
        className="mt-4 max-w-md font-mono text-[11px] leading-relaxed text-white/50 sm:text-xs"
      >
        {BIO.split("").map((ch, i) => (
          <motion.span
            key={`${bioKey}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02, duration: 0.05 }}
          >
            {ch}
          </motion.span>
        ))}
      </motion.p>
    </div>
  );
}
