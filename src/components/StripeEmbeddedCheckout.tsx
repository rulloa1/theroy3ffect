import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";
import { createCommissionCheckoutSession } from "@/utils/payments.functions";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
  addOnPriceIds?: string[];
  quantity?: number;
  tierLabel?: string;
  customerEmail?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({
  priceId,
  addOnPriceIds,
  quantity,
  tierLabel,
  customerEmail,
  returnUrl,
}: StripeEmbeddedCheckoutProps) {
  const { user } = useAuth();

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createCommissionCheckoutSession({
      data: {
        priceId,
        addOnPriceIds,
        quantity,
        tierLabel,
        customerEmail: customerEmail || user?.email || undefined,
        userId: user?.id,
        returnUrl:
          returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Checkout could not be started");
    return result.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
