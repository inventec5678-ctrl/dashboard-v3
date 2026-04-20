import type { Component } from 'solid-js';
import { onMount } from 'solid-js';
import { store as marketStore } from '../stores/marketStore';
import { quoteStore } from '../stores/quoteStore';
import UpdateBadge from './UpdateBadge';
import CountdownTimer from './CountdownTimer';

const TopBar: Component = () => {
  onMount(() => {
    quoteStore.fetchQuote();
  });

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatTime = (ts: number | null) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      'justify-content': 'space-between',
      'align-items': 'center',
      padding: '8px 0',
      'border-bottom': '1px solid #2a2a3e',
      'margin-bottom': '12px',
      'flex-wrap': 'wrap',
      gap: '8px',
    }}>
      {/* Left: market + symbol */}
      <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
        <span style={{
          padding: '2px 8px',
          background: '#6366f1',
          color: '#fff',
          'border-radius': '4px',
          'font-size': '12px',
          'font-weight': 'bold',
        }}>
          {marketStore.market}
        </span>
        <span style={{ 'font-size': '16px', 'font-weight': 'bold', color: '#fff' }}>
          {marketStore.symbol}
        </span>
        <UpdateBadge />
      </div>

      {/* Right: price + time + controls */}
      <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
        {quoteStore.quote && (
          <>
            <span style={{ 'font-size': '18px', 'font-weight': 'bold', color: '#fff' }}>
              {formatPrice(quoteStore.quote.price)}
            </span>
            <span style={{
              'font-size': '14px',
              color: quoteStore.quote.change >= 0 ? '#26a69a' : '#ef5350',
            }}>
              {quoteStore.quote.change >= 0 ? '+' : ''}{quoteStore.quote.change.toFixed(2)}
              ({quoteStore.quote.changePct >= 0 ? '+' : ''}{quoteStore.quote.changePct.toFixed(2)}%)
            </span>
          </>
        )}
        <span style={{ 'font-size': '12px', color: '#666' }}>
          {formatTime(quoteStore.lastUpdated)}
        </span>
        <CountdownTimer />
        <button
          onClick={() => quoteStore.fetchQuote()}
          style={{
            padding: '4px 10px',
            background: '#2a2a3e',
            color: '#fff',
            border: '1px solid #3a3a4e',
            'border-radius': '4px',
            cursor: 'pointer',
            'font-size': '12px',
          }}
        >
          刷新
        </button>
      </div>
    </div>
  );
};

export default TopBar;