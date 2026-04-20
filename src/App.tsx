import type { Component } from 'solid-js';
import { store as marketStore } from './stores/marketStore';

const App: Component = () => {
  return (
    <div style={{ padding: '20px', "font-family": "system-ui" }}>
      <h1>Dashboard V3 — 建設中</h1>
      <p>Market: {marketStore.market} | Symbol: {marketStore.symbol} | TF: {marketStore.interval}</p>
      <p>Symbols loaded: {marketStore.symbols.length}</p>
      <p style={{ color: '#666' }}>T1-1 前端資料層 — 實作進行中</p>
    </div>
  );
};

export default App;