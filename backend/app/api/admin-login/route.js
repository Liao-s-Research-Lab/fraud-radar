import { NextResponse } from 'next/server';
import { getDb, getAuth } from '../../lib/firebaseDayoff';
import { getClientIp, rateLimit } from '../../lib/security';

export async function POST(request) {
    try {
        // 速率限制：擋暴力試密碼
        const ip = getClientIp(request);
        if (!rateLimit(ip)) {
            return NextResponse.json({ success: false, message: '嘗試過於頻繁，請稍後再試。' }, { status: 429 });
        }

        const { account, password } = await request.json();
        if (!account || !password) {
            return NextResponse.json({ success: false, message: '請輸入帳號與密碼。' }, { status: 400 });
        }

        // 伺服器端查 Management 並比對密碼（Admin SDK 會繞過安全規則，Management 對前端可全鎖）
        const snap = await getDb().collection('Management').where('Account', '==', account).limit(1).get();
        if (snap.empty || snap.docs[0].data().Password !== password) {
            // 不分辨「帳號不存在」與「密碼錯誤」，避免洩漏帳號是否存在
            return NextResponse.json({ success: false, message: '帳號或密碼錯誤。' }, { status: 401 });
        }

        // 驗證通過 → 發一張帶 admin 權限的 Firebase custom token
        const uid = `admin_${snap.docs[0].id}`;
        const token = await getAuth().createCustomToken(uid, { admin: true });
        return NextResponse.json({ success: true, token });
    } catch (error) {
        console.error('admin-login 失敗:', error.message);
        return NextResponse.json({ success: false, message: '登入失敗，請稍後再試。' }, { status: 500 });
    }
}
