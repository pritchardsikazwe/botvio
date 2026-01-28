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
