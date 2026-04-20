export interface OHLCV {
  time: number;     // Unix timestamp (秒)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
}

export type Market = 'CRYPTO' | 'TWSE' | 'US';
export type Timeframe = '15m' | '1h' | '4h' | '1d' | '1wk' | '1mo';

export interface Symbol {
  symbol: string;   // API 用的 ID
  display: string;  // 顯示名稱
  name?: string;    // 完整名稱（TWSE/US 用）
}