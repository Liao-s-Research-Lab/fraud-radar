from paddleocr import PaddleOCR
import cv2
import numpy as np
import requests


# 初始化 PaddleOCR（PaddleOCR 3.x API）
# - enable_mkldnn=False：規避 paddlepaddle 3.x 在本機 oneDNN 推論時的
#   「ConvertPirAttribute2RuntimeAttribute」崩潰。
# - cpu_threads=8：多執行緒加速 CPU 推論。
# - 關閉 textline 方向／文件方向／矯正三個子模型：聊天截圖皆為正向文字，
#   用不到，關掉可省初始化時間與模型下載（對辨識結果無影響）。
ocr = PaddleOCR(
    lang='ch',
    enable_mkldnn=False,
    cpu_threads=8,
    use_textline_orientation=False,
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
)

# 大圖先等比縮小再做 OCR：偵測/辨識耗時與像素量成正比，2080px 約 15s、
# 縮到 1280px 約 5s，實測對中文辨識正確率無損。
OCR_MAX_WIDTH = 1280


def _downscale(image):
    h, w = image.shape[:2]
    if w <= OCR_MAX_WIDTH:
        return image
    scale = OCR_MAX_WIDTH / w
    return cv2.resize(image, (OCR_MAX_WIDTH, int(h * scale)), interpolation=cv2.INTER_AREA)

# 用於跟蹤處理過的圖片 URL
processed_urls = set()


def download_image_from_url(image_url):
    """從 URL 下載圖片並轉爲 OpenCV 格式"""
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        if 'image' not in response.headers.get('Content-Type', ''):
            raise Exception(f"URL does not point to an image: {image_url}")

        image_array = np.frombuffer(response.content, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if image is None:
            raise Exception(f"Failed to decode image: {image_url}")
        return image
    
    except Exception as e:
        print(f"Failed to download or decode image {image_url}: {e}")
        return None
    

def load_image_from_path(image_url):
    """從本地路徑加載圖像並轉爲 OpenCV 格式"""
    try:
        image = cv2.imdecode(np.fromfile(image_url, dtype=np.uint8), -1)
        if image is None:
            raise Exception(f"Failed to load image from path: {image_url}")
        return image
    except Exception as e:
        print(f"Error loading image from local path: {e}")
        raise  # 拋出異常，便於更好地調試



# 增強圖片
def enhance_image(image, scale_factor=4.0):
    """增強圖片（調整對比度、亮度和銳化）"""
    alpha = 1.5  # 對比度
    beta = 0     # 亮度
    enhanced = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
    
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    
    return sharpened

# OCR 識別
def perform_ocr(image):
    """執行 OCR 識別（PaddleOCR 3.x 用 predict()，回傳每頁一個結果物件）"""
    result = ocr.predict(_downscale(image))
    return result

# 提取 OCR 識別結果中的文字
def extract_text_from_ocr(result):
    """提取 OCR 識別結果中的文字（3.x 結果物件以 rec_texts 存放辨識字串）"""
    if not result:
        return ''
    text = ''
    for page in result:
        for line in page.get('rec_texts', []):
            text += line + ' '
    return text.strip()

def is_url(path):
    """判斷傳遞的路徑是否爲 URL"""
    return path.startswith(('http://', 'https://'))


def process_images(image_urls):
    """批量處理圖像 URLs，並返回 OCR 結果"""
    ocr_texts = []
    ocr_results = {}
    for image_url in image_urls:
        if (image_url in processed_urls) and is_url(image_url):
            print(f"Skipping already processed URL: {image_url}")
            continue
        processed_urls.add(image_url)

        try:
            if is_url(image_url):
                # 處理 URL
                image = download_image_from_url(image_url)
            else:
                image = load_image_from_path(image_url)  # 加載本地文件

            if image is None:
                continue
            enhanced_image = enhance_image(image)
            ocr_data = perform_ocr(enhanced_image)
            ocr_text = extract_text_from_ocr(ocr_data)
            print("ocr_text",ocr_text)

            ocr_texts.append(ocr_text)
            ocr_results[image_url] = ocr_text

        except Exception as e:
            print(f"Failed to process image {image_url}: {e}")
            ocr_results[image_url] = str(e)

        

    return ocr_texts, ocr_results