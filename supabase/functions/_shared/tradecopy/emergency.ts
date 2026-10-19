import type { ExecutionAdapter } from "./adapter.ts";

/** No blind close retry: always read remaining broker positions; caller persists the latch first. */
export async function emergencyClose(adapter: ExecutionAdapter, followerId: number, closeAll: boolean) {
  const errors: string[] = [];
  let deactivated = false;
  try { await adapter.deactivateFollower(followerId); deactivated = true; }
  catch { errors.push("Copy deactivation could not be confirmed"); }
  if (closeAll) {
    try { await adapter.closeAll(followerId, "slave"); }
    catch { errors.push("Close response uncertain; reconcile before retrying"); }
  }
  let remainingTickets: string[] | null = null;
  try { remainingTickets = (await adapter.getOpenOrders(followerId, "slave")).map((o) => o.ticket); }
  catch { errors.push("Remaining positions could not be verified"); }
  return {
    copyingBlockedLocally: true, deactivated, closeRequested: closeAll,
    closureStatus: !closeAll ? "not_requested" : remainingTickets === null ? "unknown" : remainingTickets.length ? "remaining" : "confirmed",
    remainingTickets, errors, simulated: adapter.mode === "mock",
  };
}