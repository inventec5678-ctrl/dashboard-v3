import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { strategyStore } from '../stores/strategyStore';
import { store as marketStore } from '../stores/marketStore';

const METRIC_THRESHOLDS = {
  winRate: { good: 60, warn: 55 },
  profitFactor: { good: 2.0, warn: 1.5 },
  maxDrawdown: { good: 20, warn: 25 },
  sharpe: { good: 3.0, warn: 2.0 },
};

const getColor = (value: number, thresholds: { good: number; warn: number }, invert = false) => {
  if (invert) {
    if (value <= thresholds.good) return '#26a69a';
    if (value <= thresholds.warn) return '#f59e0b';
    return '#ef5350';
  }
  if (value >= thresholds.good) return '#26a69a';
  if (value >= thresholds.warn) return '#f59e0b';
  return '#ef5350';
};

const StrategyTable: Component = () => {
  const filtered = () => strategyStore.strategies.filter(s => s.market === marketStore.market);

  const handleSelect = (id: string) => {
    strategyStore.selectStrategy(id);
  };

  return (
    <div style={{ 'margin-top': '16px' }}>
      <h3 style={{ margin: '0 0 12px', color: '#fff', 'font-size': '16px' }}>策略列表</h3>
      <Show when={strategyStore.isLoading}>
        <div style={{ color: '#6366f1', padding: '8px' }}>載入中...</div>
      </Show>
      <Show when={strategyStore.error}>
        <div style={{ color: '#ef5350', padding: '8px' }}>錯誤：{strategyStore.error}</div>
      </Show>
      <Show when={!strategyStore.isLoading && filtered().length === 0}>
        <div style={{ color: '#666', padding: '8px' }}>目前市場無策略</div>
      </Show>
      <Show when={!strategyStore.isLoading && filtered().length > 0}>
        <table style={{
          width: '100%',
          'border-collapse': 'collapse',
          'font-size': '12px',
        }}>
          <thead>
            <tr style={{ color: '#666', 'border-bottom': '1px solid #2a2a3e' }}>
              <th style={{ padding: '8px 6px', 'text-align': 'left' }}>策略</th>
              <th style={{ padding: '8px 6px', 'text-align': 'right' }}>信號</th>
              <th style={{ padding: '8px 6px', 'text-align': 'right' }}>勝率</th>
              <th style={{ padding: '8px 6px', 'text-align': 'right' }}>PF</th>
              <th style={{ padding: '8px 6px', 'text-align': 'right' }}>DD</th>
              <th style={{ padding: '8px 6px', 'text-align': 'right' }}>Sharpe</th>
            </tr>
          </thead>
          <tbody>
            <For each={filtered()}>
              {(s: ReturnType<typeof filtered>[0]) => (
                <tr
                  onClick={() => handleSelect(s.id)}
                  style={{
                    cursor: 'pointer',
                    background: strategyStore.selectedId === s.id ? '#2a2a4e' : 'transparent',
                    'border-bottom': '1px solid #1e1e2e',
                  }}
                >
                  <td style={{ padding: '8px 6px', color: '#fff' }}>{s.name}</td>
                  <td style={{ padding: '8px 6px', 'text-align': 'right', 'font-weight': 'bold', color: s.signals.overall >= 0 ? '#26a69a' : '#ef5350' }}>
                    {s.signals.overall > 0 ? '+' : ''}{s.signals.overall}
                  </td>
                  <td style={{ padding: '8px 6px', 'text-align': 'right', color: getColor(s.metrics.winRate, METRIC_THRESHOLDS.winRate) }}>
                    {s.metrics.winRate}%
                  </td>
                  <td style={{ padding: '8px 6px', 'text-align': 'right', color: getColor(s.metrics.profitFactor, METRIC_THRESHOLDS.profitFactor) }}>
                    {s.metrics.profitFactor.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 6px', 'text-align': 'right', color: getColor(s.metrics.maxDrawdown, METRIC_THRESHOLDS.maxDrawdown, true) }}>
                    {s.metrics.maxDrawdown}%
                  </td>
                  <td style={{ padding: '8px 6px', 'text-align': 'right', color: getColor(s.metrics.sharpe, METRIC_THRESHOLDS.sharpe) }}>
                    {s.metrics.sharpe.toFixed(2)}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
};

export default StrategyTable;
