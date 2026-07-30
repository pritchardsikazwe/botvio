/**
 * Temporary open-access window: every trading hub / premium route is free for
 * ANY visitor (signed in or not) until this timestamp. After it passes the
 * normal paid + trial gating resumes automatically — no code change needed.
 */
export const PUBLIC_PREVIEW_UNTIL = new Date("2026-08-06T23:59:59Z");

export function isPublicPreviewActive(): boolean {
  return Date.now() < PUBLIC_PREVIEW_UNTIL.getTime();
}