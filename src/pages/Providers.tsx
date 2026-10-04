import { Navigate } from "react-router-dom";

/**
 * Legacy route kept as a safe compatibility shim.
 * The old Providers page used copy_subscriptions and the retired provider
 * execution flow. All new provider discovery/copying now lives in Botvio Copy.
 */
const Providers = () => <Navigate to="/copy-trading" replace />;

export default Providers;
