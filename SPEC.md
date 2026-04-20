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
│   │   │   ├── VolumePane.tsx     # 成交量副圖
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

## 四、功能實作順序（已修正）

每個 Phase 的任務必須依賴上一層完成才能開始。

---

### Phase 1-0：專案初始化 ✅
- [x] Vite + SolidJS + Zustand 設定
- [x] lightweight-charts npm 安裝
- [x] Tailwind CSS 設定
- [x] TypeScript 設定

---

### Phase 1-1：資料層（Data Layer）🔜
> 沒有乾淨的資料層，上層全部無法運作

**驗收標準：**
- [ ] 一個乾淨的 API service，沒有任何 `window.fetch` 或直接 `fetch()` 散落各處
- [ ] marketStore 有完整的市場/符號/TF 狀態
- [ ] chartStore 可以 fetch 並快取 K線資料
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

### Phase 1-2：圖表層（Chart Infrastructure）
> 依賴 Phase 1-1 的資料層

**驗收標準：**
- [ ] BTCUSDT 1D K線正確顯示
- [ ] 成交量副圖同步顯示
- [ ] TF 切換時 K線跟著換
- [ ] Symbol 切換時 K線跟著換
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

### Phase 1-3：報價層（Quote Layer）
> 依賴 Phase 1-1 的 API

**驗收標準：**
- [ ] 報價每 60 秒自動更新
- [ ] 倒數計時器正常倒數
- [ ] 顏色根據漲跌正確顯示
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

### Phase 1-4：策略層（Strategy Layer）
> 依賴 Phase 1-1 的 API

**驗收標準：**
- [ ] 策略排行正確顯示
- [ ] 排序切換正常
- [ ] Modal 正確開啟/關閉
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

### Phase 1-5：情緒層（Sentiment Layer）
> 依賴 Phase 1-3 的 Quote

**驗收標準：**
- [ ] 8 個晶片正確顯示
- [ ] 切換市場時正確重算
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

### Phase 2-1：指標系統（Indicators）
> 依賴 Phase 1-1（資料）+ Phase 1-2（圖表）完成

**驗收標準：**
- [ ] BTCUSDT 1D：MA 三條線在 K線上
- [ ] RSI pane 在 K線下方
- [ ] TF 切換時指 標重新計算
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

### Phase 2-2：即時更新（Real-time）
> 依賴 Phase 1-3 的 Quote

**驗收標準：**
- [ ] Binance WebSocket 毫秒級更新
- [ ] 斷線時自動 fallback HTTP polling
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

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

## 六、第一個要實作的功能：Phase 1-1 資料層

### 為什麼第一個是資料層
軟體工程基本原則：**先有乾淨的資料層，上層才能正確運作。**
圖表層、報價層、策略層全部依賴 API fetch，沒有乾淨的 api.ts 和 store，其他全部無法正常運作。

### 實作任務清單

#### 任務 1：統一 API Service（`src/services/api.ts`）

建立乾淨的 API 層，封裝所有 server.py 端點呼叫。

**必須實作以下 function：**
```typescript
// CRYPTO
fetchCryptoSymbols(): Promise<{ symbol: string; display: string }[]>
fetchCryptoKlines(symbol: string, interval: string): Promise<OHLCV[]>
fetchCryptoQuote(symbol: string): Promise<Quote>

// TWSE
fetchTWSESymbols(): Promise<{ code: string; name: string }[]>
fetchTWSEKlines(code: string, interval: string): Promise<OHLCV[]>
fetchTWSEQuote(code: string): Promise<TWSEquote>

// US
fetchUSSymbols(): Promise<{ symbol: string; name: string }[]>
fetchUSKlines(symbol: string, interval: string): Promise<OHLCV[]>
fetchUSQuote(symbol: string): Promise<USquote>

// STRATEGIES
fetchStrategies(): Promise<Strategy[]>
```

**統一格式（OHLCV）：**
```typescript
interface OHLCV {
  time: number;   // Unix timestamp (秒)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

**Server API Base：** `http://localhost:5006`

**注意：**
- Server.py 的 `/api/crypto/klines` 的 response 格式是 `raw.data`，需要 normalize
- TWSE 和 US 的 klines endpoint 不同，要區分
- 所有 fetch 都要有 error handling（try/catch）
- 60秒快取由 `cache.ts` 處理，api.ts 只做 fetch

**commit message：** `feat: data layer - unified api service`

---

#### 任務 2：Cache Service（`src/services/cache.ts`）

從 v2 的 chart_market.js cache 邏輯移植而來，簡化為通用版本。

```typescript
class CacheService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxAge = 60000; // 60秒

  get(key: string): any | null;
  set(key: string, data: any): void;
  invalidate(key: string): void;  // key='*' 全部清除
  invalidatePattern(prefix: string): void;  // 'CRYPTO|' + symbol 全部清除
}
export const cache = new CacheService();
```

**commit message：** `feat: data layer - cache service`

---

#### 任務 3：Market Store（`src/stores/marketStore.ts`）

```typescript
interface MarketState {
  market: 'CRYPTO' | 'TWSE' | 'US';
  symbol: string;
  interval: string;
  symbols: { symbol: string; display: string; name?: string }[];
  isLoadingSymbols: boolean;
  setMarket: (m: MarketState['market']) => void;
  setSymbol: (s: string) => void;
  setInterval: (i: string) => void;
  fetchSymbols: () => Promise<void>;
}
```

**commit message：** `feat: data layer - market store`

---

#### 任務 4：Chart Store（`src/stores/chartStore.ts`）

```typescript
interface ChartState {
  data: OHLCV[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;  // timestamp
  fetchKlines: (market: string, symbol: string, interval: string) => Promise<void>;
  invalidateCache: () => void;
}
```

**注意：**
- 使用 `api.ts` 的 fetch functions，不直接 fetch
- 60秒 cache 有效期（`Date.now() - lastFetched < 60000`）
- `invalidateCache()` 由外部觸發（如倒數歸零）

**commit message：** `feat: data layer - chart store`

---

#### 測試驗收清單（Agent-測試者）
- [ ] `fetchCryptoKlines('BTCUSDT', '1d')` 回傳 non-empty array
- [ ] `fetchTWSEKlines('2330', '1wk')` 回傳 non-empty array
- [ ] `fetchUSKlines('AAPL', '1mo')` 回傳 non-empty array
- [ ] `marketStore.setMarket('TWSE')` 後 symbols 變成 TWSE 列表
- [ ] 60秒內重複 fetch 回傳 cache 的資料（不發請求）
- [ ] `cache.invalidate('*')` 後下次 fetch 真正發請求
- [ ] Console 無 Error

---

#### 審查重點（Agent-審查者）
- [ ] 所有 API 都有 error handling
- [ ] cache 邏輯正確（有效期限、key 命名）
- [ ] TypeScript types 完整（無 `any`）
- [ ] 命名清晰（api.ts 的 function names）
- [ ] 沒有 `window.fetch` 或 直接 `fetch()` 散落

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
