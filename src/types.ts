export type Market = 'CRYPTO' | 'TWSE' | 'US';
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1wk' | '1mo';

export interface OHLCV {
  time: number;
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
  bid?: number;
  ask?: number;
  volume?: number;
  timestamp?: number;
}

export interface Symbol {
  symbol: string;
  display: string;
  name?: string;
}