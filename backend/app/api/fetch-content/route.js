import { NextResponse } from 'next/server';
import fs from 'fs';
import mime from 'mime-types';
import { spawn } from 'child_process';
import path from 'path';
import { getDb, admin } from '../../lib/firebaseDayoff';
import { UrlContent } from '../../lib/browser';
import { sendImageUrlToPythonService, processPythonResult } from '../../lib/pythonService';
import { createResponse, corsHeaders } from '../../lib/http';
import { getClientIp, rateLimit, MAX_FILES, MAX_FILE_BYTES } from '../../lib/security';

async function readFileContent(buffer) {
    return buffer.toString('utf-8');
}

async function saveToFirestore(detectionType, content, pythonResult) {
    console.log(pythonResult); // 現在應該輸出實際的數據而不是 Promise
    const docRef = await getDb().collection('Outcome').add({
        DetectionType: detectionType,
        Content: content,
        PythonResult: pythonResult,
        TimeStamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return docRef.id;
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}

export async function POST(request) {

    try {

        // 速率限制：每個 IP 每分鐘最多 20 次，擋掉惡意洗 API（灌爆 Firestore / 燒 Gemini / DoS）
        const ip = getClientIp(request);
        if (!rateLimit(ip)) {
            return NextResponse.json(
                { success: false, message: '請求過於頻繁，請稍後再試。' },
                { status: 429 }
            );
        }

        const contentType = request.headers.get('content-type');
        console.log(contentType);


        if (contentType.includes('application/json')) {
            const json = await request.json();
            const { url, text, from } = json;

            if (url) {
                const result = await UrlContent(url);
                const pythonResult = await sendImageUrlToPythonService(result.content+url, result.imageUrls);
                const simplifiedPythonResult = await processPythonResult(pythonResult);
                if (from !== undefined) {
                    console.log(`請求來自: ${from}`);
                  }
                  let ID = null;
                  if (from === undefined) {
                    ID = await saveToFirestore(1, result.content, simplifiedPythonResult);
                    console.log(`已儲存到資料庫`);
                  }
                return createResponse(true, {
                    ID,  pythonResult: simplifiedPythonResult
                });

            }

            else if (text) {
                // 檢查 text 裡是否包含 URL
                const urlPattern = /(https?:\/\/[^\s]+)/g;
                const containsUrl = urlPattern.test(text);
                const urls = text.match(urlPattern);
                let pythonResult;
                let allContent = text;          // 用於收集所有文本內容
                let allImageUrls = [];        // 用於收集所有圖片鏈接
                if (containsUrl) {
                    console.log('處理文本信息', text);
                    for (const url of urls) {
                        try {
                            const result = await UrlContent(url); // 每個 URL 傳入 scrapeUrlContent
                            allContent += result.content + '\n';
                            allImageUrls = allImageUrls.concat(result.imageUrls);  // 合併圖片鏈接數組
                        } catch (e) {
                            console.warn(`略過無法抓取的網址 ${url}: ${e.message}`); // 例如被 SSRF 防護擋下
                        }
                    }
                    pythonResult = await sendImageUrlToPythonService(allContent, allImageUrls);

                } else {
                    console.log('處理文本信息', text);
                    pythonResult = await sendImageUrlToPythonService(text, []);
                    console.log('pythonResult', pythonResult);

                }
                const simplifiedPythonResult = await processPythonResult(pythonResult);
                if (from !== undefined) {
                    console.log(`請求來自: ${from}`);
                  }
                  let ID = null;
                  if (from === undefined) {
                    ID = await saveToFirestore(2, text, simplifiedPythonResult);
                    console.log(`已儲存到資料庫`);
                  }

                return createResponse(true, {
                    ID,
                    pythonResult: simplifiedPythonResult
                });
            }


        } else if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const from = formData.get('from');         // 拿來源
            const files = formData.getAll('files[]'); // 取得所有檔案

            // 上傳限制：擋掉「大量／超大檔」耗光 CPU 與磁碟
            if (files.length > MAX_FILES) {
                return createResponse(false, {}, `檔案數量過多（最多 ${MAX_FILES} 個）。`);
            }
            for (const f of files) {
                if (f && typeof f.size === 'number' && f.size > MAX_FILE_BYTES) {
                    return createResponse(false, {}, `檔案過大（單檔上限 ${MAX_FILE_BYTES / 1024 / 1024}MB）。`);
                }
            }

            let uploadedFileBuffer, uploadedFileName, mimeType;
            let filePaths = []; // 用來儲存所有圖片的路徑

            // 先處理所有文件
            for (const file of files) {
                uploadedFileBuffer = await file.arrayBuffer();
                uploadedFileName = file.name;

                console.log(`處理上傳文件: ${uploadedFileName}`);
                mimeType = mime.lookup(uploadedFileName);
                console.log(`文件 MIME 類型: ${mimeType}`);

                if (mimeType?.startsWith('image/')) {
                    const filePath = path.resolve(__dirname, `../../../../../uploads`, uploadedFileName);
                    fs.writeFileSync(filePath, Buffer.from(uploadedFileBuffer));
                    console.log(`文件已保存至: ${filePath}`);
                    filePaths.push(filePath);

                }
            }

            // 只對圖片發送到 Python 服務
            if (mimeType?.startsWith('image/')) {
                console.log("filePath",filePaths)

                const pythonResult = await sendImageUrlToPythonService('', filePaths);
                const content = pythonResult?.content || '';  // 提取 content 欄位
                for (const filePath of filePaths) {
                fs.unlinkSync(filePath);
                }
                const simplifiedPythonResult = await processPythonResult(pythonResult);
                console.log(`從 Python 獲得的內容: ${content}`);
                let ID = null;
                if (from == null) {
                    ID = await saveToFirestore(4, content, simplifiedPythonResult);
                    console.log(`已儲存到資料庫`);
                  }
                else{
                    console.log(`請求來自: ${from}`);
                }


                return createResponse(true, { ID, pythonResult: simplifiedPythonResult });
            } else if (mimeType?.startsWith('text/plain')) {
                const text = await readFileContent(Buffer.from(uploadedFileBuffer));
                const pythonResult = await sendImageUrlToPythonService(text, []);
                const simplifiedPythonResult = await processPythonResult(pythonResult);
                const ID = await saveToFirestore(3, text, simplifiedPythonResult);

                return createResponse(true, { ID, pythonResult: simplifiedPythonResult });

            } else if (mimeType === 'application/vnd.ms-excel' || mimeType.trim() === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType === 'text/csv') {
                const filePath = path.resolve(__dirname, `../../../../../uploads`, uploadedFileName);
                fs.writeFileSync(filePath, Buffer.from(uploadedFileBuffer));

                const pythonPath = 'python'; // 或 'python3'，或者寫上絕對路徑
                const pythonProcess = spawn(pythonPath, ['schedule_update.py', filePath], {
                    cwd: path.join(__dirname, '../../../../../python'),
                    stdio: 'pipe'  // 確保子進程輸出通過管道傳回
                });
                pythonProcess.stdout.on('data', (data) => {
                    console.log(`Python Output: ${data.toString()}`);
                });

                // 監聽錯誤輸出
                pythonProcess.stderr.on('data', (data) => {
                    console.error(`Python Error: ${data.toString()}`);
                });

                // 監聽腳本結束
                pythonProcess.on('close', (code) => {
                    console.log(`Python script exited with code ${code}`);
                });


                pythonProcess.stderr.on('data', (data) => {
                    console.error(`Python 錯誤: ${data.toString()}`);
                });
                return createResponse(true, {}, '上傳成功');

            }else{
                return createResponse(false, {}, '不支持的文件類型');
                }

        }
        else{return createResponse(false, {}, '無法識別的文件類型');
    }


    } catch (error) {
        console.error('處理失敗:', error.message);
        return createResponse(false, {}, error.message);
    }


}
