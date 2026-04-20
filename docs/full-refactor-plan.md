# Dashboard V3 完整重構計畫
> 日期：2026-04-20
> 涵蓋範圍：前端（SolidJS）+ 後端（server.py）+ 資料攝取（Data Ingestion）
> 依據：5 份分析報告

---

## 總目標

**成為下一個 TradingView — 三市場（Crypto/TWSE/US）專業圖表平台**

---

## 一、現狀診斷

### 前端問題（V2 Vanilla JS）
- 50+ `window.*` 全域變數
- 400行 God Module（chart_market.js）
- `var` 泛濫，無 ES6+
- 零測試覆蓋
- 無法擴展（加 MA/RSI 要大改）
- vDOM overhead（每 sec 多次 K線更新）

### 後端問題（server.py + Ingestion）
- **無 WebSocket** — 全部靠 polling，60秒延遲
- **US 1w 資料損壞** — `*_1w.parquet` 只有 1 row（吃到錯誤檔名）
- **TWSE 週/月K從未生成** — `ingest_twse.py` 只寫 1d
- **yfinance 不穩定** — 不適合長期專業平台
- **無 ingestion 監控** — 失敗沒 alert
- **無 Rate Limiting** — 可能觸發外部 API 429

---

## 二、重構範圍

| 層次 | 現狀 | 重構後 |
|------|------|--------|
| 前端 UI | Vanilla JS + ES Module | SolidJS + Zustand |
| 前端狀態 | 50+ window.* | Zustand Stores |
| 即時更新 | 60秒 polling | Binance WebSocket（毫秒級）|
| 技術指標 | 0 | MA/RSI/MACD/Bollinger |
| 後端 API | server.py（微修）| 統一 `/api/v1` 介面 |
| 資料攝取 | 分散 crontab | Data Service（統一 scheduler）|
| 資料來源 CRYPTO | ✅ Binance（好）| 維持 + WebSocket |
| 資料來源 TWSE | ⚠️ 缺週/月K | 修 1w/1mo |
| 資料來源 US | ❌ yfinance | 遷移 Polygon.io |
| 監控 | 無 | Discord webhook alert |

---

## 三、完整工作項目（按優先順序）

---

### 🔴 P0 — 立即（1天）

#### 1. [前端-緊急] US 1w parquet 資料修復
**問題**：`AAPL_1w.parquet` 只有 1 row，前端吃到錯誤資料
**處理**：
```bash
# 刪除所有 *_1w.parquet，保留 *_1wk
ls data/ohlcvutc/us/*_1w.parquet | xargs -I{} mv {} data/ohlcvutc/us/_trash/
# 確認 server.py 的 /api/us/klines 只認 _1wk
```
**負責**：luka 直接執行（不需要 agent）

---

#### 2. [後端-緊急] TWSE 週/月K從未生成
**問題**：`ingest_twse.py` 的 `TIMEFRAMES = ["1d", "1w", "1mo"]` 但只寫入 `["1d"]`
**處理**：修改 script，從 1d parquet 匯總生成 1w/1mo
```python
# 在 ingest_twse.py 中加入：
for tf in ["1w", "1mo"]:
    df_weekly = df_daily.resample(tf).agg({...}).dropna()
    save_parquet(df_weekly, symbol, tf)
```
**負責**：派 agent 實作 → 測試 → 審查 → Gino 審核

---

### 🟠 P1 — 短期（1-2週）

#### 3. [前端] Phase 1-1：資料層
**任務**：
- `src/services/api.ts` — 統一 fetch，封裝所有 server.py API
- `src/services/cache.ts` — 60秒記憶體快取
- `src/stores/marketStore.ts` — 市場/符號/TF 狀態
- `src/stores/chartStore.ts` — K線 fetch + cache

**驗收**：fetchCryptoKlines / fetchTWSEKlines / fetchUSKlines 全部正常

**三關流程**：實作者 → 測試者 → 審查者 → Gino 審核

---

#### 4. [後端] 建立 Data Service + Alerts
**任務**：
- 建立 `data_service/` 目錄，統一 scheduler
- `alerts.py` — ingestion 失敗時發 Discord webhook
- `scheduler.py` — 統一路由三市場的 ingestion cron
- `freshness_check.py` — 主動檢查並 alert

**目標**：任何 ingestion 失敗，Discord 自動通知

---

#### 5. [前端] Phase 1-2：圖表層
**任務**：
- `src/hooks/useChart.ts` — chart lifecycle hook
- `src/components/charts/CandleChart.tsx` — K線主圖
- `src/components/charts/VolumePane.tsx` — 成交量副圖
- `src/components/market/TFSwitcher.tsx` — TF 按鈕
- `src/components/market/SymbolPicker.tsx` — 符號選擇

**驗收**：BTCUSDT 1D K線顯示 + TF/.Symbol 切換正常

---

### 🟡 P2 — 中期（2-4週）

#### 6. [前端] Phase 1-3：報價層
**任務**：
- `src/stores/quoteStore.ts` — 即時報價 store
- `src/components/market/PriceDisplay.tsx` — 價格顯示
- `src/components/ui/CountdownTimer.tsx` — 倒數計時器
- `src/components/ui/UpdateBadge.tsx` — 更新狀態徽章

**驗收**：60秒自動更新 + 倒數正常 + 顏色正確

---

#### 7. [後端] US 資料遷移評估
**任務**：
- 評估 Polygon.io vs Alpha Vantage vs 繼續 yfinance
- 決定遷移方案
- 實作遷移（`ingest_us.py` 改用新資料源）

**驗收**：US 1d/1w/1mo 新鮮度 ≤ 1 天

---

#### 8. [前端] Phase 1-4：策略層
**任務**：
- `src/stores/strategyStore.ts` — 策略 store
- `src/components/strategies/StrategyTable.tsx` — 策略排行
- `src/components/strategies/StrategyModal.tsx` — 策略詳情
- `src/components/strategies/ConsensusBar.tsx` — 共識 bar

**驗收**：排序正常 + Modal 開關正常

---

#### 9. [後端] 建立統一 `/api/v1` 介面
**任務**：
- 新增 `/api/v1/klines` — 三市場統一入口
- 新增 `/api/v1/quote` — 三市場統一報價
- 改善 error handling（統一格式）
- 加入 Rate Limiting

---

### 🟢 P3 — 長期（1-2個月）

#### 10. [前端] Phase 2-1：指標系統
**任務**：
- `src/utils/indicators.ts` — SMA/EMA/RSI 計算
- `src/components/charts/MALines.tsx` — MA5/20/60 疊加
- `src/components/charts/IndicatorPane.tsx` — RSI 獨立 pane
- `src/hooks/useIndicators.ts` — 指標 hook

**驗收**：BTCUSDT 1D 三條 MA + RSI pane 顯示正常

---

#### 11. [後端] Binance WebSocket 即時更新
**任務**：
- 建立 `ws_service/` — Binance WebSocket 管理
- `ws_manager.py` — 訂閱/取消訂閱/重連
- `/api/v1/realtime` — WebSocket upgrade endpoint
- 前端 `ws.ts` — 串接輕量級 WebSocket client

**驗收**：CRYPTO K線 < 1 秒更新（非 60 秒 polling）

---

#### 12. [前端] Phase 2-2：價格警報
**任務**：
- `src/components/ui/AlertToast.tsx` — 警報通知
- `localStorage` 儲存警報規則
- 每次報價時檢查是否符合條件

**驗收**：設定「BTC > 70000」後，價格觸及時收到通知

---

#### 13. [後端] TWSE/WebSocket 替代方案
**任務**：
- TWSE 沒有原生 WebSocket，評估 SSE（Server-Sent Events）
- 或繼續 polling 但提升頻率

---

#### 14. [前端] Phase 3：進階功能
**任務**：
- MACD + Bollinger Bands
- 繪圖工具（Horizontal Line）
- Screener（市場掃描器）
- Watchlist（觀察列表）

---

#### 15. [後端] 策略回測 Engine（Phase 4）
**任務**：
- Python Backtest Engine
- `/api/v1/backtest` endpoint
- 前端 Equity Curve + Trade Log 展示

---

## 四、V3 完整架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (SolidJS)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Candle   │ │ Volume   │ │ Indicator│ │ Strategy │       │
│  │ Chart    │ │ Pane     │ │ Pane     │ │ Table    │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │               │
│  ┌────┴────────────┴────────────┴────────────┴────┐        │
│  │              Zustand Stores                    │         │
│  │  marketStore | chartStore | quoteStore | ...   │        │
│  └─────────────────────┬───────────────────────────┘        │
│                        │                                   │
│  ┌─────────────────────┴───────────────────────────┐       │
│  │         Services / Hooks                         │       │
│  │  api.ts | cache.ts | ws.ts | useIndicators.ts   │       │
│  └─────────────────────┬───────────────────────────┘       │
└─────────────────────────┼─────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────┼─────────────────────────────────┐
│                   API Server (FastAPI)                       │
│  ┌─────────────────────┴───────────────────────────────┐     │
│  │  /api/v1/klines  — 讀取 parquet                   │     │
│  │  /api/v1/quote  — 即時報價（Binance/TWSE proxy）   │     │
│  │  /api/v1/realtime  — WebSocket 升級              │     │
│  │  /api/strategies  — 策略查詢（port 5008 proxy）   │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────┐
│               Data Service（獨立行程）                          │
│  ┌───────────┬───────────┬───────────┬───────────┐          │
│  │ scheduler │  alerts   │ quality   │ freshness │          │
│  └───────────┴───────────┴───────────┴───────────┘          │
│                                                             │
│  ┌───────────┬───────────┬───────────┐                      │
│  │ CRYPTO    │ TWSE      │ US       │                      │
│  │ ingest    │ ingest    │ ingest   │                      │
│  │ ✅ Binance│ ⚠️ TWSE   │ ❌ yfinance│                      │
│  │ + WS      │ → 修 1w/1m│ → Polygon │                      │
│  └───────────┴───────────┴───────────┘                      │
│                                                             │
│  資料儲存：parquet（data/ohlcvutc/）                          │
│  備份：GCS / S3 每週 snapshot                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、團隊分工（三關審核流程）

每個任務都依序經過：

```
實作者（implementer）
  → 提交 PR
  → 測試者（tester）：Playwright 驗證
  → 審查者（reviewer）：程式碼審查 → 報告
  → Gino：看報告 → 決策（LGTM / 需修改 / 駁回）
  → Merge to main
```

**Gino 的角色：** 只看審查報告和截圖，決定是否通過。不需要自己測試。

---

## 六、預估工時

| 階段 | 任務 | 工時 |
|------|------|------|
| 🔴 P0 | US 1w 修復 + TWSE 週/月K | 1-2 天 |
| 🟠 P1 | 前端資料層 + 圖表層 | 2-3 週 |
| 🟠 P1 | Data Service + Alerts | 1-2 週 |
| 🟡 P2 | 前端報價層 + 策略層 | 2-3 週 |
| 🟡 P2 | US 遷移 Polygon.io + 統一 API | 2-3 週 |
| 🟢 P3 | 前端指標系統 + WebSocket | 2-3 週 |
| 🟢 P3 | 進階功能（MACD/Screener）| 2-3 週 |
| 🟢 P3 | Backtest Engine | 2-4 週 |

**總計：约 3-4 個月（兼職）**

---

## 七、GitHub Repo 對照

| Repo | 用途 |
|------|------|
| `dashboard-v2-standalone` | V2 當前運行版本（維護中）|
| `dashboard-v3` | V3 重構版本（新功能）|

**並行策略：**
- V2 繼續正常運行，不影響
- V3 在 `dashboard-v3` 開發，完成一個 Phase 就上線一個
- 最後階段：V3 完全取代 V2，或兩者並行

---

## 八、當前首要任務

根據優先順序，馬上可以開始的是：

### 任務 A：TWSE 週/月K生成（後端修復）
**為什麼優先**：TWSE 投資者需要週/月K看長期趨勢，目前完全沒有。

### 任務 B：Phase 1-1 前端資料層（前端重構）
**為什麼優先**：這是所有前端上層的基礎，不做完其他都無法開始。

---

Gino，確認這個完整計畫後，我就按照優先順序派出 agents 開始執行。

你說開始，我就同時派出：
- **任務 A**：修復 TWSE 週/月K（後端 agent）
- **任務 B**：Phase 1-1 前端資料層（前端 agent）