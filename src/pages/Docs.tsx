import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

// This page is for internal documentation, hidden from regular users
// Only admins can access it. It contains guides, API docs, risk disclaimers, etc.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Book, Code, Shield, Zap, Bot, TrendingUp, AlertTriangle, Cpu } from "lucide-react";

const Docs = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Documentation" description="Botvio internal documentation." noIndex />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">Botvio Documentation</h1>
          <Badge variant="outline" className="text-xs">Admin Only</Badge>
          <p className="text-muted-foreground">Everything you need to know about using Botvio for automated trading on Deriv.</p>
        </div>

        <Tabs defaultValue="getting-started">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="trading-modes">Trading Modes</TabsTrigger>
            <TabsTrigger value="symbols">Deriv Symbols</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="api">API Docs</TabsTrigger>
            <TabsTrigger value="risk">Risk & Disclaimers</TabsTrigger>
            <TabsTrigger value="ai">AI Explanation</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Quick Start Guide</h2>
              <ol>
                <li><strong>Create Account</strong> — Sign up for Botvio with your email.</li>
                <li><strong>Connect Deriv</strong> — Link your Deriv account via API Token.</li>
                <li><strong>Choose Mode</strong> — Select from 8 trading modes.</li>
                <li><strong>Set Risk</strong> — Configure your stake amount and daily loss limits.</li>
                <li><strong>Trade</strong> — Use manual signals or enable Auto Mode.</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="trading-modes" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Trading Modes</h2>
              {[
                { name: "Rise/Fall", desc: "EMA 9/21 crossover with multi-timeframe momentum alignment." },
                { name: "Digits", desc: "Markov transition analysis, frequency divergence, and streak exhaustion." },
                { name: "Higher/Lower", desc: "Support/resistance bounces and RSI reversals." },
                { name: "Boom/Crash", desc: "Spike drought detection and volatility compression." },
                { name: "Multipliers", desc: "EMA crossovers with dynamic multiplier selection." },
                { name: "Accumulators", desc: "Stability and trend smoothness analysis." },
                { name: "Ticks", desc: "5-tick acceleration and directional alignment." },
                { name: "Turbo", desc: "Range compression and 3-tick alignment." },
              ].map((m, i) => (
                <div key={i}><h3>{m.name}</h3><p>{m.desc}</p></div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="symbols" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Deriv Symbol Guide</h2>
              <p>Volatility 10-100, Boom/Crash 500/1000, Step Index, Jump 10-100.</p>
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Hauza Sniper Strategy Suite</h2>
              <p>Core indicators: EMA 9/21, RSI(14), ATR, Markov Transitions.</p>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>API Documentation</h2>
              <p>Trade execution, signal analysis, chart analysis endpoints.</p>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Risk Disclaimers</h2>
              <p>Trading involves significant risk. Past performance does not guarantee future results.</p>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>How Botvio's AI Works</h2>
              <p>Rule-based signal engines with Markov chain analysis and confluence scoring.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Docs;
