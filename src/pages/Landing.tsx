import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { 
  Bot, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  BarChart3,
  Globe,
  ArrowRight,
  Check,
  Star,
  Play,
  Smartphone,
  Download,
  Signal,
  Wallet,
  ChevronRight,
  MessageCircle,
  Send,
  ExternalLink
} from "lucide-react";

// Affiliate links
const AFFILIATE_LINKS = {
  deriv: "https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827",
  exness: "https://one.exness-track.com/a/ts1kvs1k",
  binance: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0047GJ3KHU",
};

const COMMUNITY_LINKS = {
  whatsapp: "https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ",
  telegram: "https://t.me/+AZjYpDncHEA5OTM0",
};

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Bot,
      title: "AI Trading Bots",
      description: "Deploy pre-built or custom trading bots that execute your strategies 24/7"
    },
    {
      icon: Signal,
      title: "Live Signals",
      description: "Get real-time trading signals for Gold, Synthetic Indices, NASDAQ & Crypto"
    },
    {
      icon: Users,
      title: "Copy Trading",
      description: "Follow expert traders and automatically copy their winning trades"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Built-in daily loss limits, position sizing, and account protection"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track your performance with detailed P&L reports and win rate stats"
    },
    {
      icon: Globe,
      title: "Multi-Broker Support",
      description: "Trade on Deriv, Weltrade, and Exness from a single platform"
    }
  ];

  const brokers = [
    { name: "Deriv", markets: "Synthetic Indices, Forex, Crypto", link: AFFILIATE_LINKS.deriv },
    { name: "Exness", markets: "Forex, Gold, Crypto", link: AFFILIATE_LINKS.exness },
    { name: "Binance", markets: "Spot, Futures, Staking", link: AFFILIATE_LINKS.binance }
  ];

  const stats = [
    { value: "50K+", label: "Active Traders" },
    { value: "24/7", label: "Bot Uptime" },
    { value: "100+", label: "Trading Bots" },
    { value: "$2M+", label: "Monthly Volume" }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
                Botvio
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <Link to="/signals" className="text-muted-foreground hover:text-foreground transition-colors">Signals</Link>
              <Link to="/bots" className="text-muted-foreground hover:text-foreground transition-colors">Bots</Link>
              <Link to="/providers" className="text-muted-foreground hover:text-foreground transition-colors">Copy Trading</Link>
              <Link to="/learn" className="text-muted-foreground hover:text-foreground transition-colors">Learn</Link>
            </div>
            
            <div className="flex items-center gap-3">
              {isInstallable && (
                <Button variant="outline" size="sm" onClick={handleInstall} className="hidden sm:flex">
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
              {user ? (
                <Button variant="gold" onClick={() => navigate('/dashboard')}>
                  Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button variant="gold" onClick={() => setShowAuth(true)}>
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl opacity-50" />
        
        <div className="container mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-2">
              <Zap className="h-3 w-3 mr-2" />
              AI-Powered Trading Platform
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Trade Smarter with
              <span className="block bg-gradient-to-r from-primary via-amber-400 to-amber-500 bg-clip-text text-transparent">
                Botvio Bots
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Automate your trading on Deriv, Weltrade & Exness. Deploy AI bots, copy top traders, 
              and receive real-time signals — all from one powerful platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" variant="gold" onClick={() => user ? navigate('/dashboard') : setShowAuth(true)} className="w-full sm:w-auto text-lg px-8 py-6">
                Start Trading Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6" onClick={() => navigate('/signals')}>
                <Play className="h-5 w-5 mr-2" />
                View Live Signals
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="glass-card p-4 rounded-xl">
                  <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supported Brokers */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground mb-6">Trade on leading brokers</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {brokers.map((broker, i) => (
              <a 
                key={i} 
                href={broker.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-center hover:scale-105 transition-transform cursor-pointer"
              >
                <p className="text-xl font-bold">{broker.name}</p>
                <p className="text-xs text-muted-foreground">{broker.markets}</p>
              </a>
            ))}
          </div>
          
          {/* Community Links */}
          <div className="flex justify-center gap-4 mt-8">
            <a href={COMMUNITY_LINKS.whatsapp} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp Group
              </Button>
            </a>
            <a href={COMMUNITY_LINKS.telegram} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Telegram Group
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to
              <span className="text-primary"> Trade Successfully</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From automated bots to expert signals, Botvio provides all the tools 
              you need to profit in the markets.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="glass-card group hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in <span className="text-primary">3 Simple Steps</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Connect Your Broker", desc: "Link your Deriv, Weltrade, or Exness account securely" },
              { step: "2", title: "Choose Your Strategy", desc: "Pick from our bot marketplace or follow top traders" },
              { step: "3", title: "Start Earning", desc: "Let the bots trade for you 24/7 while you relax" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="glass-card border-primary/30 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary/20">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Install Botvio App</h3>
                    <p className="text-muted-foreground">
                      Get instant access on mobile & desktop. Works offline!
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {isInstallable ? (
                    <Button size="lg" variant="gold" onClick={handleInstall}>
                      <Download className="h-5 w-5 mr-2" />
                      Install Now
                    </Button>
                  ) : (
                    <Button size="lg" variant="gold" asChild>
                      <Link to="/install">
                        <Download className="h-5 w-5 mr-2" />
                        Get the App
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Automate Your Trading?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of traders using Botvio to grow their accounts on autopilot.
          </p>
          <Button size="lg" variant="gold" onClick={() => user ? navigate('/dashboard') : setShowAuth(true)} className="text-lg px-12 py-6">
            Get Started Free
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">Botvio</span>
              <span className="text-xs text-muted-foreground ml-2">powered by Deriv</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/signals" className="hover:text-foreground">Signals</Link>
              <Link to="/bots" className="hover:text-foreground">Bots</Link>
              <Link to="/providers" className="hover:text-foreground">Copy Trading</Link>
              <Link to="/learn" className="hover:text-foreground">Learn</Link>
              <Link to="/affiliate" className="hover:text-foreground">Affiliate</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Botvio. All rights reserved.
            </p>
          </div>
          
          {/* Deriv Disclaimer */}
          <div className="border-t border-border/50 pt-6">
            <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto mb-4">
              <strong>Risk Warning:</strong> Trading binary options and CFDs on Synthetic Indices, Forex, and Commodities involves significant risk of loss and may not be suitable for all investors. Past performance is not indicative of future results. You should never trade with money you cannot afford to lose.
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto mb-4">
              Botvio is an independent third-party platform powered by Deriv API. Botvio is not affiliated with, endorsed by, or sponsored by Deriv. Deriv is a registered trademark of Deriv Holdings Limited.
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto">
              The information on this platform does not constitute investment advice, financial advice, trading advice, or any other sort of advice. You should conduct your own research before making any investment decisions.
            </p>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Landing;
