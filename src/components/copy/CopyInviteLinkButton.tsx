import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** Builds the current-style shareable copy link for a provider. */
export const buildCopyInviteLink = (providerId: string) =>
  `${window.location.origin}/copy-trading/start/${providerId}`;

interface Props {
  providerId: string;
  className?: string;
  size?: "sm" | "default" | "icon";
  variant?: "outline" | "ghost" | "secondary";
  label?: string;
}

/**
 * Copies the provider's copy-trading invite link to the clipboard.
 * Replaces the old token-based copy links with the current
 * /copy-trading/start/:providerId route.
 */
export const CopyInviteLinkButton = ({
  providerId,
  className,
  size = "sm",
  variant = "outline",
  label = "Copy link",
}: Props) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = buildCopyInviteLink(providerId);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fall back.
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    toast({ title: "Copy link copied", description: "Share it with anyone you want to follow this provider." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={copy}
      className={cn(className)}
      aria-label="Copy invite link"
    >
      {copied ? <Check className="mr-1.5 h-4 w-4 text-success" /> : <Link2 className="mr-1.5 h-4 w-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
};
