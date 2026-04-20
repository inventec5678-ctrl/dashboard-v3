import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { strategyStore } from '../stores/strategyStore';

const StrategyModal: Component = () => {
  const strategy = () => strategyStore.getSelected();

  const handleClose = () => {
    strategyStore.selectStrategy(null);
  };

  const handleOverlayClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      handleClose();
    }
  };

  return (
    <Show when={strategy()}>
      <div
        class="modal-overlay"
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'z-index': 1000,
        }}
      >
        <div style={{
          background: '#1a1a2e',
          border: '1px solid #3a3a4e',
          'border-radius': '8px',
          padding: '24px',
          'max-width': '500px',
          width: '90%',
          'max-height': '80vh',
          overflow: 'auto',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-start', 'margin-bottom': '16px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#fff', 'font-size': '18px' }}>{strategy()!.name}</h2>
              <span style={{ 'font-size': '12px', color: '#666' }}>{strategy()!.type}</span>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#666',
                'font-size': '20px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          {/* Signals */}
          <div style={{ 'margin-bottom': '16px' }}>
            <div style={{ display: 'flex', 'align-items': 'center', 'margin-bottom': '8px' }}>
              <span style={{ 'font-size': '12px', color: '#666', 'margin-right': '8px' }}>信號評分</span>
              <span style={{
                'font-size': '24px',
                'font-weight': 'bold',
                color: strategy()!.signals.overall >= 0 ? '#26a69a' : '#ef5350',
              }}>
                {strategy()!.signals.overall > 0 ? '+' : ''}{strategy()!.signals.overall}
              </span>
            </div>
            <div style={{ 'margin-bottom': '8px' }}>
              <span style={{ 'font-size': '12px', color: '#26a69a' }}>買入信號：</span>
              <div style={{ 'margin-top': '4px' }}>
                {strategy()!.signals.buySignals.map(sig => (
                  <span style={{
                    display: 'inline-block',
                    background: '#26a69a20',
                    color: '#26a69a',
                    padding: '2px 8px',
                    'border-radius': '4px',
                    'font-size': '11px',
                    'margin': '2px',
                  }}>
                    {sig}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span style={{ 'font-size': '12px', color: '#ef5350' }}>賣出信號：</span>
              <div style={{ 'margin-top': '4px' }}>
                {strategy()!.signals.sellSignals.map((sig: string) => (
                  <span style={{
                    display: 'inline-block',
                    background: '#ef535020',
                    color: '#ef5350',
                    padding: '2px 8px',
                    'border-radius': '4px',
                    'font-size': '11px',
                    'margin': '2px',
                  }}>
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{
            display: 'grid',
            'grid-template-columns': 'repeat(2, 1fr)',
            gap: '12px',
            'margin-bottom': '16px',
          }}>
            {[
              { label: '勝率', value: `${strategy()!.metrics.winRate}%`, good: strategy()!.metrics.winRate >= 60 },
              { label: '盈虧比', value: strategy()!.metrics.profitFactor.toFixed(2), good: strategy()!.metrics.profitFactor >= 2.0 },
              { label: '最大回測', value: `${strategy()!.metrics.maxDrawdown}%`, good: strategy()!.metrics.maxDrawdown <= 20 },
              { label: 'Sharpe', value: strategy()!.metrics.sharpe.toFixed(2), good: strategy()!.metrics.sharpe >= 3.0 },
            ].map(m => (
              <div style={{
                background: '#2a2a3e',
                padding: '12px',
                'border-radius': '6px',
              }}>
                <div style={{ 'font-size': '11px', color: '#666', 'margin-bottom': '4px' }}>{m.label}</div>
                <div style={{
                  'font-size': '18px',
                  'font-weight': 'bold',
                  color: m.good ? '#26a69a' : '#ef5350',
                }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Updated time */}
          <div style={{ 'font-size': '11px', color: '#666', 'text-align': 'right' }}>
            更新：{new Date(strategy()!.updatedAt).toLocaleString('zh-TW')}
          </div>
        </div>
      </div>
    </Show>
  );
};

export default StrategyModal;
