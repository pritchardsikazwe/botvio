/**
 * Global access bypass is intentionally disabled.
 * Access is granted only by a valid subscription, the 24-hour new-user trial,
 * or an explicitly authorized admin/super-admin role.
 */
export const OPEN_ACCESS = false;

export function isPublicPreviewActive(): boolean {
  return false;
}
