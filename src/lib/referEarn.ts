// Refer & Earn rules shown to users; the database enforces the same values.
export const REFERRAL_COMMISSION_RATE = 0.15;
export const REFERRAL_BONUS_EVERY = 10;
export const REFERRAL_BONUS_USD = 10;
export const MIN_PAYOUT_USD = 5;
export const REFERRAL_STORAGE_KEY = "botvio_referral";
const BASE = "https://botvio.live";

export const referralLink = (code: string) => `${BASE}/r/${code}`;
export const commissionFor = (amountUsd: number) => Math.round(amountUsd * REFERRAL_COMMISSION_RATE * 100) / 100;
export const bonusesEarned = (payingReferrals: number) => Math.floor(Math.max(0, payingReferrals) / REFERRAL_BONUS_EVERY) * REFERRAL_BONUS_USD;
export const referralsToNextBonus = (payingReferrals: number) => REFERRAL_BONUS_EVERY - (Math.max(0, payingReferrals) % REFERRAL_BONUS_EVERY);
export const canRequestPayout = (balance: number) => balance >= MIN_PAYOUT_USD;

export const readStoredReferralCode = (): string | null => {
  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.code || (parsed.expiresAt && Date.now() > parsed.expiresAt)) { localStorage.removeItem(REFERRAL_STORAGE_KEY); return null; }
    return String(parsed.code);
  } catch { return null; }
};
