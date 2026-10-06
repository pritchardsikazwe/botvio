import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { encryptSecret, decryptSecret } from "../_shared/tradecopy/crypto.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BASE = (Deno.env.get("MT5_API_STUDIO_BASE_URL") || "https://mt5full3.mtapi.io").replace(/\/+$/, "");
const API_KEY = Deno.env.get("MT5_API_STUDIO_API_KEY") || Deno.env.get("TRADECOPY_API_KEY");

function safeError(value: unknown) {
  return String(value instanceof Error ? value.message : value).slice(0, 500);
}

async function callApi(path: string, query: Record<string, string | number | undefined>) {
  if (!API_KEY) throw new Error("MT5 API Studio API key is not configured");
  const url = new URL(BASE + path);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { ApiKey: API_KEY, Accept: "application/json, text/plain" },
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* plain text */ }

  if (!res.ok) {
    throw new Error(`MT5 API Studio ${res.status}: ${typeof body === "string" ? body.slice(0, 300) : JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

function unwrap(body: unknown): unknown {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    return b.data ?? body;
  }
  return body;
}

function normalizeSymbols(body: unknown): string[] {
  const raw = unwrap(body);
  if (Array.isArray(raw)) {
    return raw.map((x) => typeof x === "string" ? x : String((x as Record<string, unknown>)?.symbol ?? (x as Record<string, unknown>)?.name ?? "")).filter(Boolean);
  }
  if (raw && typeof raw === "object") {
    for (const key of ["symbols", "items", "data", "result"]) {
      const value = (raw as Record<string, unknown>)[key];
      if (Array.isArray(value)) return normalizeSymbols(value);
    }
  }
  return [];
}

function normalizeQuote(body: unknown) {
  const raw = unwrap(body) as Record<string, unknown>;
  const bid = Number(raw?.bid ?? raw?.Bid);
  const ask = Number(raw?.ask ?? raw?.Ask);
  const lastNum = Number(raw?.last ?? raw?.Last ?? raw?.price ?? raw?.Price);
  // MT5 reports last=0 for bid/ask-only instruments — treat 0 as "no last trade".
  const last = lastNum > 0 ? lastNum : NaN;
  return {
    bid: Number.isFinite(bid) ? bid : null,
    ask: Number.isFinite(ask) ? ask : null,
    last: Number.isFinite(last) ? last : null,
    time: raw?.time ?? raw?.Time ?? null,
    symbol: String(raw?.symbol ?? raw?.Symbol ?? ""),
    raw,
  };
}

function normalizeBars(body: unknown) {
  const raw = unwrap(body);
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? (["bars", "quotes", "items", "data", "result"].map((k) => (raw as Record<string, unknown>)[k]).find(Array.isArray) ?? [])
      : [];

  return (list as unknown[]).map((item) => {
    const b = item as Record<string, unknown>;
    const timeRaw = b.time ?? b.Time ?? b.timestamp ?? b.Timestamp ?? b.date ?? b.Date;
    const time = typeof timeRaw === "number"
      ? (timeRaw > 10_000_000_000 ? Math.floor(timeRaw / 1000) : timeRaw)
      : Math.floor(new Date(String(timeRaw).replace(/(T\d{2}:\d{2}(:\d{2})?(\.\d+)?)$/, "$1Z")).getTime() / 1000);
    return {
      time,
      open: Number(b.open ?? b.Open ?? b.openPrice),
      high: Number(b.high ?? b.High ?? b.highPrice),
      low: Number(b.low ?? b.Low ?? b.lowPrice),
      close: Number(b.close ?? b.Close ?? b.closePrice),
      volume: Number(b.volume ?? b.Volume ?? b.tickVolume ?? 0),
    };
  }).filter((b) => Number.isFinite(b.time) && [b.open,b.high,b.low,b.close].every(Number.isFinite));
}

async function getUser(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Sign in required");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("Sign in required");
  return { admin, userId: data.user.id };
}

async function loadConnection(admin: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await admin.from("syntx_api_connections").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No Weltrade SyntX API connection configured");
  return data;
}

async function connectSession(admin: ReturnType<typeof createClient>, connection: Record<string, unknown>) {
  const password = await decryptSecret(String(connection.password_encrypted), Deno.env.get("TOKEN_ENCRYPTION_KEY")!);
  const sessionId = crypto.randomUUID();
  const raw = await callApi("/ConnectEx", {
    user: String(connection.login),
    password,
    server: String(connection.server),
    id: sessionId,
    connectTimeoutSeconds: 60,
    connectTimeoutClusterMemberSeconds: 20,
  });
  const returned = typeof raw === "string" ? raw.replace(/"/g, "") : sessionId;
  const session = returned || sessionId;
  await admin.from("syntx_api_connections").update({
    session_id: session,
    connection_status: "connected",
    last_error: null,
    last_connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", connection.id);
  return session;
}

async function ensureSession(admin: ReturnType<typeof createClient>, connection: Record<string, unknown>) {
  if (connection.session_id) return String(connection.session_id);
  return connectSession(admin, connection);
}

function isRecoverableSessionError(error: unknown) {
  const message = safeError(error);
  return /401|403|unauthori[sz]ed|forbidden|session|not connected|invalid.*(id|connection)|expired|disconnect/i.test(message);
}

async function clearSession(admin: ReturnType<typeof createClient>, connectionId: unknown) {
  await admin.from("syntx_api_connections").update({
    session_id: null,
    connection_status: "connecting",
    last_error: null,
    updated_at: new Date().toISOString(),
  }).eq("id", connectionId);
}

async function withConnection(admin: ReturnType<typeof createClient>, userId: string, fn: (session: string, c: Record<string, unknown>) => Promise<unknown>) {
  const c = await loadConnection(admin, userId);
  try {
    const session = await ensureSession(admin, c);
    return await fn(session, c);
  } catch (firstError) {
    if (!isRecoverableSessionError(firstError)) {
      await admin.from("syntx_api_connections").update({
        connection_status: "error",
        last_error: safeError(firstError),
        updated_at: new Date().toISOString(),
      }).eq("id", c.id);
      throw firstError;
    }

    // API Studio sessions can expire upstream while our DB still has the old
    // session id. Clear it, reconnect with the stored MT5 credentials, then
    // retry the original request exactly once.
    try {
      await clearSession(admin, c.id);
      const freshConnection = { ...c, session_id: null };
      const freshSession = await connectSession(admin, freshConnection);
      return await fn(freshSession, freshConnection);
    } catch (retryError) {
      await admin.from("syntx_api_connections").update({
        connection_status: "error",
        last_error: safeError(retryError),
        updated_at: new Date().toISOString(),
      }).eq("id", c.id);
      throw retryError;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { admin, userId } = await getUser(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "connect") {
      const login = String(body?.login ?? "").trim();
      const password = String(body?.password ?? "");
      const broker = String(body?.broker ?? "Weltrade").trim();
      const server = String(body?.server ?? "Weltrade").trim();
      if (!/^\d+$/.test(login)) throw new Error("Enter a valid MT5 account number");
      if (password.length < 4) throw new Error("Enter the MT5 trader password");
      if (!server) throw new Error("Enter the exact MT5 server/cluster name");

      const encrypted = await encryptSecret(password, Deno.env.get("TOKEN_ENCRYPTION_KEY")!);
      const { data: row, error } = await admin.from("syntx_api_connections").upsert({
        user_id: userId,
        login,
        broker,
        server,
        environment: "DEMO",
        password_encrypted: encrypted,
        session_id: null,
        connection_status: "connecting",
        last_error: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,login,server" }).select("*").single();
      if (error) throw new Error(error.message);

      try {
        const session = await ensureSession(admin, row);
        const symbolsRaw = await callApi("/Symbols", { id: session });
        const symbols = normalizeSymbols(symbolsRaw);
        return json({ ok: true, connected: true, account: { login, broker, server, environment: "DEMO" }, symbols });
      } catch (error) {
        await admin.from("syntx_api_connections").update({ connection_status: "error", last_error: safeError(error), updated_at: new Date().toISOString() }).eq("id", row.id);
        throw error;
      }
    }

    if (action === "status") {
      const c = await loadConnection(admin, userId).catch(() => null);
      if (!c) return json({ ok: true, connected: false });
      return json({ ok: true, connected: c.connection_status === "connected", account: { login: c.login, broker: c.broker, server: c.server, environment: c.environment }, lastConnectedAt: c.last_connected_at, lastError: c.last_error });
    }

    if (action === "symbols") {
      return json({ ok: true, symbols: await withConnection(admin, userId, async (session) => normalizeSymbols(await callApi("/Symbols", { id: session }))) });
    }

    if (action === "quote") {
      const symbol = String(body?.symbol ?? "").trim();
      if (!symbol) throw new Error("Symbol is required");
      return json({ ok: true, quote: await withConnection(admin, userId, async (session) => normalizeQuote(await callApi("/GetQuote", { id: session, symbol }))) });
    }

    if (action === "history") {
      const symbol = String(body?.symbol ?? "").trim();
      const timeframe = String(body?.timeframe ?? "QhPeriodM5");
      const timeframeMap: Record<string, number> = { QhPeriodM1: 1, QhPeriodM5: 5, QhPeriodM15: 15, QhPeriodM30: 30, QhPeriodH1: 60, QhPeriodH4: 240, QhPeriodD1: 1440, QhPeriodW1: 10080, QhPeriodMn1: 43200 };
      const to = String(body?.to ?? new Date().toISOString());
      const from = String(body?.from ?? new Date(Date.now() - 400 * 5 * 60_000).toISOString());
      if (!symbol) throw new Error("Symbol is required");
      let rawSample = "";
      const candles = await withConnection(admin, userId, async (session) => {
        // MT5 servers report times in broker-server local time (no zone). Derive
        // the offset from a live quote so candles line up with real UTC time.
        let offsetSec = 0;
        try {
          const q = unwrap(await callApi("/GetQuote", { id: session, symbol })) as Record<string, unknown>;
          const qt = q?.time ?? q?.Time;
          if (qt) {
            const diff = new Date(String(qt).replace(/Z?$/, "Z")).getTime() - Date.now();
            offsetSec = Math.round(diff / 1_800_000) * 1800;
          }
        } catch { /* fall back to no offset */ }
        const shift = (iso: string) => new Date(new Date(iso).getTime() + offsetSec * 1000).toISOString().slice(0, 19);
        const raw = await callApi("/PriceHistory", { id: session, symbol, from: shift(from), to: shift(to), timeFrame: timeframeMap[timeframe] ?? 5 });
        const bars = normalizeBars(raw).map((b) => ({ ...b, time: b.time - offsetSec }));
        if (!bars.length) {
          rawSample = (typeof raw === "string" ? raw : JSON.stringify(raw)).slice(0, 800);
          throw new Error(`TradeCopy PriceHistory returned no valid candles for ${symbol} (${timeframe}). Response: ${rawSample}`);
        }
        return bars;
      });
      return json({ ok: true, candles, ...(rawSample ? { rawSample } : {}) });
    }

    if (action === "diagnostics") {
      const requestedSymbol = String(body?.symbol ?? "").trim();
      const timeframe = String(body?.timeframe ?? "QhPeriodM5");
      if (!requestedSymbol) throw new Error("Symbol is required");
      const connection = await loadConnection(admin, userId);
      const result: Record<string, unknown> = {
        account: { login: connection.login, broker: connection.broker, server: connection.server, environment: connection.environment },
        connectionStatus: connection.connection_status,
        requestedSymbol,
        timeframe,
      };
      const symbols = await withConnection(admin, userId, async (session) => normalizeSymbols(await callApi("/Symbols", { id: session })));
      result.symbolCount = symbols.length;
      result.symbolSample = symbols.filter((s) => s.toLowerCase().includes(requestedSymbol.toLowerCase().replace(/[-_]/g, ""))).slice(0, 25);
      try {
        result.quote = await withConnection(admin, userId, async (session) => normalizeQuote(await callApi("/GetQuote", { id: session, symbol: requestedSymbol })));
      } catch (e) {
        result.quoteError = safeError(e);
      }
      try {
        result.history = await withConnection(admin, userId, async (session) => {
          const raw = await callApi("/PriceHistory", { id: session, symbol: requestedSymbol, from: new Date(Date.now() - 60 * 60_000).toISOString().slice(0, 19), to: new Date().toISOString().slice(0, 19), timeFrame: 5 });
          const bars = normalizeBars(raw);
          return { count: bars.length, sample: bars.slice(-3) };
        });
      } catch (e) {
        result.historyError = safeError(e);
      }
      return json({ ok: true, diagnostics: result });
    }

    if (action === "disconnect") {
      const c = await loadConnection(admin, userId);
      if (c.session_id) {
        try { await callApi("/Disconnect", { id: String(c.session_id) }); } catch { /* local cleanup still proceeds */ }
      }
      await admin.from("syntx_api_connections").update({ session_id: null, connection_status: "saved", updated_at: new Date().toISOString() }).eq("id", c.id);
      return json({ ok: true, connected: false });
    }

    throw new Error("Unknown action");
  } catch (error) {
    // Expected conditions (signed out, no feed connected, upstream down) reply 200
    // with ok:false so the page shows a message instead of breaking.
    const message = safeError(error);
    const code = /sign in required/i.test(message) ? "auth" : /no weltrade syntx api connection/i.test(message) ? "not_connected" : "error";
    return json({ ok: false, error: message, code });
  }
});
