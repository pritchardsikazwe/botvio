import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, Youtube, ExternalLink, Globe, Users,
  TrendingUp, TrendingDown, Vote,
} from "lucide-react";
import { useState } from "react";

const WELTRADE_LINK = "https://gowt.net/ib67505";

const COMMUNITY_LINKS = [
  {
    title: "WhatsApp Signals Group",
    description: "Get live SyntX trading signals, market updates & chat with other traders.",
    icon: MessageCircle,
    link: "https://chat.whatsapp.com/KInahrKam85BTyFbIgC3zJ",
    label: "Join Group",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
  {
    title: "YouTube – Forex Smart Money",
    description: "Free video lessons on SyntX trading strategies and live trade breakdowns.",
    icon: Youtube,
    link: "https://www.youtube.com/@Forexsmartmoneyconcept",
    label: "Subscribe",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
  },
];

export function SyntxCommunitySection() {
  const [vote, setVote] = useState<"bull" | "bear" | null>(null);
  const [bullVotes, setBullVotes] = useState(54);
  const [bearVotes, setBearVotes] = useState(46);

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
      {/* Poll */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Which SyntX index is best this week?</h3>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleVote("bull")}
              disabled={!!vote}
              className={`flex-1 h-12 font-bold text-sm ${vote === "bull" ? "bg-success text-success-foreground" : "bg-success/10 text-success hover:bg-success/20 border border-success/30"}`}
              variant={vote === "bull" ? "default" : "outline"}
            >
              <TrendingUp className="h-4 w-4 mr-2" /> GainX (Buy Bias)
            </Button>
            <Button
              onClick={() => handleVote("bear")}
              disabled={!!vote}
              className={`flex-1 h-12 font-bold text-sm ${vote === "bear" ? "bg-destructive text-destructive-foreground" : "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30"}`}
              variant={vote === "bear" ? "default" : "outline"}
            >
              <TrendingDown className="h-4 w-4 mr-2" /> PainX (Sell Bias)
            </Button>
          </div>
          {vote && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-success font-bold">{bullPct}% GainX</span>
                <span>{totalVotes} votes</span>
                <span className="text-destructive font-bold">{bearPct}% PainX</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-success transition-all" style={{ width: `${bullPct}%` }} />
                <div className="h-full bg-destructive transition-all" style={{ width: `${bearPct}%` }} />
              </div>
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

      {/* Broker CTA */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card">
        <CardContent className="p-6 text-center space-y-4">
          <Users className="h-10 w-10 text-primary mx-auto" />
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Join the SyntX Trading Community</h3>
            <p className="text-sm text-muted-foreground mt-1">Open a Weltrade account and start trading PainX, GainX, TrendX today.</p>
          </div>
          <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              <ExternalLink className="h-4 w-4 mr-2" /> Open Weltrade Account
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
