# 部署指南（Hugging Face Spaces，免費）

把整套系統(前端 + Next.js + Flask AI)用**一個 Docker 容器**部署到免費的 Hugging Face Space。

**運作方式**：容器內 nginx(對外 7860)服務前端靜態檔、把 `/api/*` 轉給 Next.js(3000)，Next.js 再呼叫 Flask(5000)。1.5GB 模型放在一個免費的 HF 模型庫，build 時下載烤進 image。

> ⚠️ 這類重量級 Docker(torch+paddle+chrome)首次 build 較久，且可能要除錯一兩輪，屬正常。

---

## 流程總覽
1. 上傳模型到 HF 模型庫（一次）
2. 在 HF Space 設 Secrets（Firebase、Gemini）
3. 在 GitHub 設 `HF_TOKEN` Secret（給自動同步用）
4. push → GitHub Action 自動同步到 Space → Space 自動 build

---

## ① 上傳模型到 Hugging Face 模型庫

模型(`bert/`、`model/`、`emomodel/`，共約 1.5GB)不在 git 裡，要放到一個 HF 模型庫，讓 build 時下載。

**1. 建立模型庫**
到 https://huggingface.co/new （New Model）：
- Owner：`mintguess`
- Model name：`fraud-radar-models`
- 設為 **Public**（公開，這樣 build 時不用權杖就能下載）
- Create

> 程式預設就是抓 `mintguess/fraud-radar-models`(見 `backend/python/download_models.py` 與 Dockerfile 的 `MODEL_REPO`)。若你取別的名字，要同步改這兩處。

**2. 安裝 CLI 並登入**
```bash
pip install -U "huggingface_hub[cli]"
huggingface-cli login      # 貼上一個有「write」權限的 token（在 HF → Settings → Access Tokens 產生）
```

**3. 上傳三個模型資料夾**（在專案 `backend/python/` 的上層、或用絕對路徑）
```bash
cd backend/python
huggingface-cli upload mintguess/fraud-radar-models bert     bert     --repo-type model
huggingface-cli upload mintguess/fraud-radar-models model    model    --repo-type model
huggingface-cli upload mintguess/fraud-radar-models emomodel emomodel --repo-type model
```
上傳完，到模型庫頁面應看到 `bert/`、`model/`、`emomodel/` 三個資料夾。

---

## ② 在 HF Space 設 Secrets

到你的 Space → **Settings → Variables and secrets → New secret**，新增兩個 **Secret**：

| 名稱 | 值 |
|------|-----|
| `FIREBASE_ADMIN_JSON` | 把 `backend/config/dayofftest1-firebase-adminsdk-xfpl4-f64d9dc336.json` 的**整段 JSON 內容**貼上 |
| `GEMINI_API_KEY` | 一把有額度的 Gemini key（建議換新的、撤銷舊的） |

> 程式會在容器啟動時把 `FIREBASE_ADMIN_JSON` 寫回成金鑰檔給 Python 用；Gemini key 則直接從環境變數讀。

---

## ③ 在 GitHub 設 `HF_TOKEN`

讓 GitHub 能自動把程式碼推到 Space：
1. 到 GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**。
2. 名稱 `HF_TOKEN`，值 = 一個有 **write** 權限、且能存取你 Space 的 HF token。

---

## ④ 觸發部署

把這次的部署檔 push 上 GitHub（main）後：
- `.github/workflows/deploy-hf.yml` 會自動執行 → 把目前內容推到 `mintguess/fraud-radar` Space。
- Space 偵測到 `Dockerfile` → 自動 build → 部署。
- 完成後網址：**https://mintguess-fraud-radar.hf.space**

> 也可在 GitHub repo 的 **Actions** 分頁手動 **Run workflow**。
> Space 的 build 進度與 log 在 Space 頁面的 **Logs / Building** 看。

---

## 部署後注意
- **首次 build 很久**（安裝 torch/paddle + 下載模型）。在 Space 的 Logs 看進度。
- **冷啟動**：免費 Space 閒置會休眠，下次有人訪問會重新啟動 + 載入模型（約 30–60 秒）。
- **金鑰安全**：金鑰只放在 Secrets，不在 image、不在 git。
- **改 code 後**：push 到 GitHub main → Action 自動重新部署。

---

## 常見問題排查
- **build 失敗在 pip/npm**：多半是某套件版本或網路，看 log 對應那行。
- **模型下載失敗**：確認模型庫是 Public、名稱與 `MODEL_REPO` 一致。
- **偵測壞掉但畫面正常**：通常是 Flask 還在載模型（等一下）或 `FIREBASE_ADMIN_JSON` / `GEMINI_API_KEY` 沒設對。
- **後台登不進去**：確認已部署新版、Firestore 規則已貼、Management 有帳號。
