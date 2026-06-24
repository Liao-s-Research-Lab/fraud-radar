import re
import csv
import io
import time
import threading
import requests

# ─────────────────────────────────────────────────────────────
# 政府開放資料：警政署公布的「詐騙網址清單」
#
# 設計：Flask 啟動時用背景執行緒抓一次、之後每週自動重抓，結果存在記憶體快取。
#       偵測（check_text_for_lineid_and_url）時直接讀快取，0 網路延遲、不阻塞請求。
#       連不上就沿用既有快取（或空清單），不影響偵測。
#
# 政府開放資料平台「詐騙網站清單」JSON 下載連結（CSV 或 JSON 皆可，程式會自動判斷）。
#          舊的 od.moi.gov.tw REST API 已失效；LINE ID 清單來源已停止提供，故移除該功能。
URL_LIST_SOURCE = "https://quality.data.gov.tw/dq_download_json.php?nid=160055&md5_url=82bc77ebde3503b3cc2a42a96584cc30"

# 網址清單裡，代表「詐騙網址」的可能欄位名（不確定新格式時逐一嘗試）
URL_FIELD_CANDIDATES = ["WEBURL", "網址", "url", "URL", "Web", "詐騙網址"]

# 表頭列：來源 JSON 第一筆是欄位說明（WEBURL=="網址"），要跳過。
_HEADER_LABELS = {"網址", "url", "URL", "WEBURL"}

_REFRESH_INTERVAL = 7 * 24 * 3600   # 每週重抓一次
_FETCH_TIMEOUT = 10                 # 單次下載最多等 10 秒

url_pattern = r'https?://[^\s]+'

# ── 記憶體快取（背景執行緒寫、請求執行緒讀）──
# 每筆為 (raw_url, norm_url)：raw 為原始網址（顯示用），norm 為加上 https:// 並轉小寫後的比對字串。
_fraud_urls = []
_lock = threading.Lock()


def _parse_records(resp):
    """把下載回來的內容（JSON 或 CSV）解析成 list[dict]。"""
    text = resp.text
    # 先試 JSON
    try:
        data = resp.json()
        if isinstance(data, dict):
            # 常見格式：{"result": {"records": [...]}}
            if "result" in data and isinstance(data["result"], dict):
                return data["result"].get("records", [])
            for v in data.values():
                if isinstance(v, list):
                    return v
            return []
        if isinstance(data, list):
            return data
    except ValueError:
        pass
    # 再試 CSV
    try:
        return list(csv.DictReader(io.StringIO(text)))
    except Exception:
        return []


def _strip_scheme(u):
    """去掉 http(s):// 前綴並轉小寫，方便不分 scheme 比對。"""
    return re.sub(r'^https?://', '', u.strip().lower())


def _extract_url(record):
    """從一筆 record 取出網址字串（容錯多種欄位名）。"""
    if not isinstance(record, dict):
        return None
    for field in URL_FIELD_CANDIDATES:
        if field in record and record[field]:
            return str(record[field]).strip()
    # 後備：找值裡看起來像網址的
    for v in record.values():
        if isinstance(v, str) and ("." in v) and (" " not in v.strip()):
            return v.strip()
    return None


def _normalize_records(records):
    """把原始 records 正規化成 [(raw_url, norm_url)]，跳過表頭與空白。"""
    out = []
    seen = set()
    for record in records:
        raw = _extract_url(record)
        if not raw or raw in _HEADER_LABELS:
            continue
        norm = _strip_scheme(raw)
        if not norm or norm in seen:
            continue
        seen.add(norm)
        out.append((raw, norm))
    return out


def _refresh_url_list():
    """抓一次詐騙網址清單，更新快取。失敗則沿用既有快取。"""
    global _fraud_urls
    if not URL_LIST_SOURCE:
        print("[check_text] 尚未設定 URL_LIST_SOURCE，跳過政府網址清單抓取。")
        return
    try:
        resp = requests.get(URL_LIST_SOURCE, timeout=_FETCH_TIMEOUT)
        resp.raise_for_status()
        entries = _normalize_records(_parse_records(resp))
        with _lock:
            _fraud_urls = entries
        print(f"[check_text] 詐騙網址清單已更新：{len(entries)} 筆")
    except Exception as e:
        with _lock:
            n = len(_fraud_urls)
        print(f"[check_text] 詐騙網址清單抓取失敗（沿用現有 {n} 筆）：{e}")


def _background_refresh_loop():
    while True:
        _refresh_url_list()
        time.sleep(_REFRESH_INTERVAL)


# 模組載入（Flask 啟動）時就啟動背景刷新；daemon 執行緒不阻塞主程序結束。
threading.Thread(target=_background_refresh_loop, daemon=True).start()


def check_text_for_lineid_and_url(text):
    """
    比對文字裡的網址是否在「政府公布詐騙網址清單」中。
    （LINE ID 比對功能已移除，因政府資料來源停止提供。）
    回傳 (處理後文字, lineid_info, url_info)；lineid_info 固定為空以維持原介面。
    """
    urls = re.findall(url_pattern, text)
    url_info = []

    if urls:
        with _lock:
            entries = _fraud_urls
        if entries:
            for url in urls:
                text = text.replace(url, '')
                url_norm = _strip_scheme(url)
                for raw, norm in entries:
                    if norm in url_norm:
                        url_info.append({
                            'url': url,
                            'GoverURL': raw,
                            'Type': '政府公開詐騙網站',
                            'Prevent': '此為警政署公佈詐騙網站，可即時撥打165反詐騙諮詢專線，第一時間協助您辨明查證，降低受詐機率！'
                        })
                        break

    # lineid_info 維持空 list，保持與 app1.py 既有介面相容
    return text, [], url_info
