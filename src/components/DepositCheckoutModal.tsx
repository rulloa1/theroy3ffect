import { useEffect } from "react";
import { X } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

interface DepositCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  tierName: string;
  depositLabel: string;
  priceId: string;
}

export function DepositCheckoutModal({
  open,
  onClose,
  tierName,
  depositLabel,
  priceId,
}: DepositCheckoutModalProps) {
  useEffect(() => {
    if (!open) return;
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

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-3xl border border-white/10 bg-[#030014]">
        <PaymentTestModeBanner />
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
              SECURE DEPOSIT
            </span>
            <h2 className="mt-2 font-display text-2xl uppercase text-white">{tierName}</h2>
            <p className="mt-1 font-mono text-xs text-white/50">{depositLabel}</p>
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
        <div className="p-4">
          <StripeEmbeddedCheckout priceId={priceId} />
        </div>
      </div>
    </div>
  );
}
