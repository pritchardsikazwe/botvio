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
  CreditCard, 
  Smartphone, 
  Bitcoin, 
  Globe,
  Check,
  ArrowRight,
  Wallet
} from "lucide-react";

interface PaymentMethodSelectorProps {
  planCode: string;
  planName: string;
  amount: number;
  currency?: string;
  onPaymentInitiated?: (method: string, details: any) => void;
}

export const PaymentMethodSelector = ({
  planCode,
  planName,
  amount,
  currency = "USD",
  onPaymentInitiated,
}: PaymentMethodSelectorProps) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("GLOBAL");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>({});

  const { data: countries, isLoading: countriesLoading } = useCountries();
  const { data: paymentOptions, isLoading: optionsLoading } = usePaymentOptions(selectedCountry);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "crypto":
        return <Bitcoin className="h-5 w-5" />;
      case "mobile_money":
        return <Smartphone className="h-5 w-5" />;
      case "card":
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case "crypto":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "mobile_money":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "card":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const groupedOptions = paymentOptions?.reduce((acc, opt) => {
    if (!acc[opt.method_type]) {
      acc[opt.method_type] = [];
    }
    acc[opt.method_type].push(opt);
    return acc;
  }, {} as Record<string, typeof paymentOptions>);

  const handlePayment = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    const selectedOption = paymentOptions?.find((opt) => opt.provider_code === selectedMethod);
    
    if (selectedOption?.method_type === "crypto") {
      // Show crypto payment address
      toast.info(`Send ${amount} ${currency} worth of ${selectedOption.display_name} to complete payment. Address will be shown after confirmation.`);
    } else if (selectedOption?.method_type === "mobile_money") {
      if (!paymentDetails.phone) {
        toast.error("Please enter your mobile money number");
        return;
      }
      toast.info(`Payment request sent to ${paymentDetails.phone}. Please confirm on your phone.`);
    } else if (selectedOption?.method_type === "card") {
      toast.info("Redirecting to secure card payment...");
    }

    onPaymentInitiated?.(selectedMethod, {
      ...paymentDetails,
      amount,
      currency,
      planCode,
    });
  };

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
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Your Country (for mobile money)
          </Label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GLOBAL">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Global (Crypto & Cards)
                </span>
              </SelectItem>
              {!countriesLoading &&
                countries?.map((country) => (
                  <SelectItem key={country.country_code} value={country.country_code}>
                    {country.country_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Methods */}
        {optionsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedOptions || {}).map(([type, options]) => (
              <div key={type} className="space-y-3">
                <h4 className="text-sm font-medium capitalize flex items-center gap-2">
                  {getMethodIcon(type)}
                  {type.replace("_", " ")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {options?.slice(0, 10).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedMethod(option.provider_code)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedMethod === option.provider_code
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${getMethodColor(type)}`}>
                            {getMethodIcon(type)}
                          </div>
                          <span className="font-medium text-sm">{option.display_name}</span>
                        </div>
                        {selectedMethod === option.provider_code && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      {option.currency !== "USD" && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {option.currency}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Money Phone Input */}
        {selectedMethod && paymentOptions?.find((opt) => opt.provider_code === selectedMethod)?.method_type === "mobile_money" && (
          <div className="space-y-2">
            <Label>Mobile Money Number</Label>
            <Input
              type="tel"
              placeholder="e.g., 0971234567"
              value={paymentDetails.phone || ""}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, phone: e.target.value })}
            />
          </div>
        )}

        {/* Pay Button */}
        <Button
          className="w-full"
          size="lg"
          disabled={!selectedMethod}
          onClick={handlePayment}
        >
          Pay ${amount}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Payments are processed securely. By proceeding, you agree to our terms of service.
        </p>
      </CardContent>
    </Card>
  );
};
