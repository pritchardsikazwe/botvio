import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot, Settings, User, LogOut, GraduationCap, LayoutDashboard, Wallet, Users, CreditCard, Shield, ArrowLeftRight, Gift, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { NotificationBell } from "@/components/trading/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
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
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg gold-text">BOTVIO</h1>
                <p className="text-[10px] text-muted-foreground">powered by Deriv</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button 
                variant={location.pathname === '/' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/')}
              >
                Signals
              </Button>
              {user && (
                <>
                  <Button 
                    variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    variant={location.pathname === '/bots' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => navigate('/bots')}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    Bots
                  </Button>
                  <Button 
                    variant={location.pathname === '/providers' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => navigate('/providers')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Copy Trade
                  </Button>
                  <Button 
                    variant={location.pathname === '/p2p' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => navigate('/p2p')}
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    P2P
                  </Button>
                  <Button 
                    variant={location.pathname === '/affiliate' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => navigate('/affiliate')}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Affiliate
                  </Button>
                </>
              )}
              <Button 
                variant={location.pathname.startsWith('/learn') ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/learn')}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Learn
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Community Links - visible on desktop */}
            <div className="hidden lg:flex items-center gap-1">
              <a href="https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </a>
              <a href="https://t.me/+AZjYpDncHEA5OTM0" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Send className="h-4 w-4" />
                </Button>
              </a>
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-success">Live</span>
            </div>
            
            <NotificationBell />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
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
                  <DropdownMenuItem onClick={() => navigate('/provider-dashboard')}>
                    <Users className="w-4 h-4 mr-2" />
                    Provider Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/billing')}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/learn')}>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Learn Strategy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/affiliate')}>
                    <Gift className="w-4 h-4 mr-2" />
                    Affiliate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
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
