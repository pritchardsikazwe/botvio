import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";

const Whitepaper = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Whitepaper" description="Botvio technical whitepaper detailing AI signal generation, Markov chain analysis, EMA-based trading engines, and risk management architecture." />
    <Header />
    <main className="container mx-auto px-4 py-10 max-w-3xl prose dark:prose-invert">
      <h1>Botvio Technical Whitepaper</h1>
      <p className="lead">Version 2.0 — February 2026</p>

      <h2>1. Abstract</h2>
      <p>Botvio is an AI-powered automated trading system designed for Deriv synthetic indices. This whitepaper describes Botvio's technical architecture, signal generation methodology, risk management framework, and security model.</p>

      <h2>2. Problem Statement</h2>
      <p>Manual trading on synthetic indices suffers from emotional bias, inconsistent execution, and limited market coverage. Botvio addresses these challenges through algorithmic signal generation and automated execution.</p>

      <h2>3. Architecture Overview</h2>
      <p>Botvio operates on a three-layer architecture:</p>
      <ul>
        <li><strong>Frontend Layer:</strong> React-based UI for configuration, monitoring, and manual trading. Provides real-time signal visualization and trade status tracking.</li>
        <li><strong>Backend Layer:</strong> Edge Functions handling trade execution, token management, and signal processing. All sensitive operations occur server-side.</li>
        <li><strong>Data Layer:</strong> PostgreSQL database with Row-Level Security for user isolation, encrypted credential storage, and real-time event streaming.</li>
      </ul>

      <h2>4. Signal Generation</h2>
      <h3>4.1 Trend-Following (Rise/Fall, Higher/Lower)</h3>
      <p>Botvio uses Exponential Moving Average (EMA) crossovers with periods 9 and 21 as the primary trend indicator. Signals are confirmed by RSI (14) and ATR-normalized momentum. Multi-timeframe alignment (3, 5, and 10-tick) provides additional confluence.</p>

      <h3>4.2 Digit Prediction (Match/Differ/Even/Odd/Over/Under)</h3>
      <p>Botvio constructs a Markov transition matrix from recent tick data. For MATCH signals, Botvio identifies digits with transition probabilities significantly above the 10% baseline. For DIFFER, Botvio applies mean reversion on overrepresented digits.</p>

      <h3>4.3 Spike Detection (Boom/Crash)</h3>
      <p>Botvio monitors time since last significant price movement and calculates an "overdue" score. Volatility compression detection identifies building pressure before spikes.</p>

      <h3>4.4 Stability Analysis (Accumulators)</h3>
      <p>Botvio compares short-term ATR against long-term ATR to measure market stability. Entry is permitted only when stability exceeds 55%.</p>

      <h2>5. Risk Management</h2>
      <p>Botvio implements multi-layer risk controls:</p>
      <ul>
        <li>Maximum daily loss limits (configurable per user)</li>
        <li>Trade frequency throttling (minimum interval between trades)</li>
        <li>Stake sizing based on account balance (never exceeding safe thresholds)</li>
        <li>Administrative global kill switch for emergency system halt</li>
      </ul>

      <h2>6. Security Model</h2>
      <ul>
        <li>AES-256 encryption for broker tokens at rest</li>
        <li>OAuth 2.0 for Deriv account connection</li>
        <li>Row-Level Security on all database tables</li>
        <li>Server-side-only trade execution (no client-side token exposure)</li>
      </ul>

      <h2>7. Conclusion</h2>
      <p>Botvio combines proven technical analysis methods with modern software engineering practices to deliver a reliable, secure automated trading platform. By removing emotional bias and providing 24/7 market coverage, Botvio gives traders a measurable edge in synthetic indices markets.</p>
    </main>
  </div>
);

export default Whitepaper;
