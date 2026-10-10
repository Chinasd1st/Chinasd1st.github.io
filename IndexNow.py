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

        # IndexNow 用 200/202 表示已受理；403 通常是 keyLocation 不可访问，
        # 或该文件内容与文件名不一致；422 表示 URL 不属于该 host。
        # 必须显式检查状态码：否则提交被拒时脚本仍以 0 退出，job 全绿而搜索
        # 引擎什么都没收到 —— 这种「绿着但没生效」比直接变红难发现得多。
        #
        # 注意 202 并不等于「站点已验证」。IndexNow 受理后还会异步抓取
        # keyLocation 做验证；本仓库实测过同一把 key 先返回 202、几分钟后再次
        # 提交就变成 403 UserForbiddedToAccessSite。因此看到 202 只能说"已受理"，
        # 不能据此认为提交已生效（公开案例中也有连续两周 202 但全部未生效的情况）。
        if resp.status_code == 200:
            print(f"批次 {batch_no}: 提交 {len(batch)} 个 URL → 状态 200（已接受）")
        elif resp.status_code == 202:
            print(f"批次 {batch_no}: 提交 {len(batch)} 个 URL → 状态 202（已受理，验证异步进行）")
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

    print("IndexNow 提交完成：所有批次均被受理。"
          "（202 仅代表已受理，最终是否生效取决于 IndexNow 对 keyLocation 的异步验证，"
          "可用下一次提交是否仍返回 403 来判断。）")

# 使用
urls = get_urls_from_sitemap(SITEMAP_PATH)
submit_to_indexnow(urls)