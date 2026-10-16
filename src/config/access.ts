/**
 * Temporary public-access mode for the Botvio evaluation period.
 *
 * This bypasses client-side subscription/entitlement gates only. It does not
 * grant database permissions, admin roles, access to other users' private
 * data, or authorize live trading. Set back to false to restore plan gates.
 */
export const OPEN_ACCESS = true;

export function isPublicPreviewActive(): boolean {
  return OPEN_ACCESS;
}
