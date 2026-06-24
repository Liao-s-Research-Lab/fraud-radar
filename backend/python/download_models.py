"""從 Hugging Face 模型庫下載訓練好的模型（bert/ model/ emomodel/）。
部署時於 Docker build 階段執行，把模型烤進 image，避免每次冷啟動再下載。

環境變數 MODEL_REPO 指定模型庫（預設 mintguess/fraud-radar-models）。
"""
import os
from huggingface_hub import snapshot_download

REPO = os.environ.get("MODEL_REPO", "mintguess/fraud-radar-models")
BASE = os.path.dirname(os.path.abspath(__file__))  # backend/python

print(f"[download_models] 從 {REPO} 下載模型到 {BASE} ...")
snapshot_download(
    repo_id=REPO,
    local_dir=BASE,
    allow_patterns=["bert/*", "model/*", "emomodel/*"],
)
print("[download_models] 完成")
