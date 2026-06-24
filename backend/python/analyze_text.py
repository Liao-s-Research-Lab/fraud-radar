from transformers import pipeline
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import torch.nn as nn
import re

# 載入 Hugging Face 的 Zero-shot Learning 分類模型
classifier = pipeline("zero-shot-classification", model="./model", tokenizer="./model")

# 詐騙者與受害者情緒分類
scam_perpetrator_emotions = [
    "誘騙", "威脅", "詐騙", "敲詐", "操縱", "詐術", 
    "誤導", "欺騙", "謊言", "操控情感", "強迫", "勒索", 
    "撒謊", "隱瞞", "虛假", "欺詐", "不誠實", "偽裝", "竄改", "貪心", 
    "強制", "盜用", "誘惑", "急切", "催促"
]

scam_victim_emotions = [
    "恐慌", "焦慮", "緊張", "困惑", "疑惑", "不安", "無助", "懷疑", 
    "受騙", "害怕", "失望", "被背叛", "無奈", "壓力", "恐懼", 
    "徬徨", "擔心", "沮喪", "羞愧", "慌張", "悔恨", "疑慮", "失敗",
    "貪心", "渴望", "衝動", "期待", "急切", "輕信"
]

# BERT 模型
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
    model.eval()
    return model

# 預測角色

def predict_role(text, model, tokenizer, device):
    encoding = tokenizer(text, padding="max_length", truncation=True, max_length=128, return_tensors="pt")
    input_ids = encoding["input_ids"].to(device)
    attention_mask = encoding["attention_mask"].to(device)
    with torch.no_grad():
        outputs = model(input_ids, attention_mask)
        logits = outputs.logits
        prediction = torch.argmax(logits, dim=1).item()
    return {0: "詐騙者", 1: "受害者"}.get(prediction, "Unknown")

# 情緒分析

def analyze_scam_emotion(text, emotion_group):
    result = classifier(text, emotion_group, multi_label=True)
    sorted_scores = sorted(zip(result["labels"], result["scores"]), key=lambda x: x[1], reverse=True)
    return {"text": text, "top_emotions": {label: round(score, 4) for label, score in sorted_scores[:2]}}

# 處理長文本

# 處理長文本並統計情緒
# 更新情緒分析統計部分
def process_long_text(text, model, tokenizer, device):
    sentences = re.split(r'(?<=[。！？])\s*', text)
    results = []
    emotion_scores = {}  # 累積所有情緒的分數
    sentence_count_with_emotion = {}  # 計算每種情緒出現的句子數量
    total_sentences = len(sentences)

    for sentence in sentences:
        if sentence.strip():
            role = predict_role(sentence.strip(), model, tokenizer, device)
            emotion_result = analyze_scam_emotion(sentence.strip(), scam_perpetrator_emotions if role == "詐騙者" else scam_victim_emotions)
            results.append({"sentence": sentence.strip(), "role": role, "emotion": emotion_result})

            # 累積情緒分數 & 計算該情緒出現的句子數
            for emotion, score in emotion_result["top_emotions"].items():
                emotion_scores[emotion] = emotion_scores.get(emotion, 0) + score
                sentence_count_with_emotion[emotion] = sentence_count_with_emotion.get(emotion, 0) + 1

    # 計算情緒比例
    emotion_percentage = {}
    for emotion, total_score in emotion_scores.items():
        count = sentence_count_with_emotion[emotion]
        emotion_percentage[emotion] = round((count / total_sentences) * 100, 2)

    # 找出最顯著情緒
    dominant_emotion = max(emotion_percentage, key=emotion_percentage.get, default="無明顯情緒")
    dominant_emotion_percentage = emotion_percentage.get(dominant_emotion, 0)

    return {
        "sentences": results,
        "dominant_emotion": dominant_emotion if dominant_emotion else "無明顯情緒",
        "dominant_emotion_percentage": f"{dominant_emotion_percentage}%",
        "emotion_percentage": emotion_percentage
    }



# 提供 API

def analyze_text(text):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tokenizer = BertTokenizer.from_pretrained("bert-base-chinese")
    model = load_model("model/bert_role_classifier.pth", device)
    return process_long_text(text, model, tokenizer, device)


# 測試區
if __name__ == "__main__":
    print("請輸入文本，輸入 'exit' 退出：")
    while True:
        user_input = input("文本: ")
        if user_input.lower() == "exit":
            break
        results = analyze_text(user_input)
        
        # 輸出句子情緒分析
        print("\n情緒分析結果：")
        for res in results["sentences"]:
            print(f"句子: {res['sentence']} | 角色: {res['role']} | 情緒: {res['emotion']['top_emotions']}")

        # 輸出最高情緒與比例
        print(f"\n最高情緒: {results['dominant_emotion']} | 出現比例: {results['dominant_emotion_percentage']}")
        
        # 輸出情緒比例摘要
        print("\n情緒比例摘要：")
        print(results['emotion_percentage'])
