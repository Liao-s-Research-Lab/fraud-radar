#!/usr/bin/env bash
set -e

# 把 HF Secret（環境變數）裡的 Firebase 金鑰寫成程式預期的檔案路徑。
# Python（app1.py 等）以檔案路徑讀取；Next.js 端則直接讀環境變數 FIREBASE_ADMIN_JSON。
mkdir -p /app/backend/config
if [ -n "$FIREBASE_ADMIN_JSON" ]; then
  printf '%s' "$FIREBASE_ADMIN_JSON" > /app/backend/config/dayofftest1-firebase-adminsdk-xfpl4-f64d9dc336.json
  echo "[start] Firebase 金鑰已寫入 backend/config/"
else
  echo "[start] ⚠️ 未設定 FIREBASE_ADMIN_JSON，Firebase 相關功能會失敗"
fi

# 啟動 Flask + Next.js + nginx（前景執行，nginx 監聽 7860 對外）
exec supervisord -c /etc/supervisor/conf.d/app.conf -n
