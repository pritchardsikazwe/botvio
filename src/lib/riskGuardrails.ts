/**
 * Risk Guardrails for Botvio
 * Session limits, cooldowns, stake safety, auto-bot entry rules.
 */

export interface RiskSession {
  tradesThisSession: number;
  maxTradesPerSession: number;
  lossesInRow: number;
  maxLossesInRow: number;
  dailyLossUsd: number;
  maxDailyLossUsd: number;
  lastTradeAt: number | null;       // timestamp
  cooldownUntil: number | null;     // timestamp
  lockedUntil: number | null;       // timestamp (after 3 losses)
  autoMode: boolean;
  consecutiveSameSignal: number;    // for auto-bot 2-eval rule
}

export function createDefaultRiskSession(balance: number = 1000): RiskSession {
  return {
    tradesThisSession: 0,
    maxTradesPerSession: 10,
    lossesInRow: 0,
    maxLossesInRow: 3,
    dailyLossUsd: 0,
    maxDailyLossUsd: Math.min(50, balance * 0.1),
    lastTradeAt: null,
    cooldownUntil: null,
    lockedUntil: null,
    autoMode: false,
    consecutiveSameSignal: 0,
  };
}

export type TradeBlockReason =
  | "session_limit"
  | "loss_streak_lock"
  | "daily_loss_limit"
  | "cooldown"
  | "market_closed"
  | "low_confidence"
  | null;

export function checkCanTrade(
  session: RiskSession,
  confidence: number,
  styleMinInterval: number = 30000, // ms
): { allowed: boolean; reason: TradeBlockReason; message: string } {
  const now = Date.now();

  // Session limit
  if (session.tradesThisSession >= session.maxTradesPerSession) {
    return { allowed: false, reason: "session_limit", message: `Session limit reached (${session.maxTradesPerSession} trades)` };
  }

  // Loss streak lock
  if (session.lockedUntil && now < session.lockedUntil) {
    const secsLeft = Math.ceil((session.lockedUntil - now) / 1000);
    return { allowed: false, reason: "loss_streak_lock", message: `Locked for ${secsLeft}s after ${session.maxLossesInRow} losses` };
  }

  // Daily loss limit (skip if set to 0 = disabled)
  if (session.maxDailyLossUsd > 0 && session.dailyLossUsd >= session.maxDailyLossUsd) {
    return { allowed: false, reason: "daily_loss_limit", message: `Daily loss limit reached ($${session.maxDailyLossUsd})` };
  }

  // Cooldown
  if (session.cooldownUntil && now < session.cooldownUntil) {
    const secsLeft = Math.ceil((session.cooldownUntil - now) / 1000);
    return { allowed: false, reason: "cooldown", message: `Cooldown: ${secsLeft}s remaining` };
  }

  // Min interval
  if (session.lastTradeAt && (now - session.lastTradeAt) < styleMinInterval) {
    const secsLeft = Math.ceil((styleMinInterval - (now - session.lastTradeAt)) / 1000);
    return { allowed: false, reason: "cooldown", message: `Wait ${secsLeft}s between trades` };
  }

  // Confidence too low
  if (confidence < 60) {
    return { allowed: false, reason: "low_confidence", message: `Confidence too low (${confidence}% < 60%)` };
  }

  return { allowed: true, reason: null, message: "Ready to trade" };
}

export function getMinInterval(styleId: string): number {
  switch (styleId) {
    case "digit-contracts": return 15_000;
    case "rise-fall-scalping": return 30_000;
    case "turbo": return 15_000;
    case "multipliers": return 120_000;
    case "accumulators": return 300_000;
    default: return 30_000;
  }
}

export function safeStake(balance: number, userCap?: number): number {
  const defaultStake = Math.max(0.35, balance * 0.02);
  const maxAllowed = balance * 0.10;
  const cap = userCap ?? maxAllowed;
  return Math.min(defaultStake, cap, maxAllowed);
}

export function recordTradeResult(
  session: RiskSession,
  won: boolean,
  pnl: number,
  styleId: string,
): RiskSession {
  const updated = { ...session };
  updated.tradesThisSession++;
  updated.lastTradeAt = Date.now();

  if (!won) {
    updated.lossesInRow++;
    updated.dailyLossUsd += Math.abs(pnl);

    // Cooldown after loss
    const cooldownMs = updated.lossesInRow >= 2 ? 120_000 : (styleId === "digit-contracts" ? 20_000 : 40_000);
    updated.cooldownUntil = Date.now() + cooldownMs;

    // Lock after max losses
    if (updated.lossesInRow >= updated.maxLossesInRow) {
      updated.lockedUntil = Date.now() + 600_000; // 10 min
    }
  } else {
    updated.lossesInRow = 0;
    updated.cooldownUntil = null;
  }

  return updated;
}

// Auto-bot entry rules
export function shouldAutoTrade(
  session: RiskSession,
  confidence: number,
  timing: string,
  consecutiveSame: number,
): boolean {
  if (!session.autoMode) return false;
  if (confidence < 70) return false;
  if (timing === "Late") return false;
  if (consecutiveSame < 2) return false; // need 2 consecutive same signals
  if (session.lossesInRow >= 2) return false; // stop after 2 losses
  return true;
}
