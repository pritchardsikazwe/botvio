import { useState, useEffect, useCallback } from "react";

const OAUTH_COOLDOWN_KEY = "botvio_last_oauth_attempt";
const COOLDOWN_SECONDS = 120;

export function useOAuthCooldown() {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check cooldown on mount and update every second
  useEffect(() => {
    const checkCooldown = () => {
      const lastAttempt = localStorage.getItem(OAUTH_COOLDOWN_KEY);
      if (!lastAttempt) {
        setCooldownRemaining(0);
        return;
      }

      const elapsed = (Date.now() - parseInt(lastAttempt, 10)) / 1000;
      const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
      setCooldownRemaining(Math.ceil(remaining));
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const startOAuth = useCallback(() => {
    localStorage.setItem(OAUTH_COOLDOWN_KEY, Date.now().toString());
    setIsConnecting(true);
    setCooldownRemaining(COOLDOWN_SECONDS);
  }, []);

  const clearConnecting = useCallback(() => {
    setIsConnecting(false);
  }, []);

  const canConnect = cooldownRemaining === 0 && !isConnecting;

  return {
    cooldownRemaining,
    isConnecting,
    canConnect,
    startOAuth,
    clearConnecting,
  };
}
