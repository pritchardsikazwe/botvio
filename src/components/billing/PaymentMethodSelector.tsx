import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bitcoin, Check, ArrowRight, Wallet, Copy, Upload, Phone } from "lucide-react";

const CRYPTO_WALLETS = [
  {
    key: "btc",
    label: "Bitcoin (BTC)",
    network: "Bitcoin",
    address: "bc1q7r2ahssecmldf960gc4dklapfe5nkph2fh5etx",
    icon: "₿",
  },
  {
    key: "usdt_erc20",
    label: "Tether ERC20 (eUSDT)",
    network: "ERC20",
    address: "0x4CdDb5A96d2c9c2A2B1c97878F74126e11C616a6",
    icon: "₮",
  },
];

const MOBILE_MONEY = [
  {
    key: "airtel_money",
    label: "Airtel Money",
    network: "Airtel",
    number: "+260777204440",
    name: "Pritchard Sikazwe",
    icon: "📱",
  },
  {
    key: "mtn_money",
    label: "MTN Mobile Money",
    network: "MTN",
    number: "+260966284085",
    name: "Pritchard Sikazwe",
    icon: "📱",
  },
];

interface PaymentMethodSelectorProps {
  planCode: string;
  planName: string;
  amount: number;
  currency?: string;
  onPaymentInitiated?: (method: string, details: any) => void;
  onOfflinePayment?: (method: string, proofFile?: File) => void;
}

export const PaymentMethodSelector = ({
  planCode, planName, amount, currency = "USD",
  onPaymentInitiated, onOfflinePayment,
}: PaymentMethodSelectorProps) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompleteOrder = () => {
    if (!selectedWallet) { toast.error("Please select a payment method"); return; }
    if (!proofFile) {
      toast.error("Please attach your payment confirmation screenshot");
      return;
    }
    onOfflinePayment?.(selectedWallet, proofFile);
    toast.success("Order submitted! Admin will confirm your payment shortly.");
  };

  const activeWallet = CRYPTO_WALLETS.find(w => w.key === selectedWallet);
  const activeMobile = MOBILE_MONEY.find(m => m.key === selectedWallet);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Select Payment Method
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pay <span className="font-bold text-primary">${amount}</span> for {planName}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Crypto Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Bitcoin className="h-5 w-5" /> Cryptocurrency
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CRYPTO_WALLETS.map((wallet) => (
              <button
                key={wallet.key}
                onClick={() => setSelectedWallet(wallet.key)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedWallet === wallet.key
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 text-lg font-bold">
                      {wallet.icon}
                    </div>
                    <div>
                      <span className="font-medium text-sm block">{wallet.label}</span>
                      <span className="text-xs text-muted-foreground">Network: {wallet.network}</span>
                    </div>
                  </div>
                  {selectedWallet === wallet.key && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet Details */}
        {activeWallet && (
          <div className="space-y-3 p-4 rounded-lg border border-orange-500/20 bg-orange-500/5">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-orange-500" />
              Send ${amount} in {activeWallet.label}:
            </h4>
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Network: {activeWallet.network}</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono break-all flex-1">{activeWallet.address}</code>
                <Button size="sm" variant="outline" onClick={() => handleCopyAddress(activeWallet.address)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Upload className="h-3 w-3" /> Attach payment screenshot *
              </Label>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        )}

        {/* Complete Order Button */}
        <Button className="w-full" size="lg" disabled={!selectedWallet} onClick={handleCompleteOrder}>
          Complete Order — ${amount}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          After payment, admin will verify and activate your subscription within 24 hours.
        </p>
      </CardContent>
    </Card>
  );
};
