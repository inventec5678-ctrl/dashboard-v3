# Dashboard V3 後端資料層評估報告
> 分析時間：2026-04-20

---

## 一、現有架構分析

### 1.1 server.py 現有能力與限制

**能力：**
- [x] CRYPTO K線 API（/api/crypto/klines）— 先查本地 parquet，fallback 到 Binance
- [x] CRYPTO 即時報價（/api/crypto/quote）— 直接 proxy 到 Binance /ticker/24hr
- [x] TWSE K線 API（/api/twse/klines）— parquet 優先，fallback 到 JSON 檔
- [x] TWSE 即時報價（/api/twse/quote）— proxy 到 localhost:5008
- [x] TWSE 日內（/api/twse/intraday）— TWSE MI_5MINS API
- [x] TWSE 指數（/api/twse/index）
- [x] US K線 API（/api/us/klines/{symbol}）— 讀本地 parquet
- [x] US 即時報價（/api/us/quote/{symbol}）— yfinance 實作
- [x] 策略 API（proxy 到 localhost:5008）

**限制：**
- [ ] **無 WebSocket** — 完全沒有即時推送能力
- [ ] **無 Rate Limiting** — 對外API call 沒有節流，可能觸發 429
- [ ] **無統一快取層** — 相同請求反覆打到外部 API
- [ ] **US 1w 資料損壞** — `AAPL_1w.parquet` 只有 1 row（2026-04-13），而 `AAPL_1wk.parquet` 正常（537 rows）。兩個檔名同時存在
- [ ] **TWSE 無法作週/月K** — `ingest_twse.py` 的 `TIMEFRAMES = ["1d", "1w", "1mo"]` 但實作只寫入 `["1d"]`
- [ ] **無統一的 error handling** — 每個 endpoint 自己 try/except，錯誤格式不一致
- [ ] **Cron job 無監控** — ingestion 失敗不會自動 alert

---

### 1.2 現有資料儲存

**CRYPTO：**
- 儲存格式：parquet（UTC index）
- 符號：20 個
- 時間框架：15m / 1h / 4h / 1d / 1w / 1mo
- 覆蓋範圍：15m 從 2019 起，1d 從 2020 起
- 最新更新：2026-04-20 ✅
- **完整度評分：8/10**

**TWSE：**
- 儲存格式：parquet
- 符號：59 個
- 時間框架：**只有 1d**（週/月K從未生成）
- 覆蓋範圍：2016-01-03 ~ 2026-04-15
- 最新更新：2026-04-15（落後 5 天）
- **完整度評分：6/10**

**US：**
- 儲存格式：parquet
- 符號：60 個
- 時間框架：1d / 1w / 1mo（但 1w 有資料汙染問題）
- 覆蓋範圍（AAPL）：2016 ~ 2026-04-17
- 最新更新：2026-04-17（落後 3 天）
- **完整度評分：5/10**

---

## 二、資料來源評估

### CRYPTO — Binance ✅ 9/10
- 可靠：全球最大交易所，2024 無大規模中斷
- 深度：可達 2017 年（比特幣上線初期）
- Rate Limit：寬鬆（1200 weight/min）
- WebSocket：完整支援
- 結論：✅ 最可靠，繼續用 ccxt + Binance

### TWSE — 台灣證券交易所 ⚠️ 6/10
- 官方 API 穩定，但有 IP 管制
- Rate Limit：寬鬆但無明文（約 10 req/5s）
- 備用：FinMind（更穩定的 Python API）
- 結論：維持 TWSE API + FinMind 備用

### US — 美股 ❌ 3/10
- yfinance：非官方 API，可能無預警變更，2024 年多次中斷
- 替代：Polygon.io（付費但專業級）、Alpha Vantage（免費 25 req/day 不夠）
- 結論：❌ 不建議長期使用，應遷移到 Polygon.io

---

## 三、永續性風險（最優先處理）

| 風險 | 影響 | 處理 |
|------|------|------|
| US 1w 資料錯誤 | 前端吃到 1 row 的錯誤 parquet | 立即刪除 `*_1w.parquet`，用 `_1wk` |
| TWSE 週/月K從未生成 | 長期投資者無法看週/月趨勢 | 修改 `ingest_twse.py`，從 1d 匯總生成 |
| yfinance 不穩定 | US 資料隨時可能停擺 | 遷移到 Polygon.io |
| 無 WebSocket | 即時資料靠 polling，60秒延遲 | Binance WebSocket Streams（已支援）|
| 沒有 ingestion 監控 | 失敗也不知道 | 串 Discord webhook alert |

---

## 四、推薦的長期架構

```
┌──────────────────────────────────────────────┐
│  Frontend (SolidJS)                          │
│         ↑ REST / WebSocket                    │
├──────────────────────────────────────────────┤
│  API Server (FastAPI / server.py)             │
│  ├─ /api/v1/klines — 讀取 parquet            │
│  ├─ /api/v1/quote — 即時報價（proxy/cache）   │
│  ├─ /api/v1/realtime — WebSocket 升級        │
│  └─ /api/strategies — 策略查詢               │
│         ↑                                     │
│  ┌────────────────────────────────────────┐  │
│  │  Data Service（獨立行程）                 │  │
│  │  ├─ scheduler — 統一 cron 觸發           │  │
│  │  ├─ ingest_crypto.py（維持不變）         │  │
│  │  ├─ ingest_twse.py（新增 1w/1mo）        │  │
│  │  ├─ ingest_us.py（遷移到 Polygon.io）    │  │
│  │  ├─ quality_check + freshness_check     │  │
│  │  └─ alerts → Discord webhook            │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## 五、V3 後端建設順序

1. **立即（1天）**：刪除錯誤的 `*_1w.parquet`
2. **短期（3天）**：修復 TWSE 週/月K（從 1d 匯總）
3. **中期（1-2週）**：建立 Data Service（scheduler + alerts）
4. **中期（2-3週）**：評估並遷移 US 到 Polygon.io
5. **長期（1個月）**：實作 Binance WebSocket + 統一 `/api/v1` 介面

---

## 六、對於 Dashboard V3 的建議

**應該繼承 V2 的：**
- ✅ server.py API endpoints
- ✅ parquet 儲存格式（schema 設計良好）
- ✅ 三市場分層結構（crypto/twse/us）
- ✅ `data_quality_check.py` / `data_freshness.py` 驗證框架
- ✅ `ingest_crypto.py` ccxt-based Binance ingestion（最成熟）

**應該重新建設的：**
- ❌ yfinance（應遷移到 Polygon.io）
- ❌ 沒有 scheduler + alerts 的 ingestion（應建立 Data Service）
- ❌ 沒有 WebSocket（即時更新無法實現）
- ❌ TWSE 週/月K（完全沒有）

**server.py 本身不需要大改** — 穩定，API 設計合理，只需要微調