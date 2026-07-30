import { Button } from "@/components/ui/button";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Link2, 
  MessageCircle,
  Send,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SocialShareButtonsProps {
  title: string;
  description?: string;
  imageUrl?: string;
  analysisId?: string;
  label?: string;
}

export const SocialShareButtons = ({ 
  title, 
  description, 
  imageUrl,
  analysisId,
  label = "Share",
}: SocialShareButtonsProps) => {
  const shareUrl = analysisId 
    ? `${window.location.origin}/analysis/${analysisId}` 
    : window.location.href;
  
  const plainDescription = description?.replace(/\*\*/g, '') || '';
  const shareText = `${title}${plainDescription ? `\n${plainDescription}` : ''}`;
  
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => openShareWindow(shareLinks.twitter)}
          className="cursor-pointer"
        >
          <Twitter className="mr-2 h-4 w-4 text-[#1DA1F2]" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => openShareWindow(shareLinks.facebook)}
          className="cursor-pointer"
        >
          <Facebook className="mr-2 h-4 w-4 text-[#4267B2]" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => openShareWindow(shareLinks.linkedin)}
          className="cursor-pointer"
        >
          <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => openShareWindow(shareLinks.whatsapp)}
          className="cursor-pointer"
        >
          <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => openShareWindow(shareLinks.telegram)}
          className="cursor-pointer"
        >
          <Send className="mr-2 h-4 w-4 text-[#0088cc]" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={copyToClipboard}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
