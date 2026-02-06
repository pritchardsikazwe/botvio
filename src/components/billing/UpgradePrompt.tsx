import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";

interface UpgradePromptProps {
  feature: string;
  requiredPlan?: string;
  className?: string;
}

export const UpgradePrompt = ({ feature, requiredPlan = "Basic", className = "" }: UpgradePromptProps) => (
  <Card className={`glass-card border-warning/30 bg-gradient-to-r from-warning/5 to-amber-500/5 ${className}`}>
    <CardContent className="py-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="p-3 rounded-full bg-warning/10">
          <Lock className="h-6 w-6 text-warning" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-bold text-lg mb-1">Upgrade to Unlock {feature}</h3>
          <p className="text-sm text-muted-foreground">
            This feature requires a {requiredPlan} plan or higher. Upgrade now to access all premium features.
          </p>
        </div>
        <Button variant="gold" asChild>
          <Link to="/billing">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);
