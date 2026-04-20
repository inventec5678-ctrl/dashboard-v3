# 開發流程手冊

## 三關審核制

每個功能都必須依序經過以下關卡，全部通過才能 merge：

```
實作者 → 測試者 → 審查者 → Gino 審核 → Merge
```

---

## 關卡 1：Agent-實作者（implementer）

### 職責
- 根據 SPEC.md 的規格實作功能
- 撰寫單元測試（vitest）
- 撰寫 E2E 測試（Playwright）——負責「點擊」驗證
- 提交 PR，標題格式：`feat: [功能名]`

### 輸出
- PR 連結
- 測試結果截圖
- 功能說明（用什麼技術、怎麼運作）

---

## 關卡 2：Agent-測試者（tester）

### 職責
- 使用 Playwright 實際開瀏覽器
- 點擊每一個按鈕、每一個 TF、每一個市場
- 觀察 K線是否正確顯示、指數是否正確計算
- 檢查 Console 是否有 Error

### 驗證清單（每個功能不同，但基本檢查：）
- [ ] 頁面正常載入，無白屏
- [ ] K線圖正確顯示
- [ ] 切換市場（CRYPTO → TWSE → US）正確
- [ ] 切換 TF 正確
- [ ] Console 無 Error（只看 Error，忽略 Warning）
- [ ] 點擊功能按鈕有預期反應

### 輸出
- 測試報告（截圖 + 文字描述）
- Pass / Fail 結論
- Fail 的話：具體問題描述 + 重現步驟

---

## 關卡 3：Agent-審查者（reviewer）

### 職責
- 閱讀 PR 的程式碼變更
- 檢查：安全性、效能、可維護性、命名規範
- 檢查：是否有更好的實作方式
- 檢查：是否破壞了現有功能

### 檢查維度
- **安全性**：是否有 XSS、SQL injection、敏感資訊外露
- **效能**：是否有不必要的重繪、無限迴圈、大資料重複處理
- **可維護性**：命名是否清晰、是否有冗余程式碼
- **架構**：是否符合 SPEC.md 的架構設計

### 輸出
- 審查報告
- 評分（1-5）：Code Quality / Performance / Security / Maintainability
- 建議：Approve / Request Changes / Reject

---

## 關卡 4：人（Gino）審核

### 職責
- 看審查報告（Agent-審查者產出）
- 看測試截圖（Agent-測試者產出）
- 決定：通過 / 需修改 / 駁回

### 如果通過
- Gino 回覆 `LGTM` 或 `Approved`
- 主動告知 Luka 可以 merge

### 如果需修改
- Gino 說明要修改什麼
- Luka 通知實作者修改
- 重新跑關卡 2 → 3 → 4

---

## 合併到 main

只有 Gino `Approved` 以後才能 merge。

```bash
git checkout main
git merge --no-ff feature/xxx
git push
```

---

## 目前待實作的功能

根據 SPEC.md，第一個功能是：

### Phase 1-1：MA5/20/60 + RSI 指標系統

**實作目標：**
```
1. K線圖上疊加 MA5（紅）/ MA20（黃）/ MA60（紫）
2. RSI14 在獨立 pane 顯示
3. TF 切換時指 標重新計算
4. 市場切換時指 標清除
5. 可個別控制顯示/隱藏
```

**驗收標準：**
- BTCUSDT 1D：MA 三條線都在 K線上
- RSI pane 在 K線下方，高度約 150px
- Console 無 Error
- 代碼有 Review 報告
