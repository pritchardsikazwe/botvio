
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bot, Settings, User, LogOut, GraduationCap, LayoutDashboard, Wallet, Users, CreditCard, Shield, ArrowLeftRight, Gift, MessageCircle, Send, Signal, ChevronDown, BarChart3, Menu, Zap, ShoppingCart, Package, Download, ScanSearch, TrendingUp } from "lucide-react";
import { TradesDrawer } from "@/components/trading/TradesDrawer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { useDeriv } from "@/contexts/DerivContext";
import { useState } from "react";

import { NotificationBell } from "@/components/trading/NotificationBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, MORE_NAV } from "@/components/nav/mainNav";


export const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { isDerivConnected, accountInfo, balance, equity, runningTrades } = useDeriv();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-3"
              aria-label="Botvio home"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-background flex items-center justify-center border border-border/50">
                <img
                  src="/botvio-logo.png"
                  alt="Botvio logo"
                  className="w-10 h-10 object-contain"
                  width={40}
                  height={40}
                />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg gold-text block">BOTVIO</span>
                <p className="text-[10px] text-muted-foreground">powered by Deriv</p>
              </div>
            </Link>

            {/* Navigation - Desktop (Botvio information architecture) */}
            <nav className="hidden xl:flex items-center gap-0.5" aria-label="Primary navigation">
              {PRIMARY_NAV.map((group) => {
                const active =
                  (group.to && (location.pathname === group.to || location.pathname.startsWith(`${group.to}/`))) ||
                  group.items?.some((i) => location.pathname === i.to);

                if (!group.items) {
                  return (
                    <Button
                      key={group.label}
                      variant={active ? "secondary" : "ghost"}
                      size="sm"
                      className="px-2.5 text-xs"
                      onClick={() => navigate(group.to!)}
                    >
                      {group.label}
                    </Button>
                  );
                }

                return (
                  <DropdownMenu key={group.label}>
                    <DropdownMenuTrigger asChild>
                      <Button variant={active ? "secondary" : "ghost"} size="sm" className="px-2.5 text-xs">
                        {group.label}
                        <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 glass-card" align="start">
                      <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {group.items.map((item) => (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link to={item.to}>
                            {item.icon && <item.icon className="w-4 h-4 mr-2 text-primary" />}
                            <span className="flex-1">{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2.5 text-xs">
                    <Menu className="w-3.5 h-3.5 mr-1" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 glass-card" align="end">
                  {MORE_NAV.map((group, gi) => (
                    <div key={group.label}>
                      {gi > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                      {group.items.map((item) => (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link to={item.to}>
                            {item.icon && <item.icon className="w-4 h-4 mr-2 text-primary" />}
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                  {user && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>My Botvio</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/accounts')}>
                        <Wallet className="w-4 h-4 mr-2" />
                        Trading Accounts
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/connections')}>
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Broker Connections / MT5 Bridge
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-products')}>
                        <Package className="w-4 h-4 mr-2" />
                        My Products
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Compact navigation - tablet & mobile */}
            <nav className="xl:hidden flex items-center" aria-label="Primary navigation">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Open navigation menu">
                    <Menu className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 glass-card max-h-[80vh] overflow-y-auto">
                  <DropdownMenuItem asChild><Link to="/">Home</Link></DropdownMenuItem>
                  {PRIMARY_NAV.map((group) => (
                    <div key={group.label}>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                      {(group.items ?? [{ label: group.label, to: group.to!, icon: group.icon }]).map((item) => (
                        <DropdownMenuItem key={`${group.label}-${item.to}`} asChild>
                          <Link to={item.to}>
                            {item.icon && <item.icon className="w-4 h-4 mr-2 text-primary" />}
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                  {MORE_NAV.map((group) => (
                    <div key={group.label}>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                      {group.items.map((item) => (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link to={item.to}>
                            {item.icon && <item.icon className="w-4 h-4 mr-2 text-primary" />}
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

          </div>

          <div className="flex items-center gap-2">
            {/* Community Links - visible on desktop */}
            {/* Community links moved to DB-driven partner_links */}
            
            {isDerivConnected && accountInfo ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{
                  backgroundColor: accountInfo.is_virtual ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--success) / 0.1)',
                  borderColor: accountInfo.is_virtual ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--success) / 0.2)',
                }}
              >
                <div className={`w-2 h-2 rounded-full animate-pulse ${accountInfo.is_virtual ? 'bg-primary' : 'bg-success'}`} />
                <span className={`text-xs font-medium ${accountInfo.is_virtual ? 'text-primary' : 'text-success'}`}>
                  {accountInfo.loginid} ({accountInfo.is_virtual ? 'DEMO' : 'REAL'})
                </span>
                <span className="text-xs text-muted-foreground">
                  {accountInfo.currency} {balance?.balance?.toFixed(2)}
                </span>
                {runningTrades.length > 0 && (
                  <span className="text-xs text-warning font-medium" title="Equity = Balance + Running P&L">
                    Eq: {equity.toFixed(2)}
                  </span>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Not Connected</span>
              </div>
            )}
            
            <TradesDrawer />
            <LanguageSwitcher />
            <NotificationBell />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Open account menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {profile?.display_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/accounts')}>
                    <Wallet className="w-4 h-4 mr-2" />
                    Trading Accounts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Trade History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/billing')}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/affiliate')}>
                    <Gift className="w-4 h-4 mr-2" />
                    Affiliate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAuthModal(true)}>Sign In</Button>
                <Button variant="gold" size="sm" onClick={() => navigate("/signup")}>
                  <User className="w-4 h-4 mr-2" /> Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

    <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
};