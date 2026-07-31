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

## 監控（uptime）

免費 Space 沒有 SLA，容器可能被 OOM 或回收後**長時間躺在 Runtime error 不會自己好**，
所以要靠外部監控主動發現。**設一支就夠**：

**監控 → `https://mintguess-fraud-radar.hf.space/api/health`，間隔 5 分鐘**

不要只打首頁：首頁是 nginx 回靜態檔，就算 Flask 已經死了照樣 200，看不出偵測功能已經壞掉。
`/api/health`（`backend/app/api/health/route.js`）會實際問一次 Flask，並回報容器記憶體：

```json
{ "ok": true,
  "next":   { "status": "up", "uptimeSec": 3600 },
  "python": { "status": "up", "latencyMs": 8, "warm": { "text": true, "ocr": true }, "rssMB": 2100 },
  "memory": { "usedMB": 5200, "limitMB": 16384, "percent": 31 } }
```

- Flask 沒回應 → 整包回 **HTTP 503**，監控直接判 down。
- `memory.percent` 是排查 OOM 的關鍵：容器被殺掉後 log 常常已經沒了，
  監控歷史裡「掛掉前記憶體一路往上頂」就是唯一證據。
- **檢查間隔維持 5 分鐘**（別拉長到 30 分鐘）。這支不碰模型，成本等同回一行 JSON；
  拉長間隔只會讓「掛了幾小時沒人發現」更嚴重。順帶也能保活 —— Space 休眠門檻是
  連續 48 小時無請求（`gcTimeout: 172800`），5 分鐘一次永遠碰不到。

> **為什麼不改成監控 HF 的 Space 狀態 API 就好**：那支只看得到「容器層」。
> 若 Flask 陷入「起來就崩」的重啟迴圈、而 nginx 繼續正常回 200，
> HF 會一路顯示 `RUNNING`、監控顯示 100% 正常，但所有偵測功能其實都壞了。
> `/api/health` 會真的去問 Flask，抓得到這種「壞了卻沒人知道」的狀況。

**收到 down 通知後，查原因**

監控只會說「不通」。要知道是 `RUNTIME_ERROR` / `SLEEPING` / `BUILDING` / `PAUSED` 哪一種，
收到通知時打一次 HF 的 Space API（這是 huggingface.co，Space 掛掉時它照樣通）：

```powershell
(Invoke-RestMethod https://huggingface.co/api/spaces/mintguess/fraud-radar).runtime.stage
```

`RUNTIME_ERROR` → 到 Space 頁面看 Logs 並手動 Restart；`BUILDING` → 正在重建，等它；
`SLEEPING` → 監控沒在跑（正常情況下不該出現）。

---

## 常見問題排查
- **build 失敗在 pip/npm**：多半是某套件版本或網路，看 log 對應那行。
- **模型下載失敗**：確認模型庫是 Public、名稱與 `MODEL_REPO` 一致。
- **偵測壞掉但畫面正常**：通常是 Flask 還在載模型（等一下）或 `FIREBASE_ADMIN_JSON` / `GEMINI_API_KEY` 沒設對。
  打 `/api/health` 可直接看出是哪一種：`python.status` 是 `down` 就是 Flask 沒起來，
  `warm` 還是 `false` 就是還在預熱。
- **後台登不進去**：確認已部署新版、Firestore 規則已貼、Management 有帳號。
