<div align="center">

# 🛡️ 騙局雷達 Fraud Radar

**AI 驅動的詐騙訊息偵測系統**

貼上一段訊息、一個網址或一張截圖，幾秒內告訴你「這是不是詐騙」，並指出可疑關鍵字、詐騙類型與防範建議。

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

<table>
<tr>
<td align="center" valign="top">
<img src="https://raw.githubusercontent.com/Liao-s-Research-Lab/fraud-radar/main/docs/screenshots/home-desktop.png" alt="網頁版首頁" width="644">
<br><sub><b>網頁版</b> · 貼文字／網址／截圖即時偵測</sub><br><br>
<a href="https://mintguess-fraud-radar.hf.space"><img src="https://img.shields.io/badge/%F0%9F%8C%90_%E7%B7%9A%E4%B8%8A%E8%A9%A6%E7%94%A8-%E2%86%92-1F6FEB?style=for-the-badge" alt="線上試用"></a>
</td>
<td align="center" valign="top">
<img src="https://raw.githubusercontent.com/Liao-s-Research-Lab/fraud-radar/main/docs/screenshots/app-home.png" alt="Android App 首頁" width="190">
<br><sub><b>Android App</b> · 懸浮一鍵偵測</sub><br><br>
<a href="#-手機-app-安裝android"><img src="https://img.shields.io/badge/%F0%9F%93%B1_%E5%AE%89%E8%A3%9D_App-%E2%86%92-F97316?style=for-the-badge" alt="安裝 Android App"></a>
</td>
</tr>
</table>
</div>

---

## 📖 系統簡介

**騙局雷達** 是一套結合深度學習與規則比對的反詐騙系統。面對日益猖獗的詐騙訊息，一般人往往難以即時判斷真偽。本系統讓使用者用三種方式快速查證：

- 📝 **貼文字** — 把可疑的簡訊、對話內容貼上
- 🔗 **貼網址** — 輸入可疑連結，系統自動抓取網頁內容分析
- 🖼️ **上傳截圖** — 上傳對話或廣告截圖，透過 OCR 擷取文字後分析

系統會綜合 **BERT 語意模型**、**關鍵字比對**、**情緒分析** 與 **政府公告詐騙網址清單**，輸出一個詐騙機率與完整的分析報告，並提供防詐提醒。除了偵測，還包含詐騙測驗、最新詐騙新聞牆與後台管理。

---

## ✨ 功能特色

### 🔍 三合一詐騙偵測
- **文字偵測**：分析訊息語意，回傳詐騙機率、情緒傾向、命中的詐騙關鍵字與類型。
- **網址偵測**：自動以無頭瀏覽器抓取網頁文字與圖片內容再分析；同時比對警政署公告的詐騙網站清單，命中即標記。
- **圖片偵測**：以 PaddleOCR 從截圖擷取文字，再走完整偵測流程。

### 🧠 多模型綜合判斷
- **BERT 二分類**：判斷整段文字是否為詐騙（最終機率主要依據）。
- **關鍵字 → 類型比對**：找出「投資詐騙」「假冒公務員」等類型，並附上對應的提醒與防範建議。
- **情緒分析**：偵測訊息中的「誘惑」「恐嚇」等情緒，作為輔助分數。

### 📋 政府詐騙網址清單
- 背景定期抓取政府開放資料平台的詐騙網站清單（數萬筆），存於記憶體快取，偵測時 0 延遲比對、不阻塞請求。

### 🎮 詐騙小遊戲
- 互動式情境測驗，透過角色扮演與計分，提升使用者對各類詐騙手法的辨識力。

### 📰 詐騙新聞
- 彙整最新詐騙相關新聞，由後端 API 提供，幫助使用者掌握時下手法。

### 🎬 防詐短影音
- 整合 YouTube 與 Instagram 的防詐宣導短影音，讓使用者以輕鬆的方式認識各種詐騙手法。

### 📮 可疑訊息回報
- 使用者可主動回報可疑的網址、簡訊或訊息內容並註明來源，協助擴充詐騙資料庫、回饋偵測模型。

### 📊 詐騙統計圖表
- 以數據卡、長條圖與圓餅圖呈現詐騙趨勢與分布，並顯示資料最後更新時間，一眼掌握整體態勢。

### 📱 Android App（懸浮一鍵偵測）
- 與網頁版共用同一後端與 Firebase，並多了網頁做不到的**懸浮氣泡**：以原生 `MediaProjection` 截取當前整個手機畫面上傳偵測，結果直接浮層顯示，不必離開 LINE／訊息 App。
- iOS 因平台限制無法截取其他 App 畫面，iPhone 使用者改用網頁版即可。詳見 [mobile/README.md](mobile/README.md)。

---

## ⚙️ 偵測運作原理

```
使用者輸入（文字 / 網址 / 圖片）
        │
        ├─ 網址 → 無頭瀏覽器抓網頁文字＋圖片
        ├─ 圖片 → PaddleOCR 擷取文字
        │
        ▼
   合併為純文字
        │
        ├─ 政府詐騙網址清單比對 ── 命中 ─► 直接判定為詐騙
        │
        ├─ BERT 詐騙機率（權重 90%）
        ├─ 關鍵字比對 → 詐騙類型／提醒／防範
        └─ 情緒分析分數（權重 10%）
        │
        ▼
   綜合詐騙機率 ≥ 50% → 判定「詐騙」
        │
        ▼
   回傳分析報告（機率、類型、關鍵字、情緒、防範建議）
```

---

## 🏗️ 系統架構

| 服務 | 資料夾 | 技術 | Port |
|------|--------|------|------|
| 前端 | `frontend/` | Vite + React | 5173 |
| 後端 API | `backend/` | Next.js 14 | 3000 |
| AI 偵測服務 | `backend/python/` | Flask + PyTorch / BERT | 5000 |
| 手機 App（選配） | `mobile/` → `C:\mobile` | Expo / React Native（Android） | — |

> 前端 Vite 已設定 proxy：`/api` → Next.js（3000）；新聞牆資料由 Next.js 的 `/api/news` 路由提供。
> **前端、Next.js、Flask 三個服務需同時執行**系統才完整運作。
> 手機 App 原始碼實際位於 `C:\mobile`（Gradle 不吃中文路徑），repo 內的 `mobile/` 是指向它的 Junction。

---

## 🛠️ 技術棧

| 分類 | 使用技術 |
|------|----------|
| 前端 | React、Vite、React Router、Framer Motion、Bootstrap、MUI |
| 後端 | Next.js（App Router）、Node.js、Puppeteer（網頁擷取）|
| AI / NLP | Python、Flask、PyTorch、HuggingFace Transformers（`bert-base-chinese`）、scikit-learn（SVM）、Google Gemini |
| OCR | PaddleOCR |
| 資料庫 / 雲端 | Firebase Firestore、Firebase Admin SDK |

---

## 🚀 快速開始

詳細的安裝、啟動、模型與金鑰設定步驟請見 **[SETUP.md](SETUP.md)**。

備妥依賴與金鑰後，在根目錄一鍵啟動三個服務：

```bash
npm install     # ⚠️ 一次
npm run dev     # 同時啟動 前端(5173) + Next.js(3000) + Flask(5000)
```

啟動後開啟 **http://localhost:5173** 即可使用。

---

## 📱 手機 App 安裝（Android）

> **只想用 App、不想架環境的話，看這節就夠了 —— 裝一個 APK，不需要啟動任何本機服務。**

App 與網頁版共用同一組後端與 Firebase，並多了網頁做不到的**懸浮氣泡一鍵偵測**：以原生
`MediaProjection` 截取當前整個手機畫面直接上傳偵測，結果浮層顯示，不用離開 LINE／訊息 App。

### 方式一：安裝現成的 APK（最快）

```bash
adb install -r C:\mobile\android\app\build\outputs\apk\release\app-release.apk
```

或把 `app-release.apk` 複製到手機上直接點開安裝（需先允許「安裝未知來源的應用程式」）。

### 方式二：自己編譯／修改 App

```bash
cd C:\mobile
npx expo run:android
```

完整說明（權限設定、SAF 檢測、打包流程）見 **[mobile/README.md](mobile/README.md)**。

> **iPhone 使用者**：iOS 平台限制無法截取其他 App 的畫面，因此沒有懸浮偵測功能，請改用
> [網頁版](https://mintguess-fraud-radar.hf.space)，功能完全相同。

## 📁 目錄結構

```
騙局雷達/
├── README.md            ← 本檔（總覽）
├── SETUP.md             安裝與啟動指南
├── frontend/            前端（Vite + React）
│   └── src/components/   偵測、測驗、新聞牆、統計、後台等模組
├── backend/             後端
│   ├── app/             Next.js 路由與 API（fetch-content、news）
│   ├── config/          Firebase Admin 金鑰
│   └── python/          Flask AI 偵測服務與訓練腳本
├── mobile/              手機 App（Expo，選配）→ Junction 指向 C:\mobile
├── docs/                專題文件、操作／安裝說明、資料庫匯出
└── credentials/         其他金鑰與備援碼
```

---

## 📚 文件

`docs/` 內含專題報告、操作說明、安裝說明、發表簡報與 Firestore 資料庫匯出（`Database/*.xml`）。

---

## 👥 團隊與分工

天主教輔仁大學 資訊管理學系 第 42 屆專題　·　指導教授：**廖建翔 教授**

| 成員 | 負責項目 |
|---|---|
| **曾詰淩**（組長） | 系統文件撰寫、介面設計、系統測試 |
| **余政佑** | 全站 UI 設計、常見手法與宣導專區、詐騙測驗遊戲 |
| **徐子崴** | 詐騙檢測模型訓練、檢測結果、後台資料集更新 |
| **黃予岑** | 詐騙檢測模型訓練、前後端 API 串接、網頁爬蟲與 OCR 整合 |
| **梁瑜芳** | 資料庫設計與全站 DB 串接、統計圖表、資料提供與回報列表 |

---

## 📄 授權

本專案採用 [MIT License](LICENSE) 授權，詳見 [LICENSE](LICENSE)。
