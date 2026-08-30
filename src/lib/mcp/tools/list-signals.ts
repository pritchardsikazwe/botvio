import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_signals",
  title: "List trading signals",
  description:
    "List the most recent Botvio trading signals visible to the signed-in user, newest first. Optionally filter by symbol, direction or status.",
  inputSchema: {
    symbol: z.string().trim().min(1).optional().describe("Filter by instrument, e.g. XAUUSD or R_100."),
    direction: z.enum(["BUY", "SELL"]).optional().describe("Filter by signal direction."),
    status: z.string().trim().min(1).optional().describe("Filter by signal status, e.g. approved or pending."),
    limit: z.number().int().min(1).max(50).default(10).describe("Number of signals to return (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ symbol, direction, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("trading_signals")
      .select(
        "id,symbol,direction,timeframe,strategy_name,entry_price,stop_loss,take_profit,confidence,status,outcome,created_at,expires_at,reason"
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);

    if (symbol) query = query.ilike("symbol", symbol);
    if (direction) query = query.eq("direction", direction);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { signals: data ?? [] },
    };
  },
});
