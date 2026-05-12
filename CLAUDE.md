# 陽光單車Bot — CLAUDE.md
> 每次開場請上傳此檔案，讓 Claude 快速掌握專案進度。
> 最後更新：2026-05-12

---

## 專案基本資料

| 項目 | 內容 |
|------|------|
| 專案名稱 | 陽光單車Bot（娜美Nami） |
| Bot 帳號 | @862bfsiu |
| 線上網址 | bot.jego3c.com |
| 本機路徑 | ~/sunbike-bot |
| GitHub | a4376976/sunbike-bot |
| 管理後台 | /admin（帳密：sbot2026） |
| 版本 | v7.6 |

---

## 技術架構

- **平台**：Cloudflare Workers
- **資料庫**：Cloudflare D1（SQLite）
- **KV**：Cloudflare KV（key-value 快取）
- **檔案儲存**：Cloudflare R2
- **訊息平台**：LINE Bot（Messaging API）
- **AI**：Claude API（Anthropic）

### 推播架構（重要）
- **ReplyToken 回覆**：免費，用於回應用戶訊息
- **Push 訊息**：只用於 Cron 定時推播
  - 限額：200則/月
  - 重置日：每月 1 日
  - 本月額度請確認目前用量

### 檔案命名規則
- **R2 儲存路徑**：時間戳英數路徑（例：`20240512_morning_001.jpg`）
- **DB 顯示名稱**：中文（例：`早安陽光1號`）

---

## 已完成功能

- [x] Cloudflare D1 資料庫建置
- [x] Cloudflare KV 建置
- [x] Keywords 關鍵字回覆處理
- [x] 管理後台（/admin）
- [x] 特殊節日功能
- [x] R2 圖片儲存
- [x] 貼圖組（80 張完成）

---

## 待完成項目

- [ ] **後台 UI 重設計**（Tab 版型 / SaaS 風格）← 本次任務
  - 品牌色：#FFD600（黃色）
  - Tab 分組：儀表板｜群組管理｜內容管理｜系統設定
  - UI 原型：sunbike-admin-ui.html
- [ ] 早安圖隨機選取（早安圖隨機選取）
- [ ] Cron 設定後台
- [ ] 換行修正（LINE 訊息換行格式）
- [ ] 架構圖
- [ ] 系統狀態儀表板（LINE 額度 + Claude API 用量）

---

## 開場字串範本

```
繼續陽光單車Bot開發，請讀取CLAUDE.md和Memory確認進度。
本次任務：[任務名稱]
```

開場時請同時上傳：
1. 本檔案（CLAUDE.md）
2. 相關程式碼檔案（例：index.js）

---

## 工作流程規範

1. Claude 完成任務後，輸出可下載的完整檔案
2. 下載後放入本機 `~/sunbike-bot/`
3. 執行 `wrangler deploy` 部署
4. 下次開場上傳最新 CLAUDE.md + 相關檔案

---

## 備註 / 歷史決策

- Push 推播額度寶貴，非 Cron 觸發一律用 ReplyToken
- R2 路徑用英數避免編碼問題，DB 存中文方便後台顯示
