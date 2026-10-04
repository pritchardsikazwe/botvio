import { createClient } from "npm:@supabase/supabase-js@2";
import { assertAutomationKey } from "../_shared/automationAuth.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!assertAutomationKey(req)) return new Response(JSON.stringify({ success: false, error: "Unauthorized automation trigger" }), { status: 401, headers: cors });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const { data, error } = await db
      .from("trading_signals")
      .select("id,symbol,timeframe,strategy_name,direction,outcome,entry_price,stop_loss,take_profit,confidence,created_at,outcome_updated_at,broker,category")
      .in("outcome", ["WIN", "LOSS", "win", "loss"])
      .order("outcome_updated_at", { ascending: false })
      .limit(10000);
    if (error) throw new Error(error.message);

    const groups = new Map<string, any[]>();
    const add = (key: string, row: any) => {
      const a = groups.get(key) ?? [];
      a.push(row);
      groups.set(key, a);
    };

    for (const row of data ?? []) {
      add(`symbol|${row.symbol}`, row);
      add(`symbol_tf|${row.symbol}|${row.timeframe}`, row);
      add(`symbol_dir|${row.symbol}|${row.direction}`, row);
      add(`strategy|${row.strategy_name}`, row);
    }

    const summarize = (rows: any[]) => {
      const ordered = [...rows].sort((a,b) => new Date(b.outcome_updated_at ?? b.created_at).getTime() - new Date(a.outcome_updated_at ?? a.created_at).getTime());
      const wins = ordered.filter(r => String(r.outcome).toLowerCase() === "win").length;
      const losses = ordered.length - wins;
      let grossWinR = 0;
      let grossLossR = 0;
      for (const r of ordered) {
        const risk = Math.abs(Number(r.entry_price) - Number(r.stop_loss));
        const reward = Math.abs(Number(r.take_profit) - Number(r.entry_price));
        if (!Number.isFinite(risk) || risk <= 0) continue;
        if (String(r.outcome).toLowerCase() === "win") grossWinR += reward / risk;
        else grossLossR += 1;
      }
      let consecutiveLosses = 0;
      for (const r of ordered) {
        if (String(r.outcome).toLowerCase() !== "loss") break;
        consecutiveLosses++;
      }
      return {
        trades: ordered.length,
        wins,
        losses,
        winRate: ordered.length ? Number((wins / ordered.length * 100).toFixed(1)) : 0,
        profitFactor: grossLossR ? Number((grossWinR / grossLossR).toFixed(2)) : grossWinR ? 99 : 0,
        expectancyR: ordered.length ? Number(((grossWinR - grossLossR) / ordered.length).toFixed(3)) : 0,
        consecutiveLosses,
        lastResult: ordered[0]?.outcome ?? null,
        lastClosedAt: ordered[0]?.outcome_updated_at ?? null,
      };
    };

    const symbols = [...groups.keys()].filter(k => k.startsWith("symbol|") && !k.startsWith("symbol_tf|") && !k.startsWith("symbol_dir|"))
      .map(k => {
        const rows = groups.get(k)!;
        const symbol = k.slice("symbol|".length);
        const byTf = [...new Set(rows.map(r => r.timeframe))].map(tf => ({
          timeframe: tf,
          ...summarize(groups.get(`symbol_tf|${symbol}|${tf}`) ?? [])
        })).sort((a,b) => b.trades - a.trades);
        return { symbol, ...summarize(rows), timeframes: byTf };
      })
      .sort((a,b) => b.trades - a.trades);

    const direction = [...groups.keys()].filter(k => k.startsWith("symbol_dir|")).map(k => {
      const [,symbol,dir] = k.split("|");
      return { symbol, direction: dir, ...summarize(groups.get(k)!) };
    }).sort((a,b) => b.trades - a.trades);

    const weak = symbols.filter(s => s.trades >= 20 && (s.expectancyR <= 0 || s.profitFactor < 1));
    const strong = symbols.filter(s => s.trades >= 20 && s.expectancyR > 0 && s.profitFactor >= 1.2);

    return new Response(JSON.stringify({
      success: true,
      auditedAt: new Date().toISOString(),
      sample: data?.length ?? 0,
      symbols,
      direction,
      weakSymbols: weak,
      strongSymbols: strong,
      methodology: "Closed Botvio signals only; performance is grouped per symbol/timeframe and uses TP/SL R multiples. No-feed signals are excluded.",
    }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), { status: 500, headers: cors });
  }
});
