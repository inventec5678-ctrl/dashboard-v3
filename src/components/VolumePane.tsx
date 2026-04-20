import type { Component } from 'solid-js';
import { onMount, onCleanup, createEffect } from 'solid-js';
import { createChart, IChartApi, ISeriesApi, HistogramData, Time } from 'lightweight-charts';
import { store as chartStore } from '../stores/chartStore';

const VolumePane: Component = () => {
  let containerRef!: HTMLDivElement;
  let chart: IChartApi;
  let series: ISeriesApi<'Histogram'>;

  onMount(() => {
    chart = createChart(containerRef, {
      layout: {
        background: { color: '#1a1a2e' },
        textColor: '#a0a0a0',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#2a2a3e' },
      },
      timeScale: {
        borderColor: '#3a3a4e',
        timeVisible: true,
      },
      height: 80,
    });

    series = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    series.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef && chart) {
        chart.applyOptions({ width: containerRef.clientWidth, height: 80 });
      }
    });
    resizeObserver.observe(containerRef);

    onCleanup(() => {
      resizeObserver.disconnect();
      chart.remove();
    });
  });

  createEffect(() => {
    const data = chartStore.data;
    if (!series || data.length === 0) return;
    const formatted: HistogramData<Time>[] = data.map(d => ({
      time: d.time as Time,
      value: d.volume,
      color: d.close >= d.open ? '#26a69a80' : '#ef535080',
    }));
    series.setData(formatted);
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '80px', background: '#1a1a2e' }} />
  );
};

export default VolumePane;