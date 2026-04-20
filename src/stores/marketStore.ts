import { createStore } from 'solid-js/store';
import type { Market, Timeframe, Symbol } from '../types';
import { fetchCryptoSymbols, fetchTWSESymbols, fetchUSSymbols } from '../services/api';

interface MarketStore {
  market: Market;
  symbol: string;
  interval: Timeframe;
  symbols: Symbol[];
  isLoading: boolean;
  setMarket: (m: Market) => void;
  setSymbol: (s: string) => void;
  setInterval: (i: Timeframe) => void;
  loadSymbols: () => Promise<void>;
}

const defaults: Record<Market, string> = { CRYPTO: 'BTCUSDT', TWSE: '2330', US: 'AAPL' };

const [store, setStore] = createStore<MarketStore>({
  market: 'CRYPTO',
  symbol: 'BTCUSDT',
  interval: '1d',
  symbols: [],
  isLoading: false,
  setMarket(m) {
    setStore('market', m);
    setStore('symbol', defaults[m]);
    this.loadSymbols();
  },
  setSymbol(s) { setStore('symbol', s); },
  setInterval(i) { setStore('interval', i); },
  async loadSymbols() {
    setStore('isLoading', true);
    try {
      const fetchers: Record<Market, () => Promise<Symbol[]>> = {
        CRYPTO: fetchCryptoSymbols,
        TWSE: fetchTWSESymbols,
        US: fetchUSSymbols,
      };
      const symbols = await fetchers[store.market]();
      setStore('symbols', symbols);
    } finally {
      setStore('isLoading', false);
    }
  },
});

export { store };