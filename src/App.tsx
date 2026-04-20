import type { Component } from 'solid-js';
import { onMount, Show } from 'solid-js';
import { store as marketStore } from './stores/marketStore';
import { store as chartStore } from './stores/chartStore';
import { quoteStore } from './stores/quoteStore';
import CandleChart from './components/CandleChart';
import VolumePane from './components/VolumePane';
import TFSwitcher from './components/TFSwitcher';
import SymbolPicker from './components/SymbolPicker';
import TopBar from './components/TopBar';
import TabBar from './components/TabBar';

const App: Component = () => {
  onMount(() => {
    marketStore.loadSymbols().then(() => {
      chartStore.fetchKlines();
      quoteStore.fetchQuote();
    });
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

      <TabBar />

      <TopBar />

      {/* Chart tab */}
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

      {/* Strategy tab placeholder */}
      <Show when={false}>
        <div>策略功能建設中...</div>
      </Show>

      {/* Settings tab placeholder */}
      <Show when={false}>
        <div>設定功能建設中...</div>
      </Show>
    </div>
  );
};

export default App;