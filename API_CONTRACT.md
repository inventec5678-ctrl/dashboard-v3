# Dashboard V3 API Contract

> 版本：v1.0（2026-04-20）
> 維護者：Architect
> 所有 Frontend 和 Backend 必須遵守此合約

---

## 基礎原則

1. **相對 URL** — 所有前端 API 呼叫使用相對路徑（`/api/...`），不走 `localhost:*` 或 `http://*`
2. **統一路由** — 所有市場統一使用 `/api/v1/...` 前綴
3. **Pydantic Schema** — 所有 request/response 有明確的 schema 定義
4. **錯誤格式** — 錯誤統一用 `{ "detail": "錯誤訊息" }`

---

## 端點定義

### GET /api/v1/klines

取得 K線資料。

**Query Parameters：**
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| symbol | string | 是 | 幣種/股票代碼（例：BTCUSDT、AAPL、2330）|
| interval | string | 是 | 時間框架：`15m` / `1h` / `4h` / `1d` / `1wk` / `1mo` |
| market | string | 是 | 市場：`CRYPTO` / `TWSE` / `US` |
| limit | int | 否 | 筆數，預設 300，最大 1000 |

**Response（200）：**
```json
{
  "data": [
    {
      "time": 1718832000,
      "open": 64500.0,
      "high": 65000.0,
      "low": 64000.0,
      "close": 64800.0,
      "volume": 12345.67
    }
  ]
}
```

**錯誤（404）：**
```json
{ "detail": "No data found for symbol BTCUSDT interval 1d" }
```

---

### GET /api/v1/quote

取得即時報價。

**Query Parameters：**
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| symbol | string | 是 | 幣種/股票代碼 |
| market | string | 是 | 市場 |

**Response（200）：**
```json
{
  "price": 64800.0,
  "change": 300.0,
  "changePct": 0.47,
  "high": 65000.0,
  "low": 64000.0,
  "volume": 1234567890.0
}
```

---

### GET /api/v1/symbols

取得市場的符號列表。

**Query Parameters：**
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| market | string | 是 | 市場 |

**Response（200）：**
```json
{
  "data": [
    {
      "symbol": "BTCUSDT",
      "display": "BTC",
      "name": "Bitcoin"
    }
  ]
}
```

---

### WebSocket /ws/klines

即時 K線更新（CRYPTO 市場）。

**連線：**
```
ws://host/ws/klines?symbol=BTCUSDT&interval=1m
```

**Server 推送訊息：**
```json
{
  "type": "kline",
  "symbol": "BTCUSDT",
  "interval": "1m",
  "data": {
    "time": 1718832060,
    "open": 64800.0,
    "high": 64850.0,
    "low": 64750.0,
    "close": 64820.0,
    "volume": 1234.56
  }
}
```

**Client 發送訊息：**
```json
{ "type": "subscribe", "symbol": "ETHUSDT", "interval": "1m" }
{ "type": "unsubscribe", "symbol": "ETHUSDT", "interval": "1m" }
```

---

## 市場特殊處理

### TWSE（台股）

- TWSE 原生沒有週 K（`1wk`）和月 K（`1mo`）
- Backend 從 `1d` resample 生成
- Frontend 請求 `1wk` → Backend 回傳 resample 後的週 K

### US（美股）

- US 的週 K 檔名是 `_1wk`（不是 `_1w`）
- Frontend 請求 `1wk` → Backend 讀取 `_1wk.parquet`

### CRYPTO（加密）

- 支援所有時間框架
- 有原生 WebSocket 即時更新

---

## 錯誤代碼

| HTTP Status | 說明 |
|-------------|------|
| 200 | 成功 |
| 400 | 參數錯誤（缺少必填參數、參數格式錯誤）|
| 404 | 找不到資料（symbol/interval 不存在）|
| 429 | Rate limit exceeded |
| 500 | 伺服器錯誤 |

---

## Cache 規則

- Backend cache TTL：60 秒
- Frontend cache TTL：60 秒（K線）/ 30 秒（報價）
- Cache key 格式：`{market}|{symbol}|{interval}|{limit}`

---

## 變更流程

1. Architect 提出變更
2. Frontend 和 Backend 雙方確認
3. 更新此文件
4. 雙方各自實作

**任何單方面的 API 變更視為無效。**

---

_最後更新：2026-04-20_