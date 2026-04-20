# Dashboard V3 Agent 工作流程

> 版本：v2.1（2026-04-20）
> 所有 Agent 必須閱讀此檔案。

---

## 角色定義

| 角色 | 代號 | 職責邊界 |
|------|------|----------|
| **Luka** | 協調者 | 流程監控、進度追蹤、對 Gino 負責 |
| **Architect** | 架構師 | 技術決策、任務分配、API Contract 維護 |
| **Frontend** | 前端 | 前端實作（SolidJS + lightweight-charts）|
| **Backend** | 後端 | 後端實作（FastAPI + httpx + Parquet）|
| **UI Designer** | 設計師 | 視覺規格、顏色/間距/字體系統 |
| **QA Tester** | 測試者 | Playwright E2E 測試、部署驗證 |
| **QA Reviewer** | 審查者 | Code Review、安全/效能/正確性審查 |

**Luka 與 Architect 的分工（不再重疊）：**
- Luka：流程監控者。接收所有 agent 的完成通知，觸發下一個 gate。對 Gino 負責。
- Architect：技術負責人。獨攬技術決策權和任務分配權。Luka 通知後開始分配任務。

---

## 標準工作流程

每個功能代號（`F1-1`、`B2-3`）都必須經過五關：

```
Architect（分配任務）
  → [實作者：Frontend 或 Backend]
  → [QA Tester + QA Reviewer 同時並行]（兩者都 Pass 才算過關）
  → [Luka 通知 Gino]
```

**UI Designer 是前置關卡：** Architect 分配任務時，UI 規格必須在 Frontend/Backend 實作前完成。

### Architect 觸發機制

```
實作者完成（通知 Luka）
  → Luka 通知 Architect「任務已完成，請分配下一個」
  → Architect 評估後分配下一個任務給實作者
```

Luka 是 Architect 的觸發信號。每個任務完成後，Luka 負責通知 Architect。

### UI Designer 觸發機制

```
Architect 判斷需要 UI 規格
  → Architect 先分配任務給 UI Designer
  → UI Designer 完成後通知 Luka
  → Luka 通知 Frontend 開始實作（此時 UI 規格已就緒）
```

Frontend 收到任務時，UI 規格已經完成，不需要自己等設計師。

---

### 第一關：實作者

收到 Architect 的任務後：
1. 讀取 `MASTER_PLAN.md` 確認任務目標
2. 讀取 `agents/[ROLE].md` 確認職責規範
3. 讀取 `API_CONTRACT.md` 確認 API 介面
4. 嚴格遵守技術選型，不擅自改框架
5. `npx tsc --noEmit`（前端）或自測（後端）確認無錯誤
6. Commit 並 push
7. 通知 Luka 完成

**如果任務涉及 UI：** Frontend 會在收到任務前就已經有 UI 規格（因為 UI Designer 在前置關卡已完成）。

### 第二關：QA Tester + QA Reviewer（並行）

Luka 收到實作者完成通知後，**同時啟動** QA Tester 和 QA Reviewer。

#### QA Tester（獨立角色）
1. **啟動服務**：`./start_env.sh`（背景啟動 server.py + Vite）
2. **Playwright 開瀏覽器**，實際操作驗證
3. **部署驗證**：確認 API 走相對路徑，不走 `localhost:*`
4. 檢查清單：
   - 頁面正常載入（不白屏）
   - Console 無 Error（忽略 Warning）
   - UI 元素存在且可交互
   - 功能邏輯正確
5. 結果：PASS 或 FAIL
6. 通知 Luka

#### QA Reviewer（獨立角色）
1. 讀取代碼
2. 檢查維度：
   - **安全性**：XSS / 敏感資訊 / Injection
   - **效能**：Cache TTL / Memory leak / Reactive 正確性
   - **正確性**：Threshold 方向 / Transform 方向 / Race condition
   - **部署適應性**：API URL 用相對路徑（`/api/...`），不走 `localhost:*`
3. 評分（1-5）：
   - 5/5：完美
   - 4/5：Minor，不阻礙
   - 3/5：有問題，建議修
   - 2/5：必須修
   - 1/5：無法用
4. 結論：Approve ✅ / Request Changes ⚠️ / Reject ❌
5. 通知 Luka

**並行通過條件：** Tester PASS + Reviewer Approve，兩者同時滿足才算過關。

### Luka 處理結果

- **兩者都通過**：派下一個任務
- **任一未通過 → 退件流程（見下方）**

### 退件流程（Gino 說「需修改」或 QA 未通過時）

```
原因確定（Luka 通知 Architect）
  → Architect 分析原因並確認修復方向
  → Architect 重新分派給原實作者
  → 原實作者修復（commit/push）
  → Luka 同時啟動 QA Tester + QA Reviewer（重跑完整流程）
  → Luka 通知 Gino
```

**嚴格規定：**
- 所有 Bug 由實作者修復（Luka 不親修，Architect 不親修）
- 修復後必須**重跑完整 QA 流程**（Tester → Reviewer），不能跳關或只重跑一個
- Architect 負責分析原因並確認修復方向正確

### Gino 核准

QA 流程全部通過後，Luka 通知 Gino。
Gino 決定：LGTM ✅ / 需修改（觸發退件流程） / ❌（重新評估）

---

## 任務分配（Architect 的職責）

Architect 根據 `MASTER_PLAN.md` 的優先順序分配任務：

```
P0：F1-1 → F1-2 → F1-3 → F1-4 → B1-1
P1：F2-1 → F2-2 → F2-3 → B1-2 → B2-1 → B2-2
P2：F3-1 → F3-2 → B2-3 → F3-3
```

**分配原則：**
- F1-1（資料層）是所有前端任務的基礎，必須第一個
- B1-1（FastAPI 現代化）是所有後端任務的基礎，必須第一個
- 前後端可以並行（F1-1 和 B1-1 同時做）
- **UI Designer 提供視覺規格，在 Frontend 實作前完成**（前置關卡）

---

## API Contract（Architect 維護）

所有 Frontend 和 Backend 的介面定義在 `API_CONTRACT.md`。

任何 API 變更必須：
1. Architect 更新 `API_CONTRACT.md`
2. Frontend 和 Backend 雙方確認
3. 才能實作

---

## 緊急規則

**Luka 直接執行（T0）：** 不走四關，執行後直接通知 Gino。

**當發現嚴重問題時：** 立即通知 Luka，Luka 通知 Architect 評估。

---

## 禁止事項

- 不要跨角色修改別人的實作
- 不要引入 `MASTER_PLAN.md` 外的技術框架
- 不要刪除別人已經實作的檔案
- 不要 commit `tsc --noEmit` 有錯誤的程式碼
- **不要在程式碼中使用 `localhost:*` 或 `http://*`（API URL 必須用相對路徑）**
- **不要在 QA 流程未通過的情況下給 Gino 連結**

---

## 檔案位置

| 檔案 | 位置 |
|------|------|
| MASTER_PLAN.md | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/MASTER_PLAN.md` |
| API_CONTRACT.md | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/API_CONTRACT.md` |
| WORKFLOW.md | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/WORKFLOW.md` |
| start_env.sh | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/start_env.sh` |
| agents/ | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/agents/` |

---

_最後更新：2026-04-20_