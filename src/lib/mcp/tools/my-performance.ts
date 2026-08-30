import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_performance",
  title: "My trading performance",
  description:
    "Summarise the signed-in user's Botvio trading performance over a recent window: trade count, wins, losses, win rate and net P&L.",
  inputSchema: {
    days: z.number().int().min(1).max(365).default(30).describe("Look-back window in days (1-365)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const window = days ?? 30;
    const since = new Date(Date.now() - window * 24 * 60 * 60 * 1000).toISOString();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("executions")
      .select("pnl,status,created_at")
      .eq("user_id", ctx.getUserId())
      .gte("created_at", since)
      .limit(1000);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = data ?? [];
    const settled = rows.filter((r) => typeof r.pnl === "number");
    const wins = settled.filter((r) => (r.pnl ?? 0) > 0).length;
    const losses = settled.filter((r) => (r.pnl ?? 0) < 0).length;
    const netPnl = settled.reduce((sum, r) => sum + (r.pnl ?? 0), 0);
    const summary = {
      window_days: window,
      total_executions: rows.length,
      settled_executions: settled.length,
      wins,
      losses,
      win_rate_percent: settled.length ? Math.round((wins / settled.length) * 1000) / 10 : null,
      net_pnl: Math.round(netPnl * 100) / 100,
      open_executions: rows.filter((r) => r.status && !["CLOSED", "closed"].includes(r.status)).length,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
