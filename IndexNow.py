import os
import requests
import xml.etree.ElementTree as ET
import time

# ==================== 配置 ====================
API_KEY = os.environ["INDEXNOW_API_KEY"]
HOST = "silentnrtx.top"
KEY_LOCATION = f"https://silentnrtx.top/33302a267ad143adbe7936a5aa1edad3.txt"
INDEXNOW_URL = "https://api.indexnow.org/indexnow"
SITEMAP_PATH = "./src/.vuepress/dist/sitemap.xml"   # 构建后的 sitemap 路径
# ===========================================

def get_urls_from_sitemap(sitemap_path):
    """从 sitemap.xml 提取所有 URL"""
    tree = ET.parse(sitemap_path)
    root = tree.getroot()
    namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    urls = [url.text for url in root.findall('.//ns:loc', namespace)]
    return urls

def submit_to_indexnow(url_list, batch_size=5000):
    total = len(url_list)
    print(f"从 sitemap 中读取到 {total} 个 URL，开始分批提交...")

    for i in range(0, total, batch_size):
        batch = url_list[i:i + batch_size]
        payload = {
            "host": HOST,
            "key": API_KEY,
            "keyLocation": KEY_LOCATION,
            "urlList": batch
        }
        try:
            resp = requests.post(INDEXNOW_URL, json=payload, timeout=30)
            print(f"批次 {i//batch_size + 1}: 提交 {len(batch)} 个 URL → 状态 {resp.status_code}")
        except Exception as e:
            print(f"错误: {e}")
        if i + batch_size < total:
            time.sleep(2)

# 使用
urls = get_urls_from_sitemap(SITEMAP_PATH)
submit_to_indexnow(urls)