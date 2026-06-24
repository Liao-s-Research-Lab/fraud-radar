"""把目前內容上傳到 Hugging Face Space（給 GitHub Action 用）。
用 upload_folder（大檔自動走 LFS），避免 git push 被 HF 擋大檔。
需要環境變數 HF_TOKEN（GitHub secret）。
"""
import os
from huggingface_hub import HfApi

api = HfApi(token=os.environ["HF_TOKEN"])
SPACE = os.environ.get("HF_SPACE", "mintguess/fraud-radar")

ignore = [
    ".git/*", "*/.git/*",
    "*/node_modules/*", "node_modules/*",
    "*/venv/*", "*/newenv/*", "*/__pycache__/*",
    "backend/.next/*", "frontend/dist/*",
    "backend/python/bert/*", "backend/python/model/*", "backend/python/emomodel/*",
    "*.pth", "*.safetensors",
    "backend/config/*", "credentials/*", "*.env",
    "frontend/public/demo.mp4", "frontend/public/demotest.mp4",
    "docs/*", "mobile/*",
]

print(f"上傳到 Space {SPACE} ...", flush=True)
api.upload_folder(
    folder_path=".",
    repo_id=SPACE,
    repo_type="space",
    commit_message="deploy from github action",
    ignore_patterns=ignore,
    delete_patterns=["*"],
)
print("完成", flush=True)
