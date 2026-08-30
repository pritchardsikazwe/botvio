// Botvio Type Definitions

export interface Broker {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface TradingAccount {
  id: string;
  user_id: string;
  broker: "deriv" | "binance";
  label: string;
  login_id: string | null;
  api_key_encrypted: string;
  api_secret_encrypted: string | null;
  permissions_json: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bot {
  id: string;
  code: string;
  name: string;
  short_description: string | null;
  description: string | null;
  supported_brokers: string[];
  default_markets: string[];
  is_premium: boolean;
  config_schema_json: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface BotInstance {
  id: string;
  user_id: string;
  bot_id: string;
  trading_account_id: string;
  name: string;
  status: "active" | "paused" | "stopped";
  markets: string[];
  config_json: Record<string, unknown>;
  risk_per_trade_percent: number;
  max_daily_loss_percent: number;
  max_open_trades: number;
  max_stake: number;
  created_at: string;
  updated_at: string;
  // Joined data
  bot?: Bot;
  trading_account?: TradingAccount;
}

export interface Provider {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  primary_market: string | null;
  verified: boolean;
  status: "pending" | "approved" | "rejected" | "suspended";
  total_subscribers: number;
  total_trades: number;
  win_rate: number;
  total_profit: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderAccount {
  id: string;
  provider_id: string;
  trading_account_id: string;
  status: "active" | "paused" | "stopped";
  created_at: string;
  trading_account?: TradingAccount;
}

export interface CopySubscription {
  id: string;
  provider_id: string;
  subscriber_user_id: string;
  subscriber_trading_account_id: string;
  status: "active" | "paused" | "stopped";
  copy_mode: "fixed" | "multiplier" | "proportional";
  fixed_stake: number;
  multiplier: number;
  proportional_mode: "balance_ratio" | "equity_ratio";
  max_drawdown_percent?: number;
  equity_floor_usd?: number | null;
  daily_loss_limit_usd?: number | null;
  baseline_equity_usd?: number | null;
  drawdown_breached_at?: string | null;
  approval_status?: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
  updated_at: string;
  // Joined
  provider?: Provider;
  subscriber_trading_account?: TradingAccount;
}

export interface ProviderTrade {
  id: string;
  provider_id: string;
  provider_trading_account_id: string;
  broker: string;
  symbol: string;
  direction: "BUY" | "SELL";
  stake: number;
  duration: number;
  duration_unit: string;
  broker_trade_id: string | null;
  status: "open" | "closed" | "error";
  profit_loss: number | null;
  created_at: string;
  closed_at: string | null;
}

export interface CopiedTrade {
  id: string;
  provider_trade_id: string;
  subscriber_user_id: string;
  subscriber_trading_account_id: string;
  broker_trade_id: string | null;
  symbol: string;
  direction: "BUY" | "SELL";
  stake: number;
  status: "open" | "closed" | "error";
  profit_loss: number | null;
  opened_at: string;
  closed_at: string | null;
}

export interface BotTrade {
  id: string;
  bot_instance_id: string;
  broker_trade_id: string | null;
  symbol: string;
  side: "BUY" | "SELL";
  stake: number | null;
  quantity: number | null;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  status: "open" | "closed" | "cancelled" | "error";
  pnl: number | null;
  opened_at: string;
  closed_at: string | null;
}

export interface RiskSession {
  id: string;
  user_id: string;
  trading_account_id: string;
  date: string;
  start_balance: number | null;
  current_balance: number | null;
  daily_pnl: number;
  stop_trading: boolean;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  id: string;
  code: string;
  name: string;
  price_usd: number;
  price_zmw: number;
  max_bot_instances: number;
  max_accounts: number;
  allow_copy_trading: boolean;
  allow_premium_bots: boolean;
  allow_provider_listing: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserPlanSubscription {
  id: string;
  user_id: string;
  pricing_plan_id: string;
  status: "active" | "cancelled" | "expired";
  current_period_start: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  pricing_plan?: PricingPlan;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "trade";
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action_type: string;
  payload_json: Record<string, unknown>;
  created_at: string;
}

// API response types
export interface ExecuteCopyResult {
  success: boolean;
  provider_trade: {
    id: string;
    contract_id: string;
    buy_price: number;
  };
  copy_results: {
    subscriber_user_id: string;
    subscriber_account_id: string;
    stake: number;
    status: "success" | "error";
    contract_id?: string;
    error?: string;
  }[];
  summary: {
    total_subscribers: number;
    successful_copies: number;
    failed_copies: number;
  };
}
