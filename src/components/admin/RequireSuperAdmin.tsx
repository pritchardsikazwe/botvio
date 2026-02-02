import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX, Loader2, AlertTriangle, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RequireSuperAdminProps {
  children: React.ReactNode;
}

export const RequireSuperAdmin = ({ children }: RequireSuperAdminProps) => {
  const { user, loading: authLoading, rolesLoading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth and roles to load
    if (authLoading || rolesLoading) return;

    // Mark that we've finished the check
    setHasChecked(true);

    // Not logged in - redirect to admin login
    if (!user) {
      navigate("/admin/login", { replace: true });
      return;
    }
  }, [user, authLoading, rolesLoading, navigate]);

  // Show loading state while checking auth
  if (authLoading || rolesLoading || !hasChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not super admin - show access denied
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center mb-4">
              You do not have super admin privileges to access this area.
            </p>
            <Alert className="mb-4">
              <AlertDescription>
                Logged in as: {user.email}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is super admin - render children
  return <>{children}</>;
};
