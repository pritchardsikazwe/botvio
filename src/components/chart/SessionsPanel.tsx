import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const SESSIONS = [
  { name: "Sydney", open: "22:00", close: "07:00", utcStart: 22, utcEnd: 7, color: "bg-purple-500", volatility: "Low" },
  { name: "Tokyo", open: "00:00", close: "09:00", utcStart: 0, utcEnd: 9, color: "bg-pink-500", volatility: "Low-Medium" },
  { name: "London", open: "08:00", close: "17:00", utcStart: 8, utcEnd: 17, color: "bg-blue-500", volatility: "High" },
  { name: "New York", open: "13:00", close: "22:00", utcStart: 13, utcEnd: 22, color: "bg-orange-500", volatility: "High" },
];

function isSessionOpen(utcStart: number, utcEnd: number): boolean {
  const h = new Date().getUTCHours();
  if (utcStart < utcEnd) return h >= utcStart && h < utcEnd;
  return h >= utcStart || h < utcEnd;
}

export function SessionsPanel() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {SESSIONS.map((s) => {
        const open = isSessionOpen(s.utcStart, s.utcEnd);
        return (
          <Card key={s.name} className={`border-border/50 rounded-xl ${open ? "border-primary/40 bg-primary/5" : ""}`}>
            <CardContent className="p-4 text-center">
              <div className={`w-3 h-3 rounded-full ${s.color} mx-auto mb-2 ${open ? "animate-pulse" : "opacity-40"}`} />
              <h4 className="font-bold text-sm text-foreground">{s.name}</h4>
              <p className="text-[10px] text-muted-foreground mt-1">
                {s.open} — {s.close} UTC
              </p>
              <Badge variant="outline" className={`mt-2 text-[10px] ${open ? "text-success border-success/30" : "text-muted-foreground"}`}>
                {open ? "● Open" : "Closed"}
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-1">Vol: {s.volatility}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
