# 陽光單車 Bot 專案說明

## 專案資訊
- 專案路徑：~/sunbike-bot
- Bot 名稱：娜美 Nami
- LINE Bot basic ID：@862bfsiu
- Workers URL：https://bot.jego3c.com
- 管理後台：https://bot.jego3c.com/admin（密碼：sbot2026）

## Cloudflare 資源
- Account ID：2fc04b3461d34a6293ad3c9ac0a32940
- Workers：sunbike-bot
- D1 Database：sunbike-db（ID：9a860dc3-d297-4f66-9bcf-5314b728fc42）
- KV：SUNBIKE_KV（ID：1f802303c7dc4da5b1ad67f63e9d952e）
- R2 Bucket：sunbike（公開URL：https://media.sunbike.jego3c.com）
- 網域：jego3c.com / sunbike.jego3c.com / bot.jego3c.com

## Secrets
- LINE_CHANNEL_SECRET：71c3e55e7da95059c3d9ebe8faea8cd8
- LINE_CHANNEL_ACCESS_TOKEN：hffde28TPOM3YXpo6kDSl5wcA1kMNIqm48BhwgFa9k8pQcV6tPIsTeaBB7jLcjohdS5BFPpgC1DWCTjzQ9DmHo3xDHR32inINdOpWW0WvQpDPv/ZJUrxFqYbir7FcMlXhMS1JjLuB20iBoRfR9UB0AdB04t89/1O/w1cDnyilFU=
- CLAUDE_API_KEY：sk-ant-api03-myYBrWGCWazm0mmTn2MHcw-...

## D1 資料表
- ride_schedule：約騎行程
- morning_messages：早安語錄
- member_birthdays：隊員生日
- special_events：特殊節日/節氣/活動
- group_ids：已加入群組
- keywords：關鍵字管理

## Cron 觸發（UTC）
- 0 23 * * * → 台灣 07:00（早安推播 + 生日祝福）
- 0 22 * * * → 台灣 06:00（約騎當天出發提醒）
- 0 12 * * * → 台灣 20:00（約騎前一天預告 + 節慶預告）

## 關鍵字回覆類型
- claude：Claude AI 回答
- text：固定文字
- link：文字+連結
- r2_image：R2 圖片
- r2_video：R2 影片（MP4）
- sticker：LINE 官方貼圖

## 待完成功能
- [ ] special_events 資料表建立 + 管理後台
- [ ] 多 Cron 邏輯更新（生日、約騎預告、節慶）
- [ ] R2 綁定到 Workers
- [ ] 貼圖上傳到 R2（female/male 各40張）
- [ ] 管理後台換行問題修正

## 訂閱服務
- Cloudflare Pro
- LINE Messaging API（輕用量）
- Claude API（pay-as-you-go）
- GPT Plus

## LINE User ID（James）
- U01c8fe1517092169652e06999172e793
