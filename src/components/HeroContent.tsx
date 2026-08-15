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
    <div className="pointer-events-none relative z-20 flex flex-col items-center justify-start px-5 pt-24 text-center sm:pt-28 md:pt-32">
      <h1 className="flex flex-col items-center gap-1 leading-[0.9] md:gap-2">
        <span className="text-stroke-thin font-display text-[15px] uppercase tracking-[0.4em] sm:text-[24px] md:text-[34px] lg:text-[44px]">
          DESIGN WITH
        </span>
        <ScrambleText
          text={WORDS[wordIndex]!}
          className="font-display text-[42px] uppercase leading-[0.85] tracking-tight text-[#FF3333] sm:text-[68px] md:text-[92px] lg:text-[118px]"
        />
      </h1>

      <motion.p
        key={bioKey}
        className="mt-5 max-w-md font-mono text-[11px] leading-relaxed text-white/45 sm:text-xs md:mt-6"
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
