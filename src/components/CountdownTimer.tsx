import type { Component } from 'solid-js';
import { createSignal, onMount, onCleanup } from 'solid-js';
import { quoteStore } from '../stores/quoteStore';

const REFRESH_INTERVAL = 30000; // 30秒

const CountdownTimer: Component = () => {
  const [secondsLeft, setSecondsLeft] = createSignal(30);

  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          quoteStore.fetchQuote();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  });

  onCleanup(() => {
    if (interval) clearInterval(interval);
  });

  return (
    <div style={{
      'font-size': '12px',
      color: '#666',
      'font-family': 'monospace',
    }}>
      自動更新：{secondsLeft()}s
    </div>
  );
};

export default CountdownTimer;