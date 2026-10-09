import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DerivDiagnosticsPanel } from "@/components/trading/DerivDiagnosticsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, User, Bell, Shield, Globe, Wallet, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    display_name: "",
    email: "",
    country: "",
    language: "en",
    whatsapp_number: ""
  });
  
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    default_pair: "XAUUSD",
    default_timeframe: "M5",
    risk_per_trade: 1.0
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({
        display_name: profileData.display_name || "",
        email: profileData.email || user.email || "",
        country: profileData.country || "",
        language: profileData.language || "en",
        whatsapp_number: profileData.whatsapp_number || ""
      });
    }

    // Fetch settings
    const { data: settingsData } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsData) {
      setSettings({
        notifications_enabled: settingsData.notifications_enabled ?? true,
        default_pair: settingsData.default_pair || "XAUUSD",
        default_timeframe: settingsData.default_timeframe || "M5",
        risk_per_trade: Number(settingsData.risk_per_trade) || 1.0
      });
    }

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        country: profile.country,
        language: profile.language,
        whatsapp_number: profile.whatsapp_number.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved successfully");
    }
    setSaving(false);
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("user_settings")
      .update({
        notifications_enabled: settings.notifications_enabled,
        default_pair: settings.default_pair,
        default_timeframe: settings.default_timeframe,
        risk_per_trade: settings.risk_per_trade,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved successfully");
    }
    setSaving(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Connected Trading Accounts
                </CardTitle>
                <CardDescription>
                  Manage Deriv connections, MT5 Provider/Follower accounts, and the Weltrade SyntX data connection from the trading control center.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/connections">Manage connected accounts <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/dashboard">Open trading dashboard</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/my-products">View subscriptions</Link>
                </Button>
              </CardContent>
            </Card>
            {/* Profile Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={profile.country} onValueChange={(v) => setProfile({ ...profile, country: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZM">Zambia</SelectItem>
                        <SelectItem value="KE">Kenya</SelectItem>
                        <SelectItem value="NG">Nigeria</SelectItem>
                        <SelectItem value="ZA">South Africa</SelectItem>
                        <SelectItem value="GH">Ghana</SelectItem>
                        <SelectItem value="TZ">Tanzania</SelectItem>
                        <SelectItem value="UG">Uganda</SelectItem>
                        <SelectItem value="RW">Rwanda</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={profile.language} onValueChange={(v) => setProfile({ ...profile, language: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">WhatsApp Number <span className="text-destructive">*</span></Label>
                  <Input
                    id="whatsapp_number"
                    type="tel"
                    value={profile.whatsapp_number}
                    onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                    placeholder="+260 97 1234567"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Required for Botvio account communications and support.</p>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>

            {/* Trading Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Trading Preferences
                </CardTitle>
                <CardDescription>Default trading settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_pair">Default Trading Pair</Label>
                    <Select value={settings.default_pair} onValueChange={(v) => setSettings({ ...settings, default_pair: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XAUUSD">Gold (XAUUSD)</SelectItem>
                        <SelectItem value="EURUSD">EUR/USD</SelectItem>
                        <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                        <SelectItem value="R_100">Volatility 100</SelectItem>
                        <SelectItem value="R_50">Volatility 50</SelectItem>
                        <SelectItem value="BOOM_500">Boom 500</SelectItem>
                        <SelectItem value="CRASH_500">Crash 500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_timeframe">Default Timeframe</Label>
                    <Select value={settings.default_timeframe} onValueChange={(v) => setSettings({ ...settings, default_timeframe: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M1">1 Minute</SelectItem>
                        <SelectItem value="M5">5 Minutes</SelectItem>
                        <SelectItem value="M15">15 Minutes</SelectItem>
                        <SelectItem value="H1">1 Hour</SelectItem>
                        <SelectItem value="H4">4 Hours</SelectItem>
                        <SelectItem value="D1">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk_per_trade">Risk Per Trade (%)</Label>
                  <Input
                    id="risk_per_trade"
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.risk_per_trade}
                    onChange={(e) => setSettings({ ...settings, risk_per_trade: parseFloat(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-muted-foreground">Percentage of your balance to risk per trade (0.1% - 10%)</p>
                </div>
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? "Saving..." : "Save Trading Settings"}
                </Button>
              </CardContent>
            </Card>

            {/* Deriv Connection Diagnostics */}
            <DerivDiagnosticsPanel />

            {/* Notification Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Manage notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive alerts for signals, trades, and account updates</p>
                  </div>
                  <Switch
                    checked={settings.notifications_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifications_enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium mb-1">Password</p>
                  <p className="text-sm text-muted-foreground mb-3">Change your account password</p>
                  <Button variant="outline" size="sm" disabled>
                    Change Password (Coming Soon)
                  </Button>
                </div>
                <Separator />
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="font-medium text-destructive mb-1">Danger Zone</p>
                  <p className="text-sm text-muted-foreground mb-3">Delete your account and all associated data</p>
                  <Button variant="destructive" size="sm" disabled>
                    Delete Account (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
