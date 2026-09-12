import { useEffect, useState } from "react";
import { shouldRunHeavyEffects } from "@/lib/effects-guard";

export function CinematicEffects() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hoverCapable || !shouldRunHeavyEffects()) return;

    setEnabled(true);
    const body = document.body;
    const move = (event: PointerEvent) => {
      body.style.setProperty("--cursor-x", `${event.clientX}px`);
      body.style.setProperty("--cursor-y", `${event.clientY}px`);
    };
    const enter = () => body.classList.add("cinematic-cursor-hover");
    const leave = () => body.classList.remove("cinematic-cursor-hover");
    const targets = document.querySelectorAll("a, button, input, select, textarea, [data-cursor-target]");
    window.addEventListener("pointermove", move, { passive: true });
    targets.forEach((target) => {
      target.addEventListener("pointerenter", enter);
      target.addEventListener("pointerleave", leave);
    });
    return () => {
      window.removeEventListener("pointermove", move);
      targets.forEach((target) => {
        target.removeEventListener("pointerenter", enter);
        target.removeEventListener("pointerleave", leave);
      });
      body.classList.remove("cinematic-cursor-hover");
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <div className="cinematic-grain" aria-hidden="true" />
      <div className="cinematic-cursor" aria-hidden="true" />
    </>
  );
}