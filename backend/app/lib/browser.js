import puppeteer from 'puppeteer';

// 共用一個 headless 瀏覽器實例，避免每次偵測都重啟 Chrome（每次啟動約 1~3 秒）。
// 中斷時自動重啟。
let sharedBrowser = null;
async function getBrowser() {
    if (sharedBrowser && sharedBrowser.connected) {
        return sharedBrowser;
    }
    // headless: 'shell' 使用 chrome-headless-shell（純無頭二進位），
    // 不會像一般 Chrome 的 new headless 在 Windows 上閃出視窗（先前「白框」的真因）。
    sharedBrowser = await puppeteer.launch({
        headless: 'shell',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    return sharedBrowser;
}

// URL 偵測時，最多對網頁裡的幾張圖做 OCR。
// 整頁可能有數十張圖，每張 OCR 數秒，全跑會「無敵慢」；取前幾張即可代表頁面。
const MAX_OCR_IMAGES = 3;

// 以無頭瀏覽器抓取網址的文字內容與圖片連結（給 OCR 用）。
export async function UrlContent(url) {
    if (!/^https?:\/\//.test(url)) {
        url = `https://${url}`; // 補全爲 https://
    }
    console.log(`處理 URL: ${url}`);

    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // 檢查是否有 <article> 元素並根據情況提取內容
    const { content, imageUrls } = await page.evaluate(() => {
        let targetElement = document.querySelector('article');
        if (!targetElement) {
            targetElement = document.body; // 如果沒有 <article>，默認抓取整個 body
        }

        // 提取文本內容
        const content = targetElement.innerText;

        // 提取圖片 URL
        const imageUrls = Array.from(targetElement.querySelectorAll('img'))
            .map(img => img.src)
            .filter(src => {
                // 排除包含 "icon" 的 URL
                if (src.includes('icon')) return false;
                if (src.includes('title')) return false;
                if (src.includes('logo')) return false;
                if (src.endsWith('.svg')) return false;
                // 排除分辨率過小的縮略圖 (例如寬度或高度小於50px)
                const imgElement = document.querySelector(`img[src="${src}"]`);
                if (imgElement && (imgElement.width < 50 || imgElement.height < 50)) return false;
                return true;
            });

        return { content, imageUrls };
    });

    console.log(`提取的內容: ${content}`);
    console.log(`找到圖片 URL: ${imageUrls}`);

    // 只取前幾張圖做 OCR，避免整頁大量圖片拖慢偵測
    return { content, imageUrls: imageUrls.slice(0, MAX_OCR_IMAGES) };
    } finally {
        await page.close().catch(() => {});  // 只關分頁，保留共用瀏覽器供下次重用
    }
}
