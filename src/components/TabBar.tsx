import type { Component } from 'solid-js';
import type { Accessor } from 'solid-js';

export type Tab = 'chart' | 'strategy' | 'settings';

interface TabBarProps {
  active: Accessor<Tab>;
  onTabChange: (tab: Tab) => void;
}

const TabBar: Component<TabBarProps> = (props) => {
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
          onClick={() => props.onTabChange(tab.id)}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            color: props.active() === tab.id ? '#6366f1' : '#666',
            border: 'none',
            'border-bottom': props.active() === tab.id ? '2px solid #6366f1' : '2px solid transparent',
            cursor: 'pointer',
            'font-size': '14px',
            'font-weight': props.active() === tab.id ? 'bold' : 'normal',
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
