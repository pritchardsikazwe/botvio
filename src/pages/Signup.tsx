import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Mail, Lock, User, Globe, Phone, Crown, Zap, Star, Gift, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";

const PLANS = [
  { code: "free", name: "Free Trial", price: "$0/mo", icon: Gift, description: "5 chart analyses/day" },
  { code: "basic", name: "Basic", price: "$10/mo", icon: Star, description: "50 analyses/week + signals" },
  { code: "standard", name: "Standard", price: "$25/mo", icon: Zap, description: "100 analyses/month + copy trade" },
  { code: "vip", name: "VIP", price: "$49/mo", icon: Crown, description: "Unlimited + all strategies" },
];
const COUNTRIES = [["ZM","Zambia"],["KE","Kenya"],["NG","Nigeria"],["ZA","South Africa"],["GH","Ghana"],["TZ","Tanzania"],["UG","Uganda"],["RW","Rwanda"],["MW","Malawi"],["ZW","Zimbabwe"],["BW","Botswana"],["MZ","Mozambique"],["ET","Ethiopia"],["CD","DR Congo"],["CM","Cameroon"],["SN","Senegal"],["CI","Côte d’Ivoire"],["US","United States"],["GB","United Kingdom"],["CA","Canada"],["AU","Australia"],["IN","India"],["PK","Pakistan"],["BD","Bangladesh"],["MY","Malaysia"],["ID","Indonesia"],["PH","Philippines"],["AE","UAE"],["SA","Saudi Arabia"],["BR","Brazil"],["MX","Mexico"],["CO","Colombia"],["FR","France"],["DE","Germany"],["IT","Italy"],["ES","Spain"],["PT","Portugal"],["NL","Netherlands"],["JP","Japan"],["CN","China"],["RU","Russia"]].sort((a,b)=>a[1].localeCompare(b[1]));

export default function Signup() {
  const { signUp } = useAuth(); const navigate = useNavigate();
  const [loading,setLoading]=useState(false), [googleLoading,setGoogleLoading]=useState(false), [email,setEmail]=useState(""), [password,setPassword]=useState(""), [displayName,setDisplayName]=useState(""), [country,setCountry]=useState(""), [whatsapp,setWhatsapp]=useState(""), [selectedPlan,setSelectedPlan]=useState("free");
  const submit=async(e:React.FormEvent)=>{ e.preventDefault(); if(!displayName.trim()||!whatsapp.trim()){toast({title:"Complete your profile",description:"Full name and WhatsApp number are required.",variant:"destructive"});return;} setLoading(true); const {error}=await signUp(email,password,country,whatsapp,selectedPlan,displayName.trim()); if(error) toast({title:"Sign up failed",description:error.message,variant:"destructive"}); else {toast({title:"Account created!",description:"Please check your email to verify your account."});navigate("/dashboard");} setLoading(false); };
  const google=async()=>{setGoogleLoading(true);try{const {error}=await lovable.auth.signInWithOAuth("google",{redirect_uri:window.location.origin});if(error)toast({title:"Google sign-up failed",description:error.message,variant:"destructive"});}catch(err:any){toast({title:"Google sign-up failed",description:err?.message||"Unknown error",variant:"destructive"});}finally{setGoogleLoading(false);}};
  return <div className="min-h-screen bg-background"><Header/><main className="container mx-auto max-w-3xl px-4 py-8"><div className="mb-8 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><User className="h-6 w-6"/></div><h1 className="text-3xl font-bold">Create your Botvio account</h1><p className="mt-2 text-muted-foreground">Set up your account once, then manage trading, signals, copy trading and billing from your workspace.</p></div>
    <Card className="mx-auto max-w-2xl border-border/60 shadow-sm"><CardHeader><CardTitle>Sign Up</CardTitle><CardDescription>Your account is created on this page — no popup.</CardDescription></CardHeader><CardContent>
      <Button type="button" variant="outline" className="mb-6 w-full" onClick={google} disabled={googleLoading}>{googleLoading?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<span className="mr-2 font-bold">G</span>} Continue with Google</Button>
      <div className="mb-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border"/><span>OR</span><div className="h-px flex-1 bg-border"/></div>
      <form onSubmit={submit} className="space-y-5"><div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="signup-name"><User className="mr-2 inline h-4 w-4"/>Full Name *</Label><Input id="signup-name" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="John Doe" required/></div>
        <div className="space-y-2"><Label htmlFor="signup-email"><Mail className="mr-2 inline h-4 w-4"/>Email *</Label><Input id="signup-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="trader@example.com" required/></div>
        <div className="space-y-2"><Label htmlFor="signup-password"><Lock className="mr-2 inline h-4 w-4"/>Password *</Label><Input id="signup-password" type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 6 characters" required/></div>
        <div className="space-y-2"><Label htmlFor="signup-whatsapp"><Phone className="mr-2 inline h-4 w-4"/>WhatsApp Number *</Label><Input id="signup-whatsapp" type="tel" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="+260 97 1234567" required/></div>
      </div>
      <div className="space-y-2"><Label><Globe className="mr-2 inline h-4 w-4"/>Country</Label><Select value={country} onValueChange={setCountry}><SelectTrigger><SelectValue placeholder="Select your country"/></SelectTrigger><SelectContent className="max-h-60">{COUNTRIES.map(([code,name])=><SelectItem key={code} value={code}>{name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-3"><Label><Crown className="mr-2 inline h-4 w-4"/>Choose your starting plan</Label><RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid gap-3 sm:grid-cols-2">{PLANS.map(p=>{const Icon=p.icon;return <Label key={p.code} htmlFor={"plan-"+p.code} className={"flex cursor-pointer items-center gap-3 rounded-xl border p-4 "+(selectedPlan===p.code?"border-primary bg-primary/5":"border-border hover:border-primary/40")}><RadioGroupItem value={p.code} id={"plan-"+p.code} className="sr-only"/><Icon className="h-5 w-5 text-primary"/><span><span className="block font-semibold">{p.name}</span><span className="text-xs text-muted-foreground">{p.price} · {p.description}</span></span></Label>})}</RadioGroup></div>
      <Button type="submit" disabled={loading} className="w-full" variant="gold">{loading?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating account...</>:<>Create Account <ArrowRight className="ml-2 h-4 w-4"/></>}</Button></form>
      <p className="mt-5 text-center text-sm text-muted-foreground">Already have an account? <Link to="/" className="font-semibold text-primary">Sign in from the header</Link></p>
    </CardContent></Card></main></div>;
}