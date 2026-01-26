import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Shield, 
  ChevronRight,
  AlertTriangle
} from "lucide-react";

interface Lesson {
  id: string;
  lesson_number: number;
  title: string;
  slug: string;
  content: string;
  category: string;
}

const lessonIcons: { [key: string]: any } = {
  "overview": GraduationCap,
  "support-resistance": Target,
  "candles-wicks": TrendingUp,
  "ema-trend": TrendingUp,
  "risk-management": Shield,
};

const Learn = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from("education_lessons")
        .select("*")
        .eq("category", "hauza-sniper")
        .order("lesson_number", { ascending: true });

      if (!error && data) {
        setLessons(data);
      }
      setLoading(false);
    };

    fetchLessons();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="glass-card p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
          <div className="relative z-10">
            <Badge variant="outline" className="mb-4 border-primary text-primary">
              <GraduationCap className="w-3 h-3 mr-1" />
              Hauza Sniper Academy
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Master the Hauza Sniper Strategy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mb-6">
              Learn the complete Hauza Sniper XAUUSD trading strategy. 
              From support/resistance to precise sniper entries with risk management.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>{lessons.length} Lessons</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-success" />
                <span>Beginner Friendly</span>
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

        {/* Lessons Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-secondary rounded w-3/4" />
                  <div className="h-4 bg-secondary/50 rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))
          ) : (
            lessons.map((lesson) => {
              const Icon = lessonIcons[lesson.slug] || BookOpen;
              return (
                <Card 
                  key={lesson.id} 
                  className="glass-card hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => navigate(`/learn/${lesson.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant="secondary">
                        Lesson {lesson.lesson_number}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {lesson.title}
                    </CardTitle>
                    <CardDescription>
                      {lesson.content.substring(0, 100).replace(/[#*`]/g, '')}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full justify-between group-hover:text-primary">
                      Start Learning
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Start Guide */}
        <div className="mt-12 glass-card p-8">
          <h2 className="text-2xl font-bold mb-6">From Signal to Chart – Quick Guide</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { step: 1, title: "Receive Signal", desc: "Get Hauza Sniper alert in app" },
              { step: 2, title: "Open Chart", desc: "View on your broker/MT5/Deriv" },
              { step: 3, title: "Find Zone", desc: "Locate support or resistance" },
              { step: 4, title: "Confirm Setup", desc: "Check wick rejection + EMA" },
              { step: 5, title: "Execute Trade", desc: "Place trade with SL and TP" },
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
      </main>
    </div>
  );
};

export default Learn;
