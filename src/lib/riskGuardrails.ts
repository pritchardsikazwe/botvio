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
  lastTradeAt: number | null;
  cooldownUntil: number | null;
  lockedUntil: number | null;
  autoMode: boolean;
  consecutiveSameSignal: number;
}

export function createDefaultRiskSession(balance: number = 1000): RiskSession {
  return {
    tradesThisSession: 0,
    maxTradesPerSession: 20,
    lossesInRow: 0,
    maxLossesInRow: 5,
    dailyLossUsd: 0,
    maxDailyLossUsd: 0, // 0 = disabled by default
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
  styleMinInterval: number = 30000,
): { allowed: boolean; reason: TradeBlockReason; message: string } {
  const now = Date.now();

  if (session.tradesThisSession >= session.maxTradesPerSession) {
    return { allowed: false, reason: "session_limit", message: `Session limit reached (${session.maxTradesPerSession} trades)` };
  }

  if (session.lockedUntil && now < session.lockedUntil) {
    const secsLeft = Math.ceil((session.lockedUntil - now) / 1000);
    return { allowed: false, reason: "loss_streak_lock", message: `Locked for ${secsLeft}s after ${session.maxLossesInRow} losses` };
  }

  // Daily loss limit (skip if set to 0 = disabled)
  if (session.maxDailyLossUsd > 0 && session.dailyLossUsd >= session.maxDailyLossUsd) {
    return { allowed: false, reason: "daily_loss_limit", message: `Daily loss limit reached ($${session.maxDailyLossUsd})` };
  }

  if (session.cooldownUntil && now < session.cooldownUntil) {
    const secsLeft = Math.ceil((session.cooldownUntil - now) / 1000);
    return { allowed: false, reason: "cooldown", message: `Cooldown: ${secsLeft}s remaining` };
  }

  if (session.lastTradeAt && (now - session.lastTradeAt) < styleMinInterval) {
    const secsLeft = Math.ceil((styleMinInterval - (now - session.lastTradeAt)) / 1000);
    return { allowed: false, reason: "cooldown", message: `Wait ${secsLeft}s between trades` };
  }

  return { allowed: true, reason: null, message: "Ready to trade" };
}

export function getMinInterval(styleId: string): number {
  switch (styleId) {
    case "digit-contracts": return 10_000;
    case "rise-fall-scalping": return 15_000;
    case "turbo": return 10_000;
    case "multipliers": return 30_000;
    case "accumulators": return 60_000;
    default: return 15_000;
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

    const cooldownMs = updated.lossesInRow >= 2 ? 60_000 : 20_000;
    updated.cooldownUntil = Date.now() + cooldownMs;

    if (updated.lossesInRow >= updated.maxLossesInRow) {
      updated.lockedUntil = Date.now() + 300_000; // 5 min
    }
  } else {
    updated.lossesInRow = 0;
    updated.cooldownUntil = null;
  }

  return updated;
}

export function shouldAutoTrade(
  session: RiskSession,
  confidence: number,
  timing: string,
  consecutiveSame: number,
): boolean {
  if (!session.autoMode) return false;
  if (confidence < 70) return false;
  if (timing === "Late") return false;
  if (consecutiveSame < 2) return false;
  if (session.lossesInRow >= 2) return false;
  return true;
}
