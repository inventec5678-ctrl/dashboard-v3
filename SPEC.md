# Dashboard V3 專案規格書

> 基於三份規劃報告制定：refactor-analysis / tech-research / feature-roadmap
> 日期：2026-04-20

---

## 一、技術棧

| 層面 | 選擇 |
|------|------|
| Framework | SolidJS（Runes API / Signals）|
| Build | Vite 5 |
| State | Zustand |
| Charts | lightweight-charts v4（npm）|
| UI | Tailwind CSS + Radix UI Primitives |
| Backend | server.py（不變，直接沿用 dashboard_v2_standalone 的）|

---

## 二、為什麼放棄現在的 Vanilla JS

| 問題 | 現狀後果 |
|------|---------|
| 50+ window 全域變數 | 狀態不可追蹤，任何地方都能改 |
| 400行 God Module（chart_market.js）| 改一行壞三行 |
| `var` 泛濫 | ES6+ 時代的技術債務 |
| 無測試覆蓋 | 重構 = 憑運氣 |
| 擴展困難 | 加 MA/RSI 要大改 |
| vDOM overhead | 每秒多次 K線更新浪費效能 |

**SolidJS 顆粒度更新比 React 快 20-30%，最適合 K線高頻更新。**

---

## 三、目标架構

```
dashboard_v3/
├── SPEC.md                    ← 本規格書
├── README.md
├── package.json
├── vite.config.ts
├── index.html
├── src/
│   ├── App.tsx               # 單一 entry point
│   ├── index.tsx             # 入口
│   ├── stores/               # Zustand stores
│   │   ├── marketStore.ts    # 市場/符號/TF 狀態
│   │   ├── chartStore.ts     # K線資料/chart instance
│   │   ├── quoteStore.ts     # 即時報價
│   │   ├── strategyStore.ts   # 策略排行
│   │   └── uiStore.ts        # UI 狀態（modal/tab/sentiment）
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx
│   │   │   ├── TabBar.tsx
│   │   │   └── SidePanel.tsx
│   │   ├── charts/
│   │   │   ├── CandleChart.tsx    # K線主圖
│   │   │   ├── VolumePane.tsx    # 成交量副圖
│   │   │   └── PriceLineLayer.tsx # NOW線/MA/RSI/警報
│   │   ├── market/
│   │   │   ├── PriceDisplay.tsx  # 報價顯示
│   │   │   ├── TFSwitcher.tsx    # TF 按鈕
│   │   │   └── SymbolPicker.tsx  # 符號選擇
│   │   ├── strategies/
│   │   │   ├── StrategyTable.tsx # 策略排行
│   │   │   ├── StrategyModal.tsx # 策略詳情
│   │   │   └── ConsensusBar.tsx  # 情緒共識
│   │   └── ui/
│   │       ├── CountdownTimer.tsx
│   │       ├── UpdateBadge.tsx
│   │       └── AlertToast.tsx
│   ├── services/
│   │   ├── api.ts            # 統一 fetch 層
│   │   ├── cache.ts          # 記憶體快取
│   │   └── ws.ts             # WebSocket（Phase 2）
│   ├── hooks/
│   │   ├── useChart.ts
│   │   ├── useQuote.ts
│   │   ├── useIndicators.ts  # 指標計算（MA/RSI/MACD）
│   │   └── useCountdown.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── indicators.ts     # 指標計算公式
│   └── styles/
│       └── index.css         # Tailwind imports
├── server.py                  # 從 dashboard_v2_standalone 複製（不變）
└── docs/                      # 規劃文件
    ├── refactor-analysis.md
    ├── tech-research.md
    └── feature-roadmap.md
```

---

## 四、功能實作順序

### Phase 1：MVP（等同目前 dashboard_v2 功能）
1. ✅ 專案初始化（Vite + SolidJS + Zustand）
2. ✅ 三市場 Tab 切換
3. ✅ K線圖（lightweight-charts）
4. ✅ 成交量副圖
5. ✅ 符號選擇 + TF 按鈕
6. ✅ 即時報價顯示
7. ✅ 策略排行 + Modal
8. ✅ 倒數計時器
9. ✅ 情緒晶片
10. ✅ Memory Cache

### Phase 2：即時更新 + 指標
1. MA5 / MA20 / MA60 疊加
2. RSI14 獨立 pane
3. NOW 價格線（隨報價跳動）
4. Binance WebSocket 即時更新
5. 價格警報（localStorage）

### Phase 3：進階功能
1. MACD + Bollinger Bands
2. 繪圖工具（Horizontal Line）
3. Screener
4. Watchlist

### Phase 4：Backtest
1. Python Backtest Engine
2. Equity Curve 展示
3. Trade Log

---

## 五、開發流程（每個功能）

每個功能實作都依序經過三關：

```
1. Agent-實作者（implementer）
   → 實作功能、寫測試、提交 PR
   
2. Agent-測試者（tester）
   → 實際開瀏覽器操作、點擊按鈕、觀察 K線
   → 驗證功能是否正確運作
   
3. Agent-審查者（reviewer）
   → 審視程式碼：安全性、效能、可維護性
   → 產出審查報告

4. 人（Gino）審核
   → 看審查報告
   → 決定：通過 / 需修改 / 駁回

5. 通過後 merge 到 main
```

---

## 六、第一個要實作的功能：MA5/20/60 + RSI 指標系統

### 為什麼是第一個
- chart_v2 的 Modal 裡已經有 MA/RSI 的 UI 按鈕，只是底層沒實作
- 低垂的果實，回報率高

### 實作目標
```
1. K線圖上可以疊加 MA5（紅）、MA20（黃）、MA60（紫）三條線
2. RSI14 在獨立 pane 顯示（下方）
3. 切換 TF 時指 標跟著重新計算
4. 切換市場時指 標正確清除
5. 疊加/隱藏可以個別控制
```

### 驗收標準
- [ ] BTCUSDT 1D：MA5/20/60 三條線都在 K線上
- [ ] RSI pane 在 K線下方，高度約 150px
- [ ] 切換到 TWSE 市場，指標正確清除
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

## 七、目前的 Dashboard（v2）VS 未來的 Dashboard（v3）

| 維度 | v2（現在）| v3（目標）|
|------|----------|----------|
| 架構 | Vanilla JS + ES Module | SolidJS + Zustand |
| 狀態管理 | 50+ window.* | Zustand Store |
| 技術指標 | 0 | MA/RSI/MACD/Bollinger |
| 即時更新 | 60秒 polling | WebSocket（毫秒級）|
| 報價警報 | 無 | 有 |
| 測試覆蓋 | 0 | 主要功能有測試 |
| 可維護性 | 低 | 高 |
| 擴展性 | 差 | 好 |
