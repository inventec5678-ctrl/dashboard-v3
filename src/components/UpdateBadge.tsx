import type { Component } from 'solid-js';
import { createMemo } from 'solid-js';
import { quoteStore } from '../stores/quoteStore';

const UpdateBadge: Component = () => {
  const status = createMemo(() => {
    if (quoteStore.error) return { label: 'Error', color: '#ef5350' };
    if (!quoteStore.lastUpdated) return { label: 'Loading', color: '#666' };
    const age = Date.now() - quoteStore.lastUpdated;
    if (age > 60000) return { label: 'Stale', color: '#f59e0b' };
    return { label: 'Live', color: '#26a69a' };
  });

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      background: status().color,
      color: '#fff',
      'border-radius': '10px',
      'font-size': '11px',
      'font-weight': 'bold',
    }}>
      {status().label}
    </span>
  );
};

export default UpdateBadge;