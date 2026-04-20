# Dashboard V3 完整重構計畫

> 版本：v2.0（2026-04-20）
> Repo：https://github.com/inventec5678-ctrl/dashboard-v3

---

## 願景

**成為下一個 TradingView — 三市場（Crypto/TWSE/US）專業圖表平台**

結合在地化策略排行與情緒指標，讓交易者在一個平台看遍全球市場。

---

## 技術決策（最終版，不再改）

### 前端

| 層面 | 選擇 | 理由 |
|------|------|------|
| Framework | **SolidJS**（Runes API）| 顆粒度更新，K線高頻更新最適合 |
| Build | **Vite 5** | 快速 HMR，SolidJS 原生支援 |
| State | **Zustand**（SolidJS createStore）| 簡單，天然支援 SolidJS reactive |
| Charts | **lightweight-charts v4** | TradingView 官方開源，100% 控制 |
| UI | **Tailwind CSS + Radix UI Primitives** | 設計系統化，無障礙 |
| Testing | **Vitest + Playwright** | 單元測試 + E2E |

### 後端

| 層面 | 選擇 | 理由 |
|------|------|------|
| Framework | **FastAPI** | asyncio 原生，WebSocket，Pydantic v2 |
| HTTP Client | **httpx**（共享 AsyncClient）| 連接池複用，不再每次新建 |
| Cache | **記憶體 dict**（TTL 60s）| 不需要 Redis |
| Data Format | **Parquet** | UTC index，14 欄位 schema 標準化 |
| Validation | **Pydantic v2** | 型別安全 |

### 資料攝取

| 市場 | 來源 | 理由 |
|------|------|------|
| CRYPTO | **ccxt**（Binance）| 最成熟，24/7，WebSocket 支援 |
| TWSE | **TWSE API + FinMind** | 官方，穩定 |
| US | **Polygon.io**（遷移中）| 取代 yfinance（不穩定）|

### 不採用的技術

- ❌ Redis（記憶體 dict 足夠）
- ❌ TimescaleDB（< 1 億筆，Parquet 完全夠）
- ❌ Django（學習曲線高，違反「好修復」目標）
- ❌ yfinance 作為主要來源（不穩定）

---

## 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (SolidJS)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Candle   │ │ Volume   │ │ RSI/MA   │ │ Strategy │       │
│  │ Chart    │ │ Pane     │ │ Panes    │ │ Table    │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       └────────────┴────────────┴────────────┘              │
│                   │ createStore (Zustand)                   │
│      marketStore | chartStore | quoteStore | strategyStore  │
└─────────────────────────┼─────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────▼─────────────────────────────────┐
│              API Server (FastAPI / Python)                  │
│  /api/v1/klines    — 讀取 parquet（三市場統一）           │
│  /api/v1/quote     — 即時報價（Binance/TWSE/Polygon proxy）│
│  /api/v1/realtime  — WebSocket（Binance WS）                │
│  /api/strategies   — 策略信號                              │
└─────────────────────────┼─────────────────────────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────┐
│              Data Service（獨立行程 / Cron）                │
│  ccxt（Binance）| TWSE API（FinMind）| Polygon.io（US）    │
│  資料儲存：parquet（data/ohlcvutc/）                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 全部功能（待實作）

### Frontend（前端）

| 代號 | 功能 | 說明 |
|------|------|------|
| F1-1 | **資料層** | api.ts + cache.ts + marketStore + chartStore + types |
| F1-2 | **圖表層** | CandleChart + VolumePane + TFSwitcher + SymbolPicker + PriceDisplay |
| F1-3 | **報價層** | quoteStore + TopBar + TabBar + CountdownTimer + UpdateBadge |
| F1-4 | **策略層** | StrategyTable + StrategyModal + ConsensusBar + SentimentChips |
| F2-1 | **指標系統** | SMA/EMA + RSI14 + MACD + Bollinger Bands panes |
| F2-2 | **WebSocket 即時更新** | Binance WS client，< 1 秒更新 |
| F2-3 | **價格警報** | localStorage 持久化，Toast 通知 |
| F3-1 | **Screener** | 多條件篩選（RSI < 30、MA Golden Cross 等）|
| F3-2 | **Watchlist** | 自選股列表 + Sparkline 迷你圖 |
| F3-3 | **繪圖工具** | Horizontal Line / Trend Line / Fibonacci |

### Backend（後端）

| 代號 | 功能 | 說明 |
|------|------|------|
| B1-1 | **FastAPI 現代化** | 共享 httpx client + 記憶體 cache + TWSE 1w fallback |
| B1-2 | **模組化拆分** | routers/ + core/ + models/（不再 555 行單一檔）|
| B1-3 | **Rate Limiting** | slowapi，每 IP 100 req/min |
| B2-1 | **TWSE 1w/1mo 生成** | 從 1d resample |
| B2-2 | **Data Service** | scheduler + Discord alerts + freshness monitoring |
| B2-3 | **US 遷移 Polygon.io** | 取代 yfinance |

### P0/P1/P2 優先順序

**P0（1-2週）：** B1-1（後端） → F1-1（前端資料層） → F1-2 → F1-3 → F1-4
**P1（1個月）：** F2-1 → F2-2 → F2-3 → B1-2 → B2-1 → B2-2
**P2（2-3個月）：** F3-1 → F3-2 → B2-3 → F3-3

**為什麼後端優先？**
- 前端依賴後端 API。前端無法在後端不存在的情況下實作並測試。
- V3 的 server.py 位於 V3 repo（B1-1 完成後才會建立），目前過渡階段用 V2 的 server.py。
- UI Designer 可與 Backend 並行，不衝突。

---

## 開發協作

所有協作流程定義在 `WORKFLOW.md`。
所有角色定義和規範定義在 `agents/` 目錄。

---

## Commit 格式

```
feat(F1-1): add data layer infrastructure
fix(F1-2): correct ConsensusBar transform direction
refactor(B1-2): modularize server.py into routers/
```

---

_最後更新：2026-04-20_