import { defineTool } from "@lovable.dev/mcp-js";
import { PRICING_TIERS, ADD_ONS } from "@/lib/commerce-catalog";

export default defineTool({
  name: "list_services",
  title: "List services and pricing",
  description:
    "List every service tier Rory Ulloa offers (name, price, what's included) plus the available add-ons.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const tiers = PRICING_TIERS.map((tier) => ({
      name: tier.name,
      price: `${tier.note === "from" ? "from " : ""}${tier.price}${tier.note === "/mo" ? "/mo" : ""}`,
      description: tier.description,
      features: tier.features,
      deposit: `${tier.deposit.label} — ${tier.deposit.amountLabel}`,
      payInFull: `${tier.full.label} — ${tier.full.amountLabel}`,
    }));
    const addOns = ADD_ONS.map((a) => ({
      name: a.name,
      price: a.amountLabel,
      description: a.description,
    }));

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ tiers, addOns }, null, 2) }],
      structuredContent: { tiers, addOns },
    };
  },
});
