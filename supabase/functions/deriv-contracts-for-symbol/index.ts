import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Legacy WS API requires numeric app_id, not the new OAuth2 client_id

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    // Connect to Deriv WS
    const ws = new WebSocket(`wss://api.derivws.com/trading/v1/options/ws/public`);
    
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Request timeout'));
      }, 15000);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          contracts_for: symbol,
          currency: 'USD',
          landing_company: 'svg',
          product_type: 'basic'
        }));
      };

      ws.onmessage = (event) => {
        clearTimeout(timeout);
        const data = JSON.parse(event.data);
        ws.close();
        
        if (data.error) {
          reject(new Error(data.error.message));
        } else {
          resolve(data.contracts_for);
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
    });

    // Group contracts by category
    const contracts = result as any;
    const grouped: Record<string, any[]> = {};
    
    if (contracts?.available) {
      for (const contract of contracts.available) {
        const category = contract.contract_category_display || 'Other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push({
          contract_type: contract.contract_type,
          display_name: contract.contract_display,
          category: contract.contract_category,
          min_stake: contract.min_stake,
          max_stake: contract.max_stake,
          duration_units: contract.expiry_type,
          multiplier_range: contract.multiplier_range,
          barrier_range: contract.barriers,
        });
      }
    }

    return new Response(JSON.stringify({
      symbol: contracts?.symbol,
      display_name: contracts?.symbol_display,
      market: contracts?.market,
      contracts: grouped,
      raw: contracts
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Contracts for symbol error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
