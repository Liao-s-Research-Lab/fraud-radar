# 安全性設定指南

公開部署前的安全強化。**程式碼的部分已經改好**，本檔列出**你需要手動操作的步驟**（主要在 Firebase 主控台）。

> 本系統的前端連的是 **dayofftest1** 這個 Firebase 專案（見 `frontend/src/firebase.js`），以下所有 Firebase 操作都在這個專案上。

---

## 已經幫你改好的（程式碼端）

| 項目 | 檔案 | 作用 |
|------|------|------|
| Firestore 安全規則 | `firestore.rules` | 鎖死各 collection，後台寫入需管理員權限 |
| API 速率限制 | `backend/app/lib/security.js` | 每 IP 每分鐘最多 20 次 |
| SSRF 防護 | 同上 + `browser.js` | 擋掉抓取 localhost／內網／雲端 metadata |
| 上傳限制 | `backend/app/api/fetch-content/route.js` | 最多 5 檔、單檔 8MB |
| 後台登入改後端驗證 | `backend/app/api/admin-login/route.js` + `Login.jsx`／`Admin.jsx`／`App.jsx` | 帳密在**伺服器端**比對 Management，發帶 admin 權限的 token；前端不再讀明文密碼 |

> 登入流程（方案 2）：前端送帳密 → 後端查 `Management` 比對 → 發 Firebase custom token（含 admin claim）→ 前端 `signInWithCustomToken` 登入 → Firestore 規則認得 admin。
> **你原本「帳號＋密碼＋Management」的登入習慣不變**，只是比對搬到後端、密碼不再外洩。
> 數值（20 次/分、5 檔、8MB）可在 `backend/app/lib/security.js` 調整。

---

## 你要做的步驟

### ① 部署 Firestore 安全規則（最重要）

1. Firebase 主控台 → **Firestore Database** → **規則（Rules）** 分頁。
2. 把 `firestore.rules` 的內容**整段貼上**，按 **發布（Publish）**。
3. 發布後：前端只能做被允許的操作；`Management` 對前端**完全鎖住**（只剩後端 Admin SDK 讀得到，正是登入要用的）。

### ② 在 Management 設一組強密碼的管理員帳號

登入仍是查 `Management` collection，但現在比對在後端、`Management` 不再對外。請：
1. Firestore → `Management` collection。
2. 把原本的 `test123` / `123` **改成你自己的帳號 + 強密碼**（或新增一筆、刪掉舊的）。欄位維持 `Account`、`Password`。

> ⚠️ 密碼目前是明文存放（搬到後端後不會外洩給前端，但仍建議用強密碼）。日後可改成雜湊存放再比對，屬加強項、非必須。

### ③ 測試後台

1. 開 `/login`，用 ② 的帳號密碼登入 → 應進得去 `/admin`。
2. 隨便打錯密碼 → 應顯示「帳號或密碼錯誤」。
3. 直接打 `/admin` 網址（未登入）→ 應被擋、導回 `/login`。
4. 後台的刪除／更新操作應正常（custom token 帶 admin claim，規則放行）。

### ④ 部署時的金鑰（HF Spaces）

部署到 Hugging Face Space 時，金鑰**不要寫進程式或 git**，用 Space 的 **Settings → Secrets**：
- `GEMINI_API_KEY`（換一把有額度的新 key，舊的請撤銷）
- Firebase Admin 金鑰：用 Secret File 或環境變數注入。

### ⑤ 收尾

- repo 裡的 `docs/Database/Management.xml`（含舊的 `test123`/`123`）建議移除或清空，免得密碼被看到。
- `Management` collection 本身**要保留**（後端登入要用），只是把裡面的帳密換強。

---

## 仍建議注意（非阻塞）

- **CORS 目前是 `*`**（`backend/app/lib/http.js` 與 `next.config.js`）：上線後可收緊成只允許你的前端網域。
- **匿名偵測仍會寫一筆 Outcome**：速率限制已能擋住洗 API，若想更省可改成匿名不寫／抽樣寫。
- **Gemini 額度**：偵測沒命中關鍵字會呼叫 Gemini，留意公開後的用量。
- **密碼雜湊**：`Management` 密碼改成 bcrypt 之類雜湊存放會更安全（目前後端比對明文）。

---

## 一句話總結
**先做 ①②（貼規則 + 在 Management 設強密碼），資料庫就鎖好、後台也能登入**；③ 測試、④⑤ 收尾。
