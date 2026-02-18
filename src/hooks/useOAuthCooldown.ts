import { useState, useCallback, useEffect } from "react";

const OAUTH_COOLDOWN_KEY = "botvio_oauth_cooldown_until";
const COOLDOWN_MS = 60_000; // 60 seconds

export function useOAuthCooldown() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Check localStorage for active cooldown
  useEffect(() => {
    const tick = () => {
      const until = localStorage.getItem(OAUTH_COOLDOWN_KEY);
      if (!until) {
        setCooldownRemaining(0);
        return;
      }
      const remaining = Math.max(0, Math.ceil((parseInt(until, 10) - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        localStorage.removeItem(OAUTH_COOLDOWN_KEY);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const startOAuth = useCallback(() => {
    setIsConnecting(true);
    // Set cooldown to prevent rapid re-clicks
    localStorage.setItem(OAUTH_COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
    setCooldownRemaining(Math.ceil(COOLDOWN_MS / 1000));
  }, []);

  const clearConnecting = useCallback(() => {
    setIsConnecting(false);
  }, []);

  const clearCooldown = useCallback(() => {
    localStorage.removeItem(OAUTH_COOLDOWN_KEY);
    setCooldownRemaining(0);
    setIsConnecting(false);
  }, []);

  return {
    cooldownRemaining,
    isConnecting,
    canConnect: !isConnecting && cooldownRemaining <= 0,
    startOAuth,
    clearConnecting,
    clearCooldown,
  };
}
