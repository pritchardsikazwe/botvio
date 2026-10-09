/**
 * OPEN_ACCESS is intentionally disabled for the subscription rollout.
 * Access is controlled by active plan entitlements, the new-user trial, or
 * grandfathered accounts created before the rollout cutoff.
 */
export const OPEN_ACCESS = false;

/** Accounts created before this rollout retain their previous access. */
export const LEGACY_ACCESS_CUTOFF = new Date("2026-10-09T00:00:00Z");

export function isPublicPreviewActive(): boolean {
  return false;
}

export function isLegacyAccessAccount(createdAt?: string | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  return Number.isFinite(created) && created < LEGACY_ACCESS_CUTOFF.getTime();
}
