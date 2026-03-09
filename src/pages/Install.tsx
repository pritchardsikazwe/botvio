import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Apple,
  Chrome,
  Share,
  Plus,
  Check,
  ArrowLeft,
  Bot,
  Wifi,
  WifiOff,
  Zap
} from "lucide-react";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));
    setIsDesktop(!(/iPad|iPhone|iPod|Android/.test(ua)));

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, text: "Instant app loading" },
    { icon: WifiOff, text: "Works offline" },
    { icon: Smartphone, text: "Home screen access" },
    { icon: Monitor, text: "Full-screen experience" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Install Botvio App" description="Install Botvio as a progressive web app on your phone or desktop. Get instant access to free forex signals, AI chart analysis, gold trading tools, and real-time market alerts — even offline." />
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Botvio</span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Hero */}
          <div className="mb-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center mx-auto mb-6">
              <Download className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Install Botvio App
            </h1>
            <p className="text-lg text-muted-foreground">
              Get the full app experience on your device
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            {features.map((feature, i) => (
              <div key={i} className="glass-card p-4 rounded-xl flex items-center gap-3">
                <feature.icon className="h-5 w-5 text-primary" />
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Install Status */}
          {isInstalled ? (
            <Card className="glass-card border-success/30 mb-8">
              <CardContent className="py-8">
                <div className="flex items-center justify-center gap-3 text-success">
                  <Check className="h-8 w-8" />
                  <span className="text-xl font-semibold">App Installed!</span>
                </div>
                <p className="text-muted-foreground mt-2">
                  You can now access Botvio from your home screen
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Direct Install Button (Chrome/Edge) */}
              {deferredPrompt && (
                <Button size="lg" variant="gold" onClick={handleInstall} className="w-full mb-8 text-lg py-6">
                  <Download className="h-5 w-5 mr-2" />
                  Install Botvio App
                </Button>
              )}

              {/* Platform-specific instructions */}
              {isIOS && (
                <Card className="glass-card mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Apple className="h-5 w-5" />
                      Install on iPhone/iPad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-left">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">1</div>
                      <div>
                        <p className="font-medium">Tap the Share button</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Look for the <Share className="h-4 w-4" /> icon in Safari
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">2</div>
                      <div>
                        <p className="font-medium">Tap "Add to Home Screen"</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Look for the <Plus className="h-4 w-4" /> icon
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">3</div>
                      <div>
                        <p className="font-medium">Tap "Add" to confirm</p>
                        <p className="text-sm text-muted-foreground">
                          Botvio will appear on your home screen
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isAndroid && !deferredPrompt && (
                <Card className="glass-card mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Install on Android
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-left">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">1</div>
                      <div>
                        <p className="font-medium">Open in Chrome browser</p>
                        <p className="text-sm text-muted-foreground">
                          Make sure you're using Chrome or Edge
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">2</div>
                      <div>
                        <p className="font-medium">Tap the menu (⋮)</p>
                        <p className="text-sm text-muted-foreground">
                          Top-right corner of the browser
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">3</div>
                      <div>
                        <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                        <p className="text-sm text-muted-foreground">
                          Follow the prompts to install
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isDesktop && !deferredPrompt && (
                <Card className="glass-card mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Install on Desktop
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-left">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">1</div>
                      <div>
                        <p className="font-medium">Use Chrome or Edge browser</p>
                        <p className="text-sm text-muted-foreground">
                          PWA installation works best on these browsers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">2</div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          Look for the install icon <Download className="h-4 w-4" />
                        </p>
                        <p className="text-sm text-muted-foreground">
                          In the address bar (right side)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">3</div>
                      <div>
                        <p className="font-medium">Click "Install"</p>
                        <p className="text-sm text-muted-foreground">
                          The app will open in its own window
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Continue to App */}
          <Button variant="outline" size="lg" asChild className="w-full">
            <Link to="/dashboard">
              Continue to Web App
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Install;
