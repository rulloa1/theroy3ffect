import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);

  useEffect(() => {
    let raf = 0;
    frame.current = 0;
    const total = text.length * 4 + 12;

    const tick = () => {
      const progress = frame.current / 4;
      const out = text
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < progress) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");
      setDisplay(out);
      frame.current += 1;
      if (frame.current <= total) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return <span className={className}>{display}</span>;
}
