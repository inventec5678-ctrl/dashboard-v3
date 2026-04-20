import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { store as marketStore } from '../stores/marketStore';
import { store as chartStore } from '../stores/chartStore';
import type { Market } from '../types';

const MARKETS: Market[] = ['CRYPTO', 'TWSE', 'US'];

const SymbolPicker: Component = () => {
  const handleMarketChange = (m: Market) => {
    marketStore.setMarket(m);
    chartStore.fetchKlines();
  };

  const handleSymbolChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    marketStore.setSymbol(target.value);
    chartStore.fetchKlines();
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      'align-items': 'center',
      'flex-wrap': 'wrap',
    }}>
      {/* Market switcher */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <For each={MARKETS}>
          {(m) => (
            <button
              onClick={() => handleMarketChange(m)}
              style={{
                padding: '4px 10px',
                background: marketStore.market === m ? '#6366f1' : '#2a2a3e',
                color: '#fff',
                border: 'none',
                'border-radius': '4px',
                cursor: 'pointer',
                'font-size': '12px',
              }}
            >
              {m}
            </button>
          )}
        </For>
      </div>

      {/* Symbol dropdown */}
      <select
        value={marketStore.symbol}
        onChange={handleSymbolChange}
        style={{
          padding: '4px 8px',
          background: '#2a2a3e',
          color: '#fff',
          border: '1px solid #3a3a4e',
          'border-radius': '4px',
          'min-width': '150px',
        }}
      >
        <Show when={marketStore.isLoading}>
          <option value="">Loading...</option>
        </Show>
        <For each={marketStore.symbols}>
          {(s) => (
            <option value={s.symbol}>
              {s.display}{s.name ? ` — ${s.name}` : ''}
            </option>
          )}
        </For>
      </select>
    </div>
  );
};

export default SymbolPicker;
