import { useState, useCallback, useEffect, useRef } from "react";

const OAUTH_COOLDOWN_KEY = "botvio_oauth_cooldown_until";
const LOGIN_SESSION_KEY = "botvio_deriv_session_loginid";
const COOLDOWN_MS = 60_000; // 60 seconds

/**
 * Serialized OAuth login state:
 *  - mutex (only one login at a time)
 *  - 60-second cooldown after any attempt
 *  - session reuse detection
 */
export function useOAuthCooldown() {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const loginInProgressRef = useRef(false);
  const [loginInProgress, setLoginInProgress] = useState(false);

  // Tick cooldown from localStorage
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

  /** Returns true if login can proceed; false means blocked. */
  const canLogin = !loginInProgress && cooldownRemaining <= 0;

  /** Try to acquire the login mutex. Returns false if blocked. */
  const acquireLogin = useCallback((): boolean => {
    if (loginInProgressRef.current) {
      console.log("[LOGIN BLOCKED] Login already in progress");
      return false;
    }
    if (cooldownRemaining > 0) {
      console.log(`[LOGIN BLOCKED] Cooldown active: ${cooldownRemaining}s remaining`);
      return false;
    }
    loginInProgressRef.current = true;
    setLoginInProgress(true);
    console.log("[LOGIN START] OAuth login initiated");

    // Set 60-second cooldown immediately
    localStorage.setItem(OAUTH_COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
    setCooldownRemaining(Math.ceil(COOLDOWN_MS / 1000));
    return true;
  }, [cooldownRemaining]);

  /** Mark login as completed (success or failure). */
  const releaseLogin = useCallback((success: boolean) => {
    loginInProgressRef.current = false;
    setLoginInProgress(false);
    if (success) {
      console.log("[LOGIN SUCCESS] OAuth login completed");
    } else {
      // On failure, clear cooldown so user can retry immediately
      localStorage.removeItem(OAUTH_COOLDOWN_KEY);
      setCooldownRemaining(0);
      console.log("[LOGIN BLOCKED] OAuth login failed, cooldown cleared for retry");
    }
  }, []);

  /** Force-clear everything (e.g. on successful callback). */
  const clearAll = useCallback(() => {
    loginInProgressRef.current = false;
    setLoginInProgress(false);
    localStorage.removeItem(OAUTH_COOLDOWN_KEY);
    setCooldownRemaining(0);
  }, []);

  /** Check if we have a stored session that can be reused. */
  const getStoredSession = useCallback((): string | null => {
    return localStorage.getItem(LOGIN_SESSION_KEY);
  }, []);

  /** Store session loginid after successful login. */
  const setStoredSession = useCallback((loginid: string) => {
    localStorage.setItem(LOGIN_SESSION_KEY, loginid);
  }, []);

  /** Clear stored session on disconnect. */
  const clearStoredSession = useCallback(() => {
    localStorage.removeItem(LOGIN_SESSION_KEY);
  }, []);

  return {
    cooldownRemaining,
    loginInProgress,
    canLogin,
    acquireLogin,
    releaseLogin,
    clearAll,
    getStoredSession,
    setStoredSession,
    clearStoredSession,
  };
}
