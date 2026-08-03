import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const DERIV_AFFILIATE_LINK = "https://track.deriv.com/_a_gq1w0BG0D1hit6RV3zsGNd7ZgqdRLk/1/";

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
