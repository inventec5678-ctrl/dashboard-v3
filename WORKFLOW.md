# Dashboard V3 Agent 工作流程

> 所有 Agent 必須閱讀此檔案。 Luka 是唯一入口，負責分派任務。

---

## 角色定義

| 角色 | 代號 | 職責 |
|------|------|------|
| 協調者 | Luka | 任務分配、流程管控、最終把關 |
| 網站架構師 | Architect | 架構規劃、技術決策、跨領域協調 |
| 前端工程師 | Frontend | SolidJS + TypeScript 前端實作 |
| 後端工程師 | Backend | Python FastAPI + 資料攝取實作 |
| UI 設計師 | UI Designer | 視覺規格、颜色系统、間距/字體定義 |
| QA 工程師 | QA | 功能測試、程式碼審查、部署前驗證 |

---

## 任務來源

所有任務來自 `MASTER_PLAN.md` 中的工作項目。

工作項目格式：`T1-1`、`T2-3`、`T3-4` 等

- **T1**：前端（Phase 1-1 ~ 2-3）
- **T2**：後端（Phase 2-4 ~ 2-6）
- **T3**：資料攝取（Phase 3-1 ~ 3-4）
- **T0**：緊急清理（Luka 直接執行，不派 agent）

---

## 標準工作流程（三關審核）

每個工作項目都必須經過三關：

```
[實作者] → [QA 測試者] → [QA 審查者] → [Gino 審核]
```

### 第一關：實作者（Implementer）

1. Luka 讀取 `MASTER_PLAN.md` 中的任務描述
2. Luka 派 Agent 去實作
3. Agent 完成後通知 Luka

**實作者的職責：**
- 讀取 `agents/[ROLE].md` 了解自己的職責
- 嚴格遵守技術選型（SolidJS / FastAPI / lightweight-charts 等）
- `npx tsc --noEmit` 確認無錯誤後才能 commit
- commit 並 push 到 `origin main`
- 完成後通知 Luka

### 第二關：測試者（Tester，QA 角色）

1. Luka 派 QA Agent 進行 Playwright 測試
2. QA Agent 實際開瀏覽器驗證
3. 檢查清單：
   - [ ] 頁面正常載入（不白屏）
   - [ ] H1 顯示 "Dashboard V3"
   - [ ] Console 無 Error（忽略 Warning）
   - [ ] 所有按鈕可點擊
   - [ ] 下拉選單可展開
   - [ ] 圖表正常顯示（Canvas 元素）
   - [ ] 切換市場/符號/TF 時有響應
4. 結果：PASS 或 FAIL
5. 通知 Luka

### 第三關：審查者（Reviewer，QA 角色）

1. Luka 派 QA Agent 進行程式碼審查
2. QA Agent 檢查：
   - **安全性**：無 XSS / 無敏感資訊外露
   - **效能**：cache 有 TTL / 無 memory leak
   - **正確性**：threshold 方向正確 / transform 方向正確
   - **可維護性**：TypeScript types 完整 / 無 `any` 泛濫
3. 評分（1-5）：
   - 5/5：完美
   - 4/5：Minor issues，不阻礙功能
   - 3/5：有可修復的問題，建議修復
   - 2/5：有明顯的正確性問題，必須修復
   - 1/5：無法使用
4. 結論：Approve ✅ / Request Changes ⚠️ / Reject ❌
5. 通知 Luka

### Luka 處理審查結果

- **Approve**：直接進入下一個任務
- **Request Changes**：Luka 親自修復簡單問題，或派同一個 Agent 修復後重新審查
- **Reject**：派新的 Agent 重新實作

### Gino 審核

三關都通過後，Luka 通知 Gino最終報告。Gino 決定：通過 / 需要修改 / 駁回。

---

## 任務執行順序

根據 `MASTER_PLAN.md` 的優先順序：

```
Phase 1（前端）
  T1-1 → T1-2 → T1-3 → T1-4 → T2-1 → T2-2 → T2-3

Phase 2（後端）
  T2-4 → T2-5 → T2-6

Phase 3（資料攝取）
  T3-1 → T3-2 → T3-3 → T3-4
```

**嚴格順序：T1-1 完成並通過三關 → 才能開始 T1-2**

（Phase 1-1 是基礎，Phase 1-2 依賴它的成果）

---

## Agent 啟動方式

### Luka 派發任務
```
Luka → sessions_spawn → 派 Agent
```

### Agent 如何知道自己的工作
- 讀取 `MASTER_PLAN.md` 中對應的任務描述
- 讀取 `agents/[ROLE].md` 了解職責和技術規格
- 按照 `標準工作流程` 的第一關指示實作

### Agent 完成後
1. Commit 並 push 到 `origin main`
2. 通知 Luka（用 completion event）

---

## 緊急規則

### Luka 直接執行的任務（T0）
- **不需要經過三關**
- 執行後直接通知 Gino

### 當發現嚴重問題時
- 立即停止當前任務
- 通知 Luka
- Luka 評估是否需要回滾或修復

---

## 溝通格式

### Agent 向 Luka 回報
```
[任務名稱] 完成

- 改了哪些檔案
- 有沒有需要注意的問題
- commit hash
```

### Luka 向 Gino 回報
```
[T1-1] 前端資料層 — 三關全部通過

| 關卡 | 結果 |
|------|------|
| 實作者 | ✅ 完成 |
| 測試者 | ✅ PASS |
| 審查者 | ✅ 4/5，無需修改 |

可以繼續下一個任務。
```

---

## 約束

### 禁止事項
- 不要跨角色修改別人的程式碼（Frontend 不要改 Backend 的東西）
- 不要引入 `MASTER_PLAN.md` 外的技術棧
- 不要刪除別人已經實作的檔案
- 不要在測試環境沒確認的情況下給 Gino 部署連結
- 不要 commit 半成品（`npx tsc --noEmit` 必須通過）

### 部署前確認清單（Luka 必須做）
- [ ] `curl http://localhost:5006/api/symbols/crypto` — 確認 server.py 正常
- [ ] `curl http://localhost:5173` — 確認 Vite dev server 正常
- [ ] Cloudflare tunnel 運行中
- [ ] 確認 API proxy 正常（相對 URL `/api/...`）
- [ ] 給 Gino 連結時說明要做 Hard Refresh（⌘ + Shift + R）

---

## Git 提交格式

```bash
# 功能實作
git commit -m "feat(T1-1): add data layer infrastructure"

# 問題修復
git commit -m "fix(T1-2): correct ConsensusBar transform direction"

# 清理
git commit -m "clean: remove all code, keep only MASTER_PLAN.md"
```

---

## 檔案位置（所有 Agent 通用）

| 檔案 | 位置 |
|------|------|
| MASTER_PLAN.md | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/MASTER_PLAN.md` |
| Agent prompts | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/agents/` |
| V3 程式碼 | `/Users/changrunlin/.openclaw/workspace/dashboard_v3/src/` |
| V2 server.py | `/Users/changrunlin/.openclaw/workspace/dashboard_v2_standalone/server.py` |
| V2 資料 | `/Users/changrunlin/.openclaw/workspace/dashboard_v2_standalone/data/` |

---

## 常見問題

**Q：可以同時做多個任務嗎？**
A：可以並行列舉多個 Agent，但每個任務必須走完三關才能開始下一個。同一個任務的實作者/測試者/審查者不能並行。

**Q：發現前面任務有問題怎麼辦？**
A：通知 Luka，Luka 評估是修復還是回滾。

**Q：審查者說可以，但我覺得有問題？**
A：以 Gino 為準。Gino 可以否決 QA 的 Approve。

**Q：技術選型有爭議？**
A：Architect 給建議，Luka 決定。

---

_最後更新：2026-04-20_
_協調者：Luka_