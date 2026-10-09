/** Resolve an entitled product to the feature the customer purchased. Keep this mapping shared by dashboard and My Products. */
export function getProductDestination(slug?: string | null, type?: string | null): string {
  const value = (slug ?? "").toLowerCase().trim();
  const exact: Record<string, string> = {
    "synthetic-hub": "/synthetic-hub",
    "weltrade-hub": "/weltrade",
    "mt5-direct": "/connections",
    "mt5-direct-signals": "/connections",
    "botvio-gold-robot": "/apps/gold-robot",
    "botvio-synthetic-robot": "/apps/synthetic-robot",
    "botvio-crypto-robot": "/apps/crypto-robot",
    "botvio-weltrade-robot": "/apps/weltrade-robot",
    "botvio-deriv-copy": "/apps/deriv-copy",
    "botvio-ai-robot": "/dashboard",
    "botvio-robot": "/dashboard",
  };
  if (exact[value]) return exact[value];

  // Handle additional hub products that use descriptive slugs.
  if (/weltrade|syntx/.test(value)) return "/weltrade";
  if (/synthetic|boom|crash|volatility|deriv/.test(value) && type !== "bot") return "/synthetic-hub";
  if (/gold|xauusd/.test(value)) return "/gold";
  if (/silver|xagusd/.test(value)) return "/silver";
  if (/bitcoin|btc/.test(value)) return "/bitcoin";
  if (/crypto|binance/.test(value)) return "/binance";
  if (/eur.?usd/.test(value)) return "/eur-usd";
  if (/gbp.?usd/.test(value)) return "/gbp-usd";
  if (/usd.?jpy/.test(value)) return "/usd-jpy";
  if (/aud.?usd/.test(value)) return "/aud-usd";
  if (/nas100|nasdaq/.test(value)) return "/nas100";
  if (/us30|dow/.test(value)) return "/us30";

  if (type === "bot") return "/bots";
  if (type === "signal_pack") return "/signals";
  if (type === "strategy") return "/strategies";
  if (type === "course") return "/learn";
  if (type === "hub") return "/markets";
  return "/my-products";
}
