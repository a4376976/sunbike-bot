# 陽光單車Bot — CLAUDE.md
> 最後更新：2026-05-13（v7.8 完成）
> 開場時請上傳本檔案 + src/index.js + 任務說明

---

## 一、協作規範

### 通用原則
- James 是新手，Claude 負責所有技術決策，直接給建議不要問太多
- 每次任務完成後輸出完整檔案 + 更新 CLAUDE.md
- 不要叫 James 手動移動檔案或找路徑

### Chat 模式開場流程
1. 上傳 `CLAUDE.md`（本檔案）
2. 上傳 `src/index.js`
3. 說明本次任務

---

## 二、標準部署流程（每次必須照做）

### 正確步驟
```bash
# Step 1：下載新 index.js 後
# 用 Finder（Cmd+Shift+G → ~/sunbike-bot/src）
# 刪掉舊的 index.js，把新的拖進去

# Step 2：語法檢查 + 部署（兩個指令一起跑，不分開）
cd ~/sunbike-bot
node --check src/index.js && wrangler deploy
```

### 重要規則
- `node --check` 和 `wrangler deploy` **必須一起跑**，不能分開
- 部署成功後看到新的 Version ID 才算完成
- 部署後瀏覽器按 `Cmd+Shift+R` 強制重新整理

### 每次 Claude 產生 index.js 前必做
```bash
node --check index.js && echo "✅ 語法OK"
```
語法 OK 才能輸出給 James，不能跳過這步。

### 常見問題處理
| 問題 | 原因 | 解法 |
|------|------|------|
| 部署後版本號沒更新 | 下載到舊檔案 | 確認檔案時間是今天，用 Finder 刪舊換新 |
| `node --check` 過但 wrangler 報錯 | 兩個 parser 不同 | 兩個指令一起跑 `node --check src/index.js && wrangler deploy` |
| 插入新函數後語法錯誤 | 新函數截斷舊函數 | Claude 每次插入後立即跑 `node --check` |

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
| 設定檔 | ~/sunbike-bot/wrangler.jsonc |
| GitHub | a4376976/sunbike-bot（main branch） |
| 管理後台 | /admin（帳密：sbot2026） |
| Cloudflare Account ID | 2fc04b3461d34a6293ad3c9ac0a32940 |
| 版本 | v7.8 |

### 備份路徑
- **GitHub**：a4376976/sunbike-bot（main）← 正式備份
- **Google Drive**：2026Claude / 0513 / V7.8 / ← 工作暫存

---

## 四、技術架構

- **平台**：Cloudflare Workers
- **資料庫**：Cloudflare D1（SQLite）
- **KV**：Cloudflare KV
- **檔案儲存**：Cloudflare R2（media.sunbike.jego3c.com）
- **訊息平台**：LINE Bot（Messaging API）
- **AI**：Claude API（Haiku + Sonnet）
- **天氣**：OpenWeatherMap API（5天預報）
- **搜尋**：Brave Search API

### 推播架構
- ReplyToken：免費無限，用於回應用戶訊息
- Push：200則/月，每月1日重置
- 本月額度：已用完（6/1重置）

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
- [x] 後台 UI 重設計 v7.7（Tab版型 / SaaS風格）
- [x] **v7.8** ✅ 2026-05-13
  - 🧠 知識庫（D1 `knowledge_base` 表 + 後台 Tab）
  - 🤖 smartReply 意圖分類（路線→知識庫、賽事→Brave、天氣→API）
  - 🌤️ 天氣查詢升級為未來5天預報（含自動警示）
  - 📅 約騎行程新增天氣推播欄位（城市 + 啟用開關）
  - ⏰ Cron：週日練車自動推桃園5天天氣（週二起觸發）
  - ⏰ Cron：特殊約騎出發前5天推目的地天氣
  - 🔢 數字 6-10 年份改動態（不再寫死）

---

## 六、待完成項目

- [ ] **v7.9：編輯功能**
  - 約騎行程支援編輯（目前只能刪除重填）
  - 知識庫條目支援編輯
  - 操作完（新增/編輯/刪除）不跳頁，原地更新
- [ ] 知識庫初始資料填入（台灣熱門路線）

---

## 七、資料表結構（v7.8新增）

### knowledge_base
```sql
CREATE TABLE knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL DEFAULT '路線',
  region TEXT NOT NULL DEFAULT '全台',
  title TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### ride_schedule 新增欄位
```sql
ALTER TABLE ride_schedule ADD COLUMN weather_city TEXT DEFAULT '';
ALTER TABLE ride_replace ADD COLUMN weather_push INTEGER DEFAULT 0;
```

---

## 八、備註 / 歷史決策

- Push 額度寶貴，非 Cron 一律用 ReplyToken
- R2 用英數路徑避免編碼問題，DB 存中文顯示
- 設定檔為 `wrangler.jsonc`（非 wrangler.toml）
- Claude API 費用極低（$0.19/月），5美元可用約2年
- 後台為桌機/Mac 使用，不需考慮手機版面
- node 和 wrangler 使用不同 JS parser，兩個都要過才算語法正確
- 天氣推播：週日練車固定推桃園；特殊約騎填城市名稱（例：羅東≈太平山）
