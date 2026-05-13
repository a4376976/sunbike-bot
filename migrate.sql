-- v7.8 migration
-- 1. 知識庫
CREATE TABLE IF NOT EXISTS knowledge_base (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL DEFAULT '路線',
  region   TEXT NOT NULL DEFAULT '全台',
  title    TEXT NOT NULL,
  tags     TEXT NOT NULL DEFAULT '',
  content  TEXT NOT NULL,
  enabled  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. 約騎行程新增天氣推播欄位
ALTER TABLE ride_schedule ADD COLUMN weather_city TEXT DEFAULT '';
ALTER TABLE ride_schedule ADD COLUMN weather_push INTEGER DEFAULT 0;
