const PHRASE =
  "RORY ULLOA // CREATIVE DIRECTOR // MAKE YOUR BUSINESS IMPOSSIBLE TO IGNORE // DESIGN WITH PURPOSE // ";

export function FooterMarquee() {
  const line = PHRASE.repeat(6);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 overflow-hidden"
    >
      <div className="flex w-max animate-marquee whitespace-nowrap">
        <span className="text-stroke-ghost font-display text-[13vw] leading-[0.85] tracking-tight">
          {line}
        </span>
        <span className="text-stroke-ghost font-display text-[13vw] leading-[0.85] tracking-tight">
          {line}
        </span>
      </div>
    </div>
  );
}
