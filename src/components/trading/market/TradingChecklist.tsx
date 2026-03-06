import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const CHECKLIST = [
  { emoji: "1️⃣", title: "Trend Direction 📈📉", desc: "Trade with the trend. Avoid trading against strong momentum." },
  { emoji: "2️⃣", title: "Support & Resistance 🧱", desc: "Check if price is near a key level where reversals or breakouts happen." },
  { emoji: "3️⃣", title: "Market Session ⏰", desc: "Most strong moves happen during London & New York sessions." },
  { emoji: "4️⃣", title: "High-Impact News 📰", desc: "Avoid entering trades just before major news like CPI, NFP, or rate decisions." },
  { emoji: "5️⃣", title: "Risk-to-Reward ⚖️", desc: "Make sure the trade gives at least 1:2 risk vs reward before entering." },
];

export function TradingChecklist() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-foreground">
            Pre-Trade Checklist
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Trend → Level → Session → News → Risk
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {CHECKLIST.map((item, i) => (
            <div
              key={i}
              className="bg-background/60 rounded-lg border border-border/50 px-3 py-2"
            >
              <div className="text-xs font-bold text-foreground mb-0.5">
                {item.title}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
