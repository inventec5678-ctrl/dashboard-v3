# Dashboard V3 Agent 工作流程

> 所有 Agent 必須閱讀此檔案。

---

## 角色定義

| 角色 | 代號 | 職責邊界 |
|------|------|----------|
| 協調者 | **Luka** | 任務分配、流程管控、最終把關。唯一入口。 |
| 架構師 | **Architect** | 架構規劃、技術決策、任務分配、優先順序 |
| 前端工程師 | **Frontend** | 前端實作（SolidJS + lightweight-charts + Zustand）|
| 後端工程師 | **Backend** | 後端實作（FastAPI + httpx + Parquet）|
| UI 設計師 | **UI Designer** | 視覺規格、顏色/間距/字體系統、UI 觀感 |
| QA 工程師 | **QA** | 功能測試、程式碼審查、Unit Test、部署驗證 |

---

## 標準工作流程

每個功能代號（`F1-1`、`B2-3` 等）都必須經過三關：

```
Architect 分配 → [實作者] → [QA 測試者] → [QA 審查者] → [Gino 核准]
```

### 第一關：實作者（Implementer）

收到 Architect 分配的任務後：
1. 讀取 `MASTER_PLAN.md` 了解任務目標
2. 讀取 `agents/[ROLE].md` 了解自己的規範
3. 嚴格遵守技術選型（不擅自改框架）
4. `npx tsc --noEmit`（前端）或自測（後端）確認無錯誤
5. Commit 並 push 到 `origin main`
6. 通知 Luka（協調者）完成

### 第二關：QA 測試者（Playwright）

收到 Luka 的測試請求後：
1. **啟動服務**：`server.py`（port 5006）+ `npm run dev`（port 5173）
2. **Playwright 開瀏覽器**，實際操作驗證
3. 檢查清單：
   - 頁面正常載入（不白屏）
   - Console 無 Error（忽略 Warning）
   - UI 元素存在且可交互
   - 功能邏輯正確
4. 結果：PASS 或 FAIL
5. 通知 Luka

### 第三關：QA 審查者（Code Review）

收到 Luka 的審查請求後：
1. 讀取代碼
2. 檢查維度：
   - **安全性**：XSS / 敏感資訊 / Injection
   - **效能**：Cache TTL / Memory leak / Reactive 正確性
   - **正確性**：Threshold 方向 / Transform 方向 / Race condition
   - **可維護性**：TypeScript types / 無 `any` 泛濫
3. 評分（1-5）：
   - 5/5：完美
   - 4/5：Minor，不阻礙
   - 3/5：有問題，建議修
   - 2/5：必須修
   - 1/5：無法用
4. 結論：Approve ✅ / Request Changes ⚠️ / Reject ❌
5. 通知 Luka

### Luka 處理結果

- **Approve**：直接派下一個任務
- **Request Changes**：Luka 親修或派原 Agent 修，然後重新審查
- **Reject**：派新 Agent 重寫

### Gino 核准

三關都通過後，Luka 通知 Gino。
Gino 決定：LGTM ✅ / 需修改 / ❌

---

## 任務分配（Architect 的職責）

Architect 根據 `MASTER_PLAN.md` 的優先順序分配任務：

```
P0 先做：F1-1 → F1-2 → F1-3 → F1-4 → B1-1
P1 接上：F2-1 → F2-2 → F2-3 → B1-2 → B2-1 → B2-2
P2 最後：F3-1 → F3-2 → B2-3 → F3-3
```

**分配原則：**
- F1-1（資料層）是所有前端任務的基礎，必須第一個完成
- B1-1（FastAPI 現代化）是所有後端任務的基礎，必須第一個完成
- 前後端可以並行（F1-1 和 B1-1 同時做）
- UI Designer 提供視覺規格，前端工程師參考實作

---

## 部署前確認（Luka 必須做）

給 Gino 部署連結前：
- [ ] `curl http://localhost:5006/api/symbols/crypto` — 確認 server.py 正常
- [ ] `curl http://localhost:5173` — 確認 Vite dev server 正常
- [ ] Cloudflare tunnel 運行中
- [ ] 告知 Gino 做 Hard Refresh（⌘ + Shift + R）

---

## 禁止事項

- 不要跨角色修改別人的實作（Frontend 不要改 Backend）
- 不要引入 `MASTER_PLAN.md` 外的技術框架
- 不要刪除別人已經實作的檔案
- 不要在服務未確認的情況下給 Gino 部署連結
- 不要 commit `tsc --noEmit` 有錯誤的程式碼

---

## 緊急規則

**Luka 直接執行的任務（T0）：** 不走三關，執行後直接通知 Gino。

**當發現嚴重問題時：** 立即通知 Luka，Luka 評估是否需要修復或回滾。

---

## 檔案位置

| 檔案 | 位置 |
|------|------|
| MASTER_PLAN.md | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/MASTER_PLAN.md` |
| agents/ | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/agents/` |
| V3 程式碼 | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/src/` |
| V2 server.py | `/Users/changrunlin/.openclaw/workspace/dashboard_v2_standalone/server.py` |

---

_最後更新：2026-04-20_