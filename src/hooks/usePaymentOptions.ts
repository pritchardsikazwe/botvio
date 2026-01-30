import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentOption {
  id: string;
  country_code: string;
  country_name: string;
  method_type: string;
  provider_name: string;
  provider_code: string;
  display_name: string;
  icon_url: string | null;
  is_active: boolean;
  priority: number;
  min_amount: number;
  max_amount: number;
  currency: string;
}

export const usePaymentOptions = (countryCode?: string) => {
  return useQuery({
    queryKey: ["payment-options", countryCode],
    queryFn: async () => {
      let query = supabase
        .from("payment_options")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Filter: show global options + country-specific options
      const options = (data as PaymentOption[]).filter(
        (opt) => opt.country_code === "GLOBAL" || opt.country_code === countryCode
      );

      return options;
    },
  });
};

export const useCountries = () => {
  return useQuery({
    queryKey: ["payment-countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_options")
        .select("country_code, country_name")
        .eq("is_active", true)
        .neq("country_code", "GLOBAL");

      if (error) throw error;

      // Get unique countries
      const uniqueCountries = Array.from(
        new Map(data.map((item) => [item.country_code, item])).values()
      );

      return uniqueCountries.sort((a, b) => a.country_name.localeCompare(b.country_name));
    },
  });
};
