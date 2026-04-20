import type { OHLCV, Quote, Symbol } from '../types';
import { cacheGet, cacheSet } from './cache';

const BASE = 'http://localhost:5006';

// 工具函式
async function apiFetch<T>(url: string, cacheKey?: string, ttl = 60000): Promise<T> {
  if (cacheKey) {
    const cached = cacheGet<T>(cacheKey);
    if (cached) return cached;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  if (cacheKey) cacheSet(cacheKey, data, ttl);
  return data as T;
}

// CRYPTO
export async function fetchCryptoSymbols(): Promise<Symbol[]> {
  const data = await apiFetch<{ data: { symbol: string; display: string }[] }>(
    `${BASE}/api/symbols/crypto`
  );
  return data.data || [];
}

export async function fetchCryptoKlines(symbol: string, interval: string, limit = 300): Promise<OHLCV[]> {
  const cacheKey = `CRYPTO|${symbol}|${interval}|${limit}`;
  const raw = await apiFetch<{ data: { time: number; open: number; high: number; low: number; close: number; volume: number }[] }>(
    `${BASE}/api/crypto/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    cacheKey
  );
  return raw.data || [];
}

export async function fetchCryptoQuote(symbol: string): Promise<Quote> {
  const cacheKey = `CRYPTO|quote|${symbol}`;
  return apiFetch<Quote>(`${BASE}/api/crypto/quote?symbol=${symbol}`, cacheKey, 30000);
}

// TWSE
export async function fetchTWSESymbols(): Promise<Symbol[]> {
  const data = await apiFetch<{ data: { code: string; name: string }[] }>(
    `${BASE}/api/symbols/twse`
  );
  return (data.data || []).map((s: { code: string; name: string }) => ({ symbol: s.code, display: s.name || s.code, name: s.name }));
}

export async function fetchTWSEKlines(code: string, interval: string, limit = 300): Promise<OHLCV[]> {
  // TWSE interval 1w → fallback 到 1mo（TWSE 沒有原生週K）
  const actualInterval = interval === '1w' ? '1mo' : interval;
  const cacheKey = `TWSE|${code}|${actualInterval}|${limit}`;
  const raw = await apiFetch<{ data: OHLCV[] }>(
    `${BASE}/api/twse/klines?stock=${code}&interval=${actualInterval}&limit=${limit}`,
    cacheKey
  );
  return raw.data || [];
}

export async function fetchTWSEQuote(code: string): Promise<Quote> {
  const cacheKey = `TWSE|quote|${code}`;
  return apiFetch<Quote>(`${BASE}/api/twse/quote?stock=${code}`, cacheKey, 30000);
}

// US
export async function fetchUSSymbols(): Promise<Symbol[]> {
  const data = await apiFetch<{ data: { symbol: string }[] }>(
    `${BASE}/api/symbols/us`
  );
  return (data.data || []).map((s: { symbol: string }) => ({ symbol: s.symbol, display: s.symbol }));
}

export async function fetchUSKlines(symbol: string, interval: string, limit = 300): Promise<OHLCV[]> {
  // US interval 1w → 改成 1wk（US 用 _1wk 檔名）
  const actualInterval = interval === '1w' ? '1wk' : interval;
  const cacheKey = `US|${symbol}|${actualInterval}|${limit}`;
  const raw = await apiFetch<{ data: OHLCV[] }>(
    `${BASE}/api/us/klines/${symbol}?interval=${actualInterval}&limit=${limit}`,
    cacheKey
  );
  return raw.data || [];
}

export async function fetchUSQuote(symbol: string): Promise<Quote> {
  const cacheKey = `US|quote|${symbol}`;
  return apiFetch<Quote>(`${BASE}/api/us/quote/${symbol}`, cacheKey, 30000);
}