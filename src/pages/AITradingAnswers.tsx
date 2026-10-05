import { Link, useParams } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const questions = [
  ["what-is-an-ai-trading-bot","What is an AI trading bot?","An AI trading bot is software that analyzes market data and applies predefined or model-assisted trading rules. Botvio combines market analysis, signals and automated trading workflows; it does not guarantee profits."],
  ["best-ai-trading-bot-for-mt5","What should I look for in an AI trading bot for MT5?","Check data quality, strategy transparency, risk controls, execution handling, symbol mapping, trade history and emergency-stop controls before using an MT5 trading bot."],
  ["ai-gold-trading","How can AI be used for gold trading?","AI tools can analyze XAUUSD price data, identify patterns and organize signals or rules. Traders should still verify the instrument, spread, leverage, position size and stop-loss before trading."],
  ["ai-forex-trading","How does AI forex trading work?","AI forex systems can process price and indicator data to rank setups or automate rules. They should be evaluated by drawdown, consistency, execution and risk controls rather than by a single winning streak."],
  ["synthetic-indices-ai","Can AI trade synthetic indices?","AI systems can analyze synthetic-index data and automate strategies where the broker or platform permits it. Synthetic indices are provider-defined simulated instruments and should not be treated as ordinary forex markets."],
  ["mt5-copy-trading","What is MT5 copy trading?","MT5 copy trading allows trades from a provider or strategy to be replicated to a follower account according to the platform's rules. The follower can still experience losses and execution differences."],
  ["copy-trading-risk","Is copy trading safe?","Copy trading is not risk-free. Before allocating funds, evaluate drawdown, leverage, trade frequency, losing streaks, position sizing and the controls available to stop copying."],
  ["best-trading-signals","How do I evaluate trading signals?","A useful signal should have a timestamp, instrument, direction, entry context and risk framework. Freshness matters because market prices can change after publication."],
  ["gold-signals","Are AI gold signals guaranteed?","No. AI or algorithmic gold signals cannot guarantee a profitable outcome. Signals should be treated as analytical information and combined with independent risk management."],
  ["deriv-synthetic-indices","What are Deriv synthetic indices?","Synthetic indices are simulated markets offered by Deriv with provider-defined price behaviour. They differ from real-world forex, commodities and stock markets."],
  ["boom-crash","What are Boom and Crash indices?","Boom and Crash are synthetic indices with provider-defined spike characteristics. They require instrument-specific risk management and should not be assumed to behave like conventional markets."],
  ["trading-bot-risk-management","How should I manage risk with a trading bot?","Define maximum position size, maximum daily loss, drawdown limits and an emergency stop before automation. Test the strategy in a controlled environment before increasing exposure."],
  ["best-ai-trading-platform","How do I compare AI trading platforms?","Compare supported markets, signal transparency, automation controls, execution connections, account security, pricing, risk controls and the quality of published educational material."],
  ["botvio-ai-trading","What is Botvio?","Botvio is an AI-focused trading platform providing market research, trading signals, chart analysis, automated strategies and copy-trading workflows. Trading involves substantial risk and Botvio does not guarantee returns."],
];

export default function AITradingAnswers() {
  const { slug } = useParams();
  const selected = questions.find(([key]) => key === slug);
  const faq = questions.map(([slug,q,a])=>({ "@type":"Question", name:q, acceptedAnswer:{ "@type":"Answer", text:a }}));
  return <div className="min-h-screen bg-background">
    <SEOHead
      title={selected ? selected[1] : "AI Trading Answers: Forex, Gold, MT5, Synthetic Indices & Copy Trading"}
      description={selected ? selected[2] : "Clear answers to common AI trading questions about forex, gold, MT5, synthetic indices, signals, bots and copy trading."}
      jsonLd={selected ? {"@context":"https://schema.org","@type":"QAPage","mainEntity":{"@type":"Question","name":selected[1],"text":selected[1],"answerCount":1,"acceptedAnswer":{"@type":"Answer","text":selected[2]}}} : {"@context":"https://schema.org","@graph":[{"@type":"CollectionPage",name:"Botvio AI Trading Answers",url:"https://botvio.live/ai-trading",description:"AI trading research and direct answers."},{"@type":"FAQPage",mainEntity:faq}]}}
    />
    <Header />
    {selected ? <main className="container mx-auto px-4 py-10 max-w-3xl"><Link to="/ai-trading" className="text-sm text-primary">← All AI answers</Link><h1 className="mt-5 text-4xl font-bold">{selected[1]}</h1><div className="mt-6 rounded-2xl border bg-card p-6"><p className="text-lg leading-relaxed text-muted-foreground">{selected[2]}</p></div><h2 className="mt-10 text-2xl font-semibold">What to check next</h2><p className="mt-3 text-muted-foreground">Verify current broker terms, product availability, leverage, fees, execution conditions and local requirements. Trading involves substantial risk.</p></main> : <main className="container mx-auto px-4 py-10 max-w-6xl"><Badge>AI TRADING RESEARCH</Badge><h1 className="mt-4 text-4xl font-bold tracking-tight">AI Trading Answers</h1><p className="mt-4 max-w-3xl text-lg text-muted-foreground">Direct, research-first answers to the questions traders ask about AI trading, gold, forex, synthetic indices, MT5, signals and copy trading.</p><div className="mt-10 grid gap-4 md:grid-cols-2">{questions.map(([slug,q,a])=><article key={slug} className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">{q}</h2><p className="mt-3 text-muted-foreground leading-relaxed">{a}</p><Link to={`/ai-trading/${slug}`} className="mt-4 inline-flex items-center gap-2 text-primary font-medium">Read answer <ArrowRight className="h-4 w-4"/></Link></article>)}</div></main>}
  </div>;
}
