import type { Component } from 'solid-js';
import { onMount, onCleanup, createEffect } from 'solid-js';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { store as chartStore } from '../stores/chartStore';

const CandleChart: Component = () => {
  let containerRef!: HTMLDivElement;
  let chart: IChartApi;
  let series: ISeriesApi<'Candlestick'>;

  onMount(() => {
    chart = createChart(containerRef, {
      layout: {
        background: { color: '#1a1a2e' },
        textColor: '#a0a0a0',
      },
      grid: {
        vertLines: { color: '#2a2a3e' },
        horzLines: { color: '#2a2a3e' },
      },
      crosshair: {
        mode: 1, // Normal
      },
      timeScale: {
        borderColor: '#3a3a4e',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef && chart) {
        chart.applyOptions({ width: containerRef.clientWidth, height: 300 });
      }
    });
    resizeObserver.observe(containerRef);

    onCleanup(() => {
      resizeObserver.disconnect();
      chart.remove();
    });
  });

  // Update data when chartStore changes
  createEffect(() => {
    const data = chartStore.data;
    if (!series || data.length === 0) return;
    const formatted: CandlestickData<Time>[] = data.map(d => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    series.setData(formatted);
    chart.timeScale().fitContent();
  });

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '300px', background: '#1a1a2e' }}
    />
  );
};

export default CandleChart;
