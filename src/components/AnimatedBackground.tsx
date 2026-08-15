export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* moving grid */}
      <div className="absolute inset-0 bg-grid animate-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_75%)]" />

      {/* drifting neon orbs */}
      <div className="absolute -left-40 top-[-10%] size-[42rem] rounded-full halo opacity-45 blur-3xl animate-drift-a" />
      <div className="absolute right-[-15%] top-[25%] size-[36rem] rounded-full halo opacity-35 blur-3xl animate-drift-b" />
      <div className="absolute bottom-[-15%] left-[20%] size-[40rem] rounded-full halo opacity-30 blur-3xl animate-drift-a [animation-delay:-9s]" />

      {/* vignette */}
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_35%,var(--background)_100%)]" />
    </div>
  );
}
