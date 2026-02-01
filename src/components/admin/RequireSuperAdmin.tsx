import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX, Loader2 } from "lucide-react";

interface RequireSuperAdminProps {
  children: React.ReactNode;
}

export const RequireSuperAdmin = ({ children }: RequireSuperAdminProps) => {
  const { user, loading: authLoading, rolesLoading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth and roles to load
    if (authLoading || rolesLoading) return;

    // Not logged in - redirect to home (which has login)
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    // Not super admin - redirect to dashboard
    if (!isSuperAdmin) {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, authLoading, rolesLoading, isSuperAdmin, navigate]);

  // Show loading state while checking auth
  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authorized
  if (!user || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center">
              You do not have permission to access this area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
