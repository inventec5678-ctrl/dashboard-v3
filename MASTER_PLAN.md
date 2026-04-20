# Dashboard V3 完整重構計畫 MASTER_PLAN

> 整合日期：2026-04-20
> 版本：v1.0
> Repo：dashboard-v3（純計畫，不寫 code）

---

## 願景

**成為下一個 TradingView — 三市場（Crypto/TWSE/US）專業圖表平台**

結合在地化策略排行與情緒指標，讓交易者在一個平台看遍全球市場。

---

## 技術棧

### 前端

| 層面 | 選擇 |
|------|------|
| Framework | SolidJS（Runes API / Signals）|
| Build | Vite 5 |
| State | Zustand |
| Charts | lightweight-charts v4（npm）|
| UI | Tailwind CSS + Radix UI Primitives |
| 測試 | Vitest + Playwright |

### 後端 Python

| 層面 | 選擇 |
|------|------|
| Framework | FastAPI 2.0（維持 server.py 基礎，模組化重構）|
| HTTP Client | httpx（共享 AsyncClient）|
| 驗證 | Pydantic v2 |
| Cache | 記憶體 dict（TTL 60s），不需 Redis |
| 可選遷移 | Polars（讀取 Parquet 提速 5-10x）|

### 資料攝取

| 市場 | 資料來源 | 狀態 |
|------|---------|------|
| CRYPTO | Binance（ccxt）| ✅ 成熟 |
| TWSE | TWSE API + FinMind 備用 | ⚠️ 需修復 1w/1mo |
| US | yfinance → **Polygon.io**（遷移中）| ❌ 需遷移 |

### 資料儲存

- **Parquet**（UTC index，14 欄位 schema 已標準化）
- **未來備份**：GCS / S3 每週 snapshot
- **不需要 TimescaleDB**（目前 < 1 億筆資料，Parquet 完全足夠）

---

## 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (SolidJS)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Candle   │ │ Volume   │ │ RSI/MA   │ │ Strategy │        │
│  │ Chart    │ │ Pane     │ │ Panes    │ │ Table    │        │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │
│       └────────────┴────────────┴────────────┘               │
│                        │ Zustand Stores                      │
│          marketStore | chartStore | quoteStore | ...        │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│               API Server (FastAPI / server.py)                │
│  ┌─────────────────────┴───────────────────────────────────┐│
│  │  /api/v1/klines   — 讀取 parquet（統一格式）             ││
│  │  /api/v1/quote    — 即時報價（Binance/TWSE/US proxy）     ││
│  │  /api/v1/realtime — WebSocket 升級（Binance WS）          ││
│  │  /api/strategies  — 策略查詢（port 5008 proxy）           ││
│  │  /api/v1/indicators — 指標計算（可選）                   ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Data Service（獨立行程 / Cron）                   │
│  ┌───────────┬───────────┬───────────┬───────────┐           │
│  │ scheduler │  alerts   │ quality   │ freshness │           │
│  └───────────┴───────────┴───────────┴───────────┘           │
│  ┌───────────┬───────────┬───────────┐                       │
│  │ CRYPTO    │ TWSE      │ US        │                       │
│  │ ccxt      │ requests  │ Polygon.io │ ← T3-4 遷移目標       │
│  │ ✅ 成熟   │ ⚠️ 修 1w  │ ❌ yfi   │                       │
│  └───────────┴───────────┴───────────┘                       │
│                                                             │
│  資料儲存：parquet（data/ohlcvutc/）                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 前端重構計畫

### 前端技術選型

**為什麼 SolidJS？**

| 維度 | Vanilla JS | React 18 | Vue 3 | SolidJS |
|------|------------|----------|-------|---------|
| 學習曲線 | 低 | 中 | 中低 | 中 |
| 執行期效能 | 高 | 中(vDOM) | 中(vDOM) | **最高** |
| 可維護性 | 低 | **高** | 高 | 高 |
| 適合 K線高頻更新 | ❌ | ✅ | ✅ | **✅✅** |
| 與 lightweight-charts 整合 | 完美 | 好 | 好 | 好 |

**SolidJS 顆粒度更新比 React 快 20-30%，最適合 K線高頻更新。**

### 前端工作項目

---

#### T1-1 [前端] 資料層 ✅ Phase 1-1

**任務：**
```
src/services/api.ts        — 統一 fetch，封裝所有 server.py API
src/services/cache.ts      — 60秒記憶體快取
src/stores/marketStore.ts  — 市場/符號/TF 狀態（Zustand）
src/stores/chartStore.ts   — K線 fetch + cache（Zustand）
src/types/index.ts         — 統一 TypeScript types（OHLCV/Quote/Strategy）
```

**commit message：** `feat(data-layer): add unified API service, cache, and Zustand stores`

**驗收標準：**
- [ ] `fetchCryptoKlines('BTCUSDT', '1d')` 回傳 non-empty OHLCV array
- [ ] `fetchTWSEKlines('2330', '1wk')` 回傳 non-empty OHLCV array
- [ ] `fetchUSKlines('AAPL', '1mo')` 回傳 non-empty OHLCV array
- [ ] 60秒內重複 fetch 回傳 cache
- [ ] Console 無 Error

---

#### T1-2 [前端] 圖表層 ✅ Phase 1-2

**任務：**
```
src/hooks/useChart.ts           — chart lifecycle hook
src/components/charts/CandleChart.tsx   — K線主圖（lightweight-charts）
src/components/charts/VolumePane.tsx    — 成交量副圖
src/components/market/TFSwitcher.tsx    — TF 按鈕（15m/1h/4h/D/W/M）
src/components/market/SymbolPicker.tsx   — 符號選擇下拉選單
src/components/market/PriceDisplay.tsx  — 報價顯示（價格+漲跌%+成交量）
```

**commit message：** `feat(chart-layer): add CandleChart, VolumePane, TF/Symbol pickers`

**驗收標準：**
- [ ] BTCUSDT 1D K線正確顯示
- [ ] 成交量副圖同步顯示
- [ ] TF 切換（15m → 1h → D → W）K線跟著換
- [ ] Symbol 切換（BTCUSDT → ETHUSDT）K線跟著換
- [ ] Console 無 Error

---

#### T1-3 [前端] 報價層 + UI ✅ Phase 1-3

**任務：**
```
src/stores/quoteStore.ts            — 即時報價 store
src/components/ui/CountdownTimer.tsx — 倒數計時器（每秒遞減，歸零 refresh）
src/components/ui/UpdateBadge.tsx   — 更新狀態徽章（loading/stale/live）
src/components/layout/TabBar.tsx    — CRYPTO/TWSE/US Tab 切換
src/components/layout/TopBar.tsx    — 頂部導航列
```

**commit message：** `feat(quote-layer): add quote store, countdown timer, tab bar`

**驗收標準：**
- [ ] 報價每 60 秒自動更新
- [ ] 倒數計時器正常倒數（90 → 0 → reset）
- [ ] Tab 切換（CRYPTO ↔ TWSE ↔ US）正確
- [ ] Console 無 Error

---

#### T1-4 [前端] 策略層 ✅ Phase 1-4

**任務：**
```
src/stores/strategyStore.ts           — 策略 store（Zustand）
src/components/strategies/StrategyTable.tsx  — 策略排行（5 維度排序）
src/components/strategies/StrategyModal.tsx   — 策略詳情 Modal
src/components/strategies/ConsensusBar.tsx    — 共識 bar
src/components/strategies/SentimentChips.tsx   — 情緒晶片（8 種）
```

**commit message：** `feat(strategy-layer): add strategy table, modal, consensus bar, sentiment chips`

**驗收標準：**
- [ ] 策略排行顯示正確（勝率/盈虧比/MaxDD/Sharpe/信心度）
- [ ] 5 種排序切換正常
- [ ] 點擊 row 開啟 Modal
- [ ] 情緒晶片顯示正確（切換市場時重算）
- [ ] Console 無 Error

---

#### T2-1 [前端] 指標系統 ✅ Phase 2-1

**任務：**
```
src/utils/indicators.ts           — SMA/EMA/RSI/MACD 計算公式
src/components/charts/MALines.tsx     — MA5/20/60 疊加（可個別開關）
src/components/charts/RSIPane.tsx     — RSI14 獨立 pane
src/components/charts/BollingerPane.tsx — Bollinger Bands pane
src/hooks/useIndicators.ts           — 指標 hook
```

**commit message：** `feat(indicators): add MA lines, RSI pane, Bollinger Bands`

**驗收標準：**
- [ ] BTCUSDT 1D：MA5（紅）/ MA20（黃）/ MA60（紫）在 K線上
- [ ] RSI pane 在 K線下方（高度 150px）
- [ ] TF 切換時指標重新計算
- [ ] Console 無 Error

---

#### T2-2 [前端] 即時更新（WebSocket）✅ Phase 2-2

**任務：**
```
src/services/ws.ts              — 前端 WebSocket client hook
src/hooks/useRealtime.ts        — 即時 K線 hook
src/stores/realtimeStore.ts     — 即時狀態 store
```

**commit message：** `feat(realtime): add Binance WebSocket client hook`

**驗收標準：**
- [ ] CRYPTO K線 < 1 秒更新（非 60 秒 polling）
- [ ] WebSocket 斷線自動重連
- [ ] 斷線 fallback 到 HTTP polling
- [ ] Console 無 Error

---

#### T2-3 [前端] 價格警報 ✅ Phase 2-3

**任務：**
```
src/stores/alertStore.ts           — 警報規則 store
src/components/ui/AlertToast.tsx    — 警報通知 Toast
src/services/alertChecker.ts       — 每次報價時檢查警報條件
```

**commit message：** `feat(alerts): add price alert system`

**驗收標準：**
- [ ] 設定「BTC > 70000」後，觸及時收到 Toast 通知
- [ ] localStorage 持久化，刷新頁面不消失
- [ ] Console 無 Error

---

## 後端重構計畫（Python FastAPI 現代化）

### 後端技術選型

**繼續用 FastAPI**，原因：
- 目前 server.py 是 Flask，但實為 Starlette 架構
- FastAPI 是 Starlette 的超集，完全兼容
- 生產級、非同步、Pydantic v2 原生支援
- WebSocket 原生支援
- **不需要 Go/Rust**：Python 完全夠用（< 1000 用戶，單實例撐得住）

**現階段不需要 Redis**：
- 記憶體 dict + TTL 60s 足夠
- 等 `uvicorn --workers 4+` 多進程部署時再考慮

**現階段不需要 TimescaleDB**：
- 目前資料 < 1 億筆，Parquet 完全足夠
- 查詢模式是簡單時間範圍讀取，不需要複雜聚合

### 後端工作項目

---

#### T0-1 [後端-緊急] 清理 US 損壞的 `_1w` 檔 ⚠️ luka 直接執行

```
問題：56 個 us/*_1w.parquet 全都只有 1 row（2026-04-13），應吃錯誤的 yfinance 回應
處理：
  1. 刪除所有 us/*_1w.parquet（mv 到 _trash/）
  2. 確認 server.py 的 /api/us/klines 只認 _1wk
  3. 通知前端 US 的週K URL 改用 _1wk
```

---

#### T0-2 [後端-緊急] 確保 TWSE 無殘留 `_1w` 檔 ⚠️ luka 直接執行

```
問題：TWSE 只有 1d 和 1mo，沒有 1w
處理：TWSE 的 /api/twse/klines?interval=1w 應 fallback 到 1mo 或從 1d resample
```

---

#### T2-4 [後端] FastAPI 現代化 — 立即改（1-2天）

**任務：**
```
1. 共享 httpx.AsyncClient
   → 在 lifespan 裡創建，所有路由復用
   → 廢掉每請求新建 client 的寫法

2. 修掉同步阻塞程式碼
   → yfinance 改用 asyncio.to_thread() 包起來
   → 確認所有路由沒有同步 I/O 在 async 函數裡

3. 統一錯誤處理
   → 全部用 HTTPException(status_code=xxx)
   → 廢掉 JSONResponse(status_code=...) 直接返回的模式
```

**commit message：** `refactor(backend): share httpx client, fix sync blocking, unify error handling`

---

#### T2-5 [後端] FastAPI 模組化拆分（3-5天）

**任務：**
```
server.py (553行) → 
  app.py (50行：FastAPI init + lifespan + 統一攔截器)
  routers/
    ├─ crypto.py      # 幣行情、k線
    ├─ twse.py        # 台股行情
    ├─ us.py          # 美股行情
    ├─ strategies.py  # 策略信號（proxy to agent）
    └─ ws.py          # WebSocket（Phase 2-2）
  core/
    ├─ cache.py        # 記憶體 dict cache（TTL 60s）
    ├─ http_client.py  # 共享 httpx.AsyncClient
    ├─ config.py      # Pydantic Settings
    └─ exceptions.py  # 統一錯誤處理
  models/
    └─ schemas.py     # Pydantic v2 models
```

**commit message：** `refactor(backend): modularize server.py into routers/ + core/`

**驗收標準：**
- [ ] `/api/v1/klines` 統一介面（廢舊的分散 endpoint）
- [ ] 所有路由有 Pydantic response_model
- [ ] Console 無 Error
- [ ] 代碼有 Review 報告

---

#### T2-6 [後端] Rate Limiting（中度）

**任務：**
- 用 `slowapi` 做簡單記憶體 rate limit
- 規則：每 IP 100 requests/minute

**commit message：** `feat(backend): add rate limiting middleware`

---

## 資料攝取重構計畫

### 工作項目

---

#### T3-1 [資料攝取] ingestion base class 抽取

**問題：** 三個 script 60% 重複（`setup_logging`/`append_or_replace`/CLI 完全相同）

**任務：**
```
scripts/ingest_base.py    — 共享：CLI/logging/append_or_replace/resample logic
scripts/ingest_crypto.py  — ccxt，只改 symbol 列表
scripts/ingest_twse.py    — requests，只改 API call
scripts/ingest_us.py      — yfinance → 准備遷移 Polygon.io
```

**commit message：** `refactor(ingestion): extract ingest_base.py, reduce duplication`

**驗收標準：**
- [ ] 三個 script 繼承 base class，程式碼重複從 60% 降到 < 20%
- [ ] CLI 介面不變（backward compatible）
- [ ] Console 無 Error

---

#### T3-2 [資料攝取] TWSE 1w/1mo 生成

**問題：** `ingest_twse.py` 的 `TIMEFRAMES` 宣告了 `1w`/`1mo` 但從未實作

**任務：**
```python
# 在 ingest_twse.py 加入：
def resample_weekly(df_daily: pd.DataFrame) -> pd.DataFrame:
    df_weekly = df_daily.resample('W').agg({...}).dropna(how='all')
    # 同理 1mo
```

**commit message：** `fix(ingestion): add TWSE weekly/monthly K-line resampling`

**驗收標準：**
- [ ] TWSE `1101_1w.parquet` 有完整週K（從 2016 起）
- [ ] TWSE `2330_1mo.parquet` 有完整月K
- [ ] Console 無 Error

---

#### T3-3 [資料攝取] Data Service + Alerts

**任務：**
```
scripts/scheduler.py          — 統一 cron 路由（三市場 ingestion）
scripts/alerts.py             — ingestion 失敗時發 Discord webhook
scripts/freshness_check.py    — 主動檢查並 alert（資料落後 > 24h）
```

**commit message：** `feat(ingestion): add scheduler, alerts, freshness monitoring`

**驗收標準：**
- [ ] ingestion 失敗時 Discord 收到 alert
- [ ] 資料落後 > 24h 時 Discord 收到 alert
- [ ] Console 無 Error

---

#### T3-4 [資料攝取] US 遷移到 Polygon.io

**問題：** yfinance 不穩定，不適合專業平台

**任務：**
1. 評估 Polygon.io vs Alpha Vantage
2. 修改 `ingest_us.py` 使用新資料源
3. 補完所有 US 股票歷史（目前 60 個 → 擴充到 S&P 500 涵蓋）

**commit message：** `feat(ingestion): migrate US data source to Polygon.io`

**驗收標準：**
- [ ] US 股票資料不再使用 yfinance
- [ ] 補完所有 S&P 500 成分股歷史（2016 起）
- [ ] Console 無 Error

---

## 功能藍圖（依優先順序）

### P0 — 立即實作（1-2週）

| 功能 | 代號 | 說明 |
|------|------|------|
| 技術指標（MA/RSI）| T2-1 | MA5/20/60 + RSI14，Client-side 計算 |
| 價格警報 | T2-3 | localStorage 持久化，Toast 通知 |
| WebSocket 即時更新 | T2-2 | Binance WebSocket，60秒 → 毫秒級 |

### P1 — 短期目標（1個月）

| 功能 | 說明 |
|------|------|
| MACD + Bollinger Bands | T2-1 已含 |
| 繪圖工具 | Horizontal Line / Trend Line / Rectangle / Fibonacci |
| Screener（市場掃描器）| 多條件篩選（RSI < 30、MA Golden Cross、成交量 > 均量 2x）|
| Watchlist（觀察列表）| 自選股列表 + Sparkline 迷你圖 |

### P2 — 中期目標（2-3個月）

| 功能 | 說明 |
|------|------|
| 策略回測（Backtest）| Python Backend：equity curve + trade log + Win Rate/Sharpe/Max DD |
| 自訂時間範圍 | 任意起訖日期 |
| 資料匯出 | CSV / Excel |
| News Feed 整合 | 最新消息疊加在 K線上 |

### P3 — 長期願景

| 功能 | 說明 |
|------|------|
| 社群分享 | Public Chart 連結 |
| 行動 App | iOS / Android |
| API 開放平台 | 第三方接入 |

---

## 開發流程（三關審核）

每個任務都依序經過四關：

```
┌────────────────────────────────────────────────────────────┐
│ 1. Agent-實作者（implementer）                              │
│    → 實作功能、寫測試、提交 PR                              │
├────────────────────────────────────────────────────────────┤
│ 2. Agent-測試者（tester）                                   │
│    → Playwright 實際操作驗證                                │
│    → 點擊按鈕、觀察 K線、檢查 Console                        │
├────────────────────────────────────────────────────────────┤
│ 3. Agent-審查者（reviewer）                                 │
│    → 審視程式碼：安全性、效能、可維護性                     │
│    → 產出審查報告                                           │
├────────────────────────────────────────────────────────────┤
│ 4. 人（Gino）審核                                           │
│    → 看審查報告                                             │
│    → 決策：LGTM ✅ / 需修改 / 駁回 ❌                       │
│    → 通過後 merge 到 main                                  │
└────────────────────────────────────────────────────────────┘
```

**Gino 的角色：** 只看審查報告，不需要自己測試。

---

## 優先順序總表

| 代號 | 層面 | 任務 | 緊急性 | 預估工時 | 備註 |
|------|------|------|--------|---------|------|
| T0-1 | 後端 | 清理 US `*_1w` 損壞檔 | 🔴 緊急 | 10 分鐘 | luka 直接做 |
| T0-2 | 後端 | TWSE `_1w` fallback | 🔴 緊急 | 10 分鐘 | luka 直接做 |
| T1-1 | 前端 | 資料層（api/cache/stores）| 🔴 緊急 | 2-3 天 | 所有上層依賴 |
| T1-2 | 前端 | 圖表層（CandleChart + Volume）| 🟡 中 | 3-5 天 | 依賴 T1-1 |
| T1-3 | 前端 | 報價層（quoteStore + Countdown）| 🟡 中 | 2-3 天 | 依賴 T1-1 |
| T1-4 | 前端 | 策略層（Strategy Table + Modal）| 🟡 中 | 3-5 天 | 依賴 T1-1 |
| T2-1 | 前端 | 指標系統（MA/RSI/MACD/Bollinger）| 🟡 中 | 1-2 週 | 依賴 T1-2 |
| T2-2 | 前端 | WebSocket 即時更新 | 🟡 中 | 1-2 週 | 依賴 T1-3 |
| T2-3 | 前端 | 價格警報 | 🟢 低 | 2-3 天 | 依賴 T1-3 |
| T2-4 | 後端 | FastAPI 現代化（即時改）| 🟡 中 | 4-8 小時 | 修阻塞代碼 |
| T2-5 | 後端 | FastAPI 模組化拆分 | 🟡 中 | 1-2 人天 | 依賴 T2-4 |
| T2-6 | 後端 | Rate Limiting | 🟢 低 | 1 天 | |
| T3-1 | 攝取 | ingestion base class | 🟡 中 | 1-2 天 | |
| T3-2 | 攝取 | TWSE 1w/1mo 生成 | 🟡 中 | 1 天 | |
| T3-3 | 攝取 | Data Service + Alerts | 🟡 中 | 2-3 天 | |
| T3-4 | 攝取 | US 遷移 Polygon.io | 🟡 中 | 3-5 天 | |

---

## 當前任務（立即開始）

### Luka 直接執行（不派 agent）

```
T0-1：刪除所有 us/*_1w.parquet（mv 到 _trash/）
T0-2：確認 TWSE /api/twse/klines?interval=1w fallback 到 1mo
```

### 第一個派 agent 的任務

```
T1-1：前端資料層
  → src/services/api.ts
  → src/services/cache.ts
  → src/stores/marketStore.ts
  → src/stores/chartStore.ts
  → src/types/index.ts
  → 走三關審核流程
```

---

## Commit 指令

所有 commit 指令（從 dashboard_v3 repo 根目錄執行）：

```bash
# T0-1 + T0-2（luka 直接執行）
cd /Users/changrunlin/.openclaw/workspace/dashboard_v3

# US 壞檔清理
for f in data/ohlcvutc/us/*_1w.parquet; do [ -f "$f" ] && mv "$f" "data/ohlcvutc/us/_trash/$(basename $f)"; done
git add -A && git commit -m "fix(data): remove corrupted us *_1w parquet files (56 files, 1 row each)"

# TWSE _1w fallback（確認 server.py 或標記需修復）
# 需確認 /api/twse/klines?interval=1w 的 fallback 邏輯
```

```bash
# T1-1 前端資料層（派 agent）
git add -A && git commit -m "feat(data-layer): add unified API service, cache service, and Zustand stores (marketStore, chartStore)"
```

```bash
# T1-2 圖表層
git add -A && git commit -m "feat(chart-layer): add CandleChart, VolumePane, TFSwitcher, SymbolPicker, PriceDisplay"
```

```bash
# T1-3 報價層
git add -A && git commit -m "feat(quote-layer): add quoteStore, CountdownTimer, UpdateBadge, TabBar, TopBar"
```

```bash
# T1-4 策略層
git add -A && git commit -m "feat(strategy-layer): add StrategyTable, StrategyModal, ConsensusBar, SentimentChips"
```

```bash
# T2-1 指標系統
git add -A && git commit -m "feat(indicators): add MA5/20/60 lines, RSI pane, Bollinger Bands"
```

```bash
# T2-2 WebSocket 即時更新
git add -A && git commit -m "feat(realtime): add Binance WebSocket client hook and fallback to HTTP polling"
```

```bash
# T2-3 價格警報
git add -A && git commit -m "feat(alerts): add price alert system with localStorage persistence"
```

```bash
# T2-4 FastAPI 現代化
git add -A && git commit -m "refactor(backend): share httpx AsyncClient, fix sync yfinance blocking, unify error handling"
```

```bash
# T2-5 FastAPI 模組化拆分
git add -A && git commit -m "refactor(backend): modularize server.py into routers/ + core/ (FastAPI modern architecture)"
```

```bash
# T3-1 ingestion base class
git add -A && git commit -m "refactor(ingestion): extract ingest_base.py, reduce duplication across 3 scripts"
```

```bash
# T3-2 TWSE 1w/1mo 生成
git add -A && git commit -m "fix(ingestion): add TWSE weekly/monthly K-line resampling from daily data"
```

```bash
# T3-3 Data Service + Alerts
git add -A && git commit -m "feat(ingestion): add scheduler, Discord alerts, and freshness monitoring"
```

```bash
# T3-4 US 遷移 Polygon.io
git add -A && git commit -m "feat(ingestion): migrate US data source from yfinance to Polygon.io"
```

---

## 附錄：v2 VS v3 對照

| 維度 | v2（現在）| v3（目標）|
|------|----------|----------|
| 架構 | Vanilla JS + ES Module | SolidJS + Zustand |
| 狀態管理 | 50+ window.* | Zustand Store |
| 技術指標 | 0 | MA/RSI/MACD/Bollinger |
| 即時更新 | 60秒 polling | WebSocket（毫秒級）|
| 報價警報 | 無 | 有 |
| 測試覆蓋 | 0 | Vitest + Playwright |
| 後端架構 | 553 行 monolithic | 模組化 routers/ + core/ |
| 資料攝取 | 60% 重複 script | base class + subclass |
| 可維護性 | 低 | 高 |
| 擴展性 | 差 | 好 |
