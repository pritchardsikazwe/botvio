import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://botvio.live",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function randomId() {
  return crypto.randomUUID();
}

function waitForMessage(
  socket: WebSocket,
  expectedPayloadType: number,
  clientMsgId?: string,
  timeoutMs = 8000,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for cTrader response"));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
    };

    const onError = () => {
      cleanup();
      reject(new Error("cTrader WebSocket connection failed"));
    };

    const onMessage = (event: MessageEvent) => {
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      const type = Number(message.payloadType);
      if (type === 2142) {
        cleanup();
        reject(new Error("cTrader rejected the request"));
        return;
      }
      if (type === expectedPayloadType && (!clientMsgId || message.clientMsgId === clientMsgId)) {
        cleanup();
        resolve(message);
      }
    };

    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
  });
}

async function sendAndWait(
  socket: WebSocket,
  payloadType: number,
  payload: Record<string, unknown>,
  expectedType: number,
) {
  const clientMsgId = randomId();
  const responsePromise = waitForMessage(socket, expectedType, clientMsgId);
  socket.send(JSON.stringify({ clientMsgId, payloadType, payload }));
  return await responsePromise;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ ok: false, error: "Sign in required" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
    );
    const token = authorization.slice("Bearer ".length);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ ok: false, error: "Invalid session" }, 401);

    const { code, redirectUri } = await req.json();
    if (typeof code !== "string" || !code || typeof redirectUri !== "string" || !redirectUri) {
      return json({ ok: false, error: "Missing authorization code or redirect URI" }, 400);
    }

    const clientId = Deno.env.get("CTRADER_CLIENT_ID");
    const clientSecret = Deno.env.get("CTRADER_CLIENT_SECRET");
    const configuredRedirectUri = Deno.env.get("CTRADER_REDIRECT_URI");
    if (!clientId || !clientSecret || !configuredRedirectUri) {
      return json({ ok: false, error: "cTrader server secrets are not configured" }, 503);
    }
    if (redirectUri !== configuredRedirectUri) {
      return json({ ok: false, error: "Redirect URI does not match server configuration" }, 400);
    }

    // cTrader authorization codes expire quickly. Exchange only on the server.
    const tokenUrl = new URL("https://openapi.ctrader.com/apps/token");
    tokenUrl.searchParams.set("grant_type", "authorization_code");
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("redirect_uri", configuredRedirectUri);
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);

    const tokenResponse = await fetch(tokenUrl, { headers: { Accept: "application/json" } });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData.accessToken) {
      console.error("cTrader token exchange rejected", tokenResponse.status, tokenData.errorCode ?? "unknown");
      return json({ ok: false, error: "cTrader authorization exchange failed. Please reconnect and try again." }, 400);
    }

    // Read-only account scope only. No token is persisted or returned to the browser.
    const accessToken = String(tokenData.accessToken);
    const socket = new WebSocket("wss://demo.ctraderapi.com:5036");
    const socketOpened = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out connecting to cTrader demo")), 8000);
      socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Unable to connect to cTrader demo endpoint")); }, { once: true });
    });

    try {
      await socketOpened;
      await sendAndWait(socket, 2100, { clientId, clientSecret }, 2101);
      const accountListResponse = await sendAndWait(
        socket,
        2149,
        { accessToken },
        2150,
      );
      const payload = (accountListResponse.payload ?? {}) as Record<string, unknown>;
      const rawAccounts = Array.isArray(payload.ctidTraderAccount) ? payload.ctidTraderAccount : [];
      if (rawAccounts.length === 0) {
        return json({ ok: false, error: "Authorization succeeded, but no demo accounts were granted. Re-authorize and select a demo account." }, 400);
      }

      const accounts = rawAccounts.map((item: unknown) => {
        const account = item as Record<string, unknown>;
        return {
          accountId: String(account.ctidTraderAccountId ?? ""),
          brokerName: typeof account.brokerTitle === "string" ? account.brokerTitle : null,
          traderLogin: account.traderLogin ?? null,
          isLive: Boolean(account.isLive),
        };
      }).filter((account) => account.accountId);

      // Authorize a demo account in read-only scope to prove account-level access.
      const demoAccount = accounts.find((account) => !account.isLive);
      if (!demoAccount) {
        return json({ ok: false, error: "No demo account was returned. This test only accepts demo accounts." }, 400);
      }
      await sendAndWait(
        socket,
        2102,
        { ctidTraderAccountId: Number(demoAccount.accountId), accessToken },
        2103,
      );

      return json({
        ok: true,
        status: "connected_read_only",
        environment: "demo",
        accountCount: accounts.length,
        accounts: accounts.map((account) => ({
          ...account,
          selectedForTest: account.accountId === demoAccount.accountId,
        })),
        permission: "accounts",
        message: "cTrader demo authorization and account-level read-only handshake succeeded. No trading actions were performed.",
      });
    } finally {
      try { socket.close(); } catch { /* ignore close errors */ }
    }
  } catch (error) {
    console.error("cTrader read-only connection test failed", error instanceof Error ? error.message : "unknown error");
    return json({ ok: false, error: error instanceof Error ? error.message : "Connection test failed" }, 502);
  }
});
