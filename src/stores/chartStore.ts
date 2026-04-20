import { createStore } from 'solid-js/store';
import type { OHLCV } from '../types';
import { fetchCryptoKlines, fetchTWSEKlines, fetchUSKlines } from '../services/api';
import { cacheInvalidatePattern } from '../services/cache';
import { store as marketStore } from './marketStore';

interface ChartStore {
  data: OHLCV[];
  isLoading: boolean;
  error: string | null;
  fetchKlines: () => Promise<void>;
  invalidate: () => void;
}

let _requestId = 0;

const [store, setStore] = createStore<ChartStore>({
  data: [],
  isLoading: false,
  error: null,
  async fetchKlines() {
    const { market, symbol, interval } = marketStore;
    const myRequestId = ++_requestId;
    setStore({ isLoading: true, error: null });
    try {
      const fetchers = {
        CRYPTO: fetchCryptoKlines,
        TWSE: fetchTWSEKlines,
        US: fetchUSKlines,
      };
      const data = await fetchers[market](symbol, interval);
      // Ignore stale responses (if a newer request has been sent)
      if (myRequestId !== _requestId) return;
      setStore('data', data);
    } catch (e: any) {
      if (myRequestId !== _requestId) return;
      setStore('error', e.message);
    } finally {
      if (myRequestId !== _requestId) return;
      setStore('isLoading', false);
    }
  },
  invalidate() {
    setStore('data', []);
    cacheInvalidatePattern(`${marketStore.market}|${marketStore.symbol}|`);
  },
});

export { store };