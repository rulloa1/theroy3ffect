import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { ADD_ONS, ADD_ON_CENTS } from "@/lib/commerce-catalog";

interface DepositCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  tierName: string;
  depositLabel: string;
  priceId: string;
  kicker?: string;
}

export function DepositCheckoutModal({
  open,
  onClose,
  tierName,
  depositLabel,
  priceId,
  kicker = "SECURE CHECKOUT",
}: DepositCheckoutModalProps) {
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const isRetainer = priceId.includes("retainer");

  useEffect(() => {
    if (!open) {
      setSelectedAddOns([]);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggleAddOn = (addOnPriceId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnPriceId)
        ? prev.filter((id) => id !== addOnPriceId)
        : [...prev, addOnPriceId],
    );
  };

  const addOnTotalCents = selectedAddOns.reduce((sum, id) => sum + (ADD_ON_CENTS[id] ?? 0), 0);

  const addOnTotalFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(addOnTotalCents / 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-3xl border border-white/10 bg-[#030014]">
        <PaymentTestModeBanner />
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">{kicker}</span>
            <h2 className="mt-2 font-display text-2xl uppercase text-white">{tierName}</h2>
            <p className="mt-1 font-mono text-xs text-white/50">
              {depositLabel}
              {addOnTotalCents > 0 && ` + ${addOnTotalFormatted} in add-ons`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="shrink-0 border border-white/20 p-2 text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Optional Add-ons Selection for non-retainer tiers */}
        {!isRetainer && (
          <div className="border-b border-white/10 bg-white/[0.01] p-5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              CUSTOMIZE WITH ADD-ONS (OPTIONAL)
            </span>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {ADD_ONS.map((addOn) => {
                const isChecked = selectedAddOns.includes(addOn.priceId);
                return (
                  <button
                    key={addOn.priceId}
                    type="button"
                    onClick={() => toggleAddOn(addOn.priceId)}
                    className={`flex flex-col justify-between border p-3 text-left transition-colors ${
                      isChecked
                        ? "border-[#FF3333] bg-[#FF3333]/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display text-xs uppercase tracking-wide text-white">
                        {addOn.name}
                      </span>
                      <div
                        className={`flex size-4 shrink-0 items-center justify-center border transition-colors ${
                          isChecked ? "border-[#FF3333] bg-[#FF3333] text-black" : "border-white/30"
                        }`}
                      >
                        {isChecked ? (
                          <Check className="size-3" />
                        ) : (
                          <Plus className="size-3 text-white/40" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="font-mono text-[10px] text-white/40">
                        {addOn.description.slice(0, 32)}…
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#FF3333]">
                        {addOn.amountLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4">
          <StripeEmbeddedCheckout
            key={`${priceId}-${selectedAddOns.sort().join("-")}`}
            priceId={priceId}
            addOnPriceIds={selectedAddOns}
            tierLabel={tierName}
          />
        </div>
      </div>
    </div>
  );
}
