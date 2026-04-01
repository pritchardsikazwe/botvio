import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Megaphone } from "lucide-react";

interface AdvertSlot {
  id: string;
  title: string;
  description: string | null;
  link_url: string | null;
  badge_text: string | null;
  badge_color: string | null;
  icon_emoji: string | null;
  sort_order: number;
}

export const ScrollingAdvertBanner = () => {
  const { data: adverts } = useQuery({
    queryKey: ["advert-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advert_slots")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AdvertSlot[];
    },
    staleTime: 60 * 1000,
  });

  if (!adverts || adverts.length === 0) return null;

  // Duplicate items to create seamless loop
  const items = [...adverts, ...adverts];

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Header label */}
      <div className="absolute top-0 left-0 z-20 bg-primary text-primary-foreground px-2 py-0.5 rounded-br-lg text-[9px] font-bold flex items-center gap-1">
        <Megaphone className="h-2.5 w-2.5" /> ADS
      </div>

      {/* Scrolling track */}
      <div className="flex animate-marquee py-2.5 pt-4">
        {items.map((ad, i) => (
          <AdvertCard key={`${ad.id}-${i}`} ad={ad} />
        ))}
      </div>
    </div>
  );
};

const AdvertCard = ({ ad }: { ad: AdvertSlot }) => {
  const Wrapper = ad.link_url ? "a" : "div";
  const wrapperProps = ad.link_url
    ? { href: ad.link_url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className="flex-shrink-0 mx-2 flex items-center gap-2.5 px-4 py-2 rounded-lg border border-primary/15 bg-card/80 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer min-w-[220px] max-w-[300px] group"
    >
      <span className="text-lg flex-shrink-0">{ad.icon_emoji || "📢"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-foreground truncate">{ad.title}</p>
          {ad.badge_text && (
            <Badge
              variant="secondary"
              className="text-[8px] px-1 py-0 h-3.5 shrink-0"
            >
              {ad.badge_text}
            </Badge>
          )}
        </div>
        {ad.description && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{ad.description}</p>
        )}
      </div>
      {ad.link_url && (
        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      )}
    </Wrapper>
  );
};
