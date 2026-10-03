import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/trading/Header";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";
import { usePricingPlans } from "@/hooks/useBotvio";
import { useCreatePaymentRequest, useUploadPaymentProof } from "@/hooks/useBilling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Payment(){
 const [params]=useSearchParams(); const navigate=useNavigate(); const {data:plans,isLoading}=usePricingPlans(); const createPaymentRequest=useCreatePaymentRequest(); const uploadProof=useUploadPaymentProof(); const [uploading,setUploading]=useState(false);
 const code=params.get("plan")||"vip"; const plan=plans?.find(p=>p.code===code&&p.is_active);
 const submit=async(method:string,proofFile?:File)=>{if(!plan)return;setUploading(true);try{let proofUrl:string|undefined;if(proofFile)proofUrl=await uploadProof.mutateAsync(proofFile);await createPaymentRequest.mutateAsync({plan_id:plan.id,amount_usd:plan.price_usd,method,proof_upload_url:proofUrl});toast.success("Payment submitted. Botvio will verify it before activation.");navigate("/billing");}catch{}finally{setUploading(false);}};
 return <div className="min-h-screen bg-background"><Header/><main className="container mx-auto max-w-4xl px-4 py-8"><div className="mb-6 flex items-center gap-3"><Button variant="ghost" size="icon" onClick={()=>navigate("/billing")}><ArrowLeft className="h-4 w-4"/></Button><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Botvio Billing</p><h1 className="text-2xl font-bold">Complete Payment</h1></div></div>
 {isLoading?<Skeleton className="h-[500px] w-full"/>:!plan?<Card><CardHeader><CardTitle>Plan not found</CardTitle></CardHeader><CardContent><Button asChild><Link to="/billing">Return to Billing</Link></Button></CardContent></Card>:<div className="grid gap-6 lg:grid-cols-[1fr_320px]"><Card><CardHeader><CardTitle>Payment details</CardTitle></CardHeader><CardContent><PaymentMethodSelector planCode={plan.code} planName={plan.name} amount={plan.price_usd} onOfflinePayment={submit} /></CardContent></Card><Card className="h-fit"><CardHeader><CardTitle>{plan.name}</CardTitle></CardHeader><CardContent><div className="text-4xl font-bold">${plan.price_usd}<span className="text-base font-normal text-muted-foreground">/month</span></div><div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success"/>Payment is reviewed before activation.</div>{uploading&&<p className="mt-3 text-xs text-muted-foreground">Uploading payment proof...</p>}</CardContent></Card></div>}
 </main></div>;
}