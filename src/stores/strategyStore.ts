import { createStore } from 'solid-js/store';

export interface Strategy {
  id: string;
  name: string;
  market: 'CRYPTO' | 'TWSE' | 'US';
  type: 'momentum' | 'mean-reversion' | 'breakout' | 'sentiment';
  signals: {
    overall: number;       // -100 to +100
    buySignals: string[];
    sellSignals: string[];
  };
  metrics: {
    winRate: number;       // 0-100%
    profitFactor: number;
    maxDrawdown: number;  // 0-100%
    sharpe: number;
  };
  updatedAt: number;       // Unix ms
}

interface StrategyState {
  strategies: Strategy[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
}

const MOCK_STRATEGIES: Strategy[] = [
  {
    id: 'sigE',
    name: 'sigE 動量策略',
    market: 'CRYPTO',
    type: 'momentum',
    signals: {
      overall: 68,
      buySignals: ['RSI 超賣', 'MACD 金叉', '成交量突破'],
      sellSignals: ['RSI 超買', '價格跌破 MA20'],
    },
    metrics: {
      winRate: 64,
      profitFactor: 2.38,
      maxDrawdown: 22,
      sharpe: 6.7,
    },
    updatedAt: Date.now(),
  },
  {
    id: 'sigF',
    name: 'sigF 突破策略',
    market: 'CRYPTO',
    type: 'breakout',
    signals: {
      overall: 45,
      buySignals: ['均線多頭排列', '成交量放大'],
      sellSignals: ['高波動率', '偏離均線過遠'],
    },
    metrics: {
      winRate: 50,
      profitFactor: 2.54,
      maxDrawdown: 18.8,
      sharpe: 5.76,
    },
    updatedAt: Date.now(),
  },
  {
    id: 'sigA',
    name: 'sigA 動量溢價',
    market: 'CRYPTO',
    type: 'momentum',
    signals: {
      overall: 55,
      buySignals: ['價格突破新高', '機構買入'],
      sellSignals: ['動能減弱'],
    },
    metrics: {
      winRate: 60,
      profitFactor: 1.9,
      maxDrawdown: 28,
      sharpe: 3.2,
    },
    updatedAt: Date.now(),
  },
];

let _requestId = 0;

const initialState: StrategyState = {
  strategies: [],
  selectedId: null,
  isLoading: false,
  error: null,
};

const [store, setStore] = createStore<StrategyState>(initialState);

interface StrategyStore extends StrategyState {
  selectStrategy: (id: string | null) => void;
  loadStrategies: () => Promise<void>;
  getSelected: () => Strategy | null;
}

const strategyStore: StrategyStore = {
  get strategies() { return store.strategies; },
  get selectedId() { return store.selectedId; },
  get isLoading() { return store.isLoading; },
  get error() { return store.error; },

  selectStrategy(id) {
    setStore('selectedId', id);
  },

  async loadStrategies() {
    const myId = ++_requestId;
    setStore({ isLoading: true, error: null });
    try {
      // Simulate async load
      await new Promise(r => setTimeout(r, 300));
      if (myId !== _requestId) return;
      setStore('strategies', MOCK_STRATEGIES);
      if (MOCK_STRATEGIES.length > 0 && !store.selectedId) {
        setStore('selectedId', MOCK_STRATEGIES[0].id);
      }
    } catch (e: unknown) {
      if (myId !== _requestId) return;
      setStore('error', e instanceof Error ? e.message : String(e));
    } finally {
      if (myId !== _requestId) return;
      setStore('isLoading', false);
    }
  },

  getSelected() {
    return store.strategies.find(s => s.id === store.selectedId) || null;
  },
};

export { strategyStore };
