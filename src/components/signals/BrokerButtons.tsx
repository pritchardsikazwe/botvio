import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star } from "lucide-react";
import { SignalBroker, useTrackBrokerClick, rankBrokersForSignal } from "@/hooks/useSignalBrokers";

interface BrokerButtonsProps {
  brokers: SignalBroker[];
  signalId?: string;
  signalCategory?: string;
  signalSymbol?: string;
}

const BROKER_COLORS: Record<string, string> = {
  "pocket-option": "border-blue-500/40 hover:bg-blue-500/10 text-blue-400",
  "quotex": "border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400",
  "deriv": "border-red-500/40 hover:bg-red-500/10 text-red-400",
  "iq-option": "border-amber-500/40 hover:bg-amber-500/10 text-amber-400",
  "binomo": "border-purple-500/40 hover:bg-purple-500/10 text-purple-400",
};

export const BrokerButtons = ({ brokers, signalId, signalCategory, signalSymbol }: BrokerButtonsProps) => {
  const trackClick = useTrackBrokerClick();
  const ranked = rankBrokersForSignal(brokers, signalCategory, signalSymbol);

  if (!ranked.length) return null;

  const recommended = ranked[0];
  const others = ranked.slice(1);

  const handleClick = (broker: SignalBroker) => {
    trackClick.mutate({ brokerId: broker.id, signalId });
    window.open(broker.affiliate_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-2">
      {/* Recommended broker */}
      <Button
        variant="outline"
        className={`w-full justify-between ${BROKER_COLORS[recommended.slug] || "border-primary/40"}`}
        onClick={() => handleClick(recommended)}
      >
        <span className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 fill-current" />
          Trade on {recommended.name}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Recommended
          </Badge>
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </Button>

      {/* Other brokers */}
      <div className="grid grid-cols-2 gap-1.5">
        {others.map((broker) => (
          <Button
            key={broker.id}
            variant="ghost"
            size="sm"
            className={`text-xs justify-start border ${BROKER_COLORS[broker.slug] || "border-border"}`}
            onClick={() => handleClick(broker)}
          >
            <ExternalLink className="h-3 w-3 mr-1.5 shrink-0" />
            {broker.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
