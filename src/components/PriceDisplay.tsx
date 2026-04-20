import type { Component } from 'solid-js';
import { createSignal, createEffect } from 'solid-js';
import { store as chartStore } from '../stores/chartStore';

const PriceDisplay: Component = () => {
  const [priceInfo, setPriceInfo] = createSignal<{ last: number; change: number; changePct: number } | null>(null);

  createEffect(() => {
    const data = chartStore.data;
    if (data.length < 2) return;
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const change = last.close - prev.close;
    const changePct = (change / prev.close) * 100;
    setPriceInfo({ last: last.close, change, changePct });
  });

  return (
    <div style={{
      'font-size': '24px',
      'font-weight': 'bold',
      color: priceInfo() && priceInfo()!.change >= 0 ? '#26a69a' : '#ef5350',
    }}>
      {priceInfo()
        ? `${priceInfo()!.last.toFixed(2)} (${priceInfo()!.change >= 0 ? '+' : ''}${priceInfo()!.changePct.toFixed(2)}%)`
        : '—'}
    </div>
  );
};

export default PriceDisplay;
