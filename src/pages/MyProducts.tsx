import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, Signal, GraduationCap, Package, Zap, 
  Check, Clock, XCircle, ShoppingCart
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const productDestination = (slug?: string) => {
  switch (slug) {
    case "synthetic-hub": return "/synthetic-hub";
    case "weltrade-hub": return "/weltrade";
    case "mt5-direct":
    case "mt5-direct-signals": return "/connections";
    case "botvio-gold-robot": return "/apps/gold-robot";
    case "botvio-synthetic-robot": return "/apps/synthetic-robot";
    case "botvio-ai-robot":
    case "botvio-robot": return "/dashboard";
    default: return "/marketplace";
  }
};

const MyProducts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: entitlements, isLoading } = useEntitlements();
  const [tab, setTab] = useState("all");

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const filtered = tab === "all"
    ? entitlements
    : entitlements?.filter((e) => e.products?.type === tab);

  const getIcon = (type?: string) => {
    switch (type) {
      case "bot": return <Bot className="h-5 w-5" />;
      case "signal_pack": return <Signal className="h-5 w-5" />;
      case "course": return <GraduationCap className="h-5 w-5" />;
      case "strategy": return <Zap className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground"><Check className="h-3 w-3 mr-1" />Active</Badge>;
      case "expired":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
      case "canceled":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Products</h1>
            <p className="text-muted-foreground">
              All your purchased bots, signal subscriptions, and courses
            </p>
          </div>
          <Button onClick={() => navigate("/marketplace")}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Browse Marketplace
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({entitlements?.length || 0})</TabsTrigger>
            <TabsTrigger value="bot">Bots</TabsTrigger>
            <TabsTrigger value="signal_pack">Signals</TabsTrigger>
            <TabsTrigger value="course">Courses</TabsTrigger>
            <TabsTrigger value="strategy">Strategies</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((ent) => (
              <Link key={ent.id} to={productDestination(ent.products?.slug)} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Card className="glass-card transition-colors hover:border-primary/40">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {getIcon(ent.products?.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{ent.products?.name || "Unknown Product"}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {ent.products?.type?.replace("_", " ")} • 
                          {ent.products?.billing_type === "recurring" ? " Subscription" : " One-time"} • 
                          Since {new Date(ent.started_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {ent.ends_at && (
                        <span className="text-xs text-muted-foreground">
                          Expires {new Date(ent.ends_at).toLocaleDateString()}
                        </span>
                      )}
                      {statusBadge(ent.status)}
                    </div>
                  </div>
                </CardContent>
              </Card></Link>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-4">
                Visit the marketplace to browse and purchase trading tools
              </p>
              <Button onClick={() => navigate("/marketplace")}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Go to Marketplace
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MyProducts;
