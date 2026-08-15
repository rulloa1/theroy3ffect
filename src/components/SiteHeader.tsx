const LINKS = ["ARCHIVE", "PROCESS", "LABS"];

export function SiteHeader({ onCommission }: { onCommission: () => void }) {
  return (
    <header className="relative z-30 flex items-center justify-between px-5 py-5 md:px-10">
      <a href="/" className="group flex items-center gap-3">
        <span className="font-display text-xl uppercase tracking-widest md:text-2xl">ROY</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CCFF00] text-black transition-transform duration-500 group-hover:rotate-180">
          ✦
        </span>
      </a>

      <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
        {LINKS.map((l) => (
          <a
            key={l}
            href="#work"
            className="font-mono text-xs tracking-widest text-white/50 transition-colors hover:text-[#CCFF00]"
          >
            {l}
          </a>
        ))}
      </nav>

      <button
        type="button"
        onClick={onCommission}
        className="rounded-full border border-white/20 px-5 py-2 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#CCFF00] hover:bg-[#CCFF00] hover:text-black"
      >
        COMMISSION
      </button>
    </header>
  );
}
