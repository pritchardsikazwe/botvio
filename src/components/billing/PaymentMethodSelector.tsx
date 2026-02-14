import { useState } from "react";
import { usePaymentOptions, useCountries } from "@/hooks/usePaymentOptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  CreditCard, Smartphone, Bitcoin, Globe,
  Check, ArrowRight, Wallet, Copy, Upload
} from "lucide-react";

// Your crypto wallet addresses
const CRYPTO_WALLETS: Record<string, { address: string; network: string }> = {
  usdt: { address: "TRC20: TYourWalletAddressHere", network: "TRC20" },
  btc: { address: "bc1qYourBTCAddressHere", network: "Bitcoin" },
  eth: { address: "0xYourETHAddressHere", network: "ERC20" },
};

// Your mobile money details
const MOBILE_MONEY_DETAILS = {
  name: "Botvio Trading",
  numbers: {
    airtel_money: "+260 97X XXX XXX",
    mtn_money: "+260 96X XXX XXX",
    zamtel: "+260 95X XXX XXX",
  } as Record<string, string>,
};

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
  const [selectedCountry, setSelectedCountry] = useState<string>("GLOBAL");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedMethodType, setSelectedMethodType] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: countries, isLoading: countriesLoading } = useCountries();
  const { data: paymentOptions, isLoading: optionsLoading } = usePaymentOptions(selectedCountry);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "crypto": return <Bitcoin className="h-5 w-5" />;
      case "mobile_money": return <Smartphone className="h-5 w-5" />;
      case "card": return <CreditCard className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case "crypto": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "mobile_money": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "card": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const groupedOptions = paymentOptions?.reduce((acc, opt) => {
    if (!acc[opt.method_type]) acc[opt.method_type] = [];
    acc[opt.method_type].push(opt);
    return acc;
  }, {} as Record<string, typeof paymentOptions>);

  const handleSelectMethod = (providerCode: string, methodType: string) => {
    setSelectedMethod(providerCode);
    setSelectedMethodType(methodType);
  };

  const handleCopyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompleteOrder = () => {
    if (!selectedMethod) { toast.error("Please select a payment method"); return; }

    if (selectedMethodType === "crypto" && !proofFile) {
      toast.error("Please attach your payment confirmation screenshot");
      return;
    }

    if (selectedMethodType === "mobile_money" && !proofFile) {
      toast.error("Please attach your payment confirmation screenshot");
      return;
    }

    // Submit for admin review
    onOfflinePayment?.(selectedMethod, proofFile || undefined);
    toast.success("Order submitted! Admin will confirm your payment shortly.");
  };

  // Get crypto wallet for selected method
  const cryptoKey = selectedMethod?.replace("crypto_", "").toLowerCase() || "";
  const cryptoWallet = CRYPTO_WALLETS[cryptoKey] || CRYPTO_WALLETS.usdt;

  // Get mobile number for selected method
  const mobileNumber = MOBILE_MONEY_DETAILS.numbers[selectedMethod || ""] || MOBILE_MONEY_DETAILS.numbers.airtel_money;

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
        {/* Country Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Globe className="h-4 w-4" />Your Country</Label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger><SelectValue placeholder="Select your country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GLOBAL"><span className="flex items-center gap-2"><Globe className="h-4 w-4" />Global (Crypto & Cards)</span></SelectItem>
              {!countriesLoading && countries?.map((country) => (
                <SelectItem key={country.country_code} value={country.country_code}>{country.country_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Methods */}
        {optionsLoading ? (
          <div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedOptions || {}).map(([type, options]) => (
              <div key={type} className="space-y-3">
                <h4 className="text-sm font-medium capitalize flex items-center gap-2">
                  {getMethodIcon(type)} {type.replace("_", " ")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {options?.slice(0, 10).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelectMethod(option.provider_code, type)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedMethod === option.provider_code ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${getMethodColor(type)}`}>{getMethodIcon(type)}</div>
                          <span className="font-medium text-sm">{option.display_name}</span>
                        </div>
                        {selectedMethod === option.provider_code && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Crypto Payment Details */}
        {selectedMethod && selectedMethodType === "crypto" && (
          <div className="space-y-3 p-4 rounded-lg border border-orange-500/20 bg-orange-500/5">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-orange-500" />
              Send ${amount} to this wallet:
            </h4>
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Network: {cryptoWallet.network}</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono break-all flex-1">{cryptoWallet.address}</code>
                <Button size="sm" variant="outline" onClick={() => handleCopyAddress(cryptoWallet.address)}>
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

        {/* Mobile Money Payment Details */}
        {selectedMethod && selectedMethodType === "mobile_money" && (
          <div className="space-y-3 p-4 rounded-lg border border-success/20 bg-success/5">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-success" />
              Send ${amount} to:
            </h4>
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-sm font-bold">{MOBILE_MONEY_DETAILS.name}</p>
              <p className="text-sm font-mono mt-1">{mobileNumber}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Send the payment, then attach your confirmation screenshot below and press Complete Order.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Upload className="h-3 w-3" /> Attach payment screenshot *
              </Label>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        )}

        {/* Complete Order Button */}
        <Button className="w-full" size="lg" disabled={!selectedMethod} onClick={handleCompleteOrder}>
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
