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
        from ocr import process_images
        ocr_texts,ocr_results=process_images(image_urls)

    combined_text = input_text + ' ' + ' '.join(ocr_texts)

    # 將 OCR 文本和輸入文本合並
    
    text, lineid_data, url_data = check_text_for_lineid_and_url(combined_text)

    if not lineid_data and not url_data:    

        from GPT import analyze_text_to_python_result
        result = analyze_text_to_python_result(text)
        print(result)

        # 從 result 解構需要的資料（你提供的格式）
        fraud_probability = result['FraudRate']
        max_emotion = result['Emotion']
        matched_keywords = result['matched_keywords']
        text = result['content']
        total_probability = fraud_probability  # 如果你後續還有縮放，可以自行調整

        print("max_emotion",max_emotion)
        
        # 輸出結果
        print(f"詐騙可能性: {fraud_probability:.2f}%")
        print(f"\n🌟 累計情緒分數：最高情緒是 '{max_emotion}")
        print(f"⏳ 最終詐騙可能性（基於縮放比例）：{total_probability:.2f}%")

        return jsonify({
            'result': '詐騙' if total_probability >= 50 else '非詐騙',  # 超過50%即爲詐騙
            'matched_keywords': matched_keywords, # 返回匹配的關鍵字和類型
            'content': text if text else {},  # 僅當有 image_urls 時返回 OCR 結果
            'FraudRate': total_probability , # 返回平均置信度百分比
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