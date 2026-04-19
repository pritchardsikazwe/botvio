import { SEOHead } from "@/components/seo/SEOHead";
import { Header } from "@/components/trading/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const testimonials = [
  { name: "James K.", country: "🇰🇪 Kenya", text: "Botvio changed my trading completely. I was losing consistently with manual trading, but Botvio's digit engine has been incredibly accurate. The Match/Differ signals are spot on.", rating: 5, mode: "Digits" },
  { name: "Chioma A.", country: "🇳🇬 Nigeria", text: "I've been using Botvio for 3 months now. The Boom 1000 strategy catches spikes I would have missed. Botvio's auto mode means I make money even while sleeping.", rating: 5, mode: "Boom/Crash" },
  { name: "David M.", country: "🇿🇲 Zambia", text: "As a beginner, Botvio was perfect for me. I didn't need to learn complex analysis — Botvio does everything. The strategy guides helped me understand what the bot is doing.", rating: 5, mode: "Rise/Fall" },
  { name: "Priya S.", country: "🇮🇳 India", text: "Botvio's multiplier engine is excellent. The dynamic multiplier selection based on volatility means I'm not over-leveraged in choppy markets. Smart risk management.", rating: 4, mode: "Multipliers" },
  { name: "Emmanuel O.", country: "🇬🇭 Ghana", text: "I was skeptical about trading bots, but Botvio proved me wrong. The transparency of showing confidence scores and reasons for each signal builds real trust.", rating: 5, mode: "Higher/Lower" },
  { name: "Sarah T.", country: "🇹🇿 Tanzania", text: "Botvio's accumulator strategy is my favorite. It finds those calm market periods perfectly and I watch my balance grow steadily. Much better than the stress of manual trading.", rating: 5, mode: "Accumulators" },
  { name: "Ahmed R.", country: "🇪🇬 Egypt", text: "The security is what sold me on Botvio. Knowing my tokens are encrypted and never leave the server gives me peace of mind. Plus the trading results have been consistently positive.", rating: 4, mode: "Ticks" },
  { name: "Carlos M.", country: "🇧🇷 Brazil", text: "Botvio's turbo mode is exciting! Ultra-fast trades with good accuracy. The 3-tick alignment confirmation really helps filter out false breakouts.", rating: 5, mode: "Turbo" },
];

const Testimonials = () => (
  <div className="min-h-screen bg-background">
    <SEOHead seoKey="testimonials" title="Testimonials" description="Read what traders around the world say about Botvio AI trading bot. Real reviews from users in Kenya, Nigeria, Zambia, India, and more." />
    <Header />
    <main className="container mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight">What Traders Say About Botvio</h1>
        <p className="text-muted-foreground">Real feedback from Botvio users around the world.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {testimonials.map((t, i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex">{Array.from({ length: t.rating }, (_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                <Badge variant="outline">{t.mode}</Badge>
              </div>
              <p className="text-sm italic">"{t.text}"</p>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.country}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  </div>
);

export default Testimonials;
