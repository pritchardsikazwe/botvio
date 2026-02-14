import { useState, useCallback } from "react";

// No cooldown timer — direct OAuth redirect
export function useOAuthCooldown() {
  const [isConnecting, setIsConnecting] = useState(false);

  const startOAuth = useCallback(() => {
    setIsConnecting(true);
  }, []);

  const clearConnecting = useCallback(() => {
    setIsConnecting(false);
  }, []);

  return {
    cooldownRemaining: 0,
    isConnecting,
    canConnect: !isConnecting,
    startOAuth,
    clearConnecting,
  };
}
