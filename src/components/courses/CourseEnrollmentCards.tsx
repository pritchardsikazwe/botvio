import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useHasEntitlement } from "@/hooks/useEntitlements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { GraduationCap, Clock, Users, CheckCircle, Star, Crown, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface CourseProgram {
  id: string;
  productId: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  level: string;
  category: string;
  lessonsCount: number;
  color: string;
  borderColor: string;
  iconColor: string;
}

const COURSE_PROGRAMS: CourseProgram[] = [
  {
    id: "forex-beginner-mentorship",
    productId: "041bb16e-4ba7-44d1-b2ce-6a79cc42b93f",
    title: "Forex Beginner Mentorship",
    description: "1-on-1 mentorship program for complete beginners. Learn market structure, risk management, and live trading.",
    price: 49,
    duration: "4 Weeks",
    features: ["8 structured lessons", "Live trading sessions", "Personal mentor", "Trading plan template", "WhatsApp support group"],
    level: "Beginner",
    category: "forex-beginner-mentorship",
    lessonsCount: 8,
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-500",
  },
  {
    id: "forex-strategies-masterclass",
    productId: "f8ed3166-8710-47c6-ad89-5cfe704be70b",
    title: "Forex Strategies Masterclass",
    description: "Advanced strategies covering Smart Money Concepts, Supply & Demand, ICT methodology, and institutional order flow.",
    price: 79,
    duration: "8 Weeks",
    features: ["10 in-depth lessons", "Live market analysis", "Strategy templates", "Certificate of completion"],
    level: "Intermediate",
    category: "forex-strategies-masterclass",
    lessonsCount: 10,
    color: "from-blue-500/20 to-indigo-500/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-500",
  },
  {
    id: "pro-trading-bootcamp",
    productId: "3358ca73-5471-4c04-8baa-4fb8e9250cdb",
    title: "Pro Trading Bootcamp",
    description: "Intensive bootcamp covering Gold, Indices & Forex with real account trading and prop firm preparation.",
    price: 149,
    duration: "12 Weeks",
    features: ["6 advanced modules", "Daily live sessions", "Account management tips", "Prop firm prep", "Lifetime community access"],
    level: "Advanced",
    category: "pro-trading-bootcamp",
    lessonsCount: 6,
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-500",
  },
];

interface CourseEnrollmentCardsProps {
  onEnroll?: (category: string) => void;
  compact?: boolean;
}

export const CourseEnrollmentCards = ({ onEnroll, compact = false }: CourseEnrollmentCardsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseProgram | null>(null);

  const handleEnrollClick = (course: CourseProgram) => {
    if (!user) {
      toast.error("Please sign in to enroll in a course");
      return;
    }
    setSelectedCourse(course);
    setShowPayDialog(true);
  };

  const handleConfirmEnrollment = async () => {
    if (!selectedCourse || !user) return;
    setEnrollingId(selectedCourse.id);
    
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: selectedCourse.productId,
          product_type: "course",
          amount_usd: selectedCourse.price,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create payment request
      const { error: payError } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          amount_usd: selectedCourse.price,
          method: "manual",
          status: "submitted",
          plan_id: null,
        });

      if (payError) throw payError;

      toast.success("Enrollment request submitted! Complete payment to access the course.", {
        duration: 5000,
      });

      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
      setShowPayDialog(false);

      if (onEnroll) {
        onEnroll(selectedCourse.category);
      }
    } catch (err: any) {
      toast.error(`Enrollment failed: ${err.message}`);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <>
      <div className={`grid grid-cols-1 ${compact ? "md:grid-cols-3" : "md:grid-cols-3"} gap-5`}>
        {COURSE_PROGRAMS.map((program) => (
          <CourseCard
            key={program.id}
            program={program}
            compact={compact}
            onEnroll={() => handleEnrollClick(program)}
            onViewLessons={() => {
              if (onEnroll) onEnroll(program.category);
              else navigate(`/learn?category=${program.category}`);
            }}
            enrolling={enrollingId === program.id}
          />
        ))}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Enroll in {selectedCourse?.title}
            </DialogTitle>
            <DialogDescription>
              Complete your enrollment to get full access to all lessons and mentorship features.
            </DialogDescription>
          </DialogHeader>

          {selectedCourse && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-semibold">{selectedCourse.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedCourse.duration} • {selectedCourse.lessonsCount} lessons</p>
                </div>
                <Badge className="bg-gradient-to-r from-warning to-amber-500 text-white text-lg px-4 py-1">
                  ${selectedCourse.price}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">What you get:</p>
                {selectedCourse.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
                <p className="font-medium text-warning mb-1">Payment Instructions</p>
                <p className="text-muted-foreground">
                  After clicking "Confirm Enrollment", you'll receive payment details via email or WhatsApp. 
                  Your course access will be activated once payment is confirmed by admin.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>Cancel</Button>
            <Button 
              variant="gold" 
              onClick={handleConfirmEnrollment}
              disabled={enrollingId !== null}
            >
              {enrollingId ? "Processing..." : `Confirm Enrollment — $${selectedCourse?.price}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface CourseCardProps {
  program: CourseProgram;
  compact?: boolean;
  onEnroll: () => void;
  onViewLessons: () => void;
  enrolling: boolean;
}

const CourseCard = ({ program, compact, onEnroll, onViewLessons, enrolling }: CourseCardProps) => {
  const hasAccess = useHasEntitlement(program.productId);

  return (
    <Card className={`glass-card ${program.borderColor} hover:scale-[1.02] transition-all overflow-hidden`}>
      <div className={`h-1.5 bg-gradient-to-r ${program.color.replace(/\/20/g, "")}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className={`text-xs ${program.iconColor} border-current`}>
            {program.level}
          </Badge>
          {hasAccess ? (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle className="h-3 w-3 mr-1" /> Enrolled
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-warning to-amber-500 text-white font-bold text-sm">
              ${program.price}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg leading-tight">{program.title}</CardTitle>
        {!compact && <CardDescription className="text-sm">{program.description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{program.duration}</span>
          <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{program.lessonsCount} lessons</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />Limited Spots</span>
        </div>
        {!compact && (
          <ul className="space-y-1.5">
            {program.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-3.5 w-3.5 text-success flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        )}
        {hasAccess ? (
          <Button variant="outline" className="w-full" size="sm" onClick={onViewLessons}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Continue Learning
          </Button>
        ) : (
          <Button variant="gold" className="w-full" size="sm" onClick={onEnroll} disabled={enrolling}>
            {enrolling ? "Processing..." : <><Star className="h-4 w-4 mr-2" />Enroll Now — ${program.price}</>}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export { COURSE_PROGRAMS };
export type { CourseProgram };