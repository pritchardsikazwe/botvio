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
  const last = Number(raw?.last ?? raw?.Last ?? raw?.price ?? raw?.Price);
  return {
    bid: Number.isFinite(bid) ? bid : null,
    ask: Number.isFinite(ask) ? ask : null,
    last: Number.isFinite(last) ? last : null,
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
      : Math.floor(new Date(String(timeRaw)).getTime() / 1000);
    return {
      time,
      open: Number(b.open ?? b.Open),
      high: Number(b.high ?? b.High),
      low: Number(b.low ?? b.Low),
      close: Number(b.close ?? b.Close),
      volume: Number(b.volume ?? b.Volume ?? 0),
    };
  }).filter((b) => Number.isFinite(b.time) && [b.open,b.high,b.low,b.close].every(Number.isFinite));
}

async function getUser(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\\s+/i, "");
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

async function ensureSession(admin: ReturnType<typeof createClient>, connection: Record<string, unknown>) {
  if (connection.session_id) return String(connection.session_id);
  const password = await decryptSecret(String(connection.password_encrypted), Deno.env.get("TOKEN_ENCRYPTION_KEY")!);
  const sessionId = crypto.randomUUID();
  const raw = await callApi("/ConnectEx", {
    user: String(connection.login),
    password,
    mtClusterName: String(connection.server),
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

async function withConnection(admin: ReturnType<typeof createClient>, userId: string, fn: (session: string, c: Record<string, unknown>) => Promise<unknown>) {
  const c = await loadConnection(admin, userId);
  try {
    const session = await ensureSession(admin, c);
    return await fn(session, c);
  } catch (error) {
    await admin.from("syntx_api_connections").update({
      connection_status: "error",
      last_error: safeError(error),
      updated_at: new Date().toISOString(),
    }).eq("id", c.id);
    throw error;
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
      if (!/^\\d+$/.test(login)) throw new Error("Enter a valid MT5 account number");
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
      return json({ ok: true, quote: await withConnection(admin, userId, async (session) => normalizeQuote(await callApi("/Quote", { id: session, symbol }))) });
    }

    if (action === "history") {
      const symbol = String(body?.symbol ?? "").trim();
      const timeframe = String(body?.timeframe ?? "QhPeriodM5");
      const to = String(body?.to ?? new Date().toISOString());
      const from = String(body?.from ?? new Date(Date.now() - 400 * 5 * 60_000).toISOString());
      if (!symbol) throw new Error("Symbol is required");
      return json({ ok: true, candles: await withConnection(admin, userId, async (session) => normalizeBars(await callApi("/QuoteHistory", { id: session, symbol, timeframe, fromTime: from, toTime: to }))) });
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
    return json({ ok: false, error: safeError(error) }, 400);
  }
});
