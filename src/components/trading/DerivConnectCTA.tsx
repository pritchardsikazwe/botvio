import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface DerivConnectCTAProps {
  message?: string;
}

export const DerivConnectCTA = ({ message }: DerivConnectCTAProps) => {
  return (
    <Card className="glass-card border-warning/30">
      <CardContent className="py-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
            <Wifi className="h-6 w-6 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">
              {message || "Connect Deriv to trade"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Link your Deriv account to start automated and manual trading.
            </p>
          </div>
          <Button variant="gold" asChild>
            <Link to="/connections">
              Connect Now <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
