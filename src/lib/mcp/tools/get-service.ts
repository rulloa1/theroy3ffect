import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { PRICING_TIERS } from "@/lib/commerce-catalog";

export default defineTool({
  name: "get_service",
  title: "Get service details",
  description:
    "Get the full details of one service tier by name (e.g. 'Brand Sprint', 'Website / UI-UX', 'Design + Build', 'Retainer').",
  inputSchema: {
    name: z.string().trim().min(1).describe("Service tier name or a fragment of it."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ name }) => {
    const needle = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const tier = PRICING_TIERS.find((t) =>
      t.name.toLowerCase().replace(/[^a-z0-9]+/g, "").includes(needle),
    );
    if (!tier) {
      throw new ToolError(
        `No service named "${name}". Available: ${PRICING_TIERS.map((t) => t.name).join(", ")}.`,
      );
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(tier, null, 2) }],
      structuredContent: { tier },
    };
  },
});
