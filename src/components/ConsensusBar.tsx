import type { Component } from 'solid-js';
import { strategyStore } from '../stores/strategyStore';

const ConsensusBar: Component = () => {
  const selected = () => strategyStore.getSelected();

  const barColor = (val: number) => {
    if (val >= 60) return '#26a69a';
    if (val >= 40) return '#f59e0b';
    return '#ef5350';
  };

  return (
    <div style={{ 'margin-top': '12px' }}>
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '4px' }}>
        <span style={{ 'font-size': '12px', color: '#666' }}>共識</span>
        {selected() && (
          <span style={{
            'font-size': '12px',
            'font-weight': 'bold',
            color: barColor(selected()!.signals.overall + 50),
          }}>
            {selected()!.signals.overall > 0 ? '+' : ''}{selected()!.signals.overall} / +100
          </span>
        )}
      </div>
      <div style={{
        height: '8px',
        background: '#2a2a3e',
        'border-radius': '4px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Center line */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '1px',
          background: '#4a4a5e',
        }} />
        {/* Score bar (from center, 0 = left edge = -100) */}
        {selected() && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: `${Math.abs(selected()!.signals.overall) / 2}%`,
            background: barColor(selected()!.signals.overall + 50),
            transition: 'width 0.3s',
            transform: selected()!.signals.overall >= 0 ? 'translateX(-100%)' : 'none',
          }} />
        )}
      </div>
    </div>
  );
};

export default ConsensusBar;
