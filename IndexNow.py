import os
import sys
import requests
import xml.etree.ElementTree as ET
import time

# ==================== 配置 ====================
API_KEY = os.environ["INDEXNOW_API_KEY"]
HOST = "silentnrtx.top"
# keyLocation 指向托管的 key 文件：内容必须与文件名一致，否则 IndexNow 会拒绝（403）。
# 可用 INDEXNOW_KEY_LOCATION 覆盖，便于换 key 或排查。
KEY_LOCATION = os.environ.get("INDEXNOW_KEY_LOCATION", f"https://{HOST}/{API_KEY}.txt")
INDEXNOW_URL = "https://api.indexnow.org/indexnow"
# 默认是本地构建后的路径。CI 的 indexnow job 没有任何构建产物，
# 由 workflow 用 SITEMAP_PATH 指向它下载回来的 sitemap。
SITEMAP_PATH = os.environ.get("SITEMAP_PATH", "./src/.vuepress/dist/sitemap.xml")
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

    # sitemap 为空说明构建产物不对（或路径指错），此时"什么都不提交"却退出 0
    # 同样是静默失败，因此直接判为错误。
    if total == 0:
        print(f"错误：{SITEMAP_PATH} 中没有解析到任何 URL")
        sys.exit(1)

    failures = []

    for i in range(0, total, batch_size):
        batch = url_list[i:i + batch_size]
        payload = {
            "host": HOST,
            "key": API_KEY,
            "keyLocation": KEY_LOCATION,
            "urlList": batch
        }
        batch_no = i // batch_size + 1

        try:
            resp = requests.post(INDEXNOW_URL, json=payload, timeout=30)
        except Exception as e:
            failures.append(f"批次 {batch_no}: 请求异常 {e}")
            print(f"批次 {batch_no}: 请求异常 {e}")
            continue

        # IndexNow 用 200/202 表示已接受；403 通常是 keyLocation 不可访问，
        # 或该文件内容与文件名不一致；422 表示 URL 不属于该 host。
        # 必须显式检查状态码：否则提交被拒时脚本仍以 0 退出，job 全绿而搜索
        # 引擎什么都没收到 —— 这种「绿着但没生效」比直接变红难发现得多。
        if resp.status_code in (200, 202):
            print(f"批次 {batch_no}: 提交 {len(batch)} 个 URL → 状态 {resp.status_code}")
        else:
            hint = f"，请确认 {KEY_LOCATION} 可访问且内容与 API_KEY 一致" if resp.status_code == 403 else ""
            failures.append(f"批次 {batch_no}: HTTP {resp.status_code}{hint} {resp.text[:200]}")
            print(f"批次 {batch_no}: 提交失败 → 状态 {resp.status_code}{hint}")

        if i + batch_size < total:
            time.sleep(2)

    if failures:
        print(f"IndexNow 提交存在 {len(failures)} 个失败批次：")
        for item in failures:
            print(f"  - {item}")
        sys.exit(1)

    print("IndexNow 提交完成：全部批次均被接受。")

# 使用
urls = get_urls_from_sitemap(SITEMAP_PATH)
submit_to_indexnow(urls)