import dns from 'dns/promises';
import net from 'net';

// ── 速率限制（per-IP，記憶體版滑動視窗）──
// HF Spaces 單一執行個體，記憶體版即可。每個 IP 每 RATE_WINDOW_MS 內最多 RATE_MAX 次。
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 20;
const _hits = new Map(); // ip -> number[]（時間戳）

export function getClientIp(request) {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'unknown';
}

// 回傳 true=允許、false=超過限制
export function rateLimit(ip) {
    const now = Date.now();
    const arr = (_hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
    if (arr.length >= RATE_MAX) {
        _hits.set(ip, arr);
        return false;
    }
    arr.push(now);
    _hits.set(ip, arr);
    // 順手清理：限制 Map 不要無限長大
    if (_hits.size > 5000) {
        for (const [k, v] of _hits) {
            if (v.every(t => now - t >= RATE_WINDOW_MS)) _hits.delete(k);
        }
    }
    return true;
}

// ── 上傳限制 ──
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 8 * 1024 * 1024; // 單檔 8MB

// ── SSRF 防護：只允許抓「公開網際網路」的網址，擋掉 localhost / 內網 / 雲端 metadata ──
function isPrivateIp(ip) {
    if (net.isIPv4(ip)) {
        const p = ip.split('.').map(Number);
        if (p[0] === 10) return true;                          // 10.0.0.0/8
        if (p[0] === 127) return true;                         // 127.0.0.0/8 loopback
        if (p[0] === 0) return true;                           // 0.0.0.0/8
        if (p[0] === 169 && p[1] === 254) return true;         // 169.254.0.0/16（含雲端 metadata）
        if (p[0] === 192 && p[1] === 168) return true;         // 192.168.0.0/16
        if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true; // 172.16.0.0/12
        if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // 100.64.0.0/10 CGNAT
        return false;
    }
    if (net.isIPv6(ip)) {
        const low = ip.toLowerCase();
        if (low === '::1' || low === '::') return true;        // loopback / unspecified
        if (low.startsWith('fe80')) return true;               // link-local
        if (low.startsWith('fc') || low.startsWith('fd')) return true; // unique-local fc00::/7
        if (low.startsWith('::ffff:')) return isPrivateIp(low.replace('::ffff:', '')); // IPv4-mapped
        return false;
    }
    return true; // 無法判斷就當作不安全
}

// 驗證網址是否可安全抓取；不安全則丟出錯誤。
export async function assertPublicUrl(rawUrl) {
    let u;
    try {
        u = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    } catch {
        throw new Error('網址格式不正確');
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        throw new Error('只允許 http/https 網址');
    }
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
        throw new Error('不允許存取內部網址');
    }
    // 解析網域為 IP，逐一比對是否落在私有/內網範圍（擋掉 DNS 指向內網的情況）
    let addrs;
    try {
        addrs = await dns.lookup(host, { all: true });
    } catch {
        throw new Error('無法解析網址');
    }
    for (const a of addrs) {
        if (isPrivateIp(a.address)) {
            throw new Error('不允許存取內部/私有位址');
        }
    }
    return u.href;
}
