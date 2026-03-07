import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MINI_LESSONS = [
  { title: "How to trade support & resistance", slug: "support-resistance" },
  { title: "How to use trendlines effectively", slug: "candles-wicks" },
  { title: "How to manage risk properly", slug: "risk-management" },
];

export function EducationMiniCard() {
  const navigate = useNavigate();

  return (
    <Card className="bg-card border-border/50 rounded-xl">
      <CardContent className="p-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-warning" /> Quick Lessons
        </h3>
        <div className="space-y-2">
          {MINI_LESSONS.map((lesson) => (
            <div
              key={lesson.slug}
              onClick={() => navigate(`/learn/${lesson.slug}?category=botvio-sniper`)}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/30 cursor-pointer hover:bg-muted/40 transition-all"
            >
              <span className="text-xs text-foreground font-medium">{lesson.title}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
