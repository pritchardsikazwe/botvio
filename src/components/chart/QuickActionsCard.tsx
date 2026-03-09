import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, Copy, BarChart3, Bookmark } from "lucide-react";
import { toast } from "sonner";

const EXNESS_LINK = "https://one.exness-track.com/a/ts1kvs1k";
const WHATSAPP_LINK = "https://chat.whatsapp.com/botvio-signals";

export function QuickActionsCard() {
  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4 space-y-2">
        <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>

        <a href={EXNESS_LINK} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full bg-[hsl(145_70%_45%)] hover:bg-[hsl(145_70%_45%/0.9)] text-white font-bold" size="sm">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Trade on Exness
          </Button>
        </a>

        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="outline" className="w-full border-success/30 text-success font-bold" size="sm">
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Join WhatsApp Signals
          </Button>
        </a>

        <Button variant="outline" className="w-full font-bold" size="sm" onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied!");
        }}>
          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Signal
        </Button>

        <Button variant="outline" className="w-full font-bold" size="sm" onClick={() => toast.info("Full analysis panel open")}>
          <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Open Full Analysis
        </Button>

        <Button variant="outline" className="w-full font-bold" size="sm" onClick={() => toast.success("Setup saved!")}>
          <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Save Setup
        </Button>
      </CardContent>
    </Card>
  );
}
