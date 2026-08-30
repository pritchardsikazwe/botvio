import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_trades",
  title: "List my trades",
  description:
    "List the signed-in user's own trade executions on Botvio (stake, fill price, status and P&L), newest first.",
  inputSchema: {
    status: z.string().trim().min(1).optional().describe("Filter by execution status, e.g. OPEN, RUNNING or CLOSED."),
    limit: z.number().int().min(1).max(50).default(10).describe("Number of executions to return (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("executions")
      .select("id,broker_ref,stake_or_lot,fill_price,pnl,status,created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { executions: data ?? [] },
    };
  },
});
