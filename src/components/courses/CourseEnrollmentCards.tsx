import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useHasEntitlement } from "@/hooks/useEntitlements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { GraduationCap, Clock, CheckCircle, Star, ArrowRight, Signal, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";

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
  isFree?: boolean;
  isSignalPlan?: boolean;
  signalPeriod?: string;
}

const COURSE_PROGRAMS: CourseProgram[] = [
  {
    id: "forex-beginner-mentorship",
    productId: "041bb16e-4ba7-44d1-b2ce-6a79cc42b93f",
    title: "Forex Beginner Mentorship",
    description: "Free mentorship for complete beginners. Learn forex markets, crypto basics, and join our personal mentor WhatsApp group.",
    price: 0,
    duration: "Self-paced",
    features: ["Forex markets introduction", "Crypto trading basics", "Personal mentor WhatsApp group", "Market structure fundamentals", "Risk management basics"],
    level: "Beginner",
    category: "forex-beginner-mentorship",
    lessonsCount: 8,
    color: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-500",
    isFree: true,
  },
  {
    id: "premium-signals-monthly",
    productId: "048325ee-c379-491c-8b4f-ec80fcfc89d9",
    title: "Premium Signals — Monthly",
    description: "Daily premium forex, crypto & indices signals plus access to all paid strategy courses.",
    price: 10,
    duration: "1 Month",
    features: ["Daily premium signals", "Forex Strategies Masterclass access", "Pro Trading Bootcamp access", "AI chart analysis", "WhatsApp signals group"],
    level: "All Levels",
    category: "premium-signals-monthly",
    lessonsCount: 16,
    color: "from-blue-500/20 to-indigo-500/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-500",
    isSignalPlan: true,
    signalPeriod: "Monthly",
  },
  {
    id: "premium-signals-3months",
    productId: "95373441-a565-47af-9817-0bfe723f001a",
    title: "Premium Signals — 3 Months",
    description: "Save with our quarterly package. All premium signals and full course access for 3 months.",
    price: 49,
    duration: "3 Months",
    features: ["All monthly plan features", "3 months of premium signals", "Full courses library access", "Priority WhatsApp support", "Strategy templates"],
    level: "All Levels",
    category: "premium-signals-3months",
    lessonsCount: 16,
    color: "from-violet-500/20 to-purple-500/20",
    borderColor: "border-violet-500/30",
    iconColor: "text-violet-500",
    isSignalPlan: true,
    signalPeriod: "Quarterly",
  },
  {
    id: "premium-signals-lifetime",
    productId: "f64b75b6-6293-49e1-9953-7130177bc3f",
    title: "Premium Signals — Lifetime",
    description: "One-time payment for lifetime access to all signals, courses, and future content forever.",
    price: 99,
    duration: "Lifetime",
    features: ["Lifetime premium signals", "All current & future courses", "Lifetime WhatsApp VIP group", "1-on-1 mentorship sessions", "Prop firm prep materials"],
    level: "All Levels",
    category: "premium-signals-lifetime",
    lessonsCount: 16,
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-500",
    isSignalPlan: true,
    signalPeriod: "Lifetime",
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
  const [paymentMethod, setPaymentMethod] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleEnrollClick = (course: CourseProgram) => {
    if (course.isFree) {
      if (onEnroll) onEnroll(course.category);
      else navigate(`/learn?category=${course.category}`);
      return;
    }
    if (!user) {
      toast.error("Please sign in to subscribe");
      return;
    }
    setSelectedCourse(course);
    setPaymentMethod("");
    setProofFile(null);
    setShowPayDialog(true);
  };

  const handleConfirmEnrollment = async () => {
    if (!selectedCourse || !user) return;
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (!proofFile) {
      toast.error("Please attach your payment proof screenshot");
      return;
    }
    setEnrollingId(selectedCourse.id);

    try {
      // Upload proof image
      let proofUrl: string | undefined;
      const ext = proofFile.name.split(".").pop();
      const path = `proofs/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("charts")
        .upload(path, proofFile);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("charts").getPublicUrl(path);
        proofUrl = urlData.publicUrl;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: selectedCourse.productId,
          product_type: selectedCourse.isSignalPlan ? "signal_pack" : "course",
          amount_usd: selectedCourse.price,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: payError } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          amount_usd: selectedCourse.price,
          method: paymentMethod,
          proof_upload_url: proofUrl || null,
          status: "submitted",
          plan_id: null,
        });

      if (payError) throw payError;

      toast.success("Order submitted! Admin will confirm your payment shortly.", { duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
      setShowPayDialog(false);

      if (onEnroll) onEnroll(selectedCourse.category);
    } catch (err: any) {
      toast.error(`Enrollment failed: ${err.message}`);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <>
      <div className={`grid grid-cols-1 ${compact ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-4"} gap-5`}>
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

      {/* Payment Dialog — uses same PaymentMethodSelector as marketplace */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Signal className="h-5 w-5 text-primary" />
              Subscribe to {selectedCourse?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedCourse?.isSignalPlan
                ? "Get premium signals + full course access with this subscription."
                : "Complete your enrollment to get full access."}
            </DialogDescription>
          </DialogHeader>

          {selectedCourse && (
            <PaymentMethodSelector
              planCode={selectedCourse.id}
              planName={selectedCourse.title}
              amount={selectedCourse.price}
              embedded
              onMethodChange={(method) => setPaymentMethod(method)}
              onProofFileChange={(file) => setProofFile(file)}
              onPaymentInitiated={(method) => setPaymentMethod(method)}
            />
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>Cancel</Button>
            <Button
              variant="gold"
              onClick={handleConfirmEnrollment}
              disabled={enrollingId !== null || !paymentMethod || !proofFile}
            >
              {enrollingId ? "Processing..." : `Confirm — $${selectedCourse?.price}`}
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
            {program.isFree ? "FREE" : program.signalPeriod || program.level}
          </Badge>
          {hasAccess ? (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle className="h-3 w-3 mr-1" /> Active
            </Badge>
          ) : program.isFree ? (
            <Badge className="bg-success/20 text-success border border-success/30 font-bold text-sm">
              FREE
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-warning to-amber-500 text-white font-bold text-sm">
              ${program.price}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg leading-tight flex items-center gap-2">
          {program.isSignalPlan && <Signal className="h-4 w-4 text-primary flex-shrink-0" />}
          {program.isFree && <GraduationCap className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
          {program.title}
        </CardTitle>
        {!compact && <CardDescription className="text-sm">{program.description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{program.duration}
          </span>
          {program.isSignalPlan && (
            <span className="flex items-center gap-1">
              <Signal className="h-3 w-3" />Signals
            </span>
          )}
          {program.isFree && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />WhatsApp
            </span>
          )}
        </div>
        <ul className="space-y-1.5">
          {(compact ? program.features.slice(0, 3) : program.features).map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3.5 w-3.5 text-success flex-shrink-0" />
              {feature}
            </li>
          ))}
          {compact && program.features.length > 3 && (
            <li className="text-xs text-muted-foreground">+{program.features.length - 3} more</li>
          )}
        </ul>
        {hasAccess ? (
          <Button variant="outline" className="w-full" size="sm" onClick={onViewLessons}>
            <ArrowRight className="h-4 w-4 mr-2" />
            {program.isSignalPlan ? "View Signals" : "Continue Learning"}
          </Button>
        ) : program.isFree ? (
          <Button variant="outline" className="w-full border-success/30 text-success hover:bg-success/10" size="sm" onClick={onEnroll}>
            <Sparkles className="h-4 w-4 mr-2" />
            Start Free Course
          </Button>
        ) : (
          <Button variant="gold" className="w-full" size="sm" onClick={onEnroll} disabled={enrolling}>
            {enrolling ? "Processing..." : <><Star className="h-4 w-4 mr-2" />Subscribe — ${program.price}</>}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export { COURSE_PROGRAMS };
export type { CourseProgram };
