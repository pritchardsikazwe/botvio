import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { languages } from "@/i18n";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "icon" | "compact";
  className?: string;
}

export const LanguageSwitcher = ({ variant = "icon", className }: Props) => {
  const { i18n } = useTranslation();
  const current = languages.find((l) => l.code === i18n.language) ?? languages[0];

  const change = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          className={cn(variant === "compact" && "gap-1.5", className)}
          aria-label="Change language"
        >
          {variant === "icon" ? (
            <Globe className="h-4 w-4" />
          ) : (
            <>
              <span className="text-base leading-none">{current.flag}</span>
              <span className="text-xs font-medium uppercase">{current.code}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((l) => {
          const active = l.code === current.code;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => change(l.code)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="flex-1 text-sm">{l.native}</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
