import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore
import re
from load_env import load_env, require

load_env()

# 初始化 Firebase
cred = credentials.Certificate("../config/dayofftest1-firebase-adminsdk-xfpl4-f64d9dc336.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# 設定 Gemini 模型（API key 由環境變數 / .env 提供，勿寫死於程式碼）
genai.configure(api_key=require("GEMINI_API_KEY"))
# 註：gemini-1.5-pro-latest 已被 Google 下架（呼叫會回 404），改用現行穩定的 2.5-flash。
model = genai.GenerativeModel("models/gemini-2.5-flash")


def fetch_keywords():
    scam_keywords = []
    scam_types = []
    anti_scam_keywords = []
    keyword_map = {}

    docs = db.collection("FraudDefine").stream()
    for doc in docs:
        data = doc.to_dict()
        if "Keyword" in data:
            if data.get("Result") == 1:
                scam_keywords.append(data["Keyword"])
                scam_types.append(data.get("Type", "未知"))
                keyword_map[data["Keyword"]] = {
                    "type": data.get("Type", "未知"),
                    "Remind": data.get("Remind", ""),
                    "Prevent": data.get("Prevent", "")
                }
            elif data.get("Result") == 0:
                anti_scam_keywords.append(data["Keyword"])

    return scam_keywords, scam_types, anti_scam_keywords, keyword_map



def analyze_text_to_python_result(text):
    scam_keywords, scam_types, anti_scam_keywords, keyword_map = fetch_keywords()

    prompt = f"""
    請根據以下輸入的訊息，分析是否為詐騙、情緒、詐騙類型與關鍵字：
    詐騙關鍵字：{', '.join(scam_keywords)}
    反詐騙關鍵字：{', '.join(anti_scam_keywords)}
    訊息：「{text}」

    請依下列格式回應（用繁體字，不要加任何多餘文字）：
    ```
    語意分析: 是/否
    語意解釋: 文字...
    關鍵字/句: xxx
    情緒分析: 情緒類型
    情緒影響: 文字...
    詐騙機率: XX%
    詐騙類型: 詐騙類型或無
    提醒: 反詐騙提醒語
    防範: 防範建議
    ```
    """

    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()

        # 從 AI 回傳文字提取資料
        fraud_rate_match = re.search(r"詐騙機率[:：] *([0-9.]+)%", result_text)
        emotion_match = re.search(r"情緒分析[:：] *(.*)", result_text)
        fraud_type_match = re.search(r"詐騙類型[:：] *(.*)", result_text)
        keyword_match = re.search(r"關鍵字/句[:：] *(.*)", result_text)
        Remind_match = re.search(r"提醒[:：] *(.*)", result_text)
        Prevent_match = re.search(r"防範[:：] *(.*)", result_text)
        print("emotion_match",emotion_match)
        fraud_rate = float(fraud_rate_match.group(1)) if fraud_rate_match else 0.0
        emotion = emotion_match.group(1).strip() if emotion_match else "無"
        fraud_type = fraud_type_match.group(1).strip() if fraud_type_match else "無"
        keyword = keyword_match.group(1).strip() if keyword_match else "未知"
        remind = Remind_match.group(1).strip() if keyword_match else "無"
        prevent = Prevent_match.group(1).strip() if keyword_match else "無"
        # 根據關鍵字組成 matched_keywords
        matched_keywords = []
        
        print("matched_keywords",matched_keywords)
        if matched_keywords == []:
            matched_keywords.append({
                "keyword": keyword,
                "type": fraud_type,
                "Remind": remind,
                "Prevent": prevent
            })
        # 判斷詐騙結果

        result_flag = "詐騙" if fraud_rate > 50 else "非詐騙"

        return {
            "Emotion": emotion,
            "FraudRate": fraud_rate,
            "content": text,
            "matched_keywords": matched_keywords,
            "result": result_flag
        }

    except Exception as e:
        return {"error": f"分析時發生錯誤：{e}"}
