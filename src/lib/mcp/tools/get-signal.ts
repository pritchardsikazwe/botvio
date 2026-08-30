import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_signal",
  title: "Get signal details",
  description:
    "Fetch one Botvio trading signal by id, including entry, stop-loss, take-profit, confidence and settlement details.",
  inputSchema: { id: z.string().uuid().describe("The trading signal id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("trading_signals")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) throw new ToolError(`No signal found with id ${id}`);

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { signal: data },
    };
  },
});
