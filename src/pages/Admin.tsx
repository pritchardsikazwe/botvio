import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Shield, 
  Users, 
  UserCheck, 
  UserX,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Bot,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Provider {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  status: string;
  verified: boolean;
  created_at: string;
  total_subscribers: number;
  total_trades: number;
  win_rate: number;
}

interface UserSubscription {
  id: string;
  user_id: string;
  status: string;
  pricing_plan_id: string;
  current_period_start: string | null;
  current_period_end: string | null;
  pricing_plans: {
    name: string;
    code: string;
  } | null;
  profiles: {
    email: string | null;
    display_name: string | null;
  } | null;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [stats, setStats] = useState({
    pendingProviders: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    totalBotInstances: 0
  });

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) {
      toast.error("Access denied. Admin privileges required.");
      navigate('/dashboard');
      return;
    }

    setIsAdmin(true);
    await fetchData();
    setLoading(false);
  };

  const fetchData = async () => {
    // Fetch providers
    const { data: providersData } = await supabase
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false });

    if (providersData) {
      setProviders(providersData);
    }

    // Fetch user subscriptions with plan info
    const { data: subsData } = await supabase
      .from("user_plan_subscriptions")
      .select(`
        *,
        pricing_plans (name, code)
      `)
      .order("created_at", { ascending: false });

    if (subsData) {
      // Fetch profiles separately and merge
      const userIds = subsData.map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", userIds);

      const mergedSubs = subsData.map(sub => ({
        ...sub,
        profiles: profilesData?.find(p => p.user_id === sub.user_id) || null
      }));

      setSubscriptions(mergedSubs as UserSubscription[]);
    }

    // Calculate stats
    const pendingCount = providersData?.filter(p => p.status === 'pending').length || 0;
    const activeSubsCount = subsData?.filter(s => s.status === 'active').length || 0;

    const { count: botCount } = await supabase
      .from("bot_instances")
      .select("*", { count: 'exact', head: true });

    setStats({
      pendingProviders: pendingCount,
      totalUsers: subsData?.length || 0,
      activeSubscriptions: activeSubsCount,
      totalBotInstances: botCount || 0
    });
  };

  const updateProviderStatus = async (providerId: string, newStatus: string, verified: boolean = false) => {
    const { error } = await supabase
      .from("providers")
      .update({ status: newStatus, verified })
      .eq("id", providerId);

    if (error) {
      toast.error("Failed to update provider status");
      return;
    }

    toast.success(`Provider ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
    await fetchData();
  };

  const updateUserPlan = async (subscriptionId: string, newPlanCode: string) => {
    // Get the plan ID
    const { data: planData } = await supabase
      .from("pricing_plans")
      .select("id")
      .eq("code", newPlanCode)
      .single();

    if (!planData) {
      toast.error("Plan not found");
      return;
    }

    const { error } = await supabase
      .from("user_plan_subscriptions")
      .update({ pricing_plan_id: planData.id })
      .eq("id", subscriptionId);

    if (error) {
      toast.error("Failed to update subscription");
      return;
    }

    toast.success("Subscription updated successfully");
    await fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-warning text-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-success text-success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage providers, user subscriptions, and platform settings.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Providers</p>
                  <p className="text-2xl font-bold text-warning">{stats.pendingProviders}</p>
                </div>
                <UserCheck className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-success">{stats.activeSubscriptions}</p>
                </div>
                <CreditCard className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bot Instances</p>
                  <p className="text-2xl font-bold">{stats.totalBotInstances}</p>
                </div>
                <Bot className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="glass-card p-1">
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Provider Applications
              {stats.pendingProviders > 0 && (
                <Badge variant="destructive" className="ml-1">{stats.pendingProviders}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              User Subscriptions
            </TabsTrigger>
          </TabsList>

          {/* Providers Tab */}
          <TabsContent value="providers">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Provider Applications</CardTitle>
                <CardDescription>
                  Review and approve/reject provider applications. Approved providers can list in the marketplace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Bio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No provider applications yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      providers.map((provider) => (
                        <TableRow key={provider.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{provider.display_name}</p>
                                {provider.verified && (
                                  <Badge variant="outline" className="text-xs border-success text-success">Verified</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {provider.bio || "No bio provided"}
                          </TableCell>
                          <TableCell>{getStatusBadge(provider.status || 'pending')}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{provider.total_trades} trades</p>
                              <p className="text-muted-foreground">{provider.win_rate}% win rate</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(provider.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {provider.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-success text-success hover:bg-success hover:text-success-foreground"
                                    onClick={() => updateProviderStatus(provider.id, 'approved', true)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => updateProviderStatus(provider.id, 'rejected')}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {provider.status === 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-warning text-warning"
                                  onClick={() => updateProviderStatus(provider.id, 'pending', false)}
                                >
                                  Revoke
                                </Button>
                              )}
                              {provider.status === 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateProviderStatus(provider.id, 'approved', true)}
                                >
                                  Re-approve
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>User Subscriptions</CardTitle>
                <CardDescription>
                  Manage user subscription plans and billing status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Current Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No subscriptions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.profiles?.display_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{sub.profiles?.email || 'No email'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.pricing_plans?.code === 'vip' ? 'default' : 'secondary'}>
                              {sub.pricing_plans?.name || 'Unknown Plan'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.status === 'active' ? 'outline' : 'destructive'} className={sub.status === 'active' ? 'border-success text-success' : ''}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.current_period_start ? (
                              <>
                                {new Date(sub.current_period_start).toLocaleDateString()} - 
                                {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'Ongoing'}
                              </>
                            ) : (
                              'Not set'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserPlan(sub.id, 'starter')}
                                disabled={sub.pricing_plans?.code === 'starter'}
                              >
                                Starter
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserPlan(sub.id, 'pro')}
                                disabled={sub.pricing_plans?.code === 'pro'}
                              >
                                Pro
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateUserPlan(sub.id, 'vip')}
                                disabled={sub.pricing_plans?.code === 'vip'}
                              >
                                VIP
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
