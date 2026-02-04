import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DERIV_APP_ID = Deno.env.get("DERIV_APP_ID") || "99139";

// Cache for active symbols (refresh every 5 minutes)
let cachedSymbols: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return cached if valid
    if (cachedSymbols && (Date.now() - cacheTime) < CACHE_DURATION) {
      return new Response(JSON.stringify({
        symbols: cachedSymbols,
        cached: true,
        cache_age_ms: Date.now() - cacheTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Connect to Deriv WS
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`);
    
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Request timeout'));
      }, 15000);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          active_symbols: 'brief',
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
          resolve(data.active_symbols);
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
    });

    // Group by market
    const symbols = result as any[];
    const grouped: Record<string, any[]> = {};
    
    for (const sym of symbols) {
      const market = sym.market_display_name || sym.market;
      if (!grouped[market]) {
        grouped[market] = [];
      }
      grouped[market].push({
        symbol: sym.symbol,
        display_name: sym.display_name,
        market: sym.market,
        submarket: sym.submarket,
        pip: sym.pip,
        is_trading_suspended: sym.is_trading_suspended,
        exchange_is_open: sym.exchange_is_open,
      });
    }

    // Update cache
    cachedSymbols = grouped;
    cacheTime = Date.now();

    return new Response(JSON.stringify({
      symbols: grouped,
      cached: false,
      total: symbols.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Active symbols error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
