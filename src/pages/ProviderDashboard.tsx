import { Navigate } from "react-router-dom";

/**
 * Legacy provider dashboard compatibility shim.
 * The retired dashboard executed trades directly through the old provider
 * execution/copy stack. Provider operations now use ProviderCommandCenter,
 * MT5 TradeCopy and the isolated Deriv Options copy route.
 */
const ProviderDashboard = () => <Navigate to="/provider-dashboard" replace />;

export default ProviderDashboard;
