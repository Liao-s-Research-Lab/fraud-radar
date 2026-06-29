# 騙局雷達 — 行動 App

「騙局雷達 Fraud Radar」的 Android App(Expo SDK 52 / React Native,New Architecture)。
與網頁版共用同一個後端(Hugging Face Space)與 Firebase 專案。

## 功能
- **詐騙檢測**:網址 / 簡訊 / 文字 / 圖片,送後端 OCR + Gemini 判斷詐騙率與關鍵字。
- **懸浮一鍵截圖偵測**:原生 `MediaProjection` 懸浮氣泡,點一下截取「當前整個手機畫面」上傳偵測,結果以浮層顯示。氣泡可拖曳到下方 ✕ 暫時移除,於首頁「開啟懸浮偵測」重新開啟。**預設關閉**。
- **詐騙測驗**:照搬網頁版的情境對話測驗(選角色暱稱 → 選類型 → 對話中找出詐騙關鍵句 → 計分 + PR 值),分數寫入共用 Firebase `QuizScore`。
- **常見手法 / 統計圖表 / 防詐資訊(新聞・短影音)**:對應網頁同名頁面。

## 開發環境需求
- Node 18+、Android Studio(SDK / 模擬器或實機)、JDK 17。
- ⚠️ 專案路徑請放在**純 ASCII 路徑**(例如 `C:\mobile`);中文路徑會讓 Gradle 編碼錯誤而 build 失敗。

## 後端位址設定(API)
App 兩處要指向同一個後端,預設已指向線上 HF Space:

| 位置 | 用途 | 值 |
|---|---|---|
| `.env` 的 `EXPO_PUBLIC_API_BASE_URL` | JS 端(App 內檢測頁) | `https://mintguess-fraud-radar.hf.space` |
| `android/app/src/main/res/values/strings.xml` 的 `api_base_url` | 原生端(懸浮窗) | 同上 |

本機測試後端時改成:模擬器 `http://10.0.2.2:3000`、實機 `http://<電腦區網IP>:3000`
(連 http 明文需在 Manifest 開 `usesCleartextTraffic`;HF 是 https 則免)。

## 啟動 / 開發
```bash
npm install
npx expo run:android            # debug 版,連 Metro
```

## 打包可發布的 APK(正式版)
```bash
npx expo run:android --variant release
# 產物:android/app/build/outputs/apk/release/app-release.apk
```
把 `app-release.apk` 直接傳給人安裝(對方需允許「未知來源」),或上傳 GitHub Releases。
> 這個 release 版把 JS 直接打包進 APK,不需 Metro;API 網址在打包當下烤進去。

## 權限說明
- **顯示在其他應用程式上層(SYSTEM_ALERT_WINDOW)**:懸浮偵測必需。首次於首頁點「開啟懸浮偵測」時會引導授權。
- **螢幕截取(MediaProjection)**:懸浮偵測首次截圖時系統會跳一次授權。

## 與整體架構的關係
- 後端 / 網頁前端已打包在根目錄 `Dockerfile`,部署於 HF Space `mintguess/fraud-radar`(push 到 main 由 `.github/workflows/deploy-hf.yml` 自動同步重建)。
- **本 App 不會自動部署**:更新後需自行 `--variant release` 打包 APK 再發布。
- Firebase 專案 `dayofftest1` 與網頁共用(測驗分數、統計、短影音等)。
