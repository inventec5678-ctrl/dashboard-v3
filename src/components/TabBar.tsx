import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';

type Tab = 'chart' | 'strategy' | 'settings';

const TabBar: Component = () => {
  const [active, setActive] = createSignal<Tab>('chart');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chart', label: '走勢' },
    { id: 'strategy', label: '策略' },
    { id: 'settings', label: '設定' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      'border-bottom': '1px solid #2a2a3e',
      'margin-bottom': '12px',
    }}>
      {tabs.map(tab => (
        <button
          onClick={() => setActive(tab.id)}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            color: active() === tab.id ? '#6366f1' : '#666',
            border: 'none',
            'border-bottom': active() === tab.id ? '2px solid #6366f1' : '2px solid transparent',
            cursor: 'pointer',
            'font-size': '14px',
            'font-weight': active() === tab.id ? 'bold' : 'normal',
            'margin-bottom': '-1px',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabBar;