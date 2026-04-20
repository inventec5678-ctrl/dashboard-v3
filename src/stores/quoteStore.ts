import { createStore } from 'solid-js/store';
import type { Quote } from '../types';
import { fetchCryptoQuote, fetchTWSEQuote, fetchUSQuote } from '../services/api';
import { cacheGet, cacheSet } from '../services/cache';
import { store as marketStore } from './marketStore';

interface QuoteStore {
  quote: Quote | null;
  lastUpdated: number | null;  // Unix ms
  isLoading: boolean;
  error: string | null;
  fetchQuote: () => Promise<void>;
  clear: () => void;
}

const QUOTE_TTL = 30000; // 30秒快取

const [store, setStore] = createStore<QuoteStore>({
  quote: null,
  lastUpdated: null,
  isLoading: false,
  error: null,
  async fetchQuote() {
    const { market, symbol } = marketStore;
    const cacheKey = `${market}|quote|${symbol}`;
    const cached = cacheGet<Quote>(cacheKey);
    if (cached) {
      setStore({ quote: cached, lastUpdated: Date.now(), error: null });
      return;
    }
    setStore({ isLoading: true, error: null });
    try {
      const fetchers: Record<string, (s: string) => Promise<Quote>> = {
        CRYPTO: fetchCryptoQuote,
        TWSE: fetchTWSEQuote,
        US: fetchUSQuote,
      };
      const quote = await fetchers[market](symbol);
      cacheSet(cacheKey, quote, QUOTE_TTL);
      setStore({ quote, lastUpdated: Date.now(), isLoading: false, error: null });
    } catch (e: any) {
      setStore({ error: e.message, isLoading: false });
    }
  },
  clear() {
    setStore({ quote: null, lastUpdated: null, error: null });
  },
});

export { store as quoteStore };