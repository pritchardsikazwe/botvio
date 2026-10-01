import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bitcoin, Check, ArrowRight, Wallet, Copy, Upload, Phone, Smartphone, MessageCircle } from "lucide-react";

const CRYPTO_WALLETS = [
  { key: "bitcoin", label: "Bitcoin (BTC)", network: "Bitcoin", address: "bc1q7r2ahssecmldf960gc4dklapfe5nkph2fh5etx", icon: "₿" },
  { key: "usdt", label: "Tether (USDT)", network: "ERC20", address: "0x4CdDb5A96d2c9c2A2B1c97878F74126e11C616a6", icon: "₮" },
];

interface PaymentMethodSelectorProps {
  planCode: string;
  planName: string;
  amount: number;
  currency?: string;
  onPaymentInitiated?: (method: string, details: any) => void;
  onOfflinePayment?: (method: string, proofFile?: File) => void;
  /** If true, hides the "Complete Order" button (parent handles submission) */
  embedded?: boolean;
  /** Callback when proof file changes */
  onProofFileChange?: (file: File | null) => void;
  /** Callback when selected method changes */
  onMethodChange?: (method: string) => void;
}

export const PaymentMethodSelector = ({
  planCode, planName, amount, currency = "USD",
  onPaymentInitiated, onOfflinePayment, embedded, onProofFileChange, onMethodChange,
}: PaymentMethodSelectorProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const selectMethod = (method: string) => {
    setSelectedMethod(method);
    onPaymentInitiated?.(method, { planCode, amount, currency });
    onMethodChange?.(method);
  };

  const handleCompleteOrder = () => {
    if (!selectedMethod) return toast.error("Please select a payment method");
    if (!proofFile) return toast.error("Please attach your payment confirmation screenshot");
    onOfflinePayment?.(selectedMethod, proofFile);
    toast.success("Payment submitted. Botvio will verify it before activation.");
  };

  const activeWallet = CRYPTO_WALLETS.find(w => w.key === selectedMethod);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-5 w-5 text-primary" />Select Payment Method</CardTitle>
        <p className="text-sm text-muted-foreground">Pay <span className="font-bold text-primary">${amount}</span> for {planName}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CRYPTO_WALLETS.map(wallet => (
            <button key={wallet.key} type="button" onClick={() => selectMethod(wallet.key)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === wallet.key ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-lg font-bold">{wallet.icon}</div>
                  <div><span className="font-semibold text-sm block">{wallet.label}</span><span className="text-xs text-muted-foreground">{wallet.network}</span></div>
                </div>
                {selectedMethod === wallet.key && <Check className="h-4 w-4 text-primary" />}
              </div>
            </button>
          ))}
          <button type="button" onClick={() => selectMethod("google_pay")}
            className={`p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === "google_pay" ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:border-emerald-500/50"}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center"><Smartphone className="h-5 w-5" /></div>
                <div><span className="font-semibold text-sm block">Google Pay</span><span className="text-xs text-muted-foreground">Digital payment</span></div>
              </div>
              {selectedMethod === "google_pay" && <Check className="h-4 w-4 text-emerald-600" />}
            </div>
          </button>
        </div>

        {activeWallet && (
          <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <h4 className="text-sm font-bold flex items-center gap-2"><Bitcoin className="h-4 w-4 text-primary" />Send ${amount} in {activeWallet.label}</h4>
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Network: {activeWallet.network}</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono break-all flex-1">{activeWallet.address}</code>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(activeWallet.address); toast.success("Wallet address copied"); }}><Copy className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        )}

        {selectedMethod === "google_pay" && (
          <div className="space-y-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <h4 className="text-sm font-bold flex items-center gap-2"><Smartphone className="h-4 w-4 text-emerald-600" />Google Pay</h4>
            <p className="text-sm text-muted-foreground">Complete your Google Pay payment using the Botvio merchant/payment details provided at checkout, then attach the confirmation.</p>
            <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">Google Pay requires a configured merchant/payment gateway. No merchant account is fabricated here.</div>
          </div>
        )}

        {selectedMethod && (
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1"><Upload className="h-3 w-3" />Attach payment confirmation *</Label>
            <Input type="file" accept="image/*,.pdf" onChange={e => { const file=e.target.files?.[0]||null; setProofFile(file); onProofFileChange?.(file); }} />
          </div>
        )}

        {!embedded && <Button className="w-full" size="lg" disabled={!selectedMethod} onClick={handleCompleteOrder}>Submit Payment — ${amount}<ArrowRight className="ml-2 h-4 w-4" /></Button>}

        <p className="text-xs text-muted-foreground text-center">Payment is manually verified before paid signal access is activated.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <a href="https://wa.me/260966284085?text=Hi%20Botvio%20Support%2C%20I%20need%20help%20with%20my%20payment" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm font-medium"><MessageCircle className="h-4 w-4" />WhatsApp Support</a>
          <a href="mailto:info@botvio.live" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium"><Mail className="h-4 w-4" />info@botvio.live</a>
        </div>
      </CardContent>
    </Card>
  );
};
