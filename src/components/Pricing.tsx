import { useState } from "react";
import { motion } from "framer-motion";
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

export function Pricing({ onCommission }: { onCommission?: () => void }) {
  const [active, setActive] = useState<ActivePurchase | null>(null);
  const [viewMode, setViewMode] = useState<"TIERS" | "ESTIMATOR">("TIERS");

  return (
    <section
      id="pricing"
      className="relative z-20 w-full bg-[#030014] px-5 py-20 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="font-mono text-xs tracking-widest text-[#DFBA73]">
              INVESTMENT &amp; SCOPE
            </span>
            <h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] text-white md:text-6xl lg:text-7xl">
              INVESTMENT
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <p className="max-w-md font-mono text-xs leading-relaxed text-white/50">
              Transparent starting points &amp; custom scopes. Pay a 50% deposit or calculate custom
              page count &amp; 3D features below.
            </p>
            {/* View Toggle Tabs */}
            <div className="inline-flex rounded-sm border border-white/15 bg-white/[0.02] p-1">
              <button
                type="button"
                onClick={() => setViewMode("TIERS")}
                className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold tracking-wider transition-all ${
                  viewMode === "TIERS"
                    ? "bg-[#E51924] text-white shadow-lg"
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
                    ? "bg-[#DFBA73] text-black shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Calculator className="size-3.5" />
                SCOPE CALCULATOR
              </button>
            </div>
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
                  className={`group relative flex flex-col justify-between border p-5 transition-colors hover:border-[#FF3333]/50 md:p-6 ${
                    tier.featured
                      ? "border-[#FF3333] bg-[#FF3333]/5"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  {tier.featured && (
                    <div className="absolute -top-3 left-5 flex items-center gap-1 bg-[#FF3333] px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-black">
                      <Sparkles className="size-3" />
                      POPULAR
                    </div>
                  )}

                  <div>
                    <h3 className="font-display text-xl uppercase tracking-wide text-white md:text-2xl">
                      {tier.name}
                    </h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-mono text-xs text-white/40">{tier.note}</span>
                      <span className="font-display text-4xl text-[#FF3333] md:text-5xl">
                        {tier.price}
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-xs leading-relaxed text-white/50">
                      {tier.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 font-mono text-xs text-white/70"
                        >
                          <Check className="mt-0.5 size-3 shrink-0 text-[#FF3333]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 flex flex-col gap-2">
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
                          ? "bg-[#FF3333] text-black hover:bg-[#FF3333]/90"
                          : "border border-white/20 text-white hover:border-[#FF3333] hover:bg-[#FF3333] hover:text-black"
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
                      className="flex w-full items-center justify-center gap-2 border border-white/10 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white/70 transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
                    >
                      {tier.full.recurring
                        ? `SUBSCRIBE ${tier.full.amountLabel}`
                        : `PAY IN FULL ${tier.full.amountLabel}`}
                    </button>
                    <button
                      type="button"
                      onClick={onCommission}
                      className="flex w-full items-center justify-center gap-2 px-4 py-2 font-mono text-[11px] tracking-widest text-white/50 transition-colors hover:text-[#FF3333]"
                    >
                      {tier.cta}
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-16">
              <span className="font-mono text-xs tracking-widest text-[#FF3333]">ADD-ONS</span>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {ADD_ONS.map((addOn) => (
                  <div
                    key={addOn.priceId}
                    className="flex flex-col justify-between border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-[#FF3333]/50"
                  >
                    <div>
                      <h3 className="font-display text-lg uppercase text-white">{addOn.name}</h3>
                      <p className="mt-2 font-mono text-xs leading-relaxed text-white/50">
                        {addOn.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setActive({
                          name: addOn.name,
                          priceId: addOn.priceId,
                          label: `${addOn.amountLabel} one-time`,
                          kicker: "ADD-ON",
                        })
                      }
                      className="mt-6 flex w-full items-center justify-center gap-2 border border-white/20 px-4 py-2.5 font-mono text-[11px] tracking-widest text-white transition-colors hover:border-[#FF3333] hover:bg-[#FF3333] hover:text-black"
                    >
                      <Plus className="size-3" />
                      ADD {addOn.amountLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-10 max-w-2xl font-mono text-[11px] leading-relaxed text-white/40">
              All projects begin with a free 15-minute discovery call. Deposits are 50% of the
              tier’s starting price, credited against your final invoice and fully refundable before
              kickoff. Retainers bill monthly and can be paused or cancelled anytime. No account
              needed — you’ll get a receipt and a brief link by email right after checkout.
            </p>
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
