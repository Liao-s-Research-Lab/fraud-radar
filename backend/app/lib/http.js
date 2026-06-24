import { NextResponse } from 'next/server';

// 統一的 JSON 回應格式：{ success, ...data, message }
export function createResponse(success, data = {}, message = '') {
    return NextResponse.json({ success, ...data, message });
}

// CORS 標頭（供 OPTIONS 預檢使用；一般回應的 CORS 由 next.config 的 headers 處理）。
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // 前端地址
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  // 允許的 HTTP 方法
    'Access-Control-Allow-Headers': 'Content-Type',  // 允許的頭部
    'Access-Control-Allow-Credentials': 'true', // 如果需要支持 Cookies 或認證
};
