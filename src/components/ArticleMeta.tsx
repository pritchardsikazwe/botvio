import { Link } from "react-router-dom";
import { Clock, ShieldCheck, CalendarDays, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AffiliateDisclosureBadge } from "@/components/AffiliateDisclosureBadge";
import { getAuthor } from "@/content/authors";

interface ArticleMetaProps {
  category?: string;
  readTime?: string;
  publishedDate: string;
  updatedDate?: string;
  authorName?: string;
  showAffiliateDisclosure?: boolean;
  reviewedBy?: string;
}

export const ArticleMeta = ({
  category,
  readTime,
  publishedDate,
  updatedDate,
  authorName,
  showAffiliateDisclosure = true,
  reviewedBy = "Botvio Editorial Team",
}: ArticleMetaProps) => {
  const author = getAuthor(authorName);
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {category && <Badge className="bg-primary text-primary-foreground">{category}</Badge>}
        {readTime && (
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readTime}
          </span>
        )}
        <span className="text-muted-foreground inline-flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          Published {publishedDate}
        </span>
        {updatedDate && updatedDate !== publishedDate && (
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <RefreshCcw className="h-3 w-3" />
            Updated {updatedDate}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        <span>
          By{" "}
          <Link
            to={`/authors/${author.slug}`}
            className="font-medium text-foreground hover:text-primary underline decoration-primary/40 underline-offset-4"
          >
            {author.name}
          </Link>
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-primary" />
          Reviewed by {reviewedBy}
        </span>
        {showAffiliateDisclosure && <AffiliateDisclosureBadge />}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          to="/editorial-policy"
          className="text-muted-foreground hover:text-primary underline underline-offset-4"
        >
          Editorial Policy
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          to="/fact-checking"
          className="text-muted-foreground hover:text-primary underline underline-offset-4"
        >
          Fact-Checking
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          to="/corrections"
          className="text-muted-foreground hover:text-primary underline underline-offset-4"
        >
          Corrections
        </Link>
      </div>
    </div>
  );
};

export default ArticleMeta;