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
    <div className="pointer-events-none relative z-20 flex flex-1 flex-col items-center justify-center px-5 text-center">
      <h1 className="flex flex-col items-center leading-[0.85]">
        <span className="text-stroke-thin font-display text-[17px] uppercase tracking-[0.35em] sm:text-[32px] md:text-[50px] lg:text-[70px] md:[-webkit-text-stroke:2px_white]">
          DESIGN WITH
        </span>
        <ScrambleText
          text={WORDS[wordIndex]!}
          className="font-display text-[50px] uppercase leading-[0.82] text-[#CCFF00] sm:text-[90px] md:text-[130px] lg:text-[180px]"
        />
      </h1>

      <motion.p
        key={bioKey}
        className="mt-6 max-w-xl font-mono text-[11px] leading-relaxed text-white/50 sm:text-xs md:text-sm"
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
