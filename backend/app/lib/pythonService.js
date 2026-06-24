import fetch from 'node-fetch';

// 呼叫 Flask AI 偵測服務（/predict），回傳原始結果。
export async function sendImageUrlToPythonService(text, imageUrls) {
    try {
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, image_urls: imageUrls }),
        });

        if (!response.ok) {
            throw new Error('調用 Python 服務失敗');
        }

        return await response.json();
    } catch (error) {
        console.error('調用 Python 服務時出錯:', error.message);
        throw error;
    }
}

// 把 Python 回傳的結果轉成前端／Firestore 共用的格式（Match/MatchKeyword/FraudResult…）。
// 注意：此格式是整個系統與 Firestore Outcome 歷史資料共同依賴的契約，勿隨意改名。
export async function processPythonResult(pythonResult) {
    // 直接構造返回對象
    const matches = (pythonResult.matched_keywords || []).map(item => ({
        MatchKeyword: item.keyword || '無關鍵詞',
        MatchType: item.type || '無類型',
        Remind: item.Remind || '',
        Prevent: item.Prevent || '',
    }));

    const simplifiedPythonResult = {
        FraudResult: pythonResult.result || '未檢測到',
        FraudRate: pythonResult.FraudRate || 0,
        Match: matches,
        Emotion: pythonResult.Emotion || '',
    };

    // 確保返回的對象是標準的 JSON 格式
    return JSON.parse(JSON.stringify(simplifiedPythonResult));
}
