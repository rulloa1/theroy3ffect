import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getStripeEnvironment } from "@/lib/stripe";
import { getCheckoutSessionSummary } from "@/utils/payments.functions";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } =>
    typeof search["session_id"] === "string" ? { session_id: search["session_id"] } : {},
  head: () => ({
    meta: [
      { title: "Payment Confirmed — theroyeffect.com" },
      {
        name: "description",
        content:
          "Your commission payment is confirmed. Rory Ulloa will follow up within one business day to kick off your project.",
      },
      { property: "og:title", content: "Payment Confirmed — theroyeffect.com" },
      {
        property: "og:description",
        content:
          "Your commission payment is confirmed. Next steps land in your inbox within one business day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutReturn,
});

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100,
  );

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();
  const environment = getStripeEnvironment();
  const fetchSummary = useServerFn(getCheckoutSessionSummary);

  const { data, isLoading } = useQuery({
    queryKey: ["checkout-summary", sessionId, environment],
    queryFn: () => fetchSummary({ data: { sessionId: sessionId as string, environment } }),
    enabled: Boolean(sessionId),
    retry: false,
  });

  const verified = Boolean(data && !("error" in data) && data.status === "complete");
  const summary = data && !("error" in data) ? data : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030014] px-5 py-24">
      <div className="w-full max-w-lg border border-white/10 bg-white/[0.02] p-8">
        <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
          {isLoading ? "VERIFYING…" : verified ? "PAYMENT RECEIVED" : "NO PAYMENT FOUND"}
        </span>
        <h1 className="mt-4 font-display text-4xl uppercase leading-[0.9] text-white">
          {isLoading
            ? "CHECKING WITH STRIPE"
            : verified
              ? summary?.isDeposit
                ? "DEPOSIT CONFIRMED"
                : "PAYMENT CONFIRMED"
              : "NOTHING TO SHOW"}
        </h1>
        <p className="mt-4 font-mono text-xs leading-relaxed text-white/60">
          {verified
            ? "Your commission is reserved. I'll reach out within one business day with the kickoff schedule and scope document. A receipt is on its way to your inbox — take two minutes to fill in the project brief below so I can lock scope and a start date."
            : isLoading
              ? "Confirming your payment with Stripe…"
              : "We couldn't verify a completed checkout. If you just paid, check your email for a receipt — otherwise start again from the pricing section."}
        </p>
        {verified && summary && (
          <div className="mt-6 space-y-1 font-mono text-[11px] text-white/50">
            <p>{summary.productName}</p>
            <p>{money(summary.amountTotal, summary.currency)} paid</p>
            {summary.isDeposit && summary.balanceDueCents > 0 && (
              <p className="text-white/70">
                Remaining balance {money(summary.balanceDueCents, summary.currency)} — invoiced at
                project completion.
              </p>
            )}
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {verified && sessionId && (
            <Link
              to="/brief"
              search={{ session_id: sessionId }}
              className="inline-flex items-center gap-2 bg-[#FF3333] px-5 py-3 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
            >
              START YOUR PROJECT BRIEF
            </Link>
          )}
          {verified && sessionId && (
            <Link
              to="/account"
              search={{ session_id: sessionId }}
              className="inline-flex items-center gap-2 border border-white/15 px-5 py-3 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
            >
              VIEW MY ACCOUNT
            </Link>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-white/15 px-5 py-3 font-mono text-xs tracking-widest text-white transition-colors hover:border-[#FF3333] hover:text-[#FF3333]"
          >
            BACK TO SITE
          </Link>
        </div>
      </div>
    </main>
  );
}
