import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSignalsTool from "./tools/list-signals";
import getSignalTool from "./tools/get-signal";
import listMyTradesTool from "./tools/list-my-trades";
import myPerformanceTool from "./tools/my-performance";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "botvio-forex-copy-trading-automated-trading-p2p",
  title: "BOTVIO Forex | Copy Trading, Automated Trading & P2P",
  version: "0.1.0",
  instructions:
    "Tools for BOTVIO, an AI trading platform. Use `list_signals` and `get_signal` to read trading signals, `list_my_trades` for the signed-in user's executions, and `my_performance` for their win rate and net P&L. All tools act as the authenticated Botvio user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSignalsTool, getSignalTool, listMyTradesTool, myPerformanceTool],
});
