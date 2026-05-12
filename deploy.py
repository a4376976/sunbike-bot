#!/usr/bin/env python3
"""
陽光單車Bot 部署腳本
用法：python3 ~/sunbike-bot/deploy.py
"""
import os
import shutil
import subprocess
from pathlib import Path
from datetime import datetime

DOWNLOADS_DIR = Path.home() / "Downloads"
PROJECT_DIR   = Path.home() / "sunbike-bot"
TARGET_JS     = PROJECT_DIR / "src" / "index.js"
TARGET_MD     = PROJECT_DIR / "CLAUDE.md"

def find_latest(filename):
    files = list(DOWNLOADS_DIR.glob(f"*{filename}*"))
    if not files:
        return None
    return max(files, key=lambda f: f.stat().st_mtime)

def main():
    print("🚴‍♀️ 陽光單車Bot 部署腳本")
    print("─" * 40)

    src_js = find_latest("index.js")
    if not src_js:
        print("❌ 找不到 index.js，請先從雲端下載到 Downloads")
        return

    # 印出修改時間，確認是對的版本
    mtime = datetime.fromtimestamp(src_js.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
    print(f"✅ 找到 index.js：{src_js.name}")
    print(f"   📅 修改時間：{mtime}")
    print(f"   📦 檔案大小：{src_js.stat().st_size:,} bytes")

    confirm = input("\n確認部署這個版本？(y/n) ")
    if confirm.lower() != 'y':
        print("已取消")
        return

    TARGET_JS.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src_js, TARGET_JS)
    print(f"✅ 已複製到 {TARGET_JS}")

    src_md = find_latest("CLAUDE.md")
    if src_md:
        shutil.copy2(src_md, TARGET_MD)
        print(f"✅ 已複製 CLAUDE.md")

    print("\n🚀 開始部署...")
    result = subprocess.run(["wrangler", "deploy"], cwd=PROJECT_DIR, text=True)

    if result.returncode == 0:
        print("\n✅ 部署成功！")
        print("🌐 https://bot.jego3c.com/admin")
    else:
        print("\n❌ 部署失敗，請檢查錯誤訊息")

if __name__ == "__main__":
    main()
