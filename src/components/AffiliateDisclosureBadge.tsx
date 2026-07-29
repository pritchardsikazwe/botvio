import { Link } from "react-router-dom";
import { Info } from "lucide-react";

/**
 * Small inline badge for articles/pages that contain affiliate links.
 * Links to the full Affiliate Disclosure. Keep visible – never hide.
 */
export const AffiliateDisclosureBadge = ({
  className = "",
}: {
  className?: string;
}) => (
  <Link
    to="/affiliate-disclosure"
    className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors ${className}`}
    aria-label="Affiliate disclosure"
  >
    <Info className="h-3 w-3" />
    <span>Affiliate Disclosure</span>
  </Link>
);

export default AffiliateDisclosureBadge;