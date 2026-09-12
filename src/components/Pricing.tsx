import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, Lock, Plus, Calculator, Layers } from "lucide-react";
import { DepositCheckoutModal } from "@/components/DepositCheckoutModal";
import { ScopeEstimator } from "@/components/ScopeEstimator";
import { PRICING_TIERS, ADD_ONS } from "@/lib/commerce-catalog";

export { PRICING_TIERS };

interface ActivePurchase {
  name: string;
  priceId: string;
  label: string;
  kicker: string;
}

export function Pricing({ onCommission, mode = "homepage" }: { onCommission?: () => void; mode?: "homepage" | "checkout" }) {
  const [active, setActive] = useState<ActivePurchase | null>(null);
  const [viewMode, setViewMode] = useState<"TIERS" | "ESTIMATOR">("TIERS");

  return (
    <section
      id="pricing"
      className="relative z-20 w-full bg-[#0a0a0a] px-5 py-20 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-xs tracking-widest text-[#dfba73]">
              INVESTMENT &amp; SCOPE
            </span>
            <h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl lg:text-7xl">
              INVESTMENT
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <p className="max-w-md font-mono text-base leading-[1.6] text-white/90">
              {mode === "homepage" ? "Starting prices. A typical designed-and-built site lands at $7–9k depending on pages and integrations." : "Transparent starting points and custom scopes. Pay a 50% deposit or calculate a custom page count below."}
            </p>
            {mode === "checkout" && (
            <div className="inline-flex rounded-sm border border-white/15 bg-white/[0.02] p-1">
              <button
                type="button"
                onClick={() => setViewMode("TIERS")}
                className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold tracking-wider transition-all ${
                  viewMode === "TIERS"
                    ? "bg-[#c8362b] text-white shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Layers className="size-3.5" />
                STANDARD TIERS
              </button>
              <button
                type="button"
                onClick={() => setViewMode("ESTIMATOR")}
                className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold tracking-wider transition-all ${
                  viewMode === "ESTIMATOR"
                    ? "bg-[#dfba73] text-black shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Calculator className="size-3.5" />
                SCOPE CALCULATOR
              </button>
            </div>
            )}
          </div>
        </div>

        {viewMode === "ESTIMATOR" ? (
          <ScopeEstimator />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PRICING_TIERS.map((tier, i) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`group relative flex flex-col justify-between border p-5 transition-colors hover:border-[#dfba73]/50 md:p-6 ${
                    tier.featured
                      ? "border-[#dfba73] bg-[#dfba73]/5"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {tier.featured && (
                    <div className="absolute -top-3 left-5 flex items-center gap-1 bg-[#dfba73] px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-black">
                      <Sparkles className="size-3" />
                      POPULAR
                    </div>
                  )}

                  <div>
                    <h3 className="font-display text-xl uppercase tracking-wide text-white md:text-2xl">
                      {tier.name}
                    </h3>
                    <div className="mt-4 flex items-baseline gap-2">
                       {tier.note !== "/mo" ? <span className="font-mono text-[15px] text-white/90">{tier.note}</span> : null}
                      <span className="font-display text-4xl text-[#dfba73] md:text-5xl">
                        {tier.price}
                      </span>
                       {tier.note === "/mo" ? <span className="font-mono text-[15px] text-white/90">/mo</span> : null}
                    </div>
                    <p className="mt-3 font-mono text-base leading-[1.6] text-white/90">
                      {tier.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 font-mono text-[15px] leading-[1.6] text-white/90"
                        >
                          <Check className="mt-0.5 size-3 shrink-0 text-[#dfba73]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                   <div className="mt-8 flex flex-col gap-2">
                    {mode === "checkout" ? (
                    <>
                    <button
                      type="button"
                      onClick={() =>
                        setActive({
                          name: tier.name,
                          priceId: tier.deposit.priceId,
                          label: `${tier.deposit.amountLabel} — ${tier.deposit.label}`,
                          kicker: "SECURE DEPOSIT",
                        })
                      }
                      className={`flex w-full items-center justify-center gap-2 px-4 py-3 font-mono text-xs tracking-widest transition-all ${
                        tier.featured
                          ? "bg-[#dfba73] text-black hover:bg-[#dfba73]/90"
                          : "border border-white/20 text-white hover:border-[#dfba73] hover:bg-[#dfba73] hover:text-black"
                      }`}
                    >
                      <Lock className="size-3" />
                      PAY {tier.deposit.amountLabel}{" "}
                      {tier.name === "RETAINER" ? "FIRST MONTH" : "DEPOSIT"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActive({
                          name: tier.name,
                          priceId: tier.full.priceId,
                          label: `${tier.full.amountLabel} — ${tier.full.label}`,
                          kicker: tier.full.recurring ? "MONTHLY RETAINER" : "PAY IN FULL",
                        })
                      }
                      className="flex w-full items-center justify-center gap-2 border border-white/10 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white/70 transition-colors hover:border-[#dfba73] hover:text-[#dfba73]"
                    >
                      {tier.full.recurring ? `SUBSCRIBE ${tier.full.amountLabel}` : `PAY IN FULL ${tier.full.amountLabel}`}
                    </button>
                    </>
                    ) : (
                      <Link
                        to="/book"
                        className={`flex min-h-11 w-full items-center justify-center gap-2 px-4 py-3 font-mono text-xs tracking-widest transition-all ${tier.featured ? "bg-[#dfba73] font-bold text-black hover:bg-[#c8362b]" : "border border-white/40 text-white hover:border-[#dfba73]"}`}
                      >
                        {tier.cta}<ArrowRight className="size-3" />
                      </Link>
                    )}
                    {mode === "checkout" ? <button
                      type="button"
                      onClick={onCommission}
                      className="flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2 font-mono text-[15px] tracking-widest text-white/90 transition-colors hover:text-[#dfba73]"
                    >
                      {tier.cta}
                      <ArrowRight className="size-3" />
                    </button> : null}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 opacity-70">
              <span className="font-mono text-xs tracking-widest text-[#dfba73]">ADD-ONS</span>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {ADD_ONS.map((addOn) => (
                  <div
                    key={addOn.priceId}
                    className="flex flex-col justify-between border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-[#dfba73]/50"
                  >
                    <div>
                      <h3 className="font-display text-lg uppercase text-white">{addOn.name}</h3>
                      <p className="mt-2 font-mono text-base leading-[1.6] text-white/90">
                        {addOn.description}
                      </p>
                    </div>
                    {mode === "checkout" ? <button
                      type="button"
                      onClick={() =>
                        setActive({
                          name: addOn.name,
                          priceId: addOn.priceId,
                          label: `${addOn.amountLabel} one-time`,
                          kicker: "ADD-ON",
                        })
                      }
                      className="mt-6 flex w-full items-center justify-center gap-2 border border-white/20 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white transition-colors hover:border-[#dfba73] hover:bg-[#dfba73] hover:text-black"
                    >
                      <Plus className="size-3" />
                      ADD {addOn.amountLabel}
                    </button> : null}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-10 max-w-3xl font-mono text-[15px] leading-[1.6] text-white/90">
              All projects begin with a free 15-minute discovery call. Deposits are 50% of the
              tier&apos;s starting price: Brand Sprint $1,250, Website / UI-UX $2,500, and Design + Build $4,000. Each deposit is credited against your final invoice and fully refundable before
              kickoff. Retainers bill monthly and can be paused or cancelled anytime. No account
              needed — you’ll get a receipt and a brief link by email right after checkout.
            </p>
            {mode === "homepage" ? (
              <Link to="/pricing" className="mt-5 inline-flex min-h-11 items-center py-2 font-mono text-[15px] tracking-widest text-[#dfba73] hover:text-white">SEE FULL PRICING AND CHECKOUT →</Link>
            ) : null}
          </>
        )}
      </div>

      <DepositCheckoutModal
        open={active !== null}
        onClose={() => setActive(null)}
        tierName={active?.name ?? ""}
        depositLabel={active?.label ?? ""}
        priceId={active?.priceId ?? ""}
        kicker={active?.kicker ?? "SECURE CHECKOUT"}
      />
    </section>
  );
}
