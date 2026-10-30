export const SIGNAL_FEED_DAYS = 5;
export const SIGNAL_PAGE_SIZE = 50;
export function signalFeedWindow(page = 0, now = Date.now()) {
  const from = Math.max(0, Math.floor(page)) * SIGNAL_PAGE_SIZE;
  return { since: new Date(now - SIGNAL_FEED_DAYS * 86_400_000).toISOString(), from, to: from + SIGNAL_PAGE_SIZE };
}
export const SIGNAL_UNPAGED_MAX = 5000;
