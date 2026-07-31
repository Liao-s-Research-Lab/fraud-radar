import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';

// ============================================================
// /api/health —— 給外部監控（UptimeRobot / Better Stack 等）用的健康檢查。
//
// 為什麼要有這支：
//   1. 只打首頁的話，nginx 回靜態檔就是 200，看不出「Flask 已經死了」。
//      這支會實際問一次 Flask 的 /health，能區分「整包掛」與「只有 AI 服務掛」。
//   2. 順便回報容器記憶體用量。Space 若是被 OOM 殺掉，事後 log 常常已經沒了，
//      監控歷史裡的 memory 數字就是唯一線索（掛掉前是不是一路往上頂到 limit）。
//
// 刻意不碰任何模型、不做推論，成本等同回一行 JSON，5 分鐘打一次毫無負擔。
// ============================================================

export const dynamic = 'force-dynamic'; // 絕不靜態化／快取，每次都真的去檢查

const PYTHON_HEALTH_URL = 'http://127.0.0.1:5000/health';
const PYTHON_TIMEOUT_MS = 3000; // 健康檢查要快；Flask 若 3 秒內回不了就當它有問題

// 讀容器（cgroup）的記憶體用量與上限。cgroup v2 優先，失敗再試 v1；讀不到回 null。
async function readContainerMemory() {
    const sources = [
        { used: '/sys/fs/cgroup/memory.current', limit: '/sys/fs/cgroup/memory.max' },                       // v2
        { used: '/sys/fs/cgroup/memory/memory.usage_in_bytes', limit: '/sys/fs/cgroup/memory/memory.limit_in_bytes' }, // v1
    ];
    for (const src of sources) {
        try {
            const used = Number((await readFile(src.used, 'utf8')).trim());
            const rawLimit = (await readFile(src.limit, 'utf8')).trim();
            if (!Number.isFinite(used)) continue;
            // v2 無上限時是字串 "max"；v1 是一個超大數字，兩者都視為「沒設限」
            const limit = Number(rawLimit);
            const hasLimit = Number.isFinite(limit) && limit > 0 && limit < 2 ** 53;
            return {
                usedMB: Math.round(used / 1024 / 1024),
                limitMB: hasLimit ? Math.round(limit / 1024 / 1024) : null,
                percent: hasLimit ? Math.round((used / limit) * 100) : null,
            };
        } catch {
            // 換下一個來源
        }
    }
    return null;
}

async function checkPython() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PYTHON_TIMEOUT_MS);
    const startedAt = Date.now();
    try {
        const res = await fetch(PYTHON_HEALTH_URL, { signal: controller.signal, cache: 'no-store' });
        const latencyMs = Date.now() - startedAt;
        if (!res.ok) return { status: 'down', latencyMs, error: `HTTP ${res.status}` };
        const body = await res.json();
        return { status: 'up', latencyMs, warm: body.warm, rssMB: body.rssMB, uptimeSec: body.uptimeSec };
    } catch (e) {
        return {
            status: 'down',
            latencyMs: Date.now() - startedAt,
            error: e.name === 'AbortError' ? `逾時（>${PYTHON_TIMEOUT_MS}ms）` : e.message,
        };
    } finally {
        clearTimeout(timer);
    }
}

export async function GET() {
    const [python, memory] = await Promise.all([checkPython(), readContainerMemory()]);
    const ok = python.status === 'up';

    // Flask 掛掉時回 503，讓監控直接判定為 down —— 這時偵測功能其實已經不能用了，
    // 雖然首頁還開得起來。
    return NextResponse.json(
        {
            ok,
            time: new Date().toISOString(),
            next: { status: 'up', uptimeSec: Math.round(process.uptime()) },
            python,
            memory,
        },
        { status: ok ? 200 : 503 },
    );
}
