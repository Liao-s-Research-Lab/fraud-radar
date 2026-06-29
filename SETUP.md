# 安裝與啟動指南

本檔說明如何在本機建置與啟動「騙局雷達」。專案總覽請見 [README.md](README.md)。

---

## 環境需求

- Node.js 18+
- Python 3.9（與 `torch==2.2.0` 相容）
- 可連網（首次執行會從 HuggingFace 下載 `bert-base-chinese` 基礎模型）
- 金鑰：Firebase / Google Cloud 服務帳戶金鑰，以及 Gemini API key（見下方「金鑰設定」）

---

## 服務一覽

| 服務 | 資料夾 | 技術 | Port | 啟動指令 |
|------|--------|------|------|----------|
| 前端 | `frontend/` | Vite + React | 5173 | `npm run dev` |
| 後端 API | `backend/` | Next.js 14 | 3000 | `npm run dev` |
| AI 偵測服務 | `backend/python/` | Flask + PyTorch/BERT | 5000 | `python app1.py` |
| 手機 App（選配） | `mobile/` | Expo / React Native | — | `npx expo start` |

前端 Vite 已設定 proxy：`/api` → `http://localhost:3000`（Next.js）。新聞牆資料由 Next.js 的 `/api/news` 路由提供。**前端、Next.js、Flask 三個服務需同時執行**系統才完整運作。

---

## 🚀 一鍵啟動（整合版，推薦）

各子專案的依賴與 Python venv／模型都備妥後（見下方各步驟的 ⚠️ 一次性安裝），
在**根目錄**只需一個指令即可同時啟動前端 + Next.js + Flask：

```bash
npm install     # ⚠️ 一次：安裝 concurrently
npm run dev     # 同時啟動 前端(5173) + Next.js(3000) + Flask(5000)
```

> 底層仍是三個程序，但只需一個終端機、一個指令。Flask 由 `backend/python/venv` 啟動，
> 故需先完成下方步驟 3 的 venv 與套件安裝。

---

## 手動分開啟動（除錯用）

標 ⚠️ 的步驟整個流程只需做一次。

### 1. 前端（`frontend/`）

```bash
cd frontend
npm install          # ⚠️ 一次
npm run dev          # → http://localhost:5173
```

### 2. 後端 Next.js（`backend/`）

```bash
cd backend
npm install          # ⚠️ 一次
npm run dev          # → http://localhost:3000
```

### 3. AI 偵測服務（`backend/python/`）

```bash
cd backend/python
python -m venv venv          # ⚠️ 一次：建立虛擬環境
venv\Scripts\activate        # Windows（mac/linux: source venv/bin/activate）

# ⚠️ 一次：安裝套件（requirements.txt 為實測可運作的版本組合）
pip install -r requirements.txt
```

> **若 `pip install -r requirements.txt` 發生套件衝突**，可改用下列「依序安裝」（版本順序有講究：
> `numpy<2` 必須在 torch 之後釘回、`protobuf==3.20.*` 需在 firebase-admin 之後釘回）：
>
> ```bash
> pip install flask flask-cors requests jieba setuptools
> pip install opencv-python google-cloud-firestore google-generativeai firebase-admin
> pip install "protobuf==3.20.*"     # firebase-admin 會升級 protobuf，需釘回給 paddle 用
> pip install paddlepaddle paddleocr
> pip install imbalanced-learn datasets
> pip install "transformers==4.38.2" # 不可裝最新版：新版強制 torch>=2.6 才能 torch.load
> pip install torch==2.2.0 torchvision==0.17.0 torchaudio==2.2.0
> pip install "numpy<2"              # torch 2.2.0 以 NumPy 1.x 編譯，務必把 numpy 釘回 1.x
> ```

接著設定金鑰、建立模型目錄、訓練模型：

```bash
# ⚠️ 一次：設定 .env（見下方「金鑰設定」）
copy .env.example .env        # Windows（mac/linux: cp .env.example .env），再填入 GEMINI_API_KEY

# ⚠️ 一次：建立模型輸出目錄（model.py / role.py 會把 .pth 存到這裡，不存在會報錯）
mkdir model

# ⚠️ 一次：訓練模型（見下方「AI 模型」）
# 註：訓練腳本含 emoji 輸出，Windows 終端請先設 UTF-8 避免 UnicodeEncodeError
set PYTHONIOENCODING=utf-8
python model.py
python role.py
# svm1.py 的 fraud_keyword_classifier.pkl 已保留，通常不需重跑

python app1.py               # → http://localhost:5000
```

### 4. 新聞爬蟲（已併入 Next.js）

新聞牆資料現在由 Next.js 的 `/api/news` 路由提供（程式在
`backend/app/api/news/route.js`），不再需要單獨啟動 `:917`。
只要步驟 2 的 Next.js 有跑，新聞牆就能運作。

### 5. 手機 App（選配，`mobile/`）

> ⚠️ 專案路徑須為**純 ASCII**（例如 `C:\mobile`）；中文路徑會讓 Gradle 編碼錯誤而 build 失敗。

```bash
cd mobile
npm install              # ⚠️ 一次
npx expo run:android     # debug 版（連 Metro）
```

**後端位址（兩處，預設已指向線上 HF Space `mintguess-fraud-radar.hf.space`）：**

| 位置 | 用途 |
|------|------|
| `.env` 的 `EXPO_PUBLIC_API_BASE_URL` | JS 端（App 內檢測頁） |
| `android/app/src/main/res/values/strings.xml` 的 `api_base_url` | 原生端（懸浮窗截圖偵測） |

本機測試後端時改成：模擬器 `http://10.0.2.2:3000`、實機 `http://<電腦區網IP>:3000`。

**打包可發布 APK：**

```bash
npx expo run:android --variant release
# 產物：android/app/build/outputs/apk/release/app-release.apk（直接傳人安裝，或丟 GitHub Releases）
```

> 懸浮偵測用 Android `MediaProjection`（不需再手動改 IP）；首次於首頁「開啟懸浮偵測」會引導授權「顯示在其他應用程式上層」。
> iOS 不支援懸浮（平台限制，無法截別的 App 畫面 / 系統浮窗），iPhone 用戶改用**網頁版**即可（同一後端）。

---

## AI 模型

各模型與其來源如下：

| 模型 / 檔案 | 由誰產生 | 被誰使用 | 用途 |
|------------|---------|---------|------|
| `bert/`（`model.safetensors`） | **無訓練腳本，須保留或從備份複製** | `fraud_model.py` | **詐騙機率二分類（最終是否詐騙就靠它）** |
| `model/bert_fraud_model.pth` | `python model.py` | `keywords.py` | 關鍵字→詐騙類型的嵌入比對 |
| `emomodel/` | `python model.py` | `roletest.py` | zero-shot 情緒分析 |
| `model/bert_role_classifier.pth` | `python role.py` | `roletest.py` | 對話角色分類（詐騙者／受害者） |
| `fraud_keyword_classifier.pkl` | `python svm1.py`（已保留） | SVM | 關鍵字分類 |

> ⚠️ **最重要**：`bert/` 目錄是「判斷是否詐騙」的核心模型，但**沒有任何訓練腳本會產生它**。
> 若 `bert/` 不存在，`/predict` 會直接失敗（`fraud_model.py` 載入不到）。
> 請務必保留現有的 `backend/python/bert/`，或從你的模型備份複製回來。
> 基礎模型 `bert-base-chinese` 會在首次執行時自動從 HuggingFace 下載。
> 其餘 `model/`、`emomodel/` 由上方訓練腳本生成（記得先 `mkdir model`、設 `PYTHONIOENCODING=utf-8`）。

> 註：大型模型檔（`*.pth`、`*.safetensors`、`model/`、`bert/`、`emomodel/`）已列入 `.gitignore`，
> 不會進版控，請自行保留備份。

---

## 金鑰設定

執行前需要以下金鑰。**所有金鑰都已列入 `.gitignore`，請勿提交到公開版本庫。**

### 1. Gemini API key（`.env`）

`backend/python/` 內的 `GPT.py`、`keywords.py` 需要 Gemini API key，
從環境變數 `GEMINI_API_KEY` 讀取（透過 `load_env.py` 載入同目錄的 `.env`）。

```bash
cd backend/python
cp .env.example .env     # Windows: copy .env.example .env
# 編輯 .env，填入你的 key（申請：https://aistudio.google.com/app/apikey）
```

### 2. Firebase / Google Cloud 服務帳戶金鑰

- Firebase Admin SDK 金鑰放在 `backend/config/`，程式以相對路徑 `../config/xxx.json` 引用（Python 與 Next.js route 皆是）。
- 其餘金鑰與備援碼集中在 `credentials/`，使用方式見 [`credentials/README.md`](credentials/README.md)。
- 若改用自己的 Firebase 專案，需更換金鑰並修改以下檔案中的金鑰檔名：
  `backend/python/` 的 `app1.py`、`svm.py`、`svm1.py`、`role.py`、`model.py`、`GPT.py`，以及 `backend/app/api/fetch-content/route.js`、`backend/app/lib/firebaseAdmin.js`。

> 這些 `.json` / `.txt` 金鑰檔不在版本庫中（見 `.gitignore`）。clone 後需自行放入對應目錄。
