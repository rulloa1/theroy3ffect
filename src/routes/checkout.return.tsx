import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } =>
    typeof search["session_id"] === "string"
      ? { session_id: search["session_id"] }
      : {},
  head: () => ({
    meta: [
      { title: "Deposit Confirmed — theroyeffect.com" },
      {
        name: "description",
        content:
          "Your commission deposit is confirmed. Rory Ulloa will follow up within one business day to kick off your project.",
      },
      { property: "og:title", content: "Deposit Confirmed — theroyeffect.com" },
      {
        property: "og:description",
        content:
          "Your commission deposit is confirmed. Next steps land in your inbox within one business day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030014] px-5 py-24">
      <div className="w-full max-w-lg border border-white/10 bg-white/[0.02] p-8">
        <span className="font-mono text-[10px] tracking-widest text-[#FF3333]">
          {sessionId ? "PAYMENT RECEIVED" : "NO SESSION FOUND"}
        </span>
        <h1 className="mt-4 font-display text-4xl uppercase leading-[0.9] text-white">
          {sessionId ? "DEPOSIT CONFIRMED" : "NOTHING TO SHOW"}
        </h1>
        <p className="mt-4 font-mono text-xs leading-relaxed text-white/60">
          {sessionId
            ? "Your commission is reserved. I'll reach out within one business day with the kickoff schedule and scope document. A receipt is on its way to your inbox — take two minutes to fill in the project brief below so I can lock scope and a start date."
            : "We couldn't find a checkout session. If you just paid, check your email for a receipt — otherwise start again from the pricing section."}
        </p>
        {sessionId && (
          <p className="mt-4 break-all font-mono text-[10px] text-white/30">
            Reference: {sessionId}
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {sessionId && (
            <Link
              to="/brief"
              search={{ session_id: sessionId }}
              className="inline-flex items-center gap-2 bg-[#FF3333] px-5 py-3 font-mono text-xs tracking-widest text-black transition-opacity hover:opacity-90"
            >
              START YOUR PROJECT BRIEF
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
