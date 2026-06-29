// ============================================================
// 後端 API 位址設定 —— 用環境變數切換(本機測試 ↔ HF 上線)
// ------------------------------------------------------------
// 設定方式:在 mobile/.env 放一行
//   EXPO_PUBLIC_API_BASE_URL=<你的後端位址>
//
// 常見值:
//   Android 模擬器 → 連電腦本機後端 :  http://10.0.2.2:3000
//     (模擬器的 localhost 是它自己,10.0.2.2 才是「主機電腦」)
//   實機(手機與電腦同網段)        :  http://<電腦區網IP>:3000  例 http://192.168.0.10:3000
//   上線(HF Space)               :  https://mintguess-fraud-radar.hf.space
//
// 沒設 .env 時用下面的預設(模擬器連本機),方便開發。
// 注意:連「本機 http」需在 Manifest 開 usesCleartextTraffic;HF 是 https 則無此問題。
// ============================================================

const DEFAULT_BASE_URL = "http://10.0.2.2:3000";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL
).replace(/\/+$/, "");

export const API = {
  // 主要偵測端點:URL / 簡訊 / 文字 / 圖片(multipart)都打這支
  fetchContent: `${API_BASE_URL}/api/fetch-content`,
  // 常見手法 / 新聞
  news: `${API_BASE_URL}/api/news`,
};

export default API;
