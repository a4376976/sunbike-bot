# 陽光單車Bot — CLAUDE.md
> 最後更新：2026-05-12（v7.7 全部完成）
> 開場時請上傳本檔案 + src/index.js + 任務說明

---

## 一、協作規範

### 通用原則
- James 是新手，Claude 負責所有技術決策，直接給建議不要問太多
- 每次任務完成後輸出完整檔案 + 更新 CLAUDE.md
- 不要叫 James 手動移動檔案或找路徑

### 工具清單
| 工具 | 用途 |
|---|---|
| VS Code（未來→Cursor） | 編輯程式碼 |
| macOS 終端機 | 執行指令 |
| wrangler | 部署 Cloudflare Workers |
| Google Drive | 工作暫存備份 |
| GitHub | 正式程式碼備份 |
| Chrome | 瀏覽器 |

### Chat 模式（claude.ai，本對話）
**開場流程：**
1. 上傳 `CLAUDE.md`（本檔案）
2. 上傳 `src/index.js`
3. 說明本次任務

**Claude 輸出 → James 執行：**
- 下載 `index.js` → 點一下用 VS Code 開啟（.js 關聯）
- VS Code 開 `~/sunbike-bot/src/index.js` 全選貼上 Cmd+S
- 部署：
  ```bash
  cd ~/sunbike-bot && wrangler deploy
  ```
- 備份：
  ```bash
  cd ~/sunbike-bot
  git add .
  git commit -m "vX.X 說明"
  git push
  ```
- **不需要 deploy.py，不需要手動複製檔案**

### Cowork 模式
- Claude 直接讀寫本機檔案，完成後執行 `wrangler deploy`

### Cursor 模式（未來）
- 在 Cursor 開啟 `~/sunbike-bot/` 專案
- 直接對話說需求，Cursor AI 修改對應程式碼
- 不需要複製貼上整個檔案

---

## 二、待完成項目

（目前無待辦，v7.7 全部完成）

---

## 三、專案基本資料

| 項目 | 內容 |
|------|------|
| 專案名稱 | 陽光單車Bot（娜美Nami） |
| Bot 帳號 | @862bfsiu |
| 線上網址 | bot.jego3c.com |
| 本機專案路徑 | ~/sunbike-bot |
| 主程式路徑 | ~/sunbike-bot/src/index.js |
| CLAUDE.md 路徑 | ~/sunbike-bot/CLAUDE.md |
| 架構圖路徑 | ~/sunbike-bot/architecture.html |
| 設定檔 | ~/sunbike-bot/wrangler.jsonc |
| GitHub | a4376976/sunbike-bot（main branch） |
| 管理後台 | /admin（帳密：sbot2026） |
| Cloudflare Account ID | 2fc04b3461d34a6293ad3c9ac0a32940 |
| 版本 | v7.7 |

### 備份路徑
- **GitHub**：a4376976/sunbike-bot（main）← 正式備份
- **Google Drive**：2026Claude / 0512 / V7 / ← 工作暫存

---

## 四、技術架構

- **平台**：Cloudflare Workers
- **資料庫**：Cloudflare D1（SQLite）
- **KV**：Cloudflare KV
- **檔案儲存**：Cloudflare R2（media.sunbike.jego3c.com）
- **訊息平台**：LINE Bot（Messaging API）
- **AI**：Claude API（Haiku + Sonnet）

### 推播架構
- ReplyToken：免費無限，用於回應用戶訊息
- Push：200則/月，每月1日重置，本月已用完（6/1重置）
- 未來升級：LINE商用版 NT$800（3,000則）或 NT$2,000（無限）

### 檔案命名
- R2 路徑：時間戳英數（`morning/1234567890.jpg`）
- DB 名稱：中文顯示（`早安陽光1號`）

---

## 五、已完成功能

- [x] D1 / KV / R2 建置
- [x] Keywords 關鍵字回覆（ReplyToken）
- [x] @娜美 AI 回覆（Claude Haiku/Sonnet）
- [x] 天氣查詢（OpenWeather API）
- [x] 賽事搜尋（Brave Search API）
- [x] 管理後台（/admin）
- [x] 特殊節日功能
- [x] 貼圖組（80 張）
- [x] 早安圖隨機選取
- [x] Cron 設定後台
- [x] 換行修正
- [x] **後台 UI 重設計 v7.7** ✅ 2026-05-12
  - Tab版型：儀表板｜群組管理｜內容管理｜系統設定
  - 預設亮色，「🌙 隨系統」切換按鈕
  - Topbar：[📊 API用量] [🤖 Pro用量] [● 推播剩餘] [🌙 隨系統] [登出]
  - 系統狀態卡片：Bot狀態/版本/網址/LINE額度/推播時間
  - 架構圖：系統設定 Tab 底部，可開新視窗列印

---

## 六、備註 / 歷史決策

- Push 額度寶貴，非 Cron 一律用 ReplyToken
- R2 用英數路徑避免編碼問題，DB 存中文顯示
- 設定檔為 `wrangler.jsonc`（非 wrangler.toml）
- Claude API 費用極低（$0.19/月），5美元可用約2年
- 後台為桌機/Mac 使用，不需考慮手機版面
- 架構圖公開在 raw.githack.com，沒有保密需求
- 【Claude用量觀念】目前會話用量是滑動視窗，定期重置，不是累積。真正要注意的是每週限額（週六下午1點重置）。兩個計數獨立，不需要擔心趕快做完。
