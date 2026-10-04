import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DERIV_CLIENT_ID = "33XSUutrVPDWusVXuDUwW";
const DERIV_REST_BASE = "https://api.derivws.com";
const DERIV_PUBLIC_WS = "wss://api.derivws.com/trading/v1/options/ws/public";
const COPY_CONCURRENCY = 8;

interface TradeRequest {
  provider_id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  contract_type?: string;
  stake: number;
  duration?: number;
  duration_unit?: string;
  barrier?: number;
}

interface CopyResult {
  subscriber_user_id: string;
  subscriber_account_id: string;
  stake: number;
  status: "success" | "error";
  contract_id?: string;
  error?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function accountIdFromRecord(account: any): string | null {
  if (!account || typeof account !== "object") return null;
  return account.login_id ?? account.loginid ?? account.account_id ?? account.broker_account_id ?? null;
}

async function getDerivAccounts(token: string): Promise<any[]> {
  const response = await fetch(`${DERIV_REST_BASE}/trading/v1/options/accounts`, {
    headers: {
      "Deriv-App-ID": DERIV_CLIENT_ID,
      "Authorization": `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.errors?.[0]?.message || `Deriv account lookup failed: HTTP ${response.status}`);
  }
  return Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.accounts)
      ? payload.accounts
      : [];
}

/**
 * Resolve the exact Deriv account configured for this Botvio trading account.
 * Never silently chooses accounts[0] when the token owns multiple accounts.
 */
async function resolveDerivAccount(token: string, configuredAccountId?: string | null) {
  const accounts = await getDerivAccounts(token);
  const active = accounts.filter((a) => a?.status === "active");

  if (configuredAccountId) {
    const exact = accounts.find((a) => accountIdFromRecord(a) === configuredAccountId);
    if (!exact) throw new Error(`Configured Deriv account ${configuredAccountId} is not available to this token`);
    return exact;
  }

  if (active.length === 1) return active[0];
  if (accounts.length === 1) return accounts[0];

  throw new Error("This Deriv connection has multiple accounts but no account ID is configured. Select a specific Deriv Options account before copying.");
}

async function getOtpWebSocketUrl(token: string, accountId: string): Promise<string> {
  const response = await fetch(
    `${DERIV_REST_BASE}/trading/v1/options/accounts/${encodeURIComponent(accountId)}/otp`,
    {
      method: "POST",
      headers: {
        "Deriv-App-ID": DERIV_CLIENT_ID,
        "Authorization": `Bearer ${token}`,
      },
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.errors?.[0]?.message || `Deriv OTP request failed: HTTP ${response.status}`);
  }
  const wsUrl = payload?.data?.url || payload?.url;
  if (!wsUrl) throw new Error("Deriv did not return an authenticated WebSocket URL");
  return wsUrl;
}

async function openDerivConnection(token: string, accountId: string): Promise<WebSocket> {
  const wsUrl = await getOtpWebSocketUrl(token, accountId);
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Deriv WebSocket connection timeout"));
    }, 10000);
    ws.onopen = () => {
      clearTimeout(timeout);
      resolve(ws);
    };
    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Deriv WebSocket connection failed"));
    };
  });
}

async function sendWsRequest(
  ws: WebSocket,
  payload: Record<string, unknown>,
  timeoutMs = 15000,
): Promise<any> {
  return await new Promise((resolve, reject) => {
    const reqId = crypto.randomUUID();
    const timeout = setTimeout(() => {
      ws.removeEventListener("message", handler);
      reject(new Error("Deriv WebSocket request timeout"));
    }, timeoutMs);

    const handler = (event: MessageEvent) => {
      let data: any;
      try {
        data = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (String(data?.req_id) !== reqId) return;
      clearTimeout(timeout);
      ws.removeEventListener("message", handler);
      if (data?.error) reject(new Error(data.error.message || "Deriv request failed"));
      else resolve(data);
    };

    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ ...payload, req_id: reqId }));
  });
}

async function getPublicContracts(symbol: string): Promise<any[]> {
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(DERIV_PUBLIC_WS);
    const reqId = crypto.randomUUID();
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Deriv contracts_for request timed out"));
    }, 10000);

    ws.onopen = () => ws.send(JSON.stringify({ contracts_for: symbol, req_id: reqId }));

    ws.onmessage = (event) => {
      let data: any;
      try {
        data = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (String(data?.req_id) !== reqId) return;
      clearTimeout(timeout);
      ws.close();
      if (data?.error) reject(new Error(data.error.message || "Unable to load available Deriv contracts"));
      else resolve(Array.isArray(data?.contracts_for?.available) ? data.contracts_for.available : []);
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      ws.close();
      reject(new Error("Deriv public market-data connection failed"));
    };
  });
}

function validateTradeRequest(request: TradeRequest, availableContracts: any[]) {
  const contractType = String(
    request.contract_type || (request.direction === "BUY" ? "CALL" : "PUT"),
  ).toUpperCase();

  if (!request.symbol?.trim()) throw new Error("A Deriv underlying symbol is required");
  if (!Number.isFinite(request.stake) || request.stake <= 0) throw new Error("Stake must be greater than zero");

  const duration = request.duration ?? 5;
  const durationUnit = String(request.duration_unit ?? "t").toLowerCase();
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Duration must be greater than zero");
  if (!["t", "s", "m", "h", "d"].includes(durationUnit)) throw new Error("Unsupported duration unit");

  const available = availableContracts.some(
    (item) => String(item?.contract_type || "").toUpperCase() === contractType,
  );
  if (!available) throw new Error(`Deriv contract ${contractType} is not currently available for ${request.symbol}`);

  if (
    ["DIGITOVER", "DIGITUNDER", "DIGITMATCH", "DIGITDIFF"].includes(contractType) &&
    (request.barrier === undefined || !Number.isInteger(request.barrier) || request.barrier < 0 || request.barrier > 9)
  ) {
    throw new Error("Digit contracts require a barrier from 0 to 9");
  }

  return { contractType, duration, durationUnit };
}

async function placeDerivTrade(
  token: string,
  accountId: string,
  symbol: string,
  stake: number,
  contractType: string,
  duration: number,
  durationUnit: string,
  barrier?: number,
): Promise<{ contract_id: string; buy_price: number }> {
  const ws = await openDerivConnection(token, accountId);
  try {
    const parameters: Record<string, unknown> = {
      amount: stake,
      basis: "stake",
      contract_type: contractType,
      currency: "USD",
      duration,
      duration_unit: durationUnit,
      underlying_symbol: symbol,
    };

    if (
      barrier !== undefined &&
      ["DIGITOVER", "DIGITUNDER", "DIGITMATCH", "DIGITDIFF"].includes(contractType)
    ) {
      parameters.barrier = String(barrier);
    }

    const proposalResponse = await sendWsRequest(ws, {
      proposal: 1,
      ...parameters,
    });

    const proposalId = proposalResponse?.proposal?.id;
    const askPrice = Number(proposalResponse?.proposal?.ask_price);
    if (!proposalId || !Number.isFinite(askPrice) || askPrice <= 0) {
      throw new Error("Deriv did not return a valid contract proposal");
    }

    const buyResponse = await sendWsRequest(ws, {
      buy: proposalId,
      price: askPrice,
    });

    if (!buyResponse?.buy?.contract_id) throw new Error("Deriv did not return a contract ID");

    return {
      contract_id: String(buyResponse.buy.contract_id),
      buy_price: Number(buyResponse.buy.buy_price) || stake,
    };
  } finally {
    ws.close();
  }
}

async function getDerivBalance(token: string, accountId: string): Promise<number> {
  const ws = await openDerivConnection(token, accountId);
  try {
    const response = await sendWsRequest(ws, { balance: 1, account: "current" });
    return Number(response?.balance?.balance) || 0;
  } finally {
    ws.close();
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function runWorker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(items.length, 1)) },
      () => runWorker(),
    ),
  );
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !user) return json({ error: "Invalid token" }, 401);

    const body: TradeRequest = await req.json();
    const {
      provider_id,
      symbol,
      direction,
      contract_type,
      stake,
      duration = 5,
      duration_unit = "t",
      barrier,
    } = body;

    if (!provider_id || !["BUY", "SELL"].includes(direction)) {
      return json({ error: "provider_id and a valid direction are required" }, 400);
    }

    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("*, provider_accounts(*, trading_accounts(*))")
      .eq("id", provider_id)
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) return json({ error: "Provider not found or access denied" }, 403);
    if (provider.status !== "approved") return json({ error: "Provider not approved for trading" }, 403);

    const providerAccount = Array.isArray(provider.provider_accounts)
      ? provider.provider_accounts[0]
      : provider.provider_accounts;
    const providerTradingAccount = providerAccount?.trading_accounts;

    if (!providerTradingAccount) {
      return json({ error: "No provider Deriv Options trading account is configured" }, 400);
    }

    // MT5 providers never use this function. Their route is Botvio TradeCopy.
    const providerPlatform = String(
      providerTradingAccount.platform ??
      providerTradingAccount.broker ??
      providerAccount?.platform ??
      "",
    ).toLowerCase();

    if (providerPlatform.includes("mt5") || providerPlatform === "deriv_mt5") {
      return json({
        error: "MT5 provider routing is handled by Botvio TradeCopy. Deriv Options copy is a separate route.",
        code: "MT5_MUST_USE_TRADECOPY",
      }, 409);
    }

    const providerToken = providerTradingAccount.api_key_encrypted;
    if (!providerToken) return json({ error: "Provider Deriv access token is not configured" }, 400);

    const providerConfiguredAccountId = accountIdFromRecord(providerTradingAccount);
    const providerDerivAccount = await resolveDerivAccount(providerToken, providerConfiguredAccountId);
    const providerAccountId = accountIdFromRecord(providerDerivAccount);
    if (!providerAccountId) return json({ error: "Provider Deriv account ID could not be resolved" }, 400);

    // Deriv's current contracts_for endpoint is the source of truth for
    // currently available contract types. Do this BEFORE provider execution.
    const availableContracts = await getPublicContracts(symbol);
    const validated = validateTradeRequest(
      { provider_id, symbol, direction, contract_type, stake, duration, duration_unit, barrier },
      availableContracts,
    );

    const providerTradeResult = await placeDerivTrade(
      providerToken,
      providerAccountId,
      symbol,
      stake,
      validated.contractType,
      validated.duration,
      validated.durationUnit,
      barrier,
    );

    const { data: providerTrade, error: insertError } = await supabase
      .from("provider_trades")
      .insert({
        provider_id,
        provider_trading_account_id: providerAccount.id ?? providerAccount.trading_account_id,
        broker: "deriv",
        symbol,
        direction,
        stake,
        duration: validated.duration,
        duration_unit: validated.durationUnit,
        broker_trade_id: providerTradeResult.contract_id,
        status: "open",
      })
      .select()
      .single();

    if (insertError) console.error("Failed to insert provider trade:", insertError);

    const providerBalance = await getDerivBalance(providerToken, providerAccountId);

    const { data: subscriptions, error: subError } = await supabase
      .from("copy_subscriptions")
      .select("*, subscriber_trading_account:trading_accounts(*)")
      .eq("provider_id", provider_id)
      .eq("status", "active");

    if (subError) console.error("Failed to fetch subscriptions:", subError);

    const activeSubscriptions = subscriptions || [];

    const copyResults = await mapWithConcurrency(
      activeSubscriptions,
      COPY_CONCURRENCY,
      async (sub): Promise<CopyResult> => {
        const subscriberAccount = sub.subscriber_trading_account;
        const subscriberToken = subscriberAccount?.api_key_encrypted;
        const configuredAccountId = accountIdFromRecord(subscriberAccount);
        let subscriberStake = stake;

        try {
          if (!subscriberToken) throw new Error("No Deriv access token on follower account");

          if (sub.copy_mode === "fixed") {
            subscriberStake = Number(sub.fixed_stake) || 1;
          } else if (sub.copy_mode === "multiplier") {
            subscriberStake = stake * (Number(sub.multiplier) || 1);
          } else if (sub.copy_mode === "proportional") {
            const resolvedForBalance = await resolveDerivAccount(subscriberToken, configuredAccountId);
            const balanceAccountId = accountIdFromRecord(resolvedForBalance);
            if (!balanceAccountId) throw new Error("Follower Deriv account ID could not be resolved");
            const subscriberBalance = await getDerivBalance(subscriberToken, balanceAccountId);
            if (providerBalance <= 0) throw new Error("Provider balance is unavailable for proportional copying");
            subscriberStake = (subscriberBalance / providerBalance) * stake;
          }

          subscriberStake = Math.max(0.35, Number(subscriberStake));
          if (!Number.isFinite(subscriberStake) || subscriberStake <= 0) {
            throw new Error("Calculated follower stake is invalid");
          }

          const resolved = await resolveDerivAccount(subscriberToken, configuredAccountId);
          const subscriberAccountId = accountIdFromRecord(resolved);
          if (!subscriberAccountId) throw new Error("Follower Deriv account ID could not be resolved");

          const result = await placeDerivTrade(
            subscriberToken,
            subscriberAccountId,
            symbol,
            subscriberStake,
            validated.contractType,
            validated.duration,
            validated.durationUnit,
            barrier,
          );

          await supabase.from("copied_trades").insert({
            provider_trade_id: providerTrade?.id,
            subscriber_user_id: sub.subscriber_user_id,
            subscriber_trading_account_id: sub.subscriber_trading_account_id,
            broker_trade_id: result.contract_id,
            symbol,
            direction,
            stake: subscriberStake,
            status: "open",
          });

          await supabase.from("notifications").insert({
            user_id: sub.subscriber_user_id,
            title: "Trade Copied",
            message: `${direction} ${symbol} copied from ${provider.display_name} - Stake: $${subscriberStake.toFixed(2)}`,
            type: "trade",
            metadata: {
              symbol,
              direction,
              stake: subscriberStake,
              contract_type: validated.contractType,
              source: "deriv_options_copy",
            },
          });

          return {
            subscriber_user_id: sub.subscriber_user_id,
            subscriber_account_id: sub.subscriber_trading_account_id,
            stake: subscriberStake,
            status: "success",
            contract_id: result.contract_id,
          };
        } catch (copyErr: any) {
          const error = copyErr instanceof Error ? copyErr.message : "Follower copy failed";

          await supabase.from("copied_trades").insert({
            provider_trade_id: providerTrade?.id,
            subscriber_user_id: sub.subscriber_user_id,
            subscriber_trading_account_id: sub.subscriber_trading_account_id,
            symbol,
            direction,
            stake: subscriberStake,
            status: "error",
          });

          return {
            subscriber_user_id: sub.subscriber_user_id,
            subscriber_account_id: sub.subscriber_trading_account_id,
            stake: subscriberStake,
            status: "error",
            error,
          };
        }
      },
    );

    const successful = copyResults.filter((r) => r.status === "success");
    const failed = copyResults.filter((r) => r.status === "error");

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action_type: "EXECUTE_DERIV_OPTIONS_COPY",
      payload_json: {
        provider_id,
        provider_trade_id: providerTrade?.id,
        provider_deriv_account_id: providerAccountId,
        symbol,
        direction,
        contract_type: validated.contractType,
        stake,
        duration: validated.duration,
        duration_unit: validated.durationUnit,
        subscribers_copied: successful.length,
        subscribers_failed: failed.length,
      },
    });

    await supabase
      .from("providers")
      .update({ total_trades: Number(provider.total_trades || 0) + 1 })
      .eq("id", provider_id);

    return json({
      success: true,
      product: "deriv_options_copy",
      provider_trade: {
        id: providerTrade?.id,
        contract_id: providerTradeResult.contract_id,
        buy_price: providerTradeResult.buy_price,
        account_id: providerAccountId,
      },
      copy_results: copyResults,
      summary: {
        total_subscribers: activeSubscriptions.length,
        successful_copies: successful.length,
        failed_copies: failed.length,
      },
    });
  } catch (error: unknown) {
    console.error("Deriv Options copy error:", error);
    return json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
