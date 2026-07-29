import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot, Settings, User, LogOut, GraduationCap, LayoutDashboard, Wallet, Users, CreditCard, Shield, ArrowLeftRight, Gift, MessageCircle, Send, Signal, ChevronDown, BarChart3, Menu, Zap, ShoppingCart, Package, Download, ScanSearch, TrendingUp } from "lucide-react";
import { TradesDrawer } from "@/components/trading/TradesDrawer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useDeriv } from "@/contexts/DerivContext";
import { AuthModal } from "@/components/auth/AuthModal";
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

export const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { isDerivConnected, accountInfo, balance, equity, runningTrades } = useDeriv();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
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
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg gold-text block">BOTVIO</span>
                <p className="text-[10px] text-muted-foreground">powered by Deriv</p>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              <Button 
                variant={location.pathname === '/' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/')}
              >
                Home
              </Button>

              <Button 
                variant={location.pathname === '/signals' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/signals')}
              >
                <Signal className="w-4 h-4 mr-1" />
                Signals
              </Button>
              
              <Button 
                variant={location.pathname === '/blog' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/blog')}
              >
                Blog
              </Button>

              <Button
                variant={location.pathname === '/market-analysis' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/market-analysis')}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Analysis
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={['/gold','/silver','/bitcoin','/us30','/nas100','/ger40'].includes(location.pathname) ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Hubs
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 glass-card">
                  <DropdownMenuLabel>Trading Hubs</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/gold')}>Gold (XAU/USD)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/silver')}>Silver (XAG/USD)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/bitcoin')}>Bitcoin (BTC/USD)</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/us30')}>
                    <span style={{ color: '#3b82f6' }}>● </span>US30 (Dow)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/nas100')}>
                    <span style={{ color: '#8b5cf6' }}>● </span>NAS100 (Nasdaq)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/ger40')}>
                    <span style={{ color: '#f97316' }}>● </span>GER40 (DAX)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {!user && (
                <Button 
                  variant={location.pathname === '/authority-signals' ? 'secondary' : 'ghost'} 
                  size="sm"
                  onClick={() => navigate('/authority-signals')}
                >
                  <ScanSearch className="w-4 h-4 mr-1" />
                  AI Analysis
                </Button>
              )}

              <Button 
                variant={location.pathname.startsWith('/learn') ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/learn')}
              >
                <GraduationCap className="w-4 h-4 mr-1" />
                Learn
              </Button>

              <Button
                variant={location.pathname.startsWith('/learning-paths') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/learning-paths')}
              >
                Start Here
              </Button>

              {user && (
                <>
                  <Button 
                    variant={location.pathname.startsWith('/bots/binance') || location.pathname === '/settings/binance' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => navigate('/bots/binance')}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Binance
                  </Button>
                </>
              )}

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="w-4 h-4 mr-1" />
                      More
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 glass-card">
                    <DropdownMenuLabel>Tools & Features</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/my-products')}>
                      <Package className="w-4 h-4 mr-2" />
                      My Products
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/accounts')}>
                      <Wallet className="w-4 h-4 mr-2" />
                      Trading Accounts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/connections')}>
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      Broker Connections / MT5 Bridge
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/bridge-request')}>
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      Request Managed MT5 Bridge
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/sports-betting')}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Sports Betting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/strategies')}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Strategies
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Trade History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/p2p')}>
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      P2P Trading
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/affiliate')}>
                      <Gift className="w-4 h-4 mr-2" />
                      Affiliate Program
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Content & Resources</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigate('/faq')}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      FAQ
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/testimonials')}>
                      <Users className="w-4 h-4 mr-2" />
                      Testimonials
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/press')}>
                      <Send className="w-4 h-4 mr-2" />
                      Press
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/docs')}>
                          <GraduationCap className="w-4 h-4 mr-2" />
                          Documentation
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/whitepaper')}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Whitepaper
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/case-studies')}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Case Studies
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/billing')}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing & Plans
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            {/* Mobile Navigation */}
            <nav className="lg:hidden flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="Open navigation menu">
                      <Menu className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 glass-card">
                    <DropdownMenuItem onClick={() => navigate('/')}>
                      Home
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/signals')}>
                      <Signal className="w-4 h-4 mr-2" />
                      Signals
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/marketplace')}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Marketplace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/blog')}>
                      Blog
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/market-analysis')}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Market Analysis
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Trading Hubs</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigate('/gold')}>Gold (XAU/USD)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/silver')}>Silver (XAG/USD)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/bitcoin')}>Bitcoin (BTC/USD)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/us30')}>US30 (Dow)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/nas100')}>NAS100 (Nasdaq)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/ger40')}>GER40 (DAX)</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/authority-signals')}>
                      <ScanSearch className="w-4 h-4 mr-2" />
                      AI Analysis
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/learn')}>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Learn
                    </DropdownMenuItem>
                    {user && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/bots')}>
                          <Bot className="w-4 h-4 mr-2" />
                          Trading Bots
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/accounts')}>
                          <Wallet className="w-4 h-4 mr-2" />
                          Accounts
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/strategies')}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Strategies
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/bots/binance')}>
                          <Zap className="w-4 h-4 mr-2" />
                          Binance Bots
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/install')}>
                          <Download className="w-4 h-4 mr-2" />
                          Install App
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Resources</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate('/faq')}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          FAQ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/testimonials')}>
                          Testimonials
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/press')}>
                          Press
                        </DropdownMenuItem>
                      </>
                    )}
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
              <Button variant="gold" size="sm" onClick={() => setShowAuthModal(true)}>
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
};