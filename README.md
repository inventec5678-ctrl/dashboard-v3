# Dashboard V3

> 三市場（CRYPTO / TWSE / US）專業圖表平台
> 技術棧：SolidJS + Vite + Zustand + lightweight-charts

## 目標

成為華語交易者的第一選擇，一個覆蓋 Crypto/TWSE/US 三市場的專業圖表平台。

## 技術棧

| 層面 | 選擇 |
|------|------|
| Framework | SolidJS（Runes API / Signals）|
| Build | Vite 5 |
| State | Zustand |
| Charts | lightweight-charts v4 |
| UI | Tailwind CSS + Radix UI |
| Backend | server.py（沿用 v2，不改）|

## 開發流程

每個功能實作都依序經過三關：

1. **Agent-實作者** → 實作功能 + 寫測試 + 提交 PR
2. **Agent-測試者** → 實際開瀏覽器操作、點擊按鈕、觀察 K線
3. **Agent-審查者** → 審視程式碼：安全性、效能、可維護性
4. **人（Gino）審核** → 看審查報告 → 決定：通過 / 需修改 / 駁回
5. **通過後 merge 到 main**

## 功能實作順序

### Phase 1：MVP
- [x] 專案初始化（Vite + SolidJS + Zustand）
- [ ] 三市場 Tab 切換
- [ ] K線圖（lightweight-charts）
- [ ] 成交量副圖
- [ ] 符號選擇 + TF 按鈕
- [ ] 即時報價顯示
- [ ] 策略排行 + Modal
- [ ] 倒數計時器
- [ ] 情緒晶片
- [ ] Memory Cache

### Phase 2：即時更新 + 指標
- [ ] MA5 / MA20 / MA60
- [ ] RSI14
- [ ] NOW 價格線
- [ ] Binance WebSocket
- [ ] 價格警報

### Phase 3：進階功能
- [ ] MACD + Bollinger Bands
- [ ] 繪圖工具
- [ ] Screener
- [ ] Watchlist

### Phase 4：Backtest
- [ ] Python Backtest Engine
- [ ] Equity Curve
- [ ] Trade Log

## 文件

- [SPEC.md](./SPEC.md) — 完整專案規格
- [docs/](./docs/) — 三份規劃報告

## 當前任務

👉 **[Phase 1-1：MA5/20/60 + RSI 指標系統](./SPEC.md#七第一個要實作的功能ma52060--rsi-指標系統)**

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動前端（Vite dev server）
npm run dev

# 啟動 backend（另一個 terminal）
cd server && python server.py
```

## 部署

```bash
# Build
npm run build

# 靜態檔案輸出到 dist/
# server.py 直接 serving static/ 目錄
```
