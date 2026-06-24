import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// 連 dayofftest1 專案（前端 firebase.js 認證的就是這個）。
// 金鑰來源：部署時用環境變數 FIREBASE_ADMIN_JSON（HF Secret，整段 JSON 字串）；
//           本機開發則讀 backend/config/dayofftest1-...json。
const APP_NAME = 'dayoff';

function loadServiceAccount() {
    if (process.env.FIREBASE_ADMIN_JSON) {
        return JSON.parse(process.env.FIREBASE_ADMIN_JSON);
    }
    const p = path.join(process.cwd(), 'config', 'dayofftest1-firebase-adminsdk-xfpl4-f64d9dc336.json');
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// 延遲初始化：第一次用到才連 Firebase（避免 next build 階段就讀金鑰而失敗）
function getApp() {
    return (
        admin.apps.find((a) => a && a.name === APP_NAME) ||
        admin.initializeApp({ credential: admin.credential.cert(loadServiceAccount()) }, APP_NAME)
    );
}

export function getDb() {
    return getApp().firestore();
}
export function getAuth() {
    return getApp().auth();
}
export { admin };
