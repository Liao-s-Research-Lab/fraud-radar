# 騙局雷達 — 單一容器同時跑 前端(靜態) + Next.js + Flask AI 服務，部署於 Hugging Face Spaces。
FROM python:3.9-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=utf-8 \
    PIP_NO_CACHE_DIR=1 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_CACHE_DIR=/app/.puppeteer

# 系統套件：Node 18、nginx、supervisor、chrome-headless-shell 執行所需函式庫、中日韓字型
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates gnupg nginx supervisor \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
      libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
      libpango-1.0-0 libcairo2 libxshmfence1 fonts-noto-cjk \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Python 依賴（Flask AI）+ 模型下載工具 ----
# 用 --no-deps 安裝完整 freeze：requirements.txt 已含所有相依，且包含一組
# 「paddle 要 protobuf 3.20 / google 套件宣告要 protobuf 4」的衝突組合（本機實測可運作，
# 只是 pip 解析器會拒絕同時安裝）。--no-deps 原封不動裝回這組版本、不做解析，即可避開衝突。
COPY backend/python/requirements.txt backend/python/requirements.txt
RUN pip install --no-deps -r backend/python/requirements.txt

# 預先快取 bert-base-chinese（避免執行期才下載）
RUN python -c "from transformers import BertModel, BertTokenizer; BertModel.from_pretrained('bert-base-chinese'); BertTokenizer.from_pretrained('bert-base-chinese')"

# ---- Next.js 依賴 + chrome-headless-shell ----
COPY backend/package.json backend/package-lock.json backend/
RUN cd backend && npm ci
RUN cd backend && npx puppeteer browsers install chrome-headless-shell

# ---- 前端 build（Vite → 靜態檔）----
COPY frontend frontend
RUN cd frontend && npm ci && npm run build

# ---- 後端原始碼 ----
COPY backend backend

# ---- 下載訓練好的模型（從 HF 模型庫，烤進 image）----
ARG MODEL_REPO=mintguess/fraud-radar-models
ENV MODEL_REPO=${MODEL_REPO}
RUN python backend/python/download_models.py

# ---- Next.js build ----
RUN cd backend && npm run build

# ---- 部署設定 ----
RUN rm -f /etc/nginx/sites-enabled/default
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/supervisord.conf /etc/supervisor/conf.d/app.conf
COPY deploy/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 7860
CMD ["/app/start.sh"]
