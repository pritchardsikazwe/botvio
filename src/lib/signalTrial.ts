export const TRIAL_SIGNAL_DAILY_LIMIT = 35;

export function canUnlockTrialSignal(used: number, alreadyUnlocked: boolean, paid = false): boolean {
  return paid || alreadyUnlocked || used < TRIAL_SIGNAL_DAILY_LIMIT;
}

// Daily signals and trial counters roll over at 06:00 CAT (04:00 UTC).
export function signalDayStart(now = new Date()): Date {
  const shifted = new Date(now.getTime() - 4 * 3_600_000);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(), 4));
}

export function nextSignalMorning(now = new Date()): Date {
  return new Date(signalDayStart(now).getTime() + 24 * 3_600_000);
}