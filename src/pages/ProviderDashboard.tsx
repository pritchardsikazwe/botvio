import { Navigate } from "react-router-dom";

/** Legacy compatibility shim. Provider operations now use the Copy Control Center. */
const ProviderDashboard = () => <Navigate to="/copy-trading/become-provider" replace />;

export default ProviderDashboard;
