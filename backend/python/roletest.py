from transformers import pipeline
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import torch.nn as nn
import re

# 載入 Hugging Face 的 Zero-shot Learning 分類模型
classifier = pipeline("zero-shot-classification", model="./emomodel", tokenizer="./emomodel")

# 擴展詐騙情緒類別 - 詐騙者情緒
scam_perpetrator_emotions = [
    "誘騙", "威脅", "詐騙", "敲詐", "操縱", "詐術", 
    "誤導", "欺騙", "謊言",  "操控情感", "強迫", "威脅", "勒索", 
    "撒謊", "隱瞞", "虛假", "欺詐", "不誠實", "偽裝", "竄改", "貪心", 
    "強制", "盜用", "誘惑","急切", "催促"
]

# 擴展詐騙情緒類別 - 受害者情緒
scam_victim_emotions = [
    "恐慌", "焦慮", "緊張", "困惑", "疑惑", "不安", "無助", "懷疑", 
    "受騙", "害怕", "失望", "被背叛", "無奈", "壓力", "恐懼", 
    "徬徨", "擔心", "沮喪", "羞愧", "慌張", "悔恨", "疑慮", "失敗",
    "貪心", "渴望", "衝動", "期待", "急切", "輕信"
]


# 加載 BERT 模型和 Tokenizer
class BertForRoleClassification(nn.Module):
    def __init__(self, num_labels):
        super(BertForRoleClassification, self).__init__()
        self.bert = BertForSequenceClassification.from_pretrained("bert-base-chinese", num_labels=num_labels)

    def forward(self, input_ids, attention_mask):
        return self.bert(input_ids=input_ids, attention_mask=attention_mask)

# 加載模型
def load_model(model_path, device):
    model = BertForRoleClassification(num_labels=2).to(device)
    model.load_state_dict(torch.load(model_path))
    model.eval()  # 切換到評估模式
    return model

# ── 模組載入時就把角色模型與分詞器準備好（只載入一次）──
# 原本寫在 interactive_input() 內，導致每筆偵測都重新 torch.load 409MB，每次多花約 1 秒。
_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_ROLE_TOKENIZER = BertTokenizer.from_pretrained("bert-base-chinese")
_ROLE_MODEL = load_model("model/bert_role_classifier.pth", _DEVICE)

# 預測函數
def predict_role(text, model, tokenizer, device):
    encoding = tokenizer(
        text,
        padding="max_length",
        truncation=True,
        max_length=128,
        return_tensors="pt",
    )

    input_ids = encoding["input_ids"].to(device)
    attention_mask = encoding["attention_mask"].to(device)

    with torch.no_grad():
        outputs = model(input_ids, attention_mask)
        logits = outputs.logits
        prediction = torch.argmax(logits, dim=1).item()  # 獲取預測的標籤（0 或 1）

    label_mapping = {0: "詐騙者", 1: "受害者"}
    return label_mapping.get(prediction, "Unknown")

# 情緒分析
def analyze_scam_emotion(text, emotion_group):
    result = classifier(text, emotion_group, multi_label=True)

    # 取得分類結果，並排序取得前兩名
    sorted_scores = sorted(zip(result["labels"], result["scores"]), key=lambda x: x[1], reverse=True)
    top_two = sorted_scores[:2]

    return {
        "text": text,
        "top_emotions": {label: round(score, 4) for label, score in top_two}  # 保留 4 位小數
    }

# 處理長文本並分段預測
from collections import defaultdict

def process_long_text(text, model, tokenizer, device):
    # 先將輸入的長文本分割成句子（此處簡單以句號為分隔符，實際應用中可根據需求改進分割規則）
    sentences = re.split(r'(?<=[。！？])\s*', text)  # 分隔符為：句號、問號、感嘆號和後續的空格

    emotion_scores = defaultdict(float)  # 用來存儲所有情緒的累計分數
    results = []
    
    for sentence in sentences:
        if sentence.strip():  # 確保句子不是空白
            role = predict_role(sentence.strip(), model, tokenizer, device)
            results.append((sentence.strip(), role))

            print()
            print(f"句子: {sentence} 預測角色: {role}")
            # 根據角色進行情緒分析
            if role == "詐騙者":
                emotion_result = analyze_scam_emotion(sentence, scam_perpetrator_emotions)
                print("詐騙者情緒分析：", emotion_result)

            elif role == "受害者":
                # emotion_result = analyze_scam_emotion(sentence, scam_victim_emotions)
                print("受害者")
                emotion_result = {}
            else:
                emotion_result = {}  # 如果無法識別角色，就跳過

            # 將情緒分數進行累加
            if emotion_result.get("top_emotions"):
                for emotion, score in emotion_result["top_emotions"].items():
                    emotion_scores[emotion] += score  # 累計所有情緒的分數

    # 找出累計分數最高的情緒
    max_emotion = max(emotion_scores, key=emotion_scores.get, default="無")
    max_score  = emotion_scores.get(max_emotion, 0)

    if len(sentences) > 0:  # 用句子數量計算平均分數
        max_score = max_score / len(sentences)
    else:
        max_score = 0

    return results, max_emotion, max_score



# 交互式輸入
import time

# 交互式輸入
def interactive_input(text):
    # 模型與分詞器已在模組載入時準備好（_ROLE_MODEL / _ROLE_TOKENIZER / _DEVICE），這裡直接重用
    t2 = time.time()
    roles, max_emotion, max_score = process_long_text(text, _ROLE_MODEL, _ROLE_TOKENIZER, _DEVICE)
    t3 = time.time()
    print(f"🧠 長文本處理與情緒分析耗時：{t3 - t2:.4f} 秒")
    print(f"🌟 累計情緒分數：最高情緒是 '{max_emotion}'，總分：{max_score:.2f}")

    return max_emotion, max_score


# 使用範例：
if __name__ == "__main__":
    user_input = input("請輸入一段對話文本：")  # 示例文本，可以替換成實際輸入
    interactive_input(user_input)