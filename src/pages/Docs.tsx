import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Book, Code, Shield, Zap, Bot, TrendingUp, AlertTriangle, Cpu } from "lucide-react";

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Documentation"
        description="Complete Botvio documentation covering trading modes, API integration, strategies, risk management, and Deriv symbol explanations."
      />
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">Botvio Documentation</h1>
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
                <li><strong>Connect Deriv</strong> — Link your Deriv account via OAuth. Botvio never sees your Deriv password.</li>
                <li><strong>Choose Mode</strong> — Select from 8 trading modes: Rise/Fall, Digits, Higher/Lower, Boom/Crash, Multipliers, Accumulators, Ticks, Turbo.</li>
                <li><strong>Set Risk</strong> — Configure your stake amount and daily loss limits.</li>
                <li><strong>Trade</strong> — Use manual signals or enable Auto Mode for full automation.</li>
              </ol>
              <h2>System Requirements</h2>
              <p>Botvio is a web-based platform. No downloads required. Works on any modern browser (Chrome, Firefox, Safari, Edge). Botvio's server-side execution means trades continue even when your browser is closed.</p>
            </div>
          </TabsContent>

          <TabsContent value="trading-modes" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Trading Modes</h2>
              {[
                { name: "Rise/Fall", desc: "Predict if the price will rise or fall. Botvio uses EMA 9/21 crossover with multi-timeframe momentum alignment." },
                { name: "Digits (Match/Differ/Even/Odd/Over/Under)", desc: "Predict the last digit of the price. Botvio uses Markov transition analysis, frequency divergence, and streak exhaustion." },
                { name: "Higher/Lower", desc: "Predict if price will end higher or lower than current. Botvio identifies support/resistance bounces and RSI reversals." },
                { name: "Boom/Crash", desc: "Catch spike moves. Botvio detects spike droughts and volatility compression patterns." },
                { name: "Multipliers", desc: "Amplified trend trading. Botvio uses EMA crossovers with dynamic multiplier selection based on ATR." },
                { name: "Accumulators", desc: "Steady growth in calm markets. Botvio measures stability and trend smoothness." },
                { name: "Ticks", desc: "Ultra-fast momentum trading. Botvio detects 5-tick acceleration and directional alignment." },
                { name: "Turbo", desc: "Micro-breakout detection. Botvio identifies range compression and 3-tick alignment for explosive entries." },
              ].map((m, i) => (
                <div key={i}><h3>{m.name}</h3><p>{m.desc}</p></div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="symbols" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Deriv Symbol Guide</h2>
              <h3>Volatility Indices</h3>
              <p><strong>Volatility 10 (V10):</strong> Low volatility. Price moves slowly. Best for Accumulators and Rise/Fall with Botvio.</p>
              <p><strong>Volatility 25 (V25):</strong> Moderate volatility. Good all-round instrument for most Botvio strategies.</p>
              <p><strong>Volatility 50 (V50):</strong> Medium-high volatility. Balanced risk-reward for digit and trend trading.</p>
              <p><strong>Volatility 75 (V75):</strong> High volatility. Best for experienced traders using Botvio's Turbo and Multiplier engines.</p>
              <p><strong>Volatility 100 (V100):</strong> Highest volatility. Rapid price swings. Use with caution and tight risk limits.</p>
              <h3>Boom/Crash Indices</h3>
              <p><strong>Boom 1000:</strong> Upward spikes every ~1000 ticks. Buy contracts to catch spikes.</p>
              <p><strong>Boom 500:</strong> More frequent spikes than Boom 1000.</p>
              <p><strong>Crash 1000:</strong> Downward spikes every ~1000 ticks. Sell contracts to catch drops.</p>
              <p><strong>Crash 500:</strong> More frequent crash spikes.</p>
              <h3>Step Indices</h3>
              <p><strong>Step Index:</strong> Equal probability of moving up or down by 0.1. Ideal for digit strategies.</p>
              <h3>Jump Indices</h3>
              <p><strong>Jump 10/25/50/75/100:</strong> Similar to Volatility indices but with occasional jumps in price.</p>
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Hauza Sniper Strategy Suite</h2>
              <p>Botvio's core strategy system, Hauza Sniper, uses multiple technical indicators working together:</p>
              <h3>Core Indicators</h3>
              <ul>
                <li><strong>EMA 9/21 Crossover:</strong> Identifies trend direction. Botvio buys when EMA9 crosses above EMA21.</li>
                <li><strong>RSI (14):</strong> Measures momentum. Botvio avoids entries in overbought (&gt;75) or oversold (&lt;25) conditions.</li>
                <li><strong>ATR:</strong> Measures volatility. Botvio adjusts durations and filters based on current ATR.</li>
                <li><strong>Markov Transitions:</strong> For digit contracts, Botvio builds a transition matrix to predict likely next digits.</li>
              </ul>
              <h3>Signal Confidence</h3>
              <p>Every Botvio signal includes a confidence score (0-100):</p>
              <ul>
                <li><strong>80-100:</strong> Strong signal — high-probability setup</li>
                <li><strong>60-79:</strong> Moderate signal — acceptable entry</li>
                <li><strong>Below 60:</strong> Weak signal — Botvio waits for better conditions</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Botvio API Documentation</h2>
              <p>Botvio provides backend functions for automated trading workflows.</p>
              <h3>Trade Execution</h3>
              <pre><code>{`POST /functions/v1/deriv-trade-execute
{
  "symbol": "R_100",
  "contract_type": "CALL",
  "amount": 1.00,
  "duration": 5,
  "duration_unit": "t",
  "basis": "stake"
}`}</code></pre>
              <h3>Signal Analysis</h3>
              <pre><code>{`POST /functions/v1/botvio-sniper
{
  "symbol": "XAUUSD",
  "timeframe": "M5"
}`}</code></pre>
              <h3>Chart Analysis</h3>
              <pre><code>{`POST /functions/v1/analyze-chart
{
  "image_url": "https://...",
  "symbol": "R_100",
  "timeframe": "M5"
}`}</code></pre>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Risk Disclaimers</h2>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <h3 className="text-destructive">⚠️ Important Risk Warning</h3>
                <p>Trading synthetic indices involves significant risk. You may lose some or all of your invested capital. Past performance is not indicative of future results.</p>
              </div>
              <h3>Key Risks</h3>
              <ul>
                <li><strong>Market Risk:</strong> Prices of synthetic indices can move rapidly and unpredictably.</li>
                <li><strong>Leverage Risk:</strong> Multiplier contracts amplify both gains and losses.</li>
                <li><strong>System Risk:</strong> While Botvio has redundancy, internet outages or API failures can affect trade execution.</li>
                <li><strong>Strategy Risk:</strong> No strategy guarantees profits. All Botvio engines are based on statistical probabilities, not certainties.</li>
              </ul>
              <h3>Responsible Trading</h3>
              <ul>
                <li>Never trade with money you cannot afford to lose</li>
                <li>Use Botvio's risk guardrails (daily loss limits, maximum stake)</li>
                <li>Start with a demo account to learn Botvio's behavior</li>
                <li>Diversify across multiple trading modes</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>How Botvio's AI Works</h2>
              <p>Botvio uses a combination of statistical models and machine learning techniques:</p>
              <h3>Signal Generation</h3>
              <p>Botvio's signal engines are rule-based systems built on proven technical indicators. They process real-time tick data to identify statistically favorable conditions.</p>
              <h3>Markov Chain Analysis</h3>
              <p>For digit contracts, Botvio builds transition probability matrices from recent tick data. This allows Botvio to predict which digit is most likely to appear next based on the current digit.</p>
              <h3>Confluence Scoring</h3>
              <p>Botvio combines multiple indicators into a single confidence score. Higher confluence (more indicators agreeing) results in higher confidence.</p>
              <h3>Adaptive Thresholds</h3>
              <p>Botvio adjusts its signal thresholds based on market conditions. During high volatility, Botvio requires stronger signals before entering. During calm markets, Botvio can enter with moderate confidence.</p>
              <h3>Limitations</h3>
              <p>Botvio's AI is not a crystal ball. It identifies patterns and probabilities, but markets are inherently unpredictable. Botvio works best when used consistently over many trades, allowing statistical edges to compound.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Docs;
