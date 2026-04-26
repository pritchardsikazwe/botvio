import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface Lesson {
  id: string;
  lesson_number: number;
  title: string;
  slug: string;
  content: string;
  category: string;
}

const Lesson = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "botvio-sniper";

  useEffect(() => {
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from("education_lessons")
        .select("*")
        .eq("category", category)
        .order("lesson_number", { ascending: true });

      if (!error && data) {
        setAllLessons(data);
        const current = data.find(l => l.slug === slug);
        setLesson(current || null);
      }
      setLoading(false);
    };

    fetchLessons();
  }, [slug, category]);

  const currentIndex = allLessons.findIndex(l => l.slug === slug);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-bold mt-6 mb-3 text-primary">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
      }
      // List items
      if (line.startsWith('- ')) {
        const content = line.substring(2)
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/✅/g, '<span class="text-success">✅</span>')
          .replace(/⚠️/g, '<span class="text-warning">⚠️</span>')
          .replace(/❌/g, '<span class="text-destructive">❌</span>');
        return (
          <li 
            key={i} 
            className="ml-6 mb-2 list-disc text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      }
      // Numbered lists
      if (/^\d+\./.test(line)) {
        const content = line.replace(/^\d+\.\s*/, '')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/✅/g, '<span class="text-success">✅</span>')
          .replace(/⚠️/g, '<span class="text-warning">⚠️</span>');
        return (
          <li 
            key={i} 
            className="ml-6 mb-2 list-decimal text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      }
      // Code blocks
      if (line.startsWith('```')) {
        return null;
      }
      // Regular paragraphs
      if (line.trim()) {
        const content = line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
          .replace(/💡/g, '<span class="text-primary">💡</span>')
          .replace(/⚠️/g, '<span class="text-warning">⚠️</span>');
        return (
          <p 
            key={i} 
            className="mb-4 text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      }
      return <br key={i} />;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/4" />
            <div className="h-12 bg-secondary rounded w-1/2" />
            <div className="h-64 bg-secondary/50 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
          <Button onClick={() => navigate(`/learn?category=${category}`)}>Back to Academy</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/learn?category=${category}`)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Academy
          </Button>
          <span>/</span>
          <span>Lesson {lesson.lesson_number}</span>
        </div>

        {/* Lesson Content */}
        <div className="glass-card p-8 mb-8">
          <Badge variant="outline" className="mb-4 border-primary text-primary">
            <BookOpen className="w-3 h-3 mr-1" />
            Lesson {lesson.lesson_number}
          </Badge>

          <article className="prose prose-invert max-w-none">
            {renderContent(lesson.content)}
          </article>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          {prevLesson ? (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/learn/${prevLesson.slug}?category=${category}`)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {prevLesson.title}
            </Button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Button 
              variant="default" 
              onClick={() => navigate(`/learn/${nextLesson.slug}?category=${category}`)}
            >
              {nextLesson.title}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => navigate(`/learn?category=${category}`)}>
              Complete Course
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Lesson;
