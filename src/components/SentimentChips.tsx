import type { Component } from 'solid-js';
import { createMemo } from 'solid-js';
import { quoteStore } from '../stores/quoteStore';

const SENTIMENTS = [
  { label: '極度恐慌', range: [-100, -75], color: '#ef5350' },
  { label: '恐慌', range: [-75, -50], color: '#f59e0b' },
  { label: '中性', range: [-50, 50], color: '#6b7280' },
  { label: '貪婪', range: [50, 75], color: '#26a69a' },
  { label: '極度貪婪', range: [75, 100], color: '#10b981' },
] as const;

const SentimentChips: Component = () => {
  const sentiment = createMemo(() => {
    if (!quoteStore.quote) return null;
    const changePct = quoteStore.quote.changePct;
    // Map price change % to sentiment score (simplified)
    const sentimentScore = Math.max(-100, Math.min(100, changePct * 10));
    return SENTIMENTS.find(s => sentimentScore >= s.range[0] && sentimentScore < s.range[1]) || SENTIMENTS[2];
  });

  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      'flex-wrap': 'wrap',
      'align-items': 'center',
    }}>
      <span style={{ 'font-size': '12px', color: '#666' }}>情緒：</span>
      {SENTIMENTS.map(s => (
        <span style={{
          padding: '2px 10px',
          'border-radius': '10px',
          'font-size': '11px',
          'font-weight': 'bold',
          background: sentiment()?.label === s.label
            ? s.color
            : `${s.color}30`,
          color: sentiment()?.label === s.label ? '#fff' : s.color,
        }}>
          {s.label}
        </span>
      ))}
    </div>
  );
};

export default SentimentChips;
