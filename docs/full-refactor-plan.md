# Dashboard V3 完整重構計畫
> 日期：2026-04-20
> 版本：v2（整合資料層分析）
> 涵蓋：前端（SolidJS）+ 後端（server.py）+ 資料攝取（Ingestion）+ 資料層標準化

---

## 總目標

**成為下一個 TradingView — 三市場（Crypto/TWSE/US）專業圖表平台**

---

## 一、現狀診斷

### 前端（V2 Vanilla JS）
- 50+ `window.*` 全域變數
- 400行 God Module（chart_market.js）
- `var` 泛濫，無 ES6+
- 零測試覆蓋
- 無法擴展（加 MA/RSI 要大改）

### 後端 API（server.py）
- 無 WebSocket（全部靠 polling）
- 無 Rate Limiting
- 無統一快取層
- Error handling 格式不一致

### 資料攝取（Ingestion Scripts）
- 三個 script 60% 重複程式碼（`setup_logging`/`append_or_replace`/CLI 完全相同）
- **TWSE _1w 從未生成**（`ingest_twse.py` 只寫 1d）
- **US _1w 全部損壞**（56 個 `*_1w.parquet` 全都只有 1 row）
- yfinance 不穩定，不適合長期使用
- 無 ingestion 監控（失敗沒 alert）

### 資料層標準化
- Parquet schema **已標準化** ✅（14 欄位，三市場完全一致）
- 三市場格式 **已統一** ✅
- 只需要：清理錯誤檔案 + ingestion 重構

---

## 二、重構範圍與目標架構

### 前端重構

| 層次 | V2 現狀 | V3 目標 |
|------|---------|---------|
| Framework | Vanilla JS + ES Module | SolidJS（Runes/Signals）|
| Build | 未知 | Vite 5 |
| State | 50+ window.* | Zustand Stores |
| Charts | lightweight-charts | lightweight-charts v4（npm）|
| UI | 自製 CSS | Tailwind CSS + Radix UI |
| 即時更新 | 60秒 polling | Binance WebSocket（毫秒級）|
| 技術指標 | 0 | MA/RSI/MACD/Bollinger |
| 測試 | 零 | Vitest + Playwright |

### 後端 API 重構

| 層次 | V2 現狀 | V3 目標 |
|------|---------|---------|
| Framework | Flask | 維持 Flask（穩定不動）|
| API 設計 | 分散 endpoint | 統一 `/api/v1/` 介面 |
| Rate Limiting | 無 | HTTP cache + LRU |
| Error Handling | 不一致 | 統一格式 |
| WebSocket | 無 | Binance WS Streams |

### 資料攝取重構

| 層次 | V2 現狀 | V3 目標 |
|------|---------|---------|
| Script 架構 | 三個獨立的重複 script | `ingest_base.py` + 市場 subclass |
| TWSE 週/月K | 只有 1d | 1d/1w/1mo 全部生成 |
| US _1w 檔 | 56 個損壞（1 row）| 刪除錯誤檔，正確用 `_1wk` |
| 資料來源 US | yfinance（不穩定）| 遷移到 Polygon.io |
| 監控 | 無 | Discord webhook alert |
| Scheduler | 分散 crontab | 統一 `scheduler.py` |

### 資料層標準化

| 層次 | V2 現狀 | V3 目標 |
|------|---------|---------|
| Parquet Schema | 已標準化 ✅ | 維持不變 |
| 三市場格式 | 已統一 ✅ | 維持不變 |
| 錯誤檔清理 | 未做 | 刪除所有 `*_1w.parquet`（US）|
| Symbol 定義 | 散落各地 | 統一在 `data/symbols/` 目錄 |

---

## 三、完整工作項目

---

### 🏗️ 階段 0：奠基（1天）

#### T0-1 [後端-緊急] 清理 US 損壞的 `_1w` 檔
```
問題：56 個 us/*_1w.parquet 全都只有 1 row（2026-04-13），應吃錯誤的 yfinance 回應
處理：
  1. 刪除所有 us/*_1w.parquet（mv 到 _trash/）
  2. 確認 server.py 的 /api/us/klines 只認 _1wk
  3. 通知前端 US 的週K URL 改用 _1wk
風險：無，直接 mv 不刪除
```
**luka 直接執行，不需要 agent**

#### T0-2 [後端-緊急] 清理 TWSE 不存在的 `_1w` 目錄
```
問題：TWSE 只有 1d 和 1mo，沒有 1w
處理：TWSE 的 `/api/twse/klines?interval=1w` 應 fallback 到 1mo 或從 1d resample
```
**luka 直接執行**

---

### 🏗️ 階段 1：前端 MVP 重構（2-4週）

#### T1-1 [前端] 資料層（Phase 1-1）
**任務：**
```
src/services/api.ts        — 統一 fetch，封裝所有 server.py API
src/services/cache.ts      — 60秒記憶體快取
src/stores/marketStore.ts  — 市場/符號/TF 狀態（Zustand）
src/stores/chartStore.ts   — K線 fetch + cache（Zustand）
src/types/index.ts         — 統一 TypeScript types（OHLCV/Quote/Strategy）
```

**commit message：** `feat(data-layer): add unified API service, cache, and Zustand stores`

**驗收：**
- [ ] `fetchCryptoKlines('BTCUSDT', '1d')` 回傳 non-empty OHLCV array
- [ ] `fetchTWSEKlines('2330', '1wk')` 回傳 non-empty OHLCV array
- [ ] `fetchUSKlines('AAPL', '1mo')` 回傳 non-empty OHLCV array
- [ ] 60秒內重複 fetch 回傳 cache
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

#### T1-2 [前端] 圖表層（Phase 1-2）
**任務：**
```
src/hooks/useChart.ts           — chart lifecycle hook
src/components/charts/CandleChart.tsx   — K線主圖（lightweight-charts）
src/components/charts/VolumePane.tsx   — 成交量副圖
src/components/market/TFSwitcher.tsx    — TF 按鈕（15m/1h/4h/D/W/M）
src/components/market/SymbolPicker.tsx  — 符號選擇下拉選單
src/components/market/PriceDisplay.tsx — 報價顯示（價格+漲跌%+成交量）
```

**commit message：** `feat(chart-layer): add CandleChart, VolumePane, TF/Symbol pickers`

**驗收：**
- [ ] BTCUSDT 1D K線正確顯示
- [ ] 成交量副圖同步顯示
- [ ] TF 切換（15m → 1h → D → W）K線跟著換
- [ ] Symbol 切換（BTCUSDT → ETHUSDT）K線跟著換
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

#### T1-3 [前端] 報價層 + UI（Phase 1-3）
**任務：**
```
src/stores/quoteStore.ts            — 即時報價 store
src/components/ui/CountdownTimer.tsx — 倒數計時器（每秒遞減，歸零 refresh）
src/components/ui/UpdateBadge.tsx   — 更新狀態徽章（loading/stale/live）
src/components/layout/TabBar.tsx    — CRYPTO/TWSE/US Tab 切換
src/components/layout/TopBar.tsx    — 頂部導航列
```

**commit message：** `feat(quote-layer): add quote store, countdown timer, tab bar`

**驗收：**
- [ ] 報價每 60 秒自動更新
- [ ] 倒數計時器正常倒數（90 → 0 → reset）
- [ ] Tab 切換（CRYPTO ↔ TWSE ↔ US）正確
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

#### T1-4 [前端] 策略層（Phase 1-4）
**任務：**
```
src/stores/strategyStore.ts           — 策略 store（Zustand）
src/components/strategies/StrategyTable.tsx  — 策略排行（5 維度排序）
src/components/strategies/StrategyModal.tsx   — 策略詳情 Modal
src/components/strategies/ConsensusBar.tsx    — 共識 bar
src/components/strategies/SentimentChips.tsx — 情緒晶片（8 種）
```

**commit message：** `feat(strategy-layer): add strategy table, modal, consensus bar, sentiment chips`

**驗收：**
- [ ] 策略排行顯示正確（勝率/盈虧比/MaxDD/Sharpe/信心度）
- [ ] 5 種排序切換正常
- [ ] 點擊 row 開啟 Modal
- [ ] 情緒晶片顯示正確（切換市場時重算）
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

### 🏗️ 階段 2：進階功能（2-3週）

#### T2-1 [前端] 指標系統（Phase 2-1）
**任務：**
```
src/utils/indicators.ts           — SMA/EMA/RSI/MACD 計算公式
src/components/charts/MALines.tsx     — MA5/20/60 疊加（可個別開關）
src/components/charts/RSIPane.tsx     — RSI14 獨立 pane
src/components/charts/BollingerPane.tsx — Bollinger Bands pane
src/hooks/useIndicators.ts           — 指標 hook
```

**commit message：** `feat(indicators): add MA lines, RSI pane, Bollinger Bands`

**驗收：**
- [ ] BTCUSDT 1D：MA5（紅）/ MA20（黃）/ MA60（紫）在 K線上
- [ ] RSI pane 在 K線下方（高度 150px）
- [ ] TF 切換時指 標重新計算
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

#### T2-2 [後端] Binance WebSocket 即時更新（Phase 2-2）
**任務：**
```
server/ws_manager.py     — Binance WS 訂閱/取消/重連管理
server/api_v1.py         — 統一 /api/v1/ 介面（廢棄舊的分散 endpoint）
server/cache_layer.py    — HTTP cache + LRU（保護外部 API）
src/services/ws.ts      — 前端 WebSocket client hook
src/hooks/useRealtime.ts — 即時 K線 hook
```

**commit message:** `feat(realtime): add Binance WebSocket + unified /api/v1`

**驗收：**
- [ ] CRYPTO K線 < 1 秒更新（非 60 秒 polling）
- [ ] WebSocket 斷線自動重連
- [ ] 斷線 fallback 到 HTTP polling
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

#### T2-3 [前端] 價格警報（Phase 2-3）
**任務：**
```
src/stores/alertStore.ts           — 警報規則 store
src/components/ui/AlertToast.tsx   — 警報通知 Toast
src/services/alertChecker.ts       — 每次報價時檢查警報條件
```

**commit message:** `feat(alerts): add price alert system`

**驗收：**
- [ ] 設定「BTC > 70000」後，觸及時收到 Toast 通知
- [ ] localStorage 持久化，刷新頁面不消失
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

### 🏗️ 階段 3：後端重構（2-3週）

#### T3-1 [後端] ingestion 重構 — 抽取 base class
**問題：** 三個 script 60% 重複
**任務：**
```
scripts/ingest_base.py    — 共享：CLI/logging/append_or_replace/resample logic
scripts/ingest_crypto.py  — ccxt，只改 symbol 列表
scripts/ingest_twse.py    — requests，只改 API call
scripts/ingest_us.py      — yfinance → 准備遷移 Polygon.io
```

**commit message:** `refactor(ingestion): extract ingest_base.py, reduce duplication`

---

#### T3-2 [後端] TWSE 1w 週K生成
**問題：** `ingest_twse.py` 的 `TIMEFRAMES` 宣告了 `1w` 但從未實作
**任務：**
```python
# 在 ingest_twse.py 加入：
def resample_weekly(df_daily: pd.DataFrame) -> pd.DataFrame:
    cols = {col: 'last' if col in ['open', 'high', 'low', 'close', 'volume'] else 'last' for col in df_daily.columns}
    df_weekly = df_daily.resample('W').agg({...}).dropna(how='all')
    # 同理 1mo
```

**commit message:** `fix(ingestion): add TWSE weekly/monthly K-line resampling`

**驗收：**
- [ ] TWSE `1101_1w.parquet` 有完整週K（從 2016 起）
- [ ] TWSE `2330_1mo.parquet` 有完整月K
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

#### T3-3 [後端] Data Service + Alerts
**任務：**
```
scripts/scheduler.py   — 統一 cron 路由（三市場 ingestion）
scripts/alerts.py      — ingestion 失敗時發 Discord webhook
scripts/freshness_check.py — 主動檢查並 alert
```

**commit message:** `feat(ingestion): add scheduler, alerts, freshness monitoring`

**驗收：**
- [ ] ingestion 失敗時 Discord 收到 alert
- [ ] 資料落後 > 24h 時 Discord 收到 alert
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

#### T3-4 [後端] US 遷移到 Polygon.io（Phase 3-4）
**問題：** yfinance 不穩定，不適合專業平台
**任務：**
1. 評估 Polygon.io vs Alpha Vantage
2. 修改 `ingest_us.py` 使用新資料源
3. 補完所有 US 股票歷史（目前有 60 個，應擴充到 S&P 500）

**commit message:** `feat(ingestion): migrate US data source to Polygon.io`

---

### 🏗️ 階段 4：高級功能（1-2個月）

#### T4-1 [前端] 繪圖工具
**任務：** Horizontal Line / Trend Line / Rectangle / Fibonacci

#### T4-2 [前端] Screener（市場掃描器）
**任務：** 多條件篩選（RSI < 30、MA Golden Cross、成交量 > 均量 2x）

#### T4-3 [前端] Watchlist（觀察列表）
**任務：** 自選股列表 + Sparkline 迷你圖

#### T4-4 [後端] 策略回測 Engine
**任務：**
```
server/backtest_engine.py  — Python 回測核心
/api/backtest endpoint     — equity curve + trade log
前端 EquityCurve.tsx       — 回測結果展示
```

---

## 四、技術架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (SolidJS)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Candle   │ │ Volume   │ │ RSI/MA   │ │ Strategy │        │
│  │ Chart    │ │ Pane     │ │ Panes    │ │ Table    │        │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │
│       └────────────┴────────────┴────────────┘               │
│                        │ Zustand Stores                      │
│              marketStore | chartStore | quoteStore | ...     │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────┼───────────────────────────────────┐
│                   API Server (Flask)                           │
│  ┌─────────────────────┴───────────────────────────────────┐ │
│  │  /api/v1/klines  — 讀取 parquet（統一格式）              │ │
│  │  /api/v1/quote   — 即時報價（Binance/TWSE/US proxy）      │ │
│  │  /api/v1/realtime — WebSocket 升級（Binance WS）          │ │
│  │  /api/strategies — 策略查詢（port 5008 proxy）           │ │
│  └───────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│               Data Service（獨立行程）                             │
│  ┌───────────┬───────────┬───────────┬───────────┐            │
│  │ scheduler │  alerts    │ quality   │ freshness │            │
│  └───────────┴───────────┴───────────┴───────────┘            │
│  ┌───────────┬───────────┬───────────┐                       │
│  │ CRYPTO    │ TWSE      │ US        │                       │
│  │ ccxt      │ requests  │ Polygon.io │ ← T3-4 遷移           │
│  │ ✅ 成熟   │ ⚠️ 修 1w  │ ❌ yfi   │                       │
│  └───────────┴───────────┴───────────┘                       │
│                                                             │
│  資料儲存：parquet（data/ohlcvutc/）                        │
│  備份：GCS / S3 每週 snapshot                               │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  scripts/                                                    │
│  ├── ingest_base.py   ← T3-1 新增（共享邏輯）              │
│  ├── ingest_crypto.py ← 只改 symbol 列表                    │
│  ├── ingest_twse.py   ← T3-2 加入 1w/1mo resample         │
│  └── ingest_us.py     ← T3-4 遷移到 Polygon.io              │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、三關審核流程

每個任務都依序經過：

```
實作者（implementer）
  → 提交 PR
  → 測試者（tester）：Playwright 實際操作驗證
  → 審查者（reviewer）：程式碼審查 → 報告
  → Gino：看報告 → 決策（LGTM ✅ / 需修改 / 駁回 ❌）
  → Merge to main
```

**Gino 的角色：** 只看審查報告，不需要自己測試。

---

## 六、預估工時

| 階段 | 任務 | 工時 |
|------|------|------|
| T0-1, T0-2 | 緊急清理（luka 直接做）| 10 分鐘 |
| 階段 1 | 前端 MVP（T1-1 → T1-4）| 2-4 週 |
| 階段 2 | 進階功能（T2-1 → T2-3）| 2-3 週 |
| 階段 3 | 後端重構（T3-1 → T3-4）| 2-3 週 |
| 階段 4 | 高級功能（T4-1 → T4-4）| 1-2 個月 |

**總計：約 3-4 個月（兼職）**

---

## 七、GitHub Repo

| Repo | 用途 |
|------|------|
| `dashboard-v2-standalone` | V2 當前運行（維護中，不動）|
| `dashboard-v3` | V3 重構（新功能開發）|

**並行策略：** V2 正常運行，V3 在 `dashboard-v3` 開發，完成一個階段就上線一個。

---

## 八、當前任務

### T0-1 + T0-2：緊急清理
**luka 直接執行（馬上做）**
- 刪除所有 `us/*_1w.parquet`（56 個壞檔）
- 刪除所有 `twse/*_1w.parquet`（0 個，但確保沒有殘留）

### T1-1：前端資料層
**派 agent 實作（三關流程）**
- `src/services/api.ts`
- `src/services/cache.ts`
- `src/stores/marketStore.ts`
- `src/stores/chartStore.ts`
- `src/types/index.ts`

---

Gino，這是完整的重構計畫。確認後說「開始」，我就：
1. **馬上執行** T0-1 + T0-2（luka 直接做，10分鐘）
2. **派出** T1-1 前端資料層 agent（走三關流程）