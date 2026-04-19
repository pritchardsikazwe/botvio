import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BotvioScalpRobot } from "./BotvioScalpRobot";

export interface ScalpAsset {
  displaySymbol: string;
  label: string;
  emoji?: string;
  cryptoAlwaysOpen?: boolean;
}

interface MultiAssetScalpRobotProps {
  title?: string;
  assets: ScalpAsset[];
  defaultIndex?: number;
}

/**
 * Tabbed shell that lets users switch the Botvio Scalp Robot between
 * multiple assets (e.g. EUR/USD, GBP/USD, USD/JPY for currencies).
 */
export function MultiAssetScalpRobot({
  title = "Botvio Scalp Robot",
  assets,
  defaultIndex = 0,
}: MultiAssetScalpRobotProps) {
  const [active, setActive] = useState(Math.min(defaultIndex, assets.length - 1));
  const current = assets[active];

  return (
    <div className="space-y-3">
      <Card className="border border-border/60 bg-card/60">
        <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-primary/30">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                {title}
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/40 text-primary">
                  <Zap className="h-2.5 w-2.5 mr-0.5" /> 1m / 5m
                </Badge>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Pick an asset — the robot streams live ticks and flags scalp setups.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {assets.map((a, i) => {
              const isActive = i === active;
              return (
                <Button
                  key={a.displaySymbol}
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActive(i)}
                  className={`h-7 text-[11px] font-bold px-2.5 ${isActive ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {a.emoji && <span className="mr-1">{a.emoji}</span>}
                  {a.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <BotvioScalpRobot
        key={current.displaySymbol}
        displaySymbol={current.displaySymbol}
        assetLabel={current.label}
        cryptoAlwaysOpen={current.cryptoAlwaysOpen}
      />
    </div>
  );
}
