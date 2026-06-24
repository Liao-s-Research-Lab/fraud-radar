import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 原本 backend/news/new.js（:917）的爬蟲邏輯，搬進 Next.js 成為 /api/news
// 前端改打 /api/news，:917 這個服務不再需要。

let cachedArticles = [];      // 緩存爬取結果
let lastFetched = 0;          // 上次爬取時間（毫秒）
const CACHE_TTL = 5 * 60 * 1000; // 5 分鐘內重用緩存，避免每次都打 Yahoo

async function getPage() {
  try {
    const res = await axios.get('https://tw.news.yahoo.com/tag/%E8%A9%90%E9%A8%99', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(res.data);
    const articles = [];

    // Yahoo 新聞改版後，每則新聞是一個 li.stream-card
    $('li.stream-card').each((index, element) => {
      if (index < 12) {
        const el = $(element);
        const title = el.find('h3').first().text().trim();
        const description = el.find('p[class*="text-px16"]').first().text().trim();
        const sourceTime = el.find('div[class*="text-px12"]').first().text().trim();
        let link = el.find('a[href]').first().attr('href') || '';
        if (link && !/^https?:\/\//.test(link)) {
          link = `https://tw.news.yahoo.com${link}`;
        }
        const img = el.find('img').first().attr('src') || el.find('img').first().attr('data-src');
        if (title) articles.push({ sourceTime, title, description, link, img });
      } else {
        return false;
      }
    });

    cachedArticles = articles;
    lastFetched = Date.now();
    return articles;
  } catch (error) {
    console.error('Error fetching news page:', error.message);
    return cachedArticles; // 失敗時沿用舊緩存
  }
}

export async function GET() {
  if (Date.now() - lastFetched > CACHE_TTL || cachedArticles.length === 0) {
    await getPage();
  }
  return NextResponse.json(cachedArticles);
}
