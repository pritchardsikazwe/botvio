import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useHasProductType, useHasEntitlement } from "@/hooks/useEntitlements";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseEnrollmentCards, COURSE_PROGRAMS } from "@/components/courses/CourseEnrollmentCards";
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Shield, 
  ChevronRight,
  AlertTriangle,
  Zap,
  BarChart3,
  LineChart,
  Newspaper,
  Clock,
  Lock,
  Crown
} from "lucide-react";

interface Lesson {
  id: string;
  lesson_number: number;
  title: string;
  slug: string;
  content: string;
  category: string;
}

interface StrategyCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const strategyCategories: StrategyCategory[] = [
  {
    id: "forex-beginner-mentorship",
    name: "Forex Beginner Mentorship",
    description: "Free beginner course — learn forex & crypto basics",
    icon: GraduationCap,
    color: "text-emerald-500",
  },
  {
    id: "forex-strategies-masterclass",
    name: "Forex Strategies Masterclass",
    description: "SMC, Supply & Demand, ICT — $79",
    icon: TrendingUp,
    color: "text-blue-500",
  },
  {
    id: "pro-trading-bootcamp",
    name: "Pro Trading Bootcamp",
    description: "Gold, Indices, Prop Firm Prep — $149",
    icon: Shield,
    color: "text-amber-500",
  },
  {
    id: "botvio-sniper",
    name: "Botvio Sniper",
    description: "Master the XAUUSD sniper strategy with precise entries",
    icon: Target,
    color: "text-primary",
  },
  {
    id: "indices-trading",
    name: "Indices Trading",
    description: "Trade Boom, Crash & Volatility indices on Deriv",
    icon: TrendingUp,
    color: "text-success",
  },
  {
    id: "volatility-index",
    name: "Volatility Index (VIX)",
    description: "VIX 75/50/25 strategies with M & W formations",
    icon: Zap,
    color: "text-warning",
  },
  {
    id: "market-maker",
    name: "Market Maker Method",
    description: "Understand institutional trading & stop hunts",
    icon: BarChart3,
    color: "text-destructive",
  },
  {
    id: "m-and-w",
    name: "M & W Patterns",
    description: "Master reversal patterns for consistent profits",
    icon: LineChart,
    color: "text-primary",
  },
  {
    id: "news-trading",
    name: "News Trading",
    description: "Trade high-impact news events profitably",
    icon: Newspaper,
    color: "text-success",
  },
  {
    id: "nas100",
    name: "NAS100 Strategy",
    description: "NASDAQ trading with rejection patterns",
    icon: TrendingUp,
    color: "text-warning",
  },
  {
    id: "vit-veterans",
    name: "VIT Veterans Strategy",
    description: "Professional volatility index trading",
    icon: Shield,
    color: "text-primary",
  },
];

const lessonIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  "overview": GraduationCap,
  "support-resistance": Target,
  "candles-wicks": TrendingUp,
  "ema-trend": TrendingUp,
  "risk-management": Shield,
  "m-formations": LineChart,
  "w-formations": LineChart,
  "rejections": Zap,
  "news-events": Newspaper,
  "stop-hunts": BarChart3,
};

const Learn = () => {
  const { user } = useAuth();
  const ownsCourse = useHasProductType("course");
  // Check access for premium mentorship courses
  const isPaidCategory = (cat: string) => COURSE_PROGRAMS.some(p => p.category === cat);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const FREE_LESSON_LIMIT = 2;
  const FREE_COURSE_PREVIEW_LIMIT = 3;
  
  const activeCategory = searchParams.get("category") || "botvio-sniper";

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("education_lessons")
        .select("*")
        .eq("category", activeCategory)
        .order("lesson_number", { ascending: true });

      if (!error && data) {
        setLessons(data);
      }
      setLoading(false);
    };

    fetchLessons();
  }, [activeCategory]);

  const handleCategoryChange = (category: string) => {
    setSearchParams({ category });
  };

  const activeCategoryInfo = strategyCategories.find(c => c.id === activeCategory);
  const CategoryIcon = activeCategoryInfo?.icon || GraduationCap;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Learn Trading" description="Free trading courses and strategies for beginners and advanced traders" />
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="glass-card p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
          <div className="relative z-10">
            <Badge variant="outline" className="mb-4 border-primary text-primary">
              <GraduationCap className="w-3 h-3 mr-1" />
              Botvio Trading Academy
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Master Multiple Trading Strategies
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mb-6">
              Learn proven strategies for Forex, Indices, Volatility, and more. 
              From beginner concepts to advanced techniques used by professionals.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>{strategyCategories.length} Strategy Courses</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-success" />
                <span>All Skill Levels</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-warning" />
                <span>Learn at Your Pace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl mb-8">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="font-semibold text-warning">Risk Disclaimer</p>
            <p className="text-sm text-muted-foreground">
              Trading involves substantial risk of loss. Past performance is not indicative of future results. 
              Only trade with money you can afford to lose. Practice on a demo account first.
            </p>
          </div>
        </div>

        {/* Mentorship & Paid Courses */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-warning" />
            Premium Mentorship Programs
          </h2>
          <CourseEnrollmentCards onEnroll={(cat) => handleCategoryChange(cat)} />
        </div>

        {/* Strategy Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Choose a Strategy</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {strategyCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-all ${
                    isActive 
                      ? 'border-primary bg-primary/5' 
                      : 'glass-card hover:border-primary/50'
                  }`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Active Category Info */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center`}>
              <CategoryIcon className={`w-6 h-6 ${activeCategoryInfo?.color || 'text-primary'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{activeCategoryInfo?.name || 'Strategy'}</h2>
              <p className="text-sm text-muted-foreground">{activeCategoryInfo?.description}</p>
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-secondary rounded w-3/4" />
                  <div className="h-4 bg-secondary/50 rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))
          ) : lessons.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">
                Lessons for {activeCategoryInfo?.name} are being prepared. Check back soon!
              </p>
            </div>
          ) : (
            lessons.map((lesson, index) => {
              const Icon = lessonIcons[lesson.slug] || BookOpen;
              // For paid mentorship courses, check specific product entitlement
              const paidCourse = COURSE_PROGRAMS.find(p => p.category === activeCategory);
              // Free courses (like Forex Beginner Mentorship) are always fully unlocked
              const isFreeCategory = paidCourse?.isFree === true;
              const isLocked = isFreeCategory
                ? false
                : paidCourse
                  ? index >= FREE_LESSON_LIMIT && !ownsCourse
                  : !ownsCourse && index >= FREE_LESSON_LIMIT;
              return (
                <Card 
                  key={lesson.id} 
                  className={`glass-card transition-all group ${isLocked ? 'opacity-60' : 'hover:border-primary/50 cursor-pointer'}`}
                  onClick={() => !isLocked && navigate(`/learn/${lesson.slug}?category=${activeCategory}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        {isLocked ? <Lock className="w-6 h-6 text-muted-foreground" /> : <Icon className="w-6 h-6 text-primary" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Lesson {lesson.lesson_number}
                        </Badge>
                        {isLocked && (
                          <Badge variant="outline" className="border-warning text-warning">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className={`text-lg ${!isLocked ? 'group-hover:text-primary' : ''} transition-colors`}>
                      {lesson.title}
                    </CardTitle>
                    <CardDescription>
                      {isLocked ? "Upgrade to a paid plan to access this lesson" : lesson.content.substring(0, 100).replace(/[#*`]/g, '') + '...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLocked ? (
                      <Button variant="gold" className="w-full" asChild>
                        <a href="/marketplace">
                          <Crown className="w-4 h-4 mr-2" />
                          Buy Course to Unlock
                        </a>
                      </Button>
                    ) : (
                      <Button variant="ghost" className="w-full justify-between group-hover:text-primary">
                        Start Learning
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {!ownsCourse && lessons.length > FREE_LESSON_LIMIT && (
          <Card className="glass-card border-warning/30 mt-6">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-warning" />
                <span className="text-sm">Purchase a course to unlock all lessons</span>
              </div>
              <Button variant="gold" size="sm" asChild>
                <a href="/marketplace">Browse Courses</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Start Guide */}
        <div className="mt-12 glass-card p-8">
          <h2 className="text-2xl font-bold mb-6">Trading Process – Quick Guide</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { step: 1, title: "Learn Strategy", desc: "Study the complete course" },
              { step: 2, title: "Demo Practice", desc: "Test on demo account first" },
              { step: 3, title: "Find Setup", desc: "Wait for valid signals" },
              { step: 4, title: "Risk Management", desc: "Set proper SL and position size" },
              { step: 5, title: "Execute Trade", desc: "Enter and manage the trade" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">{step}</span>
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Affiliate Partner Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="border-primary text-primary">
                  Recommended Broker
                </Badge>
              </div>
              <h3 className="text-xl font-bold mb-2">Trade on Deriv</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Practice what you learn with Deriv's synthetic indices. Trade Boom, Crash, 
                Volatility indices 24/7 with stakes as low as $0.35!
              </p>
              <ul className="space-y-2 text-sm mb-4">
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-success" />
                  Perfect for Botvio Sniper & VIX strategies
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Boom/Crash indices for spike trading
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  Free demo account with $10,000 virtual funds
                </li>
              </ul>
              <a
                href="https://track.deriv.com/_h8e_odrKXNCTjSHedV4mENd7ZgqdRLk/1/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="gold" className="w-full">
                  Open Deriv Account
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="glass-card border-success/30 bg-gradient-to-br from-success/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="border-success text-success">
                  Forex & CFDs
                </Badge>
              </div>
              <h3 className="text-xl font-bold mb-2">Trade on Exness</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For Forex pairs and NAS100 trading. Ultra-tight spreads, instant withdrawals, 
                and professional-grade execution!
              </p>
              <ul className="space-y-2 text-sm mb-4">
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-success" />
                  Best for XAUUSD & News Trading strategies
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  NAS100 with tight spreads
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  Instant deposits & withdrawals
                </li>
              </ul>
              <a
                href="https://one.exnesstrack.org/a/up2tpvqknx"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-success hover:bg-success/90">
                  Open Exness Account
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Learn;
