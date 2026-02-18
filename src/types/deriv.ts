export type DerivError = {
  code: string;
  message: string;
};

export type DerivAuthorize = {
  loginid: string;
  balance: number;
  currency: string;
  fullname?: string;
};

export type DerivBalance = {
  balance: number;
  currency: string;
  loginid: string;
  fullname?: string;
};

export type DerivTick = {
  symbol: string;
  quote: number;
  epoch: number;
  subscription_id?: string;
};

export type AuthorizeResponse = {
  msg_type: "authorize";
  authorize?: DerivAuthorize;
  error?: DerivError;
  req_id?: number;
};

export type BalanceResponse = {
  msg_type: "balance";
  balance?: {
    balance: number;
    currency: string;
    loginid: string;
  };
  error?: DerivError;
  req_id?: number;
};

export type TickResponse = {
  msg_type: "tick";
  tick?: {
    symbol: string;
    quote: number;
    epoch: number;
  };
  subscription?: {
    id: string;
  };
  error?: DerivError;
  req_id?: number;
};

export type ForgetResponse = {
  msg_type: "forget" | "forget_all";
  forget?: string;
  error?: DerivError;
  req_id?: number;
};

export type DerivAccountInfo = {
  loginid: string;
  is_virtual: boolean;
  currency: string;
  fullname?: string;
  account_list?: Array<{
    loginid: string;
    is_virtual: number;
    currency: string;
    account_type: string;
  }>;
};

export type DerivContractUpdate = {
  contract_id: number;
  buy_price: number;
  sell_price?: number;
  current_spot: number;
  current_spot_time: number;
  profit: number;
  profit_percentage: number;
  status: "open" | "won" | "lost" | "sold";
  is_expired: boolean;
  is_sold: boolean;
  is_valid_to_sell: boolean;
  entry_spot: number;
  exit_tick?: number;
  payout: number;
  longcode: string;
  underlying: string;
  contract_type: string;
};

export type DerivMessage =
  | AuthorizeResponse
  | BalanceResponse
  | TickResponse
  | ForgetResponse
  | {
      msg_type?: string;
      error?: DerivError;
      req_id?: number;
      [k: string]: unknown;
    };
