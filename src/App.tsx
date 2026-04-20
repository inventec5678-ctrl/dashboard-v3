import type { Component } from 'solid-js';

const App: Component = () => {
  return (
    <div class="min-h-screen bg-[#0d1117] text-white p-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-2xl font-bold text-[#58a6ff] mb-4">
          Dashboard V3 — SolidJS + lightweight-charts
        </h1>
        <p class="text-[#8b949e] mb-8">
          三市場專業圖表平台（CRYPTO / TWSE / US）
        </p>
        <div class="bg-[#161b22] rounded-lg p-6 border border-[#30363d]">
          <p class="text-[#f0883e]">⚠️ 建設中 — Phase 1 尚未開始</p>
          <p class="text-[#8b949e] mt-2">
            當前任務：<a href="./SPEC.md" class="text-[#58a6ff] underline">MA5/20/60 + RSI 指標系統</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
