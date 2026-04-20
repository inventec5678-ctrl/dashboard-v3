import type { Component } from 'solid-js';
import { store as marketStore } from '../stores/marketStore';
import { store as chartStore } from '../stores/chartStore';

const TIMEFRAMES = ['15m', '1h', '4h', '1d', '1wk', '1mo'] as const;

const TFSwitcher: Component = () => {
  const handleClick = (tf: typeof TIMEFRAMES[number]) => {
    marketStore.setInterval(tf);
    chartStore.fetchKlines();
  };

  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      padding: '8px 0',
      'flex-wrap': 'wrap',
    }}>
      {TIMEFRAMES.map(tf => (
        <button
          onClick={() => handleClick(tf)}
          style={{
            padding: '4px 12px',
            background: marketStore.interval === tf ? '#6366f1' : '#2a2a3e',
            color: '#fff',
            border: 'none',
            'border-radius': '4px',
            cursor: 'pointer',
            'font-size': '12px',
          }}
        >
          {tf}
        </button>
      ))}
    </div>
  );
};

export default TFSwitcher;
