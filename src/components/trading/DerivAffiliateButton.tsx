import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const DERIV_AFFILIATE_LINK = "https://deriv.com/signup/?utm_source=botvio&utm_medium=affiliate&utm_campaign=CU23827";

interface DerivAffiliateButtonProps {
  variant?: "default" | "outline" | "ghost" | "gold";
  size?: "sm" | "default" | "lg";
  className?: string;
  label?: string;
}

export const DerivAffiliateButton = ({ variant = "gold", size = "sm", className, label = "Open Deriv Account" }: DerivAffiliateButtonProps) => (
  <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener noreferrer">
    <Button variant={variant} size={size} className={className}>
      <ExternalLink className="w-3 h-3 mr-1" />
      {label}
    </Button>
  </a>
);
