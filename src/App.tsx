import type { Component } from 'solid-js';
import { onMount } from 'solid-js';
import { store as marketStore } from './stores/marketStore';
import { store as chartStore } from './stores/chartStore';
import CandleChart from './components/CandleChart';
import VolumePane from './components/VolumePane';
import TFSwitcher from './components/TFSwitcher';
import SymbolPicker from './components/SymbolPicker';
import PriceDisplay from './components/PriceDisplay';

const App: Component = () => {
  onMount(() => {
    // Load initial data
    marketStore.loadSymbols().then(() => {
      chartStore.fetchKlines();
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
      {/* Header */}
      <div style={{
        display: 'flex',
        'justify-content': 'space-between',
        'align-items': 'center',
        'margin-bottom': '16px',
        'flex-wrap': 'wrap',
        gap: '12px',
      }}>
        <h1 style={{ margin: 0, 'font-size': '20px' }}>Dashboard V3</h1>
        <PriceDisplay />
      </div>

      {/* Symbol + TF controls */}
      <div style={{ 'margin-bottom': '12px' }}>
        <SymbolPicker />
        <TFSwitcher />
      </div>

      {/* Loading state */}
      {chartStore.isLoading && (
        <div style={{ color: '#6366f1', padding: '8px' }}>Loading...</div>
      )}

      {/* Error state */}
      {chartStore.error && (
        <div style={{ color: '#ef5350', padding: '8px' }}>Error: {chartStore.error}</div>
      )}

      {/* Charts */}
      {!chartStore.isLoading && chartStore.data.length > 0 && (
        <>
          <CandleChart />
          <VolumePane />
        </>
      )}

      {/* Empty state */}
      {!chartStore.isLoading && chartStore.data.length === 0 && !chartStore.error && (
        <div style={{ color: '#666', padding: '8px' }}>No data</div>
      )}
    </div>
  );
};

export default App;
