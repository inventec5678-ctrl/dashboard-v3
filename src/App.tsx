import type { Component } from 'solid-js';
import { createSignal, onMount, Show } from 'solid-js';
import type { Tab } from './components/TabBar';
import { store as marketStore } from './stores/marketStore';
import { store as chartStore } from './stores/chartStore';
import { quoteStore } from './stores/quoteStore';
import { strategyStore } from './stores/strategyStore';
import CandleChart from './components/CandleChart';
import VolumePane from './components/VolumePane';
import TFSwitcher from './components/TFSwitcher';
import SymbolPicker from './components/SymbolPicker';
import TopBar from './components/TopBar';
import TabBar from './components/TabBar';
import StrategyTable from './components/StrategyTable';
import ConsensusBar from './components/ConsensusBar';
import SentimentChips from './components/SentimentChips';
import StrategyModal from './components/StrategyModal';

const App: Component = () => {
  const [active, setActive] = createSignal<Tab>('chart');

  onMount(() => {
    marketStore.loadSymbols().then(() => {
      chartStore.fetchKlines();
      quoteStore.fetchQuote();
    });
    strategyStore.loadStrategies();
  });

  return (
    <div style={{
      padding: '16px',
      background: '#0f0f1a',
      color: '#fff',
      'min-height': '100vh',
      'font-family': 'system-ui, sans-serif',
    }}>
      <h1 style={{ margin: '0 0 12px', 'font-size': '20px' }}>Dashboard V3</h1>

      <TabBar active={active} onTabChange={setActive} />

      <TopBar />

      {/* Chart tab */}
      <Show when={active() === 'chart'}>
        <div>
          <SymbolPicker />
          <TFSwitcher />

          <Show when={chartStore.isLoading}>
            <div style={{ color: '#6366f1', padding: '8px' }}>載入中...</div>
          </Show>

          <Show when={chartStore.error}>
            <div style={{ color: '#ef5350', padding: '8px' }}>錯誤：{chartStore.error}</div>
          </Show>

          <Show when={!chartStore.isLoading && chartStore.data.length > 0}>
            <CandleChart />
            <VolumePane />
          </Show>

          <Show when={!chartStore.isLoading && chartStore.data.length === 0 && !chartStore.error}>
            <div style={{ color: '#666', padding: '8px' }}>無資料</div>
          </Show>
        </div>
      </Show>

      {/* Strategy tab */}
      <Show when={active() === 'strategy'}>
        <div style={{ padding: '12px 0' }}>
          <StrategyTable />
          <Show when={strategyStore.selectedId}>
            <ConsensusBar />
            <SentimentChips />
          </Show>
          <StrategyModal />
        </div>
      </Show>

      {/* Settings tab placeholder */}
      <Show when={active() === 'settings'}>
        <div>設定功能建設中...</div>
      </Show>
    </div>
  );
};

export default App;
