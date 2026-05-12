# 陽光單車Bot (娜美Nami) 開發記錄

## 基本資訊
- Bot 網址：bot.jego3c.com
- Bot 帳號：娜美Nami @862bfsiu
- 專案目錄：~/sunbike-bot
- 管理後台：bot.jego3c.com/admin（密碼：sbot2026）
- GitHub：github.com/a4376976/sunbike-bot

## 雲端架構
- Cloudflare Workers（主程式）
- Cloudflare D1（資料庫 sunbike-db）
- Cloudflare KV（設定儲存 SUNBIKE_KV）
- Cloudflare R2（圖片儲存 sunbike）
- R2 公開網址：media.sunbike.jego3c.com

## 重要架構原則
- 所有用戶觸發的回覆（關鍵字/1-11/@娜美）全用 ReplyToken（免費無限）
- Push Message 只用於 Cron 主動推播（早安/生日/節日/約騎）
- LINE 免費方案每月 200 則 Push 額度，每月 1 日重置

## 已完成功能 (v7.6)
- 早安圖庫（上傳/顯示/刪除/中文檔名/Cron隨機選圖）
- 預設節日節氣（37筆，含24節氣+台灣節日）
- 行事曆（數字5查約騎，後台管理）
- Bot設定（KV儲存：聯絡人/名稱/預設回覆/額外人設）
- help 功能選單（大小寫不敏感）
- 關鍵字 inline 編輯
- 特殊節日 r2_image 早安推播
- 特殊節日 inline 編輯 + 圖庫選取
- LINE Push 額度顯示（後台最上方）
- 數字觸發 1-11（貼圖/天氣/約騎/賽事）

## 待完成
- UI 重設計（使用 frontend-design skill）
- 架構圖頁面
- event_pre 加圖片支援

## Cron 設定（台灣時間）
- 早安推播：07:00
- 約騎當天提醒：06:00
- 約騎前一天預告：20:00
- 節慶前一天預告：20:00

## 數字關鍵字對應
- 1 = 早安娜美貼圖
- 2 = 早安美女圖
- 3 = 早安帥哥圖
- 4 = 天氣查詢
- 5 = 查詢約騎行程
- 6 = 3-4月五大古典賽
- 7 = 5月環義賽事 Giro
- 8 = 6月環法前哨賽
- 9 = 7月環法賽事 Le Tour
- 10 = 8-10月環西+世錦賽
- 11 = 新手＆車隊資訊

## 檔案命名規則（重要）

### R2 圖片存檔規則
- R2 路徑：純英數字 + 時間戳，例如 `morning/1746787200000.jpg`
- 資料庫 filename 欄位：保留原始中文顯示名稱，例如 `女版母親節快樂早安.jpg`
- 後台顯示：中文友善名稱
- 傳給 LINE API：使用 R2 路徑（純英數，不需 encode）

### 原因
LINE API 要求圖片 URL 必須是標準 HTTPS URL，中文字必須 encode。
採用方案 C：R2 存英數路徑，資料庫另存中文顯示名稱，兩全其美。

### 注意
- 舊圖片（中文路徑）已用 encodeURIComponent 處理，可正常使用
- 新上傳圖片自動使用時間戳路徑，不需 encode

## 後台 UI 規格（待實作）
- 主題：淺色主體＋深色Header，黃色 #FFD600 品牌色
- 版型：分頁式 Tab
- Tab分組：儀表板｜群組管理｜內容管理｜系統設定
- 儀表板：LINE額度＋Claude用量＋群組狀態＋推播記錄
- RWD：桌機優先，支援手機
- 字體：俐落專業 SaaS 風格
- 定位：公司化、可擴展
- 開場字串：繼續陽光單車Bot開發，請讀取 CLAUDE.md 和 Memory 確認進度。本次任務：後台 UI 重設計
