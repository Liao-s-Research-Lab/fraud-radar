"""檢查一把 Gemini API key 能不能用（有沒有額度）。

用法（在專案根目錄）：
  backend/python/venv/Scripts/python.exe backend/python/check_gemini.py 你的KEY

可一次測多把：把多個 key 用空白隔開當參數。
"""
import sys
import google.generativeai as genai

keys = sys.argv[1:]
if not keys:
    keys = [input("貼上 Gemini API key: ").strip()]

for key in keys:
    masked = key[:6] + "..." + key[-4:]
    try:
        genai.configure(api_key=key)
        m = genai.GenerativeModel("models/gemini-2.5-flash")
        r = m.generate_content("回覆一個字：好")
        print(f"✅ 可用   {masked} → 模型回覆「{r.text.strip()[:10]}」")
    except Exception as e:
        msg = str(e)
        if "429" in msg or "quota" in msg.lower() or "depleted" in msg.lower():
            reason = "額度用罄 / 超過配額（429）"
        elif "API_KEY_INVALID" in msg or "401" in msg or "PERMISSION" in msg:
            reason = "key 無效或沒權限"
        elif "404" in msg:
            reason = "模型名稱問題（404）"
        else:
            reason = msg[:120]
        print(f"❌ 不可用 {masked} → {reason}")
