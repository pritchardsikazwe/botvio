import { getSymbolCapability, type SymbolCapability } from "./derivSymbols";

export type ValidationStep =
  | "connection"
  | "authorization"
  | "symbol"
  | "contract_type"
  | "stake"
  | "duration"
  | "trading_availability";

export interface ValidationInput {
  connected: boolean;
  authorized: boolean;
  symbol: string;
  displayName?: string;
  contractType: string;
  stake: number;
  duration?: number;
  durationUnit?: "t" | "s" | "m" | "h" | "d";
  balance?: number | null;
}

export interface ValidationResult {
  ok: boolean;
  step?: ValidationStep;
  /** user-facing message */
  message?: string;
  /** developer detail, surfaced under "Technical details" only */
  technical?: string;
  capability?: SymbolCapability | null;
}

const OK: ValidationResult = { ok: true };

/**
 * Sequential pre-trade validation. A request only reaches Deriv when every
 * step passes, so invalid contracts are never sent to the API.
 */
export async function validateTradeRequest(input: ValidationInput): Promise<ValidationResult> {
  const label = input.displayName || input.symbol;

  if (!input.connected) {
    return { ok: false, step: "connection", message: "Deriv is not connected. Reconnect and try again." };
  }
  if (!input.authorized) {
    return { ok: false, step: "authorization", message: "Your Deriv session needs re-authorization." };
  }
  if (!input.symbol) {
    return { ok: false, step: "symbol", message: "Choose an asset before trading." };
  }
  if (!Number.isFinite(input.stake) || input.stake <= 0) {
    return { ok: false, step: "stake", message: "Enter a valid stake greater than 0." };
  }
  if (input.balance != null && input.stake > input.balance) {
    return {
      ok: false,
      step: "stake",
      message: `Stake of ${input.stake.toFixed(2)} exceeds your available balance.`,
    };
  }

  let cap: SymbolCapability;
  try {
    cap = await getSymbolCapability(input.symbol);
  } catch (e) {
    return {
      ok: false,
      step: "symbol",
      message: `Could not confirm that ${label} is tradable right now. Try refreshing assets.`,
      technical: e instanceof Error ? e.message : String(e),
    };
  }

  if (cap.isSuspended) {
    return { ok: false, step: "trading_availability", message: `${label} trading is suspended by Deriv.`, capability: cap };
  }
  if (!cap.isOpen) {
    return { ok: false, step: "trading_availability", message: `${label} market is currently closed.`, capability: cap };
  }

  // When the capability lookup itself failed we let the trade through rather
  // than blocking a working account, but we never claim it is supported.
  if (cap.unverified) return { ...OK, capability: cap };

  const spec = cap.contracts[input.contractType];
  if (!spec) {
    return {
      ok: false,
      step: "contract_type",
      message: `${label} does not currently support this trade type. Choose another available asset.`,
      technical: `Deriv confirmed: ${Object.keys(cap.contracts).join(", ") || "no contract types"}`,
      capability: cap,
    };
  }

  if (spec.minStake != null && input.stake < spec.minStake) {
    return {
      ok: false,
      step: "stake",
      message: `Minimum stake for ${label} is ${spec.minStake}.`,
      capability: cap,
    };
  }
  if (spec.maxStake != null && input.stake > spec.maxStake) {
    return {
      ok: false,
      step: "stake",
      message: `Maximum stake for ${label} is ${spec.maxStake}.`,
      capability: cap,
    };
  }

  if (input.duration != null) {
    if (!Number.isFinite(input.duration) || input.duration <= 0) {
      return { ok: false, step: "duration", message: "Enter a valid duration.", capability: cap };
    }
    const unitMatches = !input.durationUnit || spec.durationUnits.length === 0 || spec.durationUnits.includes(input.durationUnit);
    if (unitMatches) {
      if (spec.minDuration != null && input.duration < spec.minDuration) {
        return {
          ok: false,
          step: "duration",
          message: `Minimum duration for ${label} is ${spec.minDuration}${input.durationUnit ?? ""}.`,
          capability: cap,
        };
      }
      if (spec.maxDuration != null && input.duration > spec.maxDuration) {
        return {
          ok: false,
          step: "duration",
          message: `Maximum duration for ${label} is ${spec.maxDuration}${input.durationUnit ?? ""}.`,
          capability: cap,
        };
      }
    }
  }

  return { ...OK, capability: cap };
}

/** Turn a raw Deriv/technical error into something a trader can act on. */
export function friendlyTradeError(raw: string | undefined, assetLabel: string): string {
  const msg = (raw || "").trim();
  if (!msg) return "Trade could not be placed. Please try again.";
  if (/not offered|not available|unavailable|invalid symbol|market is closed/i.test(msg)) {
    return `${assetLabel} is currently unavailable for this contract type.`;
  }
  if (/insufficient balance/i.test(msg)) return "Insufficient balance for this stake.";
  if (/authorizationrequired|invalid token|expired/i.test(msg)) {
    return "Your Deriv session expired. Refresh the connection and try again.";
  }
  if (/timeout/i.test(msg)) return "Deriv did not respond in time. Check the connection and retry.";
  if (/properties not allowed|input validation failed/i.test(msg)) {
    return `This trade request is not valid for ${assetLabel}. Choose another asset or trade type.`;
  }
  return msg;
}