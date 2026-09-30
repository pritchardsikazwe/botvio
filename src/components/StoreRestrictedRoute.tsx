import { Navigate } from "react-router-dom";
import { isRestrictedOnStore } from "@/lib/mobile";

export function StoreRestrictedRoute({ children }: { children: React.ReactNode }) {
  if (isRestrictedOnStore(window.location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
