import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, Youtube, ExternalLink, Calendar, Globe, Users,
  TrendingUp, TrendingDown, Vote,
} from "lucide-react";
import { useState } from "react";

const COMMUNITY_LINKS = [
  {
    title: "WhatsApp Signals Group",
    description: "Get live gold trading signals, market updates & chat with other traders.",
    icon: MessageCircle,
    link: "https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ",
    label: "Join Group",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
  {
    title: "YouTube – Forex Smart Money",
    description: "Free video lessons on Smart Money Concepts, gold analysis & live trades.",
    icon: Youtube,
    link: "https://www.youtube.com/@Forexsmartmoneyconcept",
    label: "Subscribe",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
  },
];

const RESOURCE_LINKS = [
  { title: "Economic Calendar", desc: "Track Fed, NFP, CPI events", icon: Calendar, url: "https://www.forexfactory.com/calendar" },
  { title: "Gold News (Kitco)", desc: "Trusted gold market analysis", icon: Globe, url: "https://www.kitco.com/gold-price-today-usa/" },
  { title: "DXY Live Chart", desc: "US Dollar Index (inverse to gold)", icon: TrendingUp, url: "https://www.tradingview.com/symbols/TVC-DXY/" },
];

export function GoldCommunitySection() {
  const [vote, setVote] = useState<"bull" | "bear" | null>(null);
  const [bullVotes, setBullVotes] = useState(67);
  const [bearVotes, setBearVotes] = useState(33);

  const handleVote = (dir: "bull" | "bear") => {
    if (vote) return;
    setVote(dir);
    if (dir === "bull") setBullVotes(v => v + 1);
    else setBearVotes(v => v + 1);
  };

  const totalVotes = bullVotes + bearVotes;
  const bullPct = Math.round((bullVotes / totalVotes) * 100);
  const bearPct = 100 - bullPct;

  return (
    <div className="space-y-6">
      {/* Community Poll */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Where is Gold heading this week?</h3>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleVote("bull")}
              disabled={!!vote}
              className={`flex-1 h-12 font-bold text-sm ${vote === "bull" ? "bg-success text-success-foreground" : "bg-success/10 text-success hover:bg-success/20 border border-success/30"}`}
              variant={vote === "bull" ? "default" : "outline"}
            >
              <TrendingUp className="h-4 w-4 mr-2" /> Bullish
            </Button>
            <Button
              onClick={() => handleVote("bear")}
              disabled={!!vote}
              className={`flex-1 h-12 font-bold text-sm ${vote === "bear" ? "bg-destructive text-destructive-foreground" : "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30"}`}
              variant={vote === "bear" ? "default" : "outline"}
            >
              <TrendingDown className="h-4 w-4 mr-2" /> Bearish
            </Button>
          </div>

          {vote && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-success font-bold">{bullPct}% Bullish</span>
                <span>{totalVotes} votes</span>
                <span className="text-destructive font-bold">{bearPct}% Bearish</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-success transition-all" style={{ width: `${bullPct}%` }} />
                <div className="h-full bg-destructive transition-all" style={{ width: `${bearPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">Thanks for voting! Results update in real-time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMMUNITY_LINKS.map((item, idx) => (
          <Card key={idx} className={`${item.border} border bg-card hover:bg-card/80 transition-colors`}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                <Button className={`w-full font-bold text-xs ${item.bg} ${item.color} hover:opacity-80 border ${item.border}`} variant="outline">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> {item.label}
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Links */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Useful Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RESOURCE_LINKS.map((res, idx) => (
            <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-4 flex items-start gap-3">
                  <res.icon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground">{res.title}</p>
                    <p className="text-[11px] text-muted-foreground">{res.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>

      {/* Broker Section */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card">
        <CardContent className="p-6 text-center space-y-4">
          <Users className="h-10 w-10 text-primary mx-auto" />
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Join Thousands of Gold Traders</h3>
            <p className="text-sm text-muted-foreground mt-1">Open a broker account and start trading gold with tight spreads today.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://one.exness-track.com/a/ts1kvs1k" target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                <ExternalLink className="h-4 w-4 mr-2" /> Trade on Exness
              </Button>
            </a>
            <a href="https://gowt.net/ib67505m" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="font-bold border-primary/30 text-primary">
                <ExternalLink className="h-4 w-4 mr-2" /> Open Weltrade
              </Button>
            </a>
            <a href="https://deriv.partners/rx?sidi=F9C8D3BF-5854-499A-8497-F5C370F804DC&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU23827" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="font-bold">
                <ExternalLink className="h-4 w-4 mr-2" /> Open Deriv
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
