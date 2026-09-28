/**
 * OPEN_ACCESS master switch: when true, every page and feature is unlocked for
 * everyone (signed in or not, any plan). Set to false to re-enable the normal
 * paid + trial gating.
 */
export const OPEN_ACCESS = true;

/** Legacy dated preview window (kept for reference). */
export const PUBLIC_PREVIEW_UNTIL = new Date("2026-08-06T23:59:59Z");

export function isPublicPreviewActive(): boolean {
  return OPEN_ACCESS || Date.now() < PUBLIC_PREVIEW_UNTIL.getTime();
}
