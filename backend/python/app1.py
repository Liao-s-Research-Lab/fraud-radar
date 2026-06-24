from flask import Flask, request, jsonify
import joblib
import numpy as np
import firebase_admin
from firebase_admin import credentials, firestore

# 初始化 Flask 應用
app = Flask(__name__)

# 初始化 Firebase
cred = credentials.Certificate('../config/dayofftest1-firebase-adminsdk-xfpl4-f64d9dc336.json')
firebase_admin.initialize_app(cred , name='app')
fapp = firebase_admin.get_app('app')  # 確保使用已初始化的 'app' 實例
db = firestore.client(fapp)  # 使用這個實例連接 Firestore

from check_text import check_text_for_lineid_and_url

# 在 Flask 啟動時就載入模型（原本寫在 predict() 內，導致第一筆請求才載入、卡很久）
from keywords import get_and_match_keywords_with_details
from fraud_model import predict as predict_fraud_probability  # 避免與下方 Flask 路由 predict() 撞名
from roletest import interactive_input
from ocr import process_images  # 啟動時就載入 PaddleOCR（原本在 predict() 內 lazy import，第一次圖片偵測才初始化）


def _warmup():
    """背景預熱：用假資料把各模型先各跑一次，避免第一筆「真正的」偵測卡在冷啟動。"""
    try:
        get_and_match_keywords_with_details("您好")
        predict_fraud_probability("您好")
        interactive_input("您好")
        print("[warmup] 文字模型預熱完成")
    except Exception as e:
        print(f"[warmup] 文字模型預熱略過：{e}")
    try:
        import numpy as _np
        from ocr import perform_ocr
        perform_ocr(_np.full((60, 200, 3), 255, dtype=_np.uint8))  # 白圖暖機
        print("[warmup] OCR 預熱完成")
    except Exception as e:
        print(f"[warmup] OCR 預熱略過：{e}")


import threading as _threading
_threading.Thread(target=_warmup, daemon=True).start()





# 主預測函數
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    input_text = data.get('text', '')
    image_urls = data.get('image_urls', [])
    ocr_texts=[]
    # 如果沒有傳遞 image_urls，只處理輸入文本
    if  image_urls==[]:
        combined_text = input_text
    else:
        ocr_texts,ocr_results=process_images(image_urls)

    combined_text = input_text + ' ' + ' '.join(ocr_texts)

    # 將 OCR 文本和輸入文本合並
    
    text, lineid_data, url_data = check_text_for_lineid_and_url(combined_text)

    if not lineid_data and not url_data:

        import time

        # 第一行
        start_time_1 = time.time()
        matched_keywords = get_and_match_keywords_with_details(text)
        end_time_1 = time.time()
        print(f"matched_keywords 耗時：{end_time_1 - start_time_1:.4f} 秒")
        # keyword = [item["keyword"] for item in matched_keywords]
        # print(keyword)

        # 第二行
        start_time_2 = time.time()
        fraud_probability = predict_fraud_probability(text)
        end_time_2 = time.time()
        print(f"fraud_probability 耗時：{end_time_2 - start_time_2:.4f} 秒")

        # 第三行
        start_time_3 = time.time()
        print(len(text))
        if len(text) > 200:
            print("文本長度超過200字，不進行情緒分析。")
            max_emotion, max_score = None, 0  # 或者可以設置為其他處理結果
        else:
            max_emotion, max_score = interactive_input(text)        
        end_time_3 = time.time()
        print(f"interactive_input 耗時：{end_time_3 - start_time_3:.4f} 秒")
        print(f"總耗時：{end_time_3 - start_time_1:.4f} 秒")

        # 按照比例縮放欺詐可能性
        scaled_fraud_probability = fraud_probability * 0.9  # 90% 是欺詐概率
        scaled_max_score = max_score * 100 * 0.1  # 10% 是 max_score * 100

        # 計算總的輸出（百分比）
        total_probability = scaled_fraud_probability + scaled_max_score

        # 輸出結果
        print(f"詐騙可能性: {fraud_probability:.2f}%")
        print(f"\n🌟 累計情緒分數：最高情緒是 '{max_emotion}'，總分：{max_score:.2f}")
        print(f"⏳ 最終詐騙可能性（基於縮放比例）：{fraud_probability:.2f}%")

        return jsonify({
            'result': '詐騙' if fraud_probability >= 50 else '非詐騙',  # 超過50%即爲詐騙
            'matched_keywords': matched_keywords, # 返回匹配的關鍵字和類型
            'content': text if text else {},  # 僅當有 image_urls 時返回 OCR 結果
            'FraudRate': fraud_probability , # 返回平均置信度百分比
            'Emotion':max_emotion
        })
    else:
        # 構建 matched_keywords 列表，包含匹配的關鍵字和類型
        matched_keywords = []
        if lineid_data:
            for lineid_data in lineid_data:
                matched_keywords.append({
                    'keyword': lineid_data.get('LineID', '無 LineID'),
                    'type': lineid_data.get('Type', '無類型'),
                    'Remind': lineid_data.get('GoverURL', '無 GoverURL'),
                    'Prevent': lineid_data.get('Prevent', '無 Prevent')
                })
        
        if url_data:
            # 假設 url_info 是從 check_text_for_lineid_and_url 函數中得到的
            for url_data in url_data:
                matched_keywords.append({
                    'keyword': url_data.get('url', '無 URL'),
                    'type': url_data.get('Type', '無類型'),
                    'Remind': url_data.get('GoverURL', '無 GoverURL'),
                    'Prevent': url_data.get('Prevent', '無 Prevent')
                })

        # 構造 JSON 響應
        return jsonify({
            'result': '詐騙',  # 超過50%即爲詐騙
            'matched_keywords': matched_keywords,  # 返回匹配的關鍵字和類型
            'ocr_results': ocr_results if image_urls else {},  # 僅當有 image_urls 時返回 OCR 結果
            'FraudRate': 100  # 返回平均置信度百分比
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)