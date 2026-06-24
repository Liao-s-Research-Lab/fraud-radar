import os

# 極簡 .env 載入器（無第三方依賴）。
# 讀取與本檔同目錄的 .env，把 KEY=VALUE 寫進 os.environ（不覆蓋已存在的環境變數）。
# .env 不進版控（見 .gitignore），範本為 .env.example。


def load_env(path=None):
    if path is None:
        path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def require(name):
    """讀取必要環境變數，缺少時給出清楚的錯誤訊息。"""
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"缺少環境變數 {name}。請在 backend/python/.env 設定（可複製 .env.example 修改）。"
        )
    return value
