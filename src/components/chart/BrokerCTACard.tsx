import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, Globe, Shield, BookOpen } from "lucide-react";

const EXNESS_LINK = "https://one.exness-track.com/a/ts1kvs1k";

export function BrokerCTACard() {
  return (
    <Card className="rounded-xl border-2 border-[hsl(145_70%_45%)]/40 bg-gradient-to-b from-[hsl(145_70%_45%)]/5 to-transparent shadow-[0_0_25px_-5px_hsl(145_70%_45%_/_0.15)]">
      <CardContent className="p-5 space-y-4">
        <div className="text-center">
          <Badge className="bg-[hsl(145_70%_45%)]/20 text-[hsl(145_70%_45%)] border-[hsl(145_70%_45%)]/30 mb-2">
            Recommended Broker
          </Badge>
          <h3 className="text-lg font-extrabold text-foreground">Ready to trade this setup?</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Open your broker and execute when your setup is confirmed.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-[hsl(145_70%_45%)]" />
            Fast execution & tight spreads
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-[hsl(145_70%_45%)]" />
            Multi-asset: Forex, Metals, Crypto, Indices
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-[hsl(145_70%_45%)]" />
            Mobile & desktop access
          </div>
        </div>

        <a href={WELTRADE_LINK} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full bg-[hsl(145_70%_45%)] hover:bg-[hsl(145_70%_40%)] text-white font-extrabold text-sm h-11 shadow-lg shadow-[hsl(145_70%_45%)]/20">
            <ExternalLink className="h-4 w-4 mr-2" />
            Trade on WELTRADE
          </Button>
        </a>

        <a href="/learn" className="block">
          <Button variant="outline" className="w-full text-xs font-bold" size="sm">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Learn Strategy
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
