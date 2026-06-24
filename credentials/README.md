# 金鑰與機密檔案

⚠️ **此資料夾含敏感金鑰，請勿提交到任何公開的版本庫或外流。**

| 檔案 | 用途 |
|------|------|
| `root-furnace-449217-h0-2a60de25c3ae.json` | Google Cloud 服務帳戶金鑰（Vision／Language API、Firestore）。Python 端以環境變數 `GOOGLE_APPLICATION_CREDENTIALS` 指向它使用。 |
| `firebase備用碼.txt` | Google 帳戶（a03111006@gmail.com）兩步驟驗證的備援碼，2025/06/13 產生，每組僅能用一次。與程式無關，純屬帳號備份。 |

## Firebase Admin SDK 金鑰

程式實際使用的 Firebase Admin 金鑰**不在這裡**，而在 `../backend/config/`，因為程式碼以相對路徑 `../config/xxx.json` 引用：

- `dayofftest1-firebase-adminsdk-xfpl4-f64d9dc336.json` — Python 各服務與 Next.js `fetch-content` route 使用
- `test-bc002-firebase-adminsdk-47w0c-20f1ea4f43.json` — `backend/app/lib/firebaseAdmin.js` 使用
- 另有兩個 `dayofftest1-...` 備份金鑰

## 換成自己的專案時

於 Firebase 主控臺 → 專案設定 → 服務帳戶 → 產生新的私密金鑰，下載 JSON 放入 `backend/config/`，再更新引用該檔名的程式（見主 [README](../README.md) 的「金鑰設定」）。
