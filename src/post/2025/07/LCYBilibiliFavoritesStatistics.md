---
date: 2025-07-21
category: 
    - 人文社科
    - 计算机技术
tag: 
    - B站
    - 统计分析
    - 统计学
    - 拟合
    - Python
    - 李晨煜
icon: tag
---

# 对近期李晨煜b站收藏夹标签的统计以及对其分布规律的发散探究

:::info

本文于2025.08.02更新，并于2025.08.05进行小幅修正。
2025.08.06更新了统计标签数据。
2026.02.07更新了统计标签数据。
2026.02.24删去了频数小于2的标签。

:::

## 说明

下表展示了自2025年6月22日（含）到2025年7月21日（==2026.2.7更新：下方展示数据为2025年6月22日（含）到2026年2月7日==）李晨煜的b站默认收藏夹所收藏的一千八百余个视频的tag统计信息。以下为相关事项：

1. 该列表是通过使用python爬取bilibili官方api`https://api.bilibili.com/x/v3/fav/resource/list`的方式获得的。
2. 统计内容未经过筛选，可能包含少量活动tag。
3. 表格内容较多，可能导致卡顿。
4. 本人仅做了针对tag的数理分析，没有深入语言文字概念中的 **“所指”** 对tag进行探究。

## 统计

::: details 核心代码

::: code-tabs

@tab 爬虫

```py :collapsed-lines
import requests
import time
import datetime
import pandas as pd
from collections import defaultdict
import json
from urllib3.exceptions import ConnectTimeoutError, MaxRetryError
from requests.exceptions import ConnectionError, Timeout
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from rich.progress import (
    Progress,
    BarColumn,
    TimeRemainingColumn,
    SpinnerColumn,
    TextColumn
)


USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
HEADERS = {
    "User-Agent": USER_AGENT,
    "Referer": "https://www.bilibili.com/",
}
REQUEST_TIMEOUT = 15  # 增加超时时间
MAX_RETRIES = 3       # 最大重试次数
RETRY_DELAY = 2       # 重试间隔(秒)

session = requests.Session()
session.headers.update(HEADERS)

tag_cache = {}
tag_lock = threading.Lock()

last_req = 0.0
rate_lock = threading.Lock()


def clip(text, max_len=10):
    """安全截断文本，避免进度条换行"""
    if not text:
        return ""
    return text if len(text) <= max_len else text[:max_len - 1] + "…"


def get_favorite_videos(media_id, start_time, end_time, progress=None):
    """获取收藏夹视频列表（增强网络健棒性）"""
    base_url = "https://api.bilibili.com/x/v3/fav/resource/list"
    videos = []
    page = 1
    total = 0
    page_task = None
    
    if progress:
        page_task = progress.add_task(
            "[cyan]📥 获取收藏夹分页[/cyan]",
            total=None  # 页数未知
        )

    while True:
        params = {
            "media_id": media_id,
            "pn": page,
            "ps": 20,
            "keyword": "",
            "order": "mtime",  # 按收藏时间倒序排列
            "type": "0"
        }
        
        retry_count = 0
        while retry_count < MAX_RETRIES:
            try:
                response = session.get(
                    base_url, headers=HEADERS, params=params, timeout=REQUEST_TIMEOUT
                )

                response.raise_for_status()  # 检查HTTP状态码
                
                data = response.json().get("data", {})
                
                # 检查API返回状态
                if response.json().get("code") != 0:
                    print(f"API错误: {response.json().get('message')}")
                    break
                    
                if not data or not data.get("medias"):
                    print(f"第 {page} 页无数据，终止爬取")
                    if progress and page_task:
                        # 更新最终状态
                        progress.update(
                            page_task,
                            description=f"[cyan]📥 分页完成[/cyan] | 共{page-1}页 | {total}个视频"
                        )
                    return videos
                    
                # 检查最早收藏时间是否早于起始时间
                current_page_times = [item["fav_time"] for item in data["medias"]]
                earliest_time = datetime.datetime.fromtimestamp(min(current_page_times))
                if earliest_time < start_time:
                    print(f"第 {page} 页最早收藏时间 {earliest_time} 早于 {start_time}，终止爬取")
                    if progress and page_task:
                        # 更新最终状态
                        progress.update(
                            page_task,
                            description=f"[cyan]📥 分页完成[/cyan] | 共{page-1}页 | {total}个视频"
                        )
                    return videos
                
                # 处理当前页视频（逐条判断，保证分页进度可见）
                stop_paging = False

                for item in data["medias"]:
                    fav_time = datetime.datetime.fromtimestamp(item["fav_time"])

                    if fav_time < start_time:
                        stop_paging = True
                        continue
                    
                    if fav_time > end_time:
                        continue
                    
                    videos.append({
                        "bvid": item["bvid"],
                        "title": item["title"],
                        "up": item["upper"]["name"],
                        "fav_time": fav_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "duration": item["duration"]
                    })
                    total += 1

                # 更新进度显示
                if progress and page_task:
                    progress.update(
                        page_task,
                        description=f"[cyan]📥 正在获取[/cyan] | 第{page}页 | 已获取{total}个视频"
                    )

                if stop_paging:
                    if progress and page_task:
                        # 更新最终状态
                        progress.update(
                            page_task,
                            description=f"[cyan]📥 分页完成[/cyan] | 共{page}页 | {total}个视频"
                        )
                    return videos
                
                # 检查是否还有下一页
                if data.get("has_more") != 1:
                    if progress and page_task:
                        # 更新最终状态
                        progress.update(
                            page_task,
                            description=f"[cyan]📥 分页完成[/cyan] | 共{page}页 | {total}个视频"
                        )
                    return videos
                    
                page += 1
                time.sleep(0.25)  # 增加延时避免被封
                break  # 成功获取数据，跳出重试循环
                
            except (ConnectionError, Timeout, ConnectTimeoutError, MaxRetryError) as e:
                retry_count += 1
                print(f"网络连接错误 ({retry_count}/{MAX_RETRIES}): {str(e)}")
                time.sleep(RETRY_DELAY * retry_count)
                
            except Exception as e:
                print(f"请求失败: {str(e)}")
                break
                
        if retry_count >= MAX_RETRIES:
            print(f"第 {page} 页请求失败，达到最大重试次数")
            if progress and page_task:
                # 更新最终状态
                progress.update(
                    page_task,
                    description=f"[cyan]📥 分页完成[/cyan] | 共{page-1}页 | {total}个视频"
                )
            return videos
        
    return videos

def get_video_tags(bvid):
    with tag_lock:
        if bvid in tag_cache:
            return tag_cache[bvid]

    url = f"https://api.bilibili.com/x/web-interface/view/detail/tag?bvid={bvid}"

    retry_count = 0
    while retry_count < MAX_RETRIES:
        try:
            response = session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            data = response.json().get("data", [])
            tags = [tag["tag_name"] for tag in data] if data else []

            with tag_lock:
                tag_cache[bvid] = tags
            return tags

        except (ConnectionError, Timeout, ConnectTimeoutError, MaxRetryError):
            retry_count += 1
            time.sleep(RETRY_DELAY * retry_count)

        except Exception:
            return []

    return []


def classify_videos(videos):
    """自动分类视频"""
    classification = defaultdict(list)
    
    for video in videos:
        tags = video.get("tags", [])
        if not tags:
            classification["未分类"].append(video)
            continue
            
        # 使用第一个标签作为主分类
        main_tag = tags[0]
        classification[main_tag].append(video)
        
        # 添加其他标签作为副分类
        for tag in tags[1:]:
            classification[tag].append(video)
    
    return classification

def save_results(videos, classification):
    """保存结果到文件"""
    # 保存视频数据
    if videos:
        df = pd.DataFrame(videos)
        # 展开标签列表为逗号分隔的字符串
        df['tags'] = df['tags'].apply(lambda x: ', '.join(x) if x else '')
        df.to_excel("bilibili_favorites.xlsx", index=False)
    
    # 保存分类数据
    # 将defaultdict转换为普通字典以便JSON序列化
    classification_dict = {k: v for k, v in classification.items()}
    with open("video_classification.json", "w", encoding="utf-8") as f:
        json.dump(classification_dict, f, ensure_ascii=False, indent=2)
    
    print("结果已保存到 bilibili_favorites.xlsx 和 video_classification.json")

def main():
    # 用户配置 
    MEDIA_ID = "1403756728"  # 收藏夹ID
    START_TIME = datetime.datetime(2025, 6, 21)  # 起始时间
    END_TIME = datetime.datetime(2026, 2, 8)  # 结束时间
    
    print(f"开始获取收藏夹 {MEDIA_ID} 的视频 ({START_TIME} 至 {END_TIME})...")

    with Progress(
    SpinnerColumn(),
    TextColumn("[bold cyan]{task.description}"),
    transient=False,
    ) as progress:

        videos = get_favorite_videos(
            MEDIA_ID,
            START_TIME,
            END_TIME,
            progress=progress
        )
    
    if not videos:
        print("未获取到符合时间条件的视频")
        return
    
    print(f"\n成功获取 {len(videos)} 个视频，开始获取标签...")

    with Progress(
        SpinnerColumn(),
        BarColumn(bar_width=30),
        TextColumn("{task.completed}/{task.total}"),
        TimeRemainingColumn(),
        TextColumn("[bold green]{task.description}"),
        transient=False,
    ) as progress:

        task = progress.add_task(
            "[green]🏷 获取视频标签[/green]",
            total=len(videos)
        )

        rate_lock = threading.Lock()
        last_req = 0.0
        
        def rate_limited_fetch(video):
            global last_req
            with rate_lock:
                now = time.time()
                if now - last_req < 0.5:
                    time.sleep(0.5 - (now - last_req))
                last_req = time.time()
            video["tags"] = get_video_tags(video["bvid"])
            return video


        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(rate_limited_fetch, v) for v in videos]

            for f in as_completed(futures):
                v = f.result()
                title = clip(v["title"], 28)
                progress.update(
                    task,
                    advance=1,
                    description=f"[green]{title}[/green] [dim]({len(v['tags'])} tags)[/dim]"
                )


    
    print("\n开始分类视频...")
    classified = classify_videos(videos)
    
    # 打印分类统计
    print("\n分类统计:")
    for category, items in classified.items():
        print(f"{category}: {len(items)}个视频")
    
    save_results(videos, classified)
    print("\n程序执行完毕!")

if __name__ == "__main__":
    # 添加全局异常捕获
    try:
        main()
    except Exception as e:
        print(f"程序发生未捕获异常: {str(e)}")
        import traceback
        traceback.print_exc()
```

@tab Tag统计

```py :collapsed-lines
import pandas as pd
from collections import Counter
import json
import os

def count_tags_from_excel(excel_path):
    """从Excel文件中读取标签数据并统计出现次数"""
    try:
        # 读取Excel文件
        df = pd.read_excel(excel_path)
        
        # 确保tags列存在
        if 'tags' not in df.columns:
            # 尝试查找可能的列名变体
            possible_names = ['Tags', 'TAGS', 'tag', '标签', '视频标签']
            found = False
            for name in possible_names:
                if name in df.columns:
                    df.rename(columns={name: 'tags'}, inplace=True)
                    found = True
                    break
            
            if not found:
                print(f"错误: 文件中没有找到标签列。现有列名: {list(df.columns)}")
                return None
        
        # 提取标签数据
        tags_data = df['tags'].tolist()
        
        # 收集所有标签
        all_tags = []
        for tag_str in tags_data:
            if pd.isna(tag_str) or tag_str == "":
                continue
            # 分割标签字符串
            tags = [t.strip() for t in str(tag_str).split(',') if t.strip()]
            all_tags.extend(tags)
        
        # 统计标签出现次数
        tag_counter = Counter(all_tags)
        return tag_counter
    
    except Exception as e:
        print(f"处理Excel文件时出错: {str(e)}")
        return None

def save_tag_statistics(tag_counter, excel_path, json_path):
    """保存标签统计结果"""
    if not tag_counter:
        print("无标签统计数据可保存")
        return
    
    # 转换为DataFrame并排序
    tags_df = pd.DataFrame({
        "tag": list(tag_counter.keys()),
        "count": list(tag_counter.values())
    }).sort_values(by="count", ascending=False)
    
    # 保存为Excel
    tags_df.to_excel(excel_path, index=False)
    print(f"标签统计已保存到Excel: {excel_path}")
    
    # 保存为JSON
    tag_dict = tags_df.set_index('tag')['count'].to_dict()
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(tag_dict, f, ensure_ascii=False, indent=2)
    print(f"标签统计已保存到JSON: {json_path}")
    
    # 打印统计摘要
    total_tags = sum(tag_counter.values())
    unique_tags = len(tag_counter)
    print(f"\n统计摘要:")
    print(f"总标签数量: {total_tags}")
    print(f"唯一标签数量: {unique_tags}")
    
    # 打印前10个热门标签
    print("\n热门标签Top 10:")
    for i, (tag, count) in enumerate(tags_df.head(10).itertuples(index=False)):
        print(f"{i+1}. {tag}: {count}次")
    
    return tags_df

def main():
    # 配置文件路径
    INPUT_EXCEL = "bilibili_favorites.xlsx"  # 输入Excel文件
    OUTPUT_EXCEL = "excel_tag_statistics.xlsx"  # 输出Excel文件
    OUTPUT_JSON = "excel_tag_counts.json"      # 输出JSON文件
    
    # 检查输入文件是否存在
    if not os.path.exists(INPUT_EXCEL):
        print(f"错误: 输入文件 {INPUT_EXCEL} 不存在")
        return
    
    print(f"开始从 {INPUT_EXCEL} 统计标签出现次数...")
    tag_counter = count_tags_from_excel(INPUT_EXCEL)
    
    if not tag_counter:
        print("未找到可统计的标签数据")
        return
    
    print(f"统计完成，共发现 {len(tag_counter)} 个唯一标签")
    save_tag_statistics(tag_counter, OUTPUT_EXCEL, OUTPUT_JSON)

if __name__ == "__main__":
    main()
```

@tab 2md

```py
import json

INPUT_FILE = "excel_tag_counts.json"
OUTPUT_FILE = "output.md"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

lines = []
lines.append("| 关键词 | 数量 |")
lines.append("|:------:|:----:|")

for k, v in data.items():
    lines.append(f"| {k} | {v} |")

markdown = "\n".join(lines)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(markdown)

print(f"已输出 Markdown 表格到 {OUTPUT_FILE}")

```

:::

::: details 点击查看Tags

> data updated on 2026-02-07

| **tag** | **count** |
| :------: | :----: |
| 蔚蓝档案 | 1244 |
| 碧蓝档案 | 804 |
| 三角洲行动 | 528 |
| 可爱 | 520 |
| 二次元 | 510 |
| 搞笑 | 466 |
| 初音未来 | 460 |
| 初音ミク | 430 |
| VOCALOID | 320 |
| 必剪创作 | 304 |
| FPS | 282 |
| MMD | 281 |
| 娱乐 | 226 |
| 手书 | 222 |
| pjsk | 221 |
| BA | 221 |
| 世界计划 | 217 |
| 蔚蓝档案二创 | 217 |
| 明日方舟 | 206 |
| miku | 201 |
| 三角洲 | 199 |
| 绘画 | 198 |
| 动画 | 180 |
| 明日方舟创作者应援计划 | 173 |
| 抽象 | 150 |
| 三角洲破壁新赛季上线 | 143 |
| 音乐 | 132 |
| 电子竞技 | 127 |
| ba | 126 |
| 沙雕 | 125 |
| 射击游戏 | 124 |
| 游戏 | 119 |
| 音乐游戏 | 118 |
| 术力口 | 115 |
| 剪辑 | 114 |
| 绘画过程 | 114 |
| 音游 | 113 |
| 原创 | 104 |
| 生活记录 | 104 |
| 三角洲行动7月激励计划 | 104 |
| 贝斯 | 102 |
| JOJO的奇妙冒险 | 102 |
| 爱丽丝 | 97 |
| 同人 | 97 |
| 动画种草激励计划 | 92 |
| 初音 | 92 |
| 整活 | 91 |
| meme | 88 |
| 3D | 87 |
| 二创 | 87 |
| 晓山瑞希 | 85 |
| 记录 | 83 |
| Project SEKAI | 81 |
| 宵崎奏 | 80 |
| 治愈 | 79 |
| 高能 | 77 |
| MEME | 75 |
| 重音テト | 74 |
| 孤独摇滚 | 72 |
| 我的世界 | 72 |
| 推荐宝藏游戏 | 70 |
| Phigros | 65 |
| 初音未来：缤纷舞台 | 62 |
| 鬼畜 | 62 |
| mmd | 61 |
| DECO*27 | 60 |
| 漫画 | 60 |
| 小鸟游星野 | 60 |
| 混剪 | 59 |
| 教程攻略 | 58 |
| 板绘 | 57 |
| 三角洲行动5月激励计划 | 56 |
| PJSK | 56 |
| MAD | 55 |
| 猛攻三角洲黑夜之子新赛季 | 55 |
| 画师激励计划 | 54 |
| 空崎日奈 | 54 |
| 碧蓝档案/蔚蓝档案 | 54 |
| 砂狼白子 | 54 |
| 动画短片 | 54 |
| cos | 52 |
| 明日方舟UP主应援计划 – 镜中集 | 51 |
| 第一视角 | 51 |
| 佳代子 | 51 |
| 25时 | 50 |
| 虚拟偶像 | 48 |
| 虚拟主播 | 48 |
| 三角洲欢乐剧场 | 48 |
| 壁纸 | 47 |
| 白子 | 45 |
| 日奈 | 45 |
| 手机游戏 | 44 |
| 东云绘名 | 44 |
| 舞蹈 | 43 |
| 圣园未花 | 42 |
| 重音teto | 42 |
| 早濑优香 | 42 |
| COVER | 41 |
| 配音 | 41 |
| 星野 | 40 |
| 剧情 | 39 |
| sensei | 39 |
| CS2 | 39 |
| 学习 | 39 |
| 描改 | 38 |
| 重音 | 38 |
| 蔚蓝档案？蔚蓝档案启动！ | 38 |
| 普拉娜 | 37 |
| mzk | 37 |
| 动漫 | 37 |
| 动画短片群星计划 | 37 |
| 情感 | 36 |
| 战争 | 36 |
| mygo | 36 |
| 会长 | 35 |
| Miku | 35 |
| 无厘头 | 35 |
| 未花 | 34 |
| 白洲梓 | 34 |
| Blue Archive | 34 |
| phigros | 34 |
| 阿罗娜 | 34 |
| 优香 | 34 |
| 原创音乐 | 33 |
| 联邦学生会长 | 33 |
| slap | 33 |
| 奇葩 | 33 |
| cs2 | 33 |
| CS | 33 |
| 乌鲁鲁 | 33 |
| 表情包 | 32 |
| 哈基米 | 32 |
| MV | 32 |
| 哭泣少女乐队 | 32 |
| AMV | 32 |
| 七月动画种草激励 | 32 |
| 明日方舟UP主应援计划 – 红丝绒 | 32 |
| BlueArchive | 32 |
| 档案 | 32 |
| jojo | 31 |
| 贝斯手 | 30 |
| 威龙 | 30 |
| 沙盒游戏 | 30 |
| 梗 | 30 |
| 像素风 | 29 |
| 鬼畜星探企划 | 29 |
| 搞笑图片 | 29 |
| teto | 29 |
| 动态壁纸 | 29 |
| 猫猫 | 29 |
| 崩坏：星穹铁道创作者激励计划 | 29 |
| 玛丽 | 29 |
| 学生 | 28 |
| 游戏集锦 | 28 |
| 整点电子榨菜 | 28 |
| 二次元副本挑战者 | 28 |
| 猎奇 | 28 |
| 影视剪辑 | 27 |
| 碎星行动 | 27 |
| jojo的奇妙冒险 | 27 |
| 鼠鼠 | 27 |
| csgo | 27 |
| 搞笑小剧场 | 27 |
| 蔚蓝 | 26 |
| 联动 | 26 |
| 纯音乐 | 26 |
| 校园 | 26 |
| 猫 | 26 |
| 生活 | 26 |
| 空条承太郎 | 26 |
| 美图 | 26 |
| 游戏杂谈 | 26 |
| 头像 | 26 |
| 音MAD | 26 |
| 老师 | 25 |
| 圣娅 | 25 |
| vocaloid | 25 |
| 井芹仁菜 | 24 |
| 梗图 | 24 |
| 鸠 | 24 |
| 原神 | 24 |
| momotalk | 24 |
| 山田凉 | 24 |
| 啤酒烧烤 | 24 |
| JOJO | 23 |
| 韵律源点 | 23 |
| knd | 23 |
| 伊落玛丽 | 23 |
| 策略游戏 | 23 |
| 精彩集锦 | 23 |
| 喜多郁代 | 22 |
| Arcaea | 22 |
| 手游 | 22 |
| #三角洲行动 | 22 |
| 短片 | 22 |
| 维什戴尔 | 22 |
| 编程 | 22 |
| 电影世界计划无法歌唱的初音未来 | 21 |
| 碧蓝档案二创 | 21 |
| 白葱 | 21 |
| 吐槽 | 21 |
| 新人 | 21 |
| 阿米娅 | 21 |
| 跑刀 | 21 |
| 图片 | 21 |
| 数学 | 21 |
| GBC | 21 |
| 天童爱丽丝 | 21 |
| 初音未来缤纷舞台 | 20 |
| 麦晓雯 | 20 |
| Cosplay | 20 |
| 抽卡 | 20 |
| blue archive | 20 |
| 舞萌 | 20 |
| AI绘画 | 20 |
| 堵桥 | 19 |
| 凯尔希 | 19 |
| vrchat | 19 |
| 千早爱音 | 19 |
| 阿洛娜 | 19 |
| 电音 | 19 |
| 创作灵感 | 19 |
| DIO | 19 |
| 美少女 | 19 |
| 艺术 | 19 |
| #洲黄历 | 19 |
| 手绘 | 19 |
| mfy | 19 |
| 星尘远征军 | 18 |
| 虚拟歌手 | 18 |
| 日语 | 18 |
| 高燃 | 18 |
| 诺亚 | 18 |
| kei | 18 |
| MIKU | 18 |
| 喵斯快跑 | 18 |
| 逆天 | 18 |
| 教程 | 18 |
| project sekai | 18 |
| ゚初音未来 | 18 |
| UP 小剧场 3.0 | 17 |
| 翻唱 | 17 |
| 即刻轮回 | 17 |
| 单机游戏 | 17 |
| 波奇酱 | 17 |
| 凯伊 | 17 |
| 日语MV | 17 |
| 猫meme | 17 |
| VRChat | 17 |
| 亚津子 | 17 |
| いますぐ輪廻 | 17 |
| 生盐诺亚 | 17 |
| 翻弹 | 17 |
| 明日方舟终末地公测 | 16 |
| 回忆 | 16 |
| 无畏契约 | 16 |
| 4K | 16 |
| oc | 16 |
| 电贝司 | 16 |
| プロセカ | 16 |
| 丰川祥子 | 16 |
| 镜音铃 | 16 |
| 摇滚 | 16 |
| UP！小剧场   暑期档ACTION！ | 16 |
| 美食 | 16 |
| 视奸 | 16 |
| 朝比奈真冬 | 16 |
| 少女乐队 | 16 |
| GMV | 16 |
| Minecraft | 16 |
| 日常 | 16 |
| 鸣潮创作激励计划 | 16 |
| MC | 16 |
| 电子音乐 | 16 |
| 小视频 | 16 |
| 万恶之源 | 16 |
| CSGO | 16 |
| 王小桃 | 16 |
| ena | 16 |
| 塔防 | 15 |
| maimai | 15 |
| 小钩晴 | 15 |
| 直播 | 15 |
| 直播录像 | 15 |
| 三角洲S6烈火冲天新赛季 | 15 |
| 冰 | 15 |
| Cherry Pop | 15 |
| 自制 | 15 |
| 卡点 | 15 |
| 动漫二创激励计划 | 15 |
| 插画 | 15 |
| 蔚蓝档案二周年 | 15 |
| 真冬 | 15 |
| 夜神月 | 15 |
| gbc | 15 |
| 三角洲一搏成名 | 15 |
| 蔚蓝档案魅力时刻分享 | 15 |
| 电吉他 | 15 |
| 深蓝 | 15 |
| arcaea | 15 |
| 鸣潮 | 15 |
| 爱情 | 15 |
| 下江小春 | 15 |
| 三角洲行动日常操作 | 15 |
| 剧场版 | 14 |
| PROCREATE | 14 |
| 无名 | 14 |
| 红狼 | 14 |
| 普瑞赛斯 | 14 |
| 露娜 | 14 |
| 士兵酱 | 14 |
| 真夜中 | 14 |
| 段子 | 14 |
| 动态 | 14 |
| 搞笑研究所 | 14 |
| PV | 14 |
| 后藤一里 | 14 |
| 主播 | 14 |
| 音乐分享官 | 14 |
| 指绘 | 14 |
| 东方 | 14 |
| AI | 14 |
| 高中 | 14 |
| 转场 | 14 |
| 电影 | 14 |
| 游戏鉴赏家 | 14 |
| 新手 | 14 |
| 安和昴 | 14 |
| VOCALOID·UTAU | 14 |
| 新世代音乐人计划原创季 | 14 |
| BW2025×动画区限时副本大作战 | 14 |
| 颂乐人偶 | 13 |
| 直播切片 | 13 |
| 手机动态壁纸 | 13 |
| 日语翻唱 | 13 |
| girls band cry | 13 |
| Muse Dash | 13 |
| 历史 | 13 |
| 伊地知虹夏 | 13 |
| 恋爱 | 13 |
| 三角洲行动周年庆 | 13 |
| 渚 | 13 |
| 桐藤渚 | 13 |
| 明日方舟终末地 | 13 |
| 黑见芹香 | 13 |
| 30天绘画打卡挑战 | 13 |
| 碧蓝航线 | 13 |
| 百合 | 13 |
| 术曲 | 13 |
| 演示 | 13 |
| 黄金之风 | 13 |
| 练习 | 13 |
| ボカロ | 13 |
| hina | 13 |
| 画师百日创作挑战 | 12 |
| 编曲 | 12 |
| 虚拟UP主 | 12 |
| 三角洲攻略课堂 | 12 |
| 游戏解说 | 12 |
| 全能音乐挑战赛 | 12 |
| 终末地 | 12 |
| 初音MIKU | 12 |
| Ave Mujica | 12 |
| 贝斯谱 | 12 |
| 自制谱 | 12 |
| 正能量 | 12 |
| cosplay | 12 |
| avemujica | 12 |
| 摸金 | 12 |
| 柚鸟夏 | 12 |
| 崩坏星穹铁道3.4创作者激励计划 | 12 |
| 航天基地 | 12 |
| AE | 12 |
| 初音未来缤纷舞台首部银幕电影应援计划 | 12 |
| 摸鱼 | 12 |
| 快乐 | 12 |
| 吉他 | 12 |
| 芹香 | 12 |
| vtuber | 12 |
| 画师激励计划第五期 | 12 |
| 蜂医 | 12 |
| memes | 12 |
| 才羽桃井 | 12 |
| 萌宠 | 12 |
| YYB | 12 |
| nina | 12 |
| 博士 | 12 |
| STORIA | 12 |
| mujica | 11 |
| 挑战 | 11 |
| BGM | 11 |
| 桐谷遥 | 11 |
| galgame | 11 |
| BanG Dream! | 11 |
| Vlog | 11 |
| 月雪宫子 | 11 |
| 热血 | 11 |
| 神金 | 11 |
| 老婆 | 11 |
| 三角洲行动手游 | 11 |
| 小剧场 | 11 |
| 网络游戏 | 11 |
| AKAGE | 11 |
| 赛马娘 | 11 |
| Neuro | 11 |
| 虚拟歌姬 | 11 |
| 宅舞 | 11 |
| モニタリング | 11 |
| 日本 | 11 |
| 三角洲黄历 | 11 |
| 录屏 | 11 |
| 魔法少女的魔女审判 | 11 |
| 伤感 | 11 |
| 乐队 | 11 |
| bluearchive | 11 |
| 曼波 | 11 |
| Vedal | 11 |
| 演奏 | 11 |
| 全面战场 | 11 |
| 世界计划缤纷舞台 | 11 |
| 洛天依 | 11 |
| 鬼畜星探企划第二十二期 | 11 |
| なきそ | 11 |
| 河南 | 11 |
| 泳装 | 11 |
| 高松灯 | 11 |
| 动画短片群星计划第十二期 | 11 |
| 电影世界计划初音未来 | 11 |
| 莉莉丝 | 11 |
| 生日 | 11 |
| 萝莉 | 10 |
| WallpaperEngine | 10 |
| 科技猎手 | 10 |
| 三角洲行动改枪 | 10 |
| 重音テトSV | 10 |
| 游戏推荐 | 10 |
| bass | 10 |
| 唯美 | 10 |
| 喵星人 | 10 |
| 吉良吉影 | 10 |
| 科普 | 10 |
| vup | 10 |
| 阿拜多斯 | 10 |
| 糖画 | 10 |
| 潮汐监狱 | 10 |
| 三角洲S7阿萨拉新赛季 | 10 |
| 歌曲 | 10 |
| 缤纷舞台 | 10 |
| AI音乐征集大赛 | 10 |
| 绝区零UP主激励计划 | 10 |
| ACG音乐 | 10 |
| 三角洲行动整活大赏 | 10 |
| 虹夏 | 10 |
| 实况解说 | 10 |
| 游戏实况 | 10 |
| Evil | 10 |
| 长崎素世 | 10 |
| 桌游棋牌 | 10 |
| AP | 10 |
| 杏山和纱 | 10 |
| 真纪 | 10 |
| 三角洲主播巅峰赛征稿 | 10 |
| 中文字幕 | 10 |
| 军事 | 10 |
| 百合园圣娅 | 10 |
| VTuber | 10 |
| 妄想感伤代偿联盟 | 10 |
| 对立 | 10 |
| 秦泊夜 | 10 |
| 洗脑循环 | 10 |
| 迷因 | 9 |
| 碧蓝玩家团激励计划 | 9 |
| 轻音少女 | 9 |
| 杂谈 | 9 |
| 电脑 | 9 |
| 记录我的美食日常 | 9 |
| 刨手手 | 9 |
| 整点电子榨菜第22期 | 9 |
| 杨齐家 | 9 |
| belike | 9 |
| key | 9 |
| 特蕾西娅 | 9 |
| 镜音连 | 9 |
| meme动画 | 9 |
| 独立游戏 | 9 |
| 2026第一把三角洲 | 9 |
| 突破次元壁大作战 | 9 |
| 零帧起手 | 9 |
| 承太郎 | 9 |
| 鬼方佳代子 | 9 |
| 和纱 | 9 |
| VOCALOID CHINA | 9 |
| 动作游戏 | 9 |
| 无法歌唱的初音未来 | 9 |
| 燃 | 9 |
| 动漫音乐 | 9 |
| 六月动画种草激励 | 9 |
| 新赛季 | 9 |
| MyGO | 9 |
| 柚子社 | 9 |
| 鼠鼠黄历 | 9 |
| 真实 | 9 |
| 基沃托斯 | 9 |
| 幸运干员 | 9 |
| 才羽绿 | 9 |
| MOBA | 9 |
| 胭脂 | 9 |
| 天天天国地狱国 | 9 |
| mzen | 9 |
| 死别 | 9 |
| 独奏 | 9 |
| phigros鸠 | 9 |
| BASS | 9 |
| Python | 9 |
| 少女 | 9 |
| 考试 | 9 |
| cs | 9 |
| 美咲 | 9 |
| 大战场 | 9 |
| 小梓 | 9 |
| 吃鸡 | 9 |
| 少女乐队的呐喊 | 9 |
| 纪夫Junly | 9 |
| 相信大数据 | 9 |
| Mon3tr | 8 |
| 女仆 | 8 |
| 崩坏星穹铁道 | 8 |
| 烽火地带 | 8 |
| 妮可 | 8 |
| 小涂真纪 | 8 |
| cherry pop | 8 |
| 皮肤 | 8 |
| 哲学 | 8 |
| 搬运 | 8 |
| 重音Teto | 8 |
| 原创动画 | 8 |
| 反差 | 8 |
| 秋天的第一把三角洲 | 8 |
| 漫展 | 8 |
| 高考 | 8 |
| 音mad | 8 |
| Funk | 8 |
| 奇迹 | 8 |
| Ba | 8 |
| 鸣潮2.4版本创作激励计划 | 8 |
| MAIMAI | 8 |
| 舞萌dx | 8 |
| 三角洲行动日常记录 | 8 |
| 巡音流歌 | 8 |
| 陈千语 | 8 |
| bro | 8 |
| チェリーポップ | 8 |
| 桔梗 | 8 |
| 若叶睦 | 8 |
| 游戏音乐 | 8 |
| 公主 | 8 |
| 计算机 | 8 |
| BW | 8 |
| 飞鸟马时 | 8 |
| Photoshop | 8 |
| 木偶 | 8 |
| LeaF | 8 |
| OC | 8 |
| 搞笑视频 | 8 |
| 25時ナイトコードで | 8 |
| 方洲行动 | 8 |
| 纱织 | 8 |
| 崩坏星穹铁道3.3创作者激励计划 | 8 |
| 稲葉曇 | 8 |
| YOASOBI | 8 |
| 花子 | 8 |
| 猛攻三角洲破壁新赛季 | 8 |
| 能天使 | 8 |
| ooc | 8 |
| Live2D | 8 |
| 描改手书 | 8 |
| zutomayo | 8 |
| あいつら全員同窓会 | 8 |
| ずっと真夜中でいいのに | 8 |
| 2025画师年终总结 | 8 |
| 联邦学生会 | 8 |
| oicolatcho | 8 |
| 25时，Nightcord见。 | 8 |
| UTAU | 8 |
| 直拍 | 8 |
| おいこらしょ | 8 |
| 母鸡卡 | 8 |
| 绫音 | 8 |
| GAL | 8 |
| 神人 | 8 |
| 亚子 | 8 |
| prsk | 8 |
| 我不是天才吗 | 8 |
| mmt | 8 |
| 翻唱总动员 | 8 |
| mad | 8 |
| 超天酱 | 8 |
| 草东没有派对 | 8 |
| 草东 | 8 |
| 弔图 | 8 |
| 程序员 | 8 |
| 学习心得 | 8 |
| 哈夫克 | 8 |
| 有趣 | 8 |
| 舞萌DX | 8 |
| 星乃一歌 | 8 |
| 风景 | 7 |
| 魔裁 | 7 |
| 原口沙輔 | 7 |
| 暗区突围 | 7 |
| 穿搭 | 7 |
| 马走 | 7 |
| 艾玛 | 7 |
| 心跳不止 | 7 |
| 世界计划多彩舞台 | 7 |
| 3DMV | 7 |
| LIVE | 7 |
| 盾构 | 7 |
| 虚拟之声创作计划 | 7 |
| 人生 | 7 |
| 踩点 | 7 |
| 美游 | 7 |
| 吊图 | 7 |
| 小动画 | 7 |
| 同人动画 | 7 |
| 兄弟 | 7 |
| YYB式 | 7 |
| 人力VOCALOID | 7 |
| BA二创 | 7 |
| 故事 | 7 |
| 三角洲行动同人 | 7 |
| 外挂 | 7 |
| #三角洲黄历 | 7 |
| 中国 | 7 |
| 物理 | 7 |
| 三角洲行动新赛季前瞻直播 | 7 |
| T氏の話を信じるな | 7 |
| 美食制作 | 7 |
| 钢琴 | 7 |
| 三角洲护航 | 7 |
| 佩丽卡 | 7 |
| 扒谱 | 7 |
| 猛攻 | 7 |
| 铁道双子 | 7 |
| 天天天国地獄国 | 7 |
| 日漫 | 7 |
| 游戏开发部 | 7 |
| ピノキオピー | 7 |
| 卡密 | 7 |
| Project Sekai | 7 |
| 世界计划剧场版 | 7 |
| jpop | 7 |
| 架子鼓 | 7 |
| 科技 | 7 |
| 爱素 | 7 |
| 战地 | 7 |
| 石之海 | 7 |
| 恶作剧 | 7 |
| 生草 | 7 |
| 卡提希娅 | 7 |
| 柿崎ユウタ | 7 |
| 萌 | 7 |
| 泰拉探索协会 | 7 |
| 新年 | 7 |
| 欧皇 | 7 |
| 原创曲 | 7 |
| MOD | 7 |
| 音葵 | 7 |
| PJSK激励社 | 7 |
| 朋友 | 7 |
| bangdream | 7 |
| テトリス | 7 |
| 重音TETO | 7 |
| 咕咕嘎嘎 | 7 |
| 喜多 | 7 |
| 恐怖 | 7 |
| 游戏CG | 7 |
| 特效 | 7 |
| Vocaloid | 7 |
| 天马咲希 | 7 |
| 改枪 | 7 |
| 日和 | 7 |
| 歌愛ユキ | 7 |
| 沙雕梗图 | 7 |
| 遥香 | 7 |
| 代码 | 7 |
| 亚北 | 7 |
| 小春 | 7 |
| 教学 | 7 |
| ooc致歉 | 7 |
| 偶像玛丽 | 6 |
| ai | 6 |
| 波波 | 6 |
| 漫剪 | 6 |
| 美食教程 | 6 |
| 宫子 | 6 |
| 希罗 | 6 |
| 万物研究所 | 6 |
| 把兴趣玩出名堂 | 6 |
| 方言 | 6 |
| 手游情报 | 6 |
| 冰红茶 | 6 |
| 离谱 | 6 |
| 画渣 | 6 |
| 萌系 | 6 |
| 初音未来 缤纷舞台 | 6 |
| 放松 | 6 |
| 胡桃 | 6 |
| 糖糖 | 6 |
| 主播女孩重度依赖 | 6 |
| 超绝最可爱天使酱 | 6 |
| Blender | 6 |
| 时雨羽衣 | 6 |
| Teto | 6 |
| 电棍 | 6 |
| 生日祝福 | 6 |
| 飞机 | 6 |
| 小护士 | 6 |
| 魔性 | 6 |
| 影视神仙剪刀手 | 6 |
| SRT | 6 |
| 公主殿下 | 6 |
| 美女 | 6 |
| 樱羽艾玛 | 6 |
| 二阶堂希罗 | 6 |
| 分享 | 6 |
| mc | 6 |
| 世界计划：无法歌唱的初音未来 | 6 |
| 摄影 | 6 |
| 三角洲行动烽火地带 | 6 |
| 可不 | 6 |
| 泪目 | 6 |
| 日系 | 6 |
| 千恋万花 | 6 |
| 小桃 | 6 |
| 橘雪莉 | 6 |
| 结束乐队 | 6 |
| RPG | 6 |
| 哔哩哔哩 | 6 |
| 绝密航天 | 6 |
| 宣传片 | 6 |
| 草薙宁宁 | 6 |
| 火影忍者 | 6 |
| 梦核 | 6 |
| 美味 | 6 |
| 视频 | 6 |
| 活动 | 6 |
| 人文 | 6 |
| 冒险游戏 | 6 |
| VRC | 6 |
| 游戏日常 | 6 |
| 新世代音乐人计划S3原创季 | 6 |
| 莉音 | 6 |
| 三角洲行动×明日方舟联动皮肤 | 6 |
| MEIKO | 6 |
| 猛毒注意 | 6 |
| 随手记录我的生活碎片 | 6 |
| 总力战 | 6 |
| 刀子 | 6 |
| 女儿 | 6 |
| 听歌 | 6 |
| Ave mujica | 6 |
| 粉丝 | 6 |
| fox小队 | 6 |
| 界园 | 6 |
| 阿列克谢 | 6 |
| 银色战车 | 6 |
| 社会 | 6 |
| Heart111 | 6 |
| 迷途之子 | 6 |
| cheems | 6 |
| 高甜 | 6 |
| 阿露 | 6 |
| 瓦学弟 | 6 |
| ourplay | 6 |
| 励志 | 6 |
| 初音未来:缤纷舞台 | 6 |
| 三角初华 | 6 |
| 熟肉 | 6 |
| イガク | 6 |
| MyGO!!!!! | 6 |
| WOTA | 6 |
| 明日方舟岁的界园志异 | 6 |
| 下饭 | 6 |
| 趣图 | 6 |
| 蔚藍檔案 | 6 |
| 蔚蓝档案/碧蓝档案 | 6 |
| 邦邦 | 6 |
| ProjectSEKAI | 6 |
| 蔡徐坤 | 6 |
| 世界第一的公主殿下 | 6 |
| 101俱乐部 | 6 |
| 科技猎手2025·1.0计划 | 6 |
| 萌妹子 | 6 |
| GUMI | 6 |
| 暑假 | 6 |
| 来BW当然要拍vlog啦 | 6 |
| C++ | 6 |
| TETO | 6 |
| 性感 | 6 |
| 零号大坝 | 6 |
| 中文 | 6 |
| pjsk名片 | 6 |
| Mygo | 6 |
| 教育 | 6 |
| GO学长太能剪了 | 6 |
| 世界计划 多彩舞台 | 6 |
| 网络 | 6 |
| 碧蓝玩家团激励计划第45期 | 6 |
| 卡牌游戏 | 6 |
| I Can't Wait | 6 |
| 骇爪 | 5 |
| 鸽游 | 5 |
| 现场 | 5 |
| 轻舞蹈竖屏激励计划 | 5 |
| CG混剪 | 5 |
| 东云彰人 | 5 |
| 天马司 | 5 |
| 二游 | 5 |
| 无忧梦呓 | 5 |
| 压迫感 | 5 |
| 桐生桔梗 | 5 |
| 开箱 | 5 |
| 游戏视频 | 5 |
| 三角洲黑鹰坠落上线 | 5 |
| 布料解算 | 5 |
| 剧场 | 5 |
| 攻略 | 5 |
| AveMujica | 5 |
| B站好片有奖种草 | 5 |
| 填词 | 5 |
| 胃弱 | 5 |
| 萌新 | 5 |
| 发癫 | 5 |
| 三角洲行动3月激励创作活动 | 5 |
| 精神状态 | 5 |
| 钢琴曲 | 5 |
| 亚北音留 | 5 |
| 日富美 | 5 |
| 圣三一 | 5 |
| channel | 5 |
| 角色 | 5 |
| FL Studio | 5 |
| 地狱笑话 | 5 |
| GIRLS BAND CRY | 5 |
| FOX小队 | 5 |
| 古关忧 | 5 |
| 3D动画 | 5 |
| 东方PROJECT | 5 |
| 奶油-cream- | 5 |
| 布若 | 5 |
| 比赛 | 5 |
| ave mujica | 5 |
| 监狱 | 5 |
| ブルーアーカイブ | 5 |
| 中配 | 5 |
| 三角洲DDC钻石冠军赛 | 5 |
| 2025科学很可爱 | 5 |
| 机甲 | 5 |
| Avemujica | 5 |
| 三角洲联动明日方舟 | 5 |
| 电影剪辑 | 5 |
| 天才 | 5 |
| 疾风 | 5 |
| 双马尾 | 5 |
| 抽奖 | 5 |
| 手办 | 5 |
| 红皮 | 5 |
| ナユタン星人 | 5 |
| 跟着DECO一起Cherry Pop | 5 |
| 兔兔 | 5 |
| cover | 5 |
| BW2025 | 5 |
| 恋人不行 | 5 |
| 仲正一花 | 5 |
| go学长 | 5 |
| UP！小剧场. 暑期档！ACTION！ | 5 |
| 手机 | 5 |
| 夜鹿 | 5 |
| 人工智能 | 5 |
| 紫头麻油 | 5 |
| gmod | 5 |
| 猛攻三角洲行动 | 5 |
| 煌 | 5 |
| 化学 | 5 |
| kards | 5 |
| 技巧 | 5 |
| 硬件 | 5 |
| 耳机 | 5 |
| 第五人格 | 5 |
| 循环 | 5 |
| Vsinger创作激励计划 | 5 |
| 初音未来电影 | 5 |
| 幽默 | 5 |
| 画画 | 5 |
| 三角洲行动烽火行动 | 5 |
| 星穹铁道 | 5 |
| 高中生 | 5 |
| 柊マグネタイト | 5 |
| 经验分享 | 5 |
| 算法 | 5 |
| 麦小鼠 | 5 |
| 燃剪 | 5 |
| 方舟 | 5 |
| 演奏挑战赛 | 5 |
| 善战行动 | 5 |
| 阿里乌斯 | 5 |
| 呲牙公主 | 5 |
| しぐれうい | 5 |
| 海猫 | 5 |
| 动物总动员12.0-毛孩子美食季 | 5 |
| 豆包 | 5 |
| 狙击 | 5 |
| 立绘 | 5 |
| 换装 | 5 |
| カササギ | 5 |
| CS2暑期征稿狂欢 | 5 |
| 坦克 | 5 |
| 仁菜 | 5 |
| 无名教学 | 5 |
| 心理 | 5 |
| 秤亚津子 | 5 |
| bang dream | 5 |
| wowaka | 5 |
| 欧美音乐 | 5 |
| mikumikudance | 5 |
| 万物皆可游戏 | 5 |
| ariiol | 5 |
| 迪亚波罗 | 5 |
| 演唱会 | 5 |
| 舰娘 | 5 |
| 光 | 5 |
| ヨルシカ | 5 |
| だいあるのーと | 5 |
| KAITO | 5 |
| 中二节奏 | 5 |
| 魔女画师周榜 | 5 |
| 北极熊 | 5 |
| 服务器 | 5 |
| 乔瑟夫 | 5 |
| 谷子 | 5 |
| 不要相信T氏的话 | 5 |
| 战争雷霆 | 5 |
| 黄绿合战10th-绿队应援 | 5 |
| JoJo的奇妙冒险 | 5 |
| 春岚 | 5 |
| 礼服日奈 | 5 |
| 外网 | 5 |
| 聊天记录 | 5 |
| きゅうくらりん | 5 |
| 三角洲监狱新地图上手攻略 | 5 |
| 女友 | 5 |
| deco27 | 5 |
| 2025毕业季 | 5 |
| 波奇 | 5 |
| 萌物 | 5 |
| 琪露诺 | 5 |
| AI翻唱 | 5 |
| fps | 5 |
| 表情 | 5 |
| 世界计划无法歌唱的初音未来 | 5 |
| 迷迭香 | 5 |
| 魔审 | 5 |
| apex | 5 |
| 你被骗了 | 5 |
| 静止系 | 5 |
| 高中数学 | 5 |
| 编程语言 | 5 |
| 七度雪乃 | 5 |
| bgm | 5 |
| 缪尔赛思 | 5 |
| 花京院 | 5 |
| heart111 | 4 |
| 使命召唤手游 | 4 |
| 格斗游戏 | 4 |
| 复古 | 4 |
| 笑面教授 | 4 |
| Blue archive | 4 |
| 祥子 | 4 |
| 管理员 | 4 |
| 堵桥来 | 4 |
| fyp | 4 |
| 本子 | 4 |
| 武器 | 4 |
| 夺舍 | 4 |
| 老Key | 4 |
| KK日报 | 4 |
| 互联网 | 4 |
| 盾狗 | 4 |
| 三角洲行动高光时刻 | 4 |
| 合集 | 4 |
| DIY | 4 |
| 三角洲行动整活 | 4 |
| 奇迹于你 | 4 |
| 同学 | 4 |
| 感情 | 4 |
| 医学 | 4 |
| 官方 | 4 |
| 手办模玩 | 4 |
| 死亡笔记 | 4 |
| CS2创作激励 | 4 |
| フォニイ | 4 |
| 猫耳 | 4 |
| 橘里橘气 | 4 |
| 不灭钻石 | 4 |
| 神的随波逐流 | 4 |
| 诗歌剧 | 4 |
| otto | 4 |
| 碎核 | 4 |
| mon3tr | 4 |
| remix | 4 |
| 小游戏 | 4 |
| cp向 | 4 |
| 爆率 | 4 |
| 猫娘 | 4 |
| 试跳 | 4 |
| 小鬼 | 4 |
| 地球 | 4 |
| 鬼方佳代子cos | 4 |
| 最终章 | 4 |
| 电台新星征集令 | 4 |
| 秦始皇 | 4 |
| Girls Band Cry | 4 |
| 解谜 | 4 |
| 精神 | 4 |
| 初中 | 4 |
| 桃井爱莉 | 4 |
| 女鼓手 | 4 |
| 橘望 | 4 |
| 3d | 4 |
| ai动画 | 4 |
| 栀子梦 | 4 |
| 绝区零 2.0版本UP主激励计划 | 4 |
| 周边 | 4 |
| 大学 | 4 |
| ビビデバ | 4 |
| 逐帧动画 | 4 |
| 音游曲 | 4 |
| 波鲁纳雷夫 | 4 |
| 九鸟 | 4 |
| 宇泽玲纱 | 4 |
| 原神UP主激励计划 | 4 |
| 巴别塔 | 4 |
| 绝区零 | 4 |
| 蓝色恶魔 | 4 |
| 自制动画 | 4 |
| 催眠术 | 4 |
| 枪械 | 4 |
| 兔子洞 | 4 |
| 彩蛋 | 4 |
| BILIBILI美食研究所2.0-缤纷欢聚会 | 4 |
| 周年庆 | 4 |
| 三妈式 | 4 |
| 25時 | 4 |
| 东海帝皇 | 4 |
| 程序 | 4 |
| 新年快乐 | 4 |
| 转转 | 4 |
| バカみたいに | 4 |
| 野宫 | 4 |
| 白毛 | 4 |
| donk | 4 |
| vrc | 4 |
| 建模 | 4 |
| 夏天 | 4 |
| 妄想感傷代償連盟 | 4 |
| 下江コハル | 4 |
| FOX | 4 |
| 替身使者 | 4 |
| 圆形监狱 | 4 |
| Panopticon | 4 |
| 动画MV | 4 |
| 小豆泽心羽 | 4 |
| 清唱 | 4 |
| 铃美 | 4 |
| 才羽桃 | 4 |
| 世界计划pjsk | 4 |
| 感动 | 4 |
| 叉葱 | 4 |
| ずっと真夜中でいいのに。 | 4 |
| 花京院典明 | 4 |
| 睦月 | 4 |
| 建筑 | 4 |
| 贝司 | 4 |
| 雪乃 | 4 |
| 自设 | 4 |
| 斯卡蒂 | 4 |
| 三角洲S5新赛季3x3速通攻略 | 4 |
| 恋爱循环 | 4 |
| 游戏测评 | 4 |
| 冷知识 | 4 |
| 足立零 | 4 |
| vlog | 4 |
| Pjsk | 4 |
| ps | 4 |
| 谁家小猫这么可爱 | 4 |
| 小猫 | 4 |
| 评测 | 4 |
| 体验 | 4 |
| Biliboard | 4 |
| 天禄 | 4 |
| 怀旧 | 4 |
| CP | 4 |
| 崩铁 | 4 |
| 魔法少女 | 4 |
| 樱桃汽水 | 4 |
| 遥实 | 4 |
| 翻唱的N种打开方式暑期季 | 4 |
| Notanote | 4 |
| Synthet | 4 |
| ansy | 4 |
| 装机 | 4 |
| fate | 4 |
| いよわ | 4 |
| pv | 4 |
| 设计 | 4 |
| 共鸣 | 4 |
| 25時、ナイトコードで。 | 4 |
| 周榜 | 4 |
| 虚拟up主 | 4 |
| 三角洲主播巅峰赛 | 4 |
| VRchat | 4 |
| 鏡音リン | 4 |
| 生日快乐 | 4 |
| 声控 | 4 |
| 菜鸡 | 4 |
| 伊吕波 | 4 |
| Pigeon Games | 4 |
| 粑粑流无名 | 4 |
| 助眠 | 4 |
| 米津玄师 | 4 |
| 当时髦精闯进痛圈 | 4 |
| 歌爱雪 | 4 |
| 新皮肤 | 4 |
| 双菜 | 4 |
| 谱面 | 4 |
| 竞技游戏 | 4 |
| 幸运星 | 4 |
| 两句话剧场 | 4 |
| 羽毛笔 | 4 |
| 非洲之心 | 4 |
| 羽衣 | 4 |
| C语言 | 4 |
| 米塔 | 4 |
| 三角洲行动欢乐剧场 | 4 |
| 使命召唤 | 4 |
| 砂狼黑子 | 4 |
| 486 | 4 |
| 爆料 | 4 |
| 糖果曲奇巧克力 | 4 |
| 唐人 | 4 |
| 声音 | 4 |
| 拟人 | 4 |
| mel直拍 | 4 |
| 画师 | 4 |
| 结算画面 | 4 |
| Leo/need | 4 |
| 俄罗斯方块 | 4 |
| 不存在的你和我 | 4 |
| 灵梦 | 4 |
| CF手游铠甲勇士联动 | 4 |
| 坏苹果 | 4 |
| 老飞宇66 | 4 |
| F1 | 4 |
| 考研 | 4 |
| funk | 4 |
| mfkn | 4 |
| 中文配音 | 4 |
| 虚拟UP主日常和虚拟主播切片 | 4 |
| 剧情向 | 4 |
| Milthm | 4 |
| 梦见霖音 | 4 |
| 崩坏：星穹铁道 | 4 |
| IRIS OUT | 4 |
| 三角洲新手教学 | 4 |
| 春嵐 | 4 |
| john | 4 |
| 鹫见芹娜 | 4 |
| ういこうせん | 4 |
| 杂鱼酱 | 4 |
| 终末地公测 | 4 |
| 菲比 | 4 |
| ick | 4 |
| 青春 | 4 |
| 妃咲 | 4 |
| 毛主席 | 3 |
| tyros | 3 |
| 艺术家 | 3 |
| 德克萨斯 | 3 |
| 萝尔露 | 3 |
| 圣诞节 | 3 |
| 重音テ卜 | 3 |
| 暗区S12冲刺一夏 | 3 |
| 誓见 | 3 |
| 黑客 | 3 |
| 速凌电竞 | 3 |
| 旋转音律 | 3 |
| steam | 3 |
| 一起做手工吧！ | 3 |
| 模型 | 3 |
| 感觉 | 3 |
| 壁纸推荐 | 3 |
| 屁股肉 | 3 |
| 声优 | 3 |
| mopemope | 3 |
| 起床战争 | 3 |
| 动漫杂谈 | 3 |
| 英雄联盟 | 3 |
| mmk | 3 |
| ハローセカイ | 3 |
| 临摹 | 3 |
| 洗脑 | 3 |
| 神のまにまに | 3 |
| ［GBC］哭泣少女乐队二创 | 3 |
| 日鞠 | 3 |
| 小雪 | 3 |
| 无畏契约二创挑战 | 3 |
| DECO27 | 3 |
| Meme | 3 |
| VUP | 3 |
| 葱钻 | 3 |
| 大概 | 3 |
| たぶん | 3 |
| 翻译 | 3 |
| 2026 | 3 |
| 编曲教程 | 3 |
| 龙华妃咲 | 3 |
| 假面骑士 | 3 |
| 温馨 | 3 |
| 战斗潮流 | 3 |
| 时间 | 3 |
| 三角洲行动攻略 | 3 |
| 贝斯教学 | 3 |
| 强度 | 3 |
| riff | 3 |
| 歪果仁 | 3 |
| FGO | 3 |
| fgo | 3 |
| 赛车 | 3 |
| mika | 3 |
| vocaloid原创曲 | 3 |
| tab | 3 |
| Vtuber | 3 |
| 脑洞 | 3 |
| 三角洲游戏新赛季实况！ | 3 |
| AWM | 3 |
| 新版本 | 3 |
| プロセカMMD | 3 |
| Nina | 3 |
| 好听 | 3 |
| 山茶花 | 3 |
| 一人分饰多角 | 3 |
| 学校 | 3 |
| Monitoring | 3 |
| 超燃 | 3 |
| REMIX | 3 |
| 梓 | 3 |
| 吉本おじさん | 3 |
| 巴克什 | 3 |
| クチナシの木が朽ちる前に | 3 |
| 一花 | 3 |
| l2d | 3 |
| 国服 | 3 |
| 意义不明 | 3 |
| 柚子厨 | 3 |
| 男生 | 3 |
| 天气预报 | 3 |
| 东方Project | 3 |
| 毕业季 | 3 |
| 大东北是我的家乡 | 3 |
| 神曲 | 3 |
| 人マニア | 3 |
| 柯伊 | 3 |
| 突破次元壁！ | 3 |
| 女装 | 3 |
| 乔瑟夫乔斯达 | 3 |
| 伊洛玛丽 | 3 |
| 开心 | 3 |
| 阿尔图罗 | 3 |
| 主播巅峰赛 | 3 |
| 王者荣耀 | 3 |
| 二乔 | 3 |
| 乔斯达 | 3 |
| MIDI | 3 |
| 游戏开发 | 3 |
| 八音盒 | 3 |
| 瑞希 | 3 |
| 初音miku | 3 |
| 深夜食堂 | 3 |
| 服饰 | 3 |
| 图集 | 3 |
| 航空 | 3 |
| 少女前线 | 3 |
| 浦和花子 | 3 |
| ysm | 3 |
| Java | 3 |
| 刀马刀马刀马 | 3 |
| 3D动画月更挑战 | 3 |
| steam游戏 | 3 |
| Vrchat | 3 |
| 椎名もた | 3 |
| 这就是混剪 | 3 |
| 玩游戏上OurPlay加速器 | 3 |
| love | 3 |
| 转角遇到春天 | 3 |
| 英语学习 | 3 |
| 恐怖游戏 | 3 |
| WOTA艺 | 3 |
| bw2025 | 3 |
| 魔王 | 3 |
| 鬼畜调教 | 3 |
| Channel | 3 |
| Vsinger创作激励计划2025夏日赛 | 3 |
| 大黑塔 | 3 |
| 一起来打三角洲 | 3 |
| 【三角洲行动】一起来打三角洲 | 3 |
| ARCAEA | 3 |
| 作文 | 3 |
| 健康 | 3 |
| 图标 | 3 |
| 孤独摇滚！ | 3 |
| 配音小剧场 | 3 |
| 模拟恐怖 | 3 |
| 伪人 | 3 |
| 游戏主播 | 3 |
| 花里实乃理 | 3 |
| Eku | 3 |
| エク | 3 |
| 蕾缪安 | 3 |
| 帅哥 | 3 |
| 杨齐家扶贫王 | 3 |
| 游戏王 | 3 |
| 分享游戏故事 | 3 |
| 索尼原创音浪季 | 3 |
| 刘蟹水 | 3 |
| 现状 | 3 |
| SEGA | 3 |
| 小绿 | 3 |
| 迪奥 | 3 |
| 准备出发 | 3 |
| 普奇神父 | 3 |
| VRCHAT | 3 |
| 难绷 | 3 |
| 长弓溪谷 | 3 |
| 小气走 | 3 |
| 像神一样呐 | 3 |
| 神っぽいな | 3 |
| 德穆兰 | 3 |
| 万万没想到 | 3 |
| 真实还原 | 3 |
| 大人的责任 | 3 |
| 这一块 | 3 |
| 十一不咕咕 | 3 |
| 绫地宁宁 | 3 |
| 姐妹 | 3 |
| 绝区零 2.1版本UP主激励计划 | 3 |
| acg音乐 | 3 |
| 艾希 | 3 |
| 记忆大厅 | 3 |
| 波鲁那雷夫 | 3 |
| 星尘斗士 | 3 |
| Ayase | 3 |
| 年度动画巡礼 | 3 |
| deepseek | 3 |
| 幻想 | 3 |
| 黑帮摇 | 3 |
| 穿越 | 3 |
| 红牛 | 3 |
| 维斯塔潘 | 3 |
| 动作 | 3 |
| 明日方舟联动皮肤上线 | 3 |
| 皇帝 | 3 |
| Synthesizer V | 3 |
| 枫香 | 3 |
| 虚荣屠夫 | 3 |
| 毕业 | 3 |
| r-906 | 3 |
| 治愈向 | 3 |
| 花里实乃里 | 3 |
| 焦作 | 3 |
| 伊吹 | 3 |
| 字幕 | 3 |
| 三角洲搞笑 | 3 |
| 电锯人 | 3 |
| 银狼 | 3 |
| 校门口小吃 | 3 |
| 路边摊 | 3 |
| 纱世里 | 3 |
| bw | 3 |
| 日野森雫 | 3 |
| 治愈系 | 3 |
| 黑子 | 3 |
| AzureArchive | 3 |
| 谱子 | 3 |
| 米库 | 3 |
| 乐子 | 3 |
| 泉奈 | 3 |
| 黑 | 3 |
| fes | 3 |
| Koharu Shimoe | 3 |
| 动画电影 | 3 |
| 剥蒜的情谊 | 3 |
| Fan-Made | 3 |
| Unofficial | 3 |
| 高铁 | 3 |
| 科幻 | 3 |
| 人类 | 3 |
| 中考 | 3 |
| 哭泣乐队少女 | 3 |
| 0721 | 3 |
| 残局 | 3 |
| 转转回收 | 3 |
| 中国铁路 | 3 |
| 玲纱 | 3 |
| P站 | 3 |
| 三角洲行动×明日方舟联动皮肤上线 | 3 |
| 恶搞 | 3 |
| 国宴 | 3 |
| Bass | 3 |
| 音游游戏日常！ | 3 |
| 一勺料汁 | 3 |
| 渴望就可能 | 3 |
| 我的BW2025 | 3 |
| 鹫见芹奈 | 3 |
| 夜宵 | 3 |
| FES | 3 |
| 综合 | 3 |
| 预告 | 3 |
| 大学生就业指南-美食版2.0 | 3 |
| 邦多利 | 3 |
| 异环 | 3 |
| 歌单 | 3 |
| kipfel | 3 |
| 鸡你太美 | 3 |
| 蔚蓝档案动画 | 3 |
| 大佬 | 3 |
| 悲伤 | 3 |
| 怀念 | 3 |
| 贝斯新手 | 3 |
| 蒸汽波 | 3 |
| 冰与火之舞 | 3 |
| 里表情人 | 3 |
| 魔法少女的魔法审判 | 3 |
| 纽带乐队 | 3 |
| 青柳冬弥 | 3 |
| 多多理财 | 3 |
| 悬疑 | 3 |
| 鬼畜剧场 | 3 |
| ai生成 | 3 |
| mmj葱 | 3 |
| 原创搞笑剧情 | 3 |
| 反转 | 3 |
| 久住 | 3 |
| 唱歌 | 3 |
| 穿越火线 | 3 |
| 特摄 | 3 |
| 爸爸 | 3 |
| 二战 | 3 |
| 纯爱 | 3 |
| ノンブレス・オブリージュ | 3 |
| 哈基蜂 | 3 |
| 清澄晶 | 3 |
| 木偶动画 | 3 |
| 战斗 | 3 |
| APEX英雄 | 3 |
| 凉 | 3 |
| 废话文学 | 3 |
| 节奏 | 3 |
| 泰拉瑞亚 | 3 |
| 东云姐弟 | 3 |
| 高中物理 | 3 |
| bilibili期末季 | 3 |
| 兔子小队 | 3 |
| 改枪教学 | 3 |
| 熙熙攘攘 | 3 |
| 怀疑 | 3 |
| 橘光 | 3 |
| 五杀 | 3 |
| 气象感应 | 3 |
| 玩家 | 3 |
| B站超高清视频计划 | 3 |
| 病娇 | 3 |
| 新约能天使 | 3 |
| 集锦 | 3 |
| 知识 | 3 |
| 直播回放 | 3 |
| 大叔 | 3 |
| 唐 | 3 |
| 女贝斯手 | 3 |
| SLAP | 3 |
| 呐呐呐 | 3 |
| 小仙女 | 3 |
| 怪物之歌 | 3 |
| 孤独摇滚！！ | 3 |
| 黄绿合战10th-黄队应援 | 3 |
| 逆转裁判 | 3 |
| 生塩ノア | 3 |
| 鸣潮二创 | 3 |
| 显卡 | 3 |
| 机密航天 | 3 |
| ブルアカ | 3 |
| 千本樱 | 3 |
| 过程 | 3 |
| 爱音 | 3 |
| 三角洲行动操作记录 | 3 |
| 版本更新 | 3 |
| 指弹 | 3 |
| 双子星 | 3 |
| amv | 3 |
| 传说之下 | 3 |
| ut | 3 |
| 心理学 | 3 |
| 傲娇 | 3 |
| YTPMV | 3 |
| 大红 | 3 |
| 凤笑梦 | 3 |
| 战地风云 | 3 |
| 致歉一切 | 3 |
| 三角洲行动联动明日方舟 | 3 |
| 白石杏 | 3 |
| 月亮 | 3 |
| 羊腿umer | 3 |
| 超燃剪辑 | 3 |
| ハート111 | 3 |
| 霞沢美游 | 3 |
| AI音乐征集大赛·2025第三期 | 3 |
| 枪声 | 3 |
| fufu | 3 |
| 意义 | 3 |
| 数据结构 | 3 |
| ICPC | 3 |
| OOC | 3 |
| 25点，Nightcord见。 | 3 |
| 4k | 3 |
| 逐帧MEME | 3 |
| 先生 | 3 |
| 大学毕业生 | 3 |
| 逗比 | 3 |
| 绘名 | 3 |
| 音乐制作 | 3 |
| 博丽灵梦 | 3 |
| enmz | 3 |
| 猫对立 | 3 |
| 重口 | 3 |
| SOLO | 3 |
| 俄罗斯 | 3 |
| Hardcore | 3 |
| 杰驰电竞 | 3 |
| BUG | 3 |
| minecraft | 3 |
| 解压 | 3 |
| 伊蕾娜 | 3 |
| 微软 | 3 |
| 喵梦 | 3 |
| 原口沙辅 | 3 |
| 史 | 3 |
| emoji | 3 |
| 邮箱 | 3 |
| UNDEAD | 3 |
| 晴 | 3 |
| Kasane Teto | 3 |
| 甜文 | 3 |
| 田园猫 | 3 |
| 伊织 | 3 |
| bilibili次元论战 | 3 |
| 剧场版世界计划 | 3 |
| 猫meme小剧场 | 3 |
| 手元 | 3 |
| 不为人知的鹅妈妈童谣 | 3 |
| 中文VOCALOID | 3 |
| 游戏耳机 | 3 |
| 阿里乌斯战术小队 | 3 |
| 尤诺 | 3 |
| 航天 | 3 |
| 渲染 | 3 |
| 切片 | 3 |
| 三角洲抢砖大战 | 3 |
| 天童 爱丽丝 | 3 |
| 女孩子 | 3 |
| 锭前纱织 | 3 |
| 新干员 | 2 |
| BOSS | 2 |
| 你的冥字 | 2 |
| 深渊 | 2 |
| 真东 | 2 |
| 友情 | 2 |
| 情感共鸣 | 2 |
| 猫咪 | 2 |
| 情话套路 | 2 |
| 猫meme已经nextlevel了 | 2 |
| 爱人 | 2 |
| 双狼 | 2 |
| 拉普兰德 | 2 |
| 东雪莲 | 2 |
| 月亮计划 | 2 |
| 微笑调查队 | 2 |
| 2022虚拟歌手创作赛 | 2 |
| Chinozo | 2 |
| 削弱 | 2 |
| VOCALOIDCHINA | 2 |
| 黑色本子 | 2 |
| 数学考试 | 2 |
| 现代艺术 | 2 |
| projectsekai | 2 |
| nanobanana pro | 2 |
| Labnana | 2 |
| 三角洲改枪 | 2 |
| 颜值 | 2 |
| 勾史 | 2 |
| 祐天寺若麦 | 2 |
| 玄学 | 2 |
| 超主人公 | 2 |
| 请输入文字 | 2 |
| かいりきベア | 2 |
| 眼睛 | 2 |
| タカオカミズキ | 2 |
| 反乌托邦 | 2 |
| 音乐4K计划 | 2 |
| 所以我放弃了音乐 | 2 |
| 孙政 | 2 |
| 插曲 | 2 |
| NCOP | 2 |
| 烹饪 | 2 |
| 反恐精英 | 2 |
| 动画MEME | 2 |
| 动物园 | 2 |
| 游玩 | 2 |
| 刻俄柏 | 2 |
| 三角洲联动 | 2 |
| 张姐 | 2 |
| 经济 | 2 |
| 露米娅 | 2 |
| 河原木桃香 | 2 |
| 马克笔 | 2 |
| PHIGROS | 2 |
| 画面 | 2 |
| 老外 | 2 |
| 垃圾 | 2 |
| 老太 | 2 |
| 网站 | 2 |
| 色彩 | 2 |
| 氛围 | 2 |
| 美工 | 2 |
| 无畏契约战术大师 | 2 |
| 奏 | 2 |
| 崩坏 | 2 |
| UP主 | 2 |
| 22娘 | 2 |
| 33娘 | 2 |
| 猫猫挥爪 | 2 |
| 布吉岛 | 2 |
| 必修二 | 2 |
| はじまりの曲 | 2 |
| 节奏感 | 2 |
| 闪耀优俊少女 | 2 |
| 三角洲行动新手教程 | 2 |
| 259 | 2 |
| 柚子柠檬茶 | 2 |
| 青梅竹马 | 2 |
| 39 | 2 |
| 中日字幕 | 2 |
| 宝藏知识UP跃迁计划 | 2 |
| 旮旯给木 | 2 |
| zywoo | 2 |
| 系统 | 2 |
| Windows | 2 |
| 三角洲行动新手教学 | 2 |
| 舞蹈翻跳 | 2 |
| 枪声音乐 | 2 |
| 救赎 | 2 |
| 日野森志步 | 2 |
| 初音未来世界计划 | 2 |
| 韵律源点Arcaea | 2 |
| 凛 | 2 |
| 烂梗 | 2 |
| 音游研究所 | 2 |
| 自制游戏 | 2 |
| 盾牌 | 2 |
| 拼凑的断音 | 2 |
| emo | 2 |
| 曼德拉记录 | 2 |
| PJSK一起创作吧 | 2 |
| 随神之侧 | 2 |
| soyo | 2 |
| 变身 | 2 |
| 视角 | 2 |
| 黑色天使 | 2 |
| 概率 | 2 |
| 刀 | 2 |
| 危机合约 | 2 |
| meme手书 | 2 |
| X | 2 |
| 牧羊人 | 2 |
| 术力口（ ボカロ） | 2 |
| 财经 | 2 |
| 灵魂 | 2 |
| 绝密 | 2 |
| 英语 | 2 |
| 街舞 | 2 |
| 礼奈 | 2 |
| 猫爪 | 2 |
| 影色舞 | 2 |
| 必修一 | 2 |
| 三角函数 | 2 |
| BanGDream | 2 |
| 瓦学院的进修日常2.0 | 2 |
| 洗面奶 | 2 |
| TAB | 2 |
| 世界多彩计划 | 2 |
| 空调 | 2 |
| bule archive | 2 |
| 像素 | 2 |
| 科学 | 2 |
| 生活现状 | 2 |
| 死宅 | 2 |
| BADAPPLE | 2 |
| 木柜子 | 2 |
| 稿件展示 | 2 |
| 命に嫌われている。 | 2 |
| 桐高 | 2 |
| 净罪作战 | 2 |
| wota艺 | 2 |
| ねぇねぇねぇ | 2 |
| EBIMAYO | 2 |
| 动态合集 | 2 |
| 自用 | 2 |
| だから僕は音楽を辞めた | 2 |
| 速通 | 2 |
| shino | 2 |
| 瞬狙 | 2 |
| 二次元鬼畜 | 2 |
| 平泽唯 | 2 |
| 打卡挑战 | 2 |
| 弭儿 | 2 |
| 公益 | 2 |
| 英文 | 2 |
| 2025穿越火线嘉年华 | 2 |
| #CF嘉年华狂欢季 | 2 |
| 手书动画 | 2 |
| 鼠鼠玩家 | 2 |
| 直升机 | 2 |
| 初音mmd | 2 |
| CSGO开箱 | 2 |
| 车万 | 2 |
| 术立口 | 2 |
| 网络安全 | 2 |
| 机密大坝 | 2 |
| 素世 | 2 |
| 卡拉彼丘 | 2 |
| 超大杯 | 2 |
| 司霆惊蛰 | 2 |
| 露帕 | 2 |
| 鸣潮露帕 | 2 |
| mikuexpo 香港 | 2 |
| 曼德尔砖 | 2 |
| 萌豚 | 2 |
| 数码 | 2 |
| 新人向 | 2 |
| 小说 | 2 |
| 画画画画画 | 2 |
| 土豆 | 2 |
| 花冈柚子 | 2 |
| 诗朗诵 | 2 |
| 八岐大蛇 | 2 |
| 年度直拍大赏 | 2 |
| 望月穗波 | 2 |
| 转载 | 2 |
| 硬核 | 2 |
| 热门 | 2 |
| 三角洲明日方舟联动皮肤公开 | 2 |
| 吃货 | 2 |
| 破壁 | 2 |
| 寻找100个宝藏vlogger | 2 |
| tyloo | 2 |
| 夏活 | 2 |
| 黄金体验镇魂曲 | 2 |
| 立刻轮回 | 2 |
| 完整版 | 2 |
| natori | 2 |
| 汽车 | 2 |
| BW整活艺术大赏 | 2 |
| 黑服 | 2 |
| 天堂制造 | 2 |
| 拼好歌 | 2 |
| 互动 | 2 |
| 神 | 2 |
| 王不见王 | 2 |
| mikuexpo | 2 |
| 音击 | 2 |
| 吉鸠 | 2 |
| 战舰世界 | 2 |
| 自然 | 2 |
| 喜欢 | 2 |
| 校园生活 | 2 |
| 绿 | 2 |
| fumo | 2 |
| UP 小剧场 2.0 | 2 |
| 一起来画画吧！ | 2 |
| fender | 2 |
| 外星人 | 2 |
| 人民 | 2 |
| 强风大背头 | 2 |
| 强风 | 2 |
| MORE MORE JUMP | 2 |
| 模组 | 2 |
| 雷斯 | 2 |
| DNA | 2 |
| 哔哩哔哩创作星引力 | 2 |
| 大东北我的家乡 | 2 |
| 你肯定听过TA的歌 | 2 |
| phira | 2 |
| 文学 | 2 |
| 优质战士 | 2 |
| 玩机器machine | 2 |
| 合唱 | 2 |
| 碧蓝 | 2 |
| 在整一种很新的活 | 2 |
| 背景 | 2 |
| am | 2 |
| 猫葱 | 2 |
| vbs葱 | 2 |
| 教室葱 | 2 |
| Vidu | 2 |
| 东北雨姐 | 2 |
| 三角洲超雄老太 | 2 |
| 画师激励计划第三期 | 2 |
| summertime | 2 |
| 音楽 | 2 |
| 情绪 | 2 |
| 初音未来的消失 | 2 |
| 匹诺曹P | 2 |
| 娃哈哈 | 2 |
| Phira | 2 |
| cos play | 2 |
| 队友 | 2 |
| 114514 | 2 |
| 蹲方魂 | 2 |
| 名草 | 2 |
| 闲鱼陪我毕业 | 2 |
| 探店 | 2 |
| 维吉尔 | 2 |
| Azusa | 2 |
| 颜文字 | 2 |
| 评论 | 2 |
| 一周目 | 2 |
| ai翻唱 | 2 |
| 冬夏玛德法克 | 2 |
| 春原心奈 | 2 |
| 死別 | 2 |
| 日语歌曲 | 2 |
| 初音MMD | 2 |
| 宵夜 | 2 |
| 外卖 | 2 |
| 下饭操作 | 2 |
| 厨艺 | 2 |
| 非酋 | 2 |
| 舞萌DX2025 | 2 |
| 朋友骂我神经病 | 2 |
| 柚鳥夏 | 2 |
| 揽佬 | 2 |
| BanG Dream！ | 2 |
| 天空 | 2 |
| Remix | 2 |
| 水大叔 | 2 |
| 乐谱 | 2 |
| 电贝斯 | 2 |
| 沉默微笑 | 2 |
| nevergonnagiveyouup | 2 |
| 黍 | 2 |
| 生存 | 2 |
| 三角洲S5 | 2 |
| 魔兽世界 | 2 |
| ナブナ | 2 |
| 赤石 | 2 |
| 飙马野郎 | 2 |
| 崩坏三 | 2 |
| Ai绘画 | 2 |
| 朝比奈 真冬 | 2 |
| 国窖 | 2 |
| 聊天 | 2 |
| 战术 | 2 |
| じん | 2 |
| kemu | 2 |
| 我的世界光影 | 2 |
| mc不灭 | 2 |
| 蓝色 | 2 |
| billboard | 2 |
| 音乐榜单资讯 | 2 |
| AI绘图 | 2 |
| 小狐狸 | 2 |
| 久田泉奈 | 2 |
| 动态木偶 | 2 |
| 同人二创 | 2 |
| 奕夕 | 2 |
| 鳳えむ誕生祭2025 | 2 |
| 红石 | 2 |
| 生电 | 2 |
| 大坝 | 2 |
| moremorejump | 2 |
| 上海 | 2 |
| 歌姬 | 2 |
| 原神5.7UP主激励计划 | 2 |
| 若藻 | 2 |
| Vup | 2 |
| 实装 | 2 |
| 日服 | 2 |
| 5周年 | 2 |
| SDVX | 2 |
| CoCo都可 | 2 |
| 后朋克 | 2 |
| Alight Motion | 2 |
| 咬住秒针 | 2 |
| kafu | 2 |
| 世界计划4周年，一同奏响心愿之歌！ | 2 |
| 动图 | 2 |
| 三角洲手游 | 2 |
| JOJOの奇妙冒险 | 2 |
| 妈妈 | 2 |
| 电弧 | 2 |
| 英国 | 2 |
| Furry | 2 |
| 街机音游 | 2 |
| 家具 | 2 |
| 约稿 | 2 |
| mmj | 2 |
| Unknown Mother-Goose | 2 |
| 鹅妈妈 | 2 |
| fox | 2 |
| 逃离塔科夫 | 2 |
| 千禧年 | 2 |
| 鏡音レン | 2 |
| srt | 2 |
| 数学竞赛 | 2 |
| 性能 | 2 |
| gpt | 2 |
| 火山旅梦 | 2 |
| 游戏制作 | 2 |
| 偷摸零 | 2 |
| MMD.3D | 2 |
| 花来 | 2 |
| 旅游 | 2 |
| 解限机 | 2 |
| 饰品 | 2 |
| Miss.Christine | 2 |
| Mujica | 2 |
| VALORANT | 2 |
| 韩国 | 2 |
| 手法 | 2 |
| 哔须有此行 | 2 |
| 旅行攻略UP主激励计划 | 2 |
| 時雨羽衣 | 2 |
| 烂泥 | 2 |
| 二次元副本大作战3.0 | 2 |
| 童年回忆 | 2 |
| 问题 | 2 |
| 汪大吼 | 2 |
| 华为 | 2 |
| 天狼星 | 2 |
| fps忍界大战 | 2 |
| 互关互赞版 | 2 |
| 少女A | 2 |
| 杨齐家拯救大兵计划 | 2 |
| 三角洲S7新赛季前瞻爆料 | 2 |
| dj | 2 |
| 千年 | 2 |
| 牢梦 | 2 |
| 战无不胜 | 2 |
| 人力vocaloid | 2 |
| 章鱼噼的原罪 | 2 |
| 温暖 | 2 |
| 眼见帧实·B站超高清视频计划 | 2 |
| 奥空绫音 | 2 |
| 十六夜野宫 | 2 |
| MORE MORE JUMP！ | 2 |
| Hi-Res无损 | 2 |
| w | 2 |
| DANK1NG | 2 |
| TYLOO | 2 |
| Jee | 2 |
| 动画CM | 2 |
| NVIDIA | 2 |
| I can't wait手书 | 2 |
| Montagem Miau | 2 |
| 后室 | 2 |
| fl studio | 2 |
| AIPC | 2 |
| 三角符文 | 2 |
| PJSK我的世界 | 2 |
| 空井咲 | 2 |
| 模板 | 2 |
| 阿姨压一压 | 2 |
| 热异常 | 2 |
| hitech | 2 |
| 竖屏 | 2 |
| 太阳 | 2 |
| 音乐现场 | 2 |
| 必剪 | 2 |
| 阿萨拉 | 2 |
| 装备 | 2 |
| 伊知地虹夏 | 2 |
| AA | 2 |
| 你好世界 | 2 |
| 坤坤 | 2 |
| PMT | 2 |
| 40mP | 2 |
| 歌姬计划 | 2 |
| 跳舞 | 2 |
| magens | 2 |
| 初根美久 | 2 |
| 动态漫画 | 2 |
| 人民警察 | 2 |
| 安澜三角洲 | 2 |
| 哈基米音乐 | 2 |
| 无CP向 | 2 |
| 加时赛 | 2 |
| 攀升 | 2 |
| pov | 2 |
| 25时ナイトコードで | 2 |
| 社会切片计划 | 2 |
| 音乐教学 | 2 |
| asmr | 2 |
| 触发音 | 2 |
| 25时，Nightcord见 | 2 |
| 思维 | 2 |
| 神作 | 2 |
| Ika式 | 2 |
| qiqi | 2 |
| まふまふ | 2 |
| 打工人 | 2 |
| 职业 | 2 |
| 哔哩哔哩2025毕业歌 | 2 |
| Phonk | 2 |
| 珠颈斑鸠 | 2 |
| 熙熙攘攘我们的城市 | 2 |
| 白尾绘里 | 2 |
| 天雨亚子 | 2 |
| 美国精神病人 | 2 |
| M250 | 2 |
| 人狂热症 | 2 |
| rupa | 2 |
| 和平精英 | 2 |
| 无名斧头帮 | 2 |
| 抑郁症 | 2 |
| 黄金精神 | 2 |
| 同人游戏 | 2 |
| 蔚蓝档案同人 | 2 |
| 圈子 | 2 |
| 电台新星征集令7.0 | 2 |
| 民间 | 2 |
| Phigros Match | 2 |
| pjsk每日分享 | 2 |
| 超かぐや姫！ | 2 |
| BichonFrise | 2 |
| Silentroom | 2 |
| JOJO的奇妙冒险黄金之风 | 2 |
| 老板 | 2 |
| 高司令 | 2 |
| 腐于权势 | 2 |
| 大师 | 2 |
| 火箭燃料 | 2 |
| cos试衣 | 2 |
| 大学生 | 2 |
| subaru | 2 |
| ワールドイズマイン | 2 |
| 放假的第一把三角洲 | 2 |
| 三角洲阿萨拉召集令 | 2 |
| 一支舞告别2025 | 2 |
| 布料 | 2 |
| 25時、ナイトコードで | 2 |
| JK制服 | 2 |
| 目击！Teto31世手书 | 2 |
| 胆大党 | 2 |
| PLA | 2 |
| 干员 | 2 |
| 经典电影 | 2 |
| 芹娜 | 2 |
| 存在主义 | 2 |
| 战地不一样 | 2 |
| 明日方舟联动 | 2 |
| 休闲 | 2 |
| miside | 2 |
| 2025哔哩哔哩毕业歌 | 2 |
| 音乐分享官第十一期 | 2 |
| FUN!! | 2 |
| OST | 2 |
| 高考数学 | 2 |
| kawaii | 2 |
| KARDS海战 | 2 |
| 风纪委员会 | 2 |
| 雑魚 | 2 |
| 英雄联盟手游激励计划 | 2 |
| 好孩子 | 2 |
| 手书描改 | 2 |
| 空战 | 2 |
| 战斗机 | 2 |
| 战地6 | 2 |
| 大病区 | 2 |
| 阅兵 | 2 |
| 梦 | 2 |
| 爱露 | 2 |
| 水圣娅 | 2 |
| 糖 | 2 |
| 电影世界计划初音未来终极预告 | 2 |
| 三角洲行动代肝 | 2 |
| 三角洲行动护航 | 2 |
| 三角洲行动新赛季 | 2 |
| Bad Apple!! | 2 |
| 命运-冠位指定创作者激励计划 | 2 |
| 迦勒底创作高能团 | 2 |
| APEX | 2 |
| 神还原仿妆大会 | 2 |
| 礼物 | 2 |
| 流萤 | 2 |
| 抑郁 | 2 |
| 可视化 | 2 |
| 神经 | 2 |
| 小勾晴 | 2 |
| 幽灵 | 2 |
| 现代战争2 | 2 |
| 游戏配音 | 2 |
| 使命召唤剧情 | 2 |
| 效果 | 2 |
| iOS26 | 2 |
| 运动会 | 2 |
| 残機 | 2 |
| 还原 | 2 |
| 国际服 | 2 |
| 便利屋68 | 2 |
| 手写 | 2 |
| 电影世界计划初音未来定档 | 2 |
| bug | 2 |
| 变形金刚 | 2 |
| transformers | 2 |
| 合成器 | 2 |
| 女生 | 2 |
| VS | 2 |
| 宅舞翻跳 | 2 |
| more jump more | 2 |
| 命运 - 冠位指定创作者激励计划 第三期 | 2 |
| 柚子 | 2 |
| 意识流 | 2 |
| 音乐4K计划3.0 | 2 |
| 文字pv | 2 |
| 纪念 | 2 |
| 鹅花 | 2 |
| 精英干员 | 2 |
| 丛雨 | 2 |
| 非洲之星 | 2 |
| 森零 | 2 |
| 瓦哩新星团 | 2 |
| emu | 2 |
| 同人转载 | 2 |
| 温柔 | 2 |
| 解放军 | 2 |
| 机械 | 2 |
| 外骨骼 | 2 |
| CS皮肤交易平台 | 2 |
| Bule Archive | 2 |
| 原曲不使用 | 2 |
| Voisona | 2 |
| 雨衣 | 2 |
| 天气 | 2 |
| ryo (supercell) | 2 |
| 印象曲 | 2 |
| 三角洲行动露娜教学 | 2 |
| 岸边露伴 | 2 |
| 一辈子 | 2 |
| 三角洲鼠鼠 | 2 |
| 雪月宫子 | 2 |
| 白金之星 | 2 |
| 看板娘 | 2 |
| 替身 | 2 |
| 视觉小说 | 2 |
| nikke | 2 |
| 娱乐吃瓜大会10.0 | 2 |
| JOJO飙马野郎 | 2 |
| 音乐推荐 | 2 |
| 地狱 | 2 |
| jojo立 | 2 |
| 烤森 | 2 |
| 生贺 | 2 |
| 鸡 | 2 |
| 同人漫画 | 2 |
| かめりあ | 2 |
| Camellia | 2 |
| house | 2 |
| 游戏玩家 | 2 |
| 又三郎 | 2 |
| 2025高考季 | 2 |
| 录取通知书 | 2 |
| 假期 | 2 |
| M7 | 2 |
| 娘化 | 2 |
| 运镜 | 2 |
| 委托展示 | 2 |
| 版本 | 2 |
| 电棍otto | 2 |
| 老物 | 2 |
| 偷跑 | 2 |
| 雀斑 | 2 |
| 夫人 | 2 |
| 肉鸽 | 2 |
| 技能演示 | 2 |
| 技能 | 2 |
| 雑踏、僕らの街 | 2 |
| 玉足 | 2 |
| 苹果 | 2 |
| VR | 2 |
| 广州 | 2 |
| 老东西 | 2 |
| 五周年 | 2 |
| 五维介质 | 2 |
| 动态谱 | 2 |
| KING | 2 |
| 护航 | 2 |
| 非人少女 | 2 |
| 橘 | 2 |
| 音濑小玉 | 2 |
| 小时 | 2 |
| 作曲 | 2 |
| piano | 2 |
| 综漫 | 2 |
| 隙 | 2 |
| 翻唱的N种打开方式3.0 | 2 |
| 纪念大厅 | 2 |
| gino | 2 |
| 珂莱塔 | 2 |
| 我的冬日宅舞日记 | 2 |
| 临战爱丽丝 | 2 |
| 二次元副本大作战 | 2 |
| 少女哭泣乐队 | 2 |
| projectSEKAI | 2 |
| 中文填词 | 2 |
| 小杂鱼 | 2 |
| 搞怪 | 2 |
| hololive | 2 |
| 实机 | 2 |
| 夜勤血裔布若 | 2 |
| 健身 | 2 |
| 男娘 | 2 |
| 诈骗 | 2 |
| osu | 2 |
| 星尘 | 2 |
| 夏日cos大赛 | 2 |
| 无刺有刺 | 2 |
| 监狱地图 | 2 |
| jojo 的奇妙冒险 | 2 |
| zzzProject | 2 |
| 魔女审判 | 2 |
| 函数 | 2 |
| Hardstyle | 2 |
| HDM | 2 |
| 人物 | 2 |
| 人物故事 | 2 |
| 春日影 | 2 |
| 明石缪 | 2 |
| 乔鲁诺 | 2 |
| 复活 | 2 |
| 大数据 | 2 |
| edit | 2 |
| 巅峰赛 | 2 |
| 古代 | 2 |
| 洲黄历 | 2 |
| 翻唱的N种打开方式 | 2 |
| 音波狂潮 | 2 |
| 雷索纳斯 | 2 |
| 伊卡菈 | 2 |
| 足立レイ | 2 |
| 明日方舟cos | 2 |
| 轮椅 | 2 |
| 二次元周边大赏 | 2 |
| 吉他弹唱 | 2 |
| 老飞宇 | 2 |
| 红温 | 2 |
| 守月铃美 | 2 |
| 鸽子神 | 2 |
| raidian | 2 |
| 暗区突围可颂作者团 | 2 |
| 闪光弹 | 2 |
| 中字 | 2 |
| sasakure.UK | 2 |
| 明日方舟终末地攻略 | 2 |
| 明日方舟：终末地 | 2 |
| 明日之后 | 2 |
| 小姐姐 | 2 |
| 嘉然 | 2 |
| 任天堂 | 2 |
| 马里奥 | 2 |
| 超级马里奥 | 2 |
| switch | 2 |
| 魔法 | 2 |
| 鸿雪 | 2 |
| 工业 | 2 |
| 圣经 | 2 |
| 三国演义 | 2 |
| 崩烤99 | 2 |
| 月球 | 2 |
| 表面 | 2 |
| 三角洲新年正当红 | 2 |
| 猛攻三角洲4月新赛季 | 2 |
| 鲨鱼猫猫 | 2 |
| oxazepam | 2 |
| 吉他谱 | 2 |
| 惊悚 | 2 |
| 小吃 | 2 |
| 世界 | 2 |
| 能超越CS的只有CS | 2 |
| 炉石传说 | 2 |
| 手工 | 2 |
| danking | 2 |
| 黑科技 | 2 |
| 前摇 | 2 |
| ぬくぬくにぎりめし | 2 |
| 性价比 | 2 |
| 蔚蓝档案阿罗娜 | 2 |
| おつかれSUMMER | 2 |
| 米哈游 | 2 |
| 烽火 | 2 |
| 九蓝一金 | 2 |
| ba二创 | 2 |
| 外剪风 | 2 |
| 铁道 | 2 |
| 乌尔比安 | 2 |
| V家 | 2 |
| S5 | 2 |
| 3x3 | 2 |
| 因果 | 2 |
| 实验 | 2 |
| 颗秒 | 2 |
| 圣地巡礼 | 2 |
| OSU | 2 |
| CytusII | 2 |
| 回忆录 | 2 |
| 纯人声 | 2 |
| 选哪个 | 2 |
| 技术 | 2 |
| 咖啡 | 2 |
| 操作系统 | 2 |
| 讽刺 | 2 |
| 新地图 | 2 |
| s5 | 2 |
| 乔乔的奇妙冒险 | 2 |
| S5赛季 | 2 |
| 嘿嘿 | 2 |
| 人类一败涂地 | 2 |
| 彩虹六号 | 2 |
| 游戏攻略 | 2 |
| 立瓶子挑战 | 2 |
| 谱面预览 | 2 |
| lowiro | 2 |
| 明日方舟红丝绒 | 2 |
| 神鹰黑手哥 | 2 |
| 童年 | 2 |
| EX | 2 |
| 现实 | 2 |
| 柚鸟夏cos | 2 |
| 小夏 | 2 |
| 白子cos | 2 |
| anno | 2 |
| 电脑装机 | 2 |
| 迈从键盘 | 2 |
| acid | 2 |
| GIRLSBANDCRY | 2 |
| 计划通 | 2 |
| 分享我的专业知识 | 2 |
| 小提琴 | 2 |
| 架子鼓英雄 | 2 |
| 东京 | 2 |
| cs2新手教学 | 2 |
| 枪法 | 2 |
| cs教学 | 2 |
| 体育 | 2 |
| 航天惩罚流 | 2 |
| n-buna | 2 |
| 标题 | 2 |
| 迈从 | 2 |
| 游戏外设 | 2 |
| mafumafu | 2 |
| 被生命所厌恶 | 2 |
| 接头霸王 | 2 |
| 古诗 | 2 |
| 蛋仔小剧场 | 2 |
| 太鼓达人 | 2 |
| MORE MORE JUMP! | 2 |
| 零号委托 | 2 |
| 前卫 | 2 |
| ichika | 2 |
| Confusing Cubes | 2 |
| 神奇的闲鱼 | 2 |
| 瑰盐 | 2 |
| 黒うさP | 2 |
| 类宁 | 2 |
| 生命 | 2 |
| 我不是天才吗？ | 2 |
| 活字印刷 | 2 |
| 泡面 | 2 |
| 边狱巴士 | 2 |
| 亲爱的你被火葬 | 2 |
| 三月七 | 2 |
| 三角洲行动游戏日常 | 2 |
| S5新赛季3x3速通攻略 | 2 |
| 赛季任务 | 2 |
| doro | 2 |
| 丢失的雨伞 | 2 |
| maimaiDX | 2 |
| 白潘 | 2 |
| 源石 | 2 |
| OI | 2 |
| AtCoder | 2 |
| KARDS | 2 |
| 三角洲行动实况 | 2 |
| 胜者为王 | 2 |
| ai绘画 | 2 |
| 短视频 | 2 |
| 上海major | 2 |
| 绿龙 | 2 |
| 国庆 | 2 |
| prts | 2 |
| 迈从ace68 | 2 |
| 瓦洛兰特 | 2 |
| 八幡海铃 | 2 |
| MYGO | 2 |
| 蔚蓝档案Only | 2 |
| 行为 | 2 |
| 表白 | 2 |
| 吃饭 | 2 |
| 饮料 | 2 |
| 小奶猫 | 2 |
| 宠物 | 2 |
| 音乐研究所 | 2 |
| 赛车初音 | 2 |
| color bass | 2 |
| Steam游戏 | 2 |
| 月が綺麗ねと言われたい！ | 2 |
| 我想被你說一句「月色真美啊！」 | 2 |
| 黑猫 | 2 |
| 这样剪 | 2 |
| Wallpaper | 2 |
| 水宫子 | 2 |
| 范式起源 | 2 |
| CG | 2 |
| 积极 | 2 |
| 描改致歉 | 2 |
| 流量 | 2 |
| 削除 | 2 |
| 东方仗助 | 2 |
| 动画毕业季 | 2 |
| POV | 2 |
| 大可爱 | 2 |
| ai配音 | 2 |
| 牢大 | 2 |
| 单词 | 2 |
| 三角洲情感日常 | 2 |
| 企鹅 | 2 |
| ba同人漫画 | 2 |
| 灾难 | 2 |
| 炸裂 | 2 |
| 戒野美咲 | 2 |
| 镜中集 | 2 |
| m3 | 2 |
| 八方来财 | 2 |
| OC画师激励计划 | 2 |
| 天狼星沙雕 | 2 |
| 校长 | 2 |
| 技术流 | 2 |
| S8 | 2 |
| 明日方舟终末地同人二创 | 2 |
| 三角初音 | 2 |
| 颜 | 2 |
| Malody | 2 |
| 细节 | 2 |
| 点弦 | 2 |
| solo | 2 |
| 生存游戏 | 2 |
| 茶话会 | 2 |
| 指挥官 | 2 |
| 罗德岛 | 2 |
| 女仆装 | 2 |
| 联邦学生会会长 | 2 |
| rather be | 2 |
| 机械键盘 | 2 |
| 迈从G87 | 2 |
| 四六级 | 2 |
| 羽衣工船 | 2 |
| 暗区突围无限 | 2 |
| 港区放映厅 | 2 |
| 课程 | 2 |
| 卡战备 | 2 |
| 新年音乐狂欢季 | 2 |
| 架子鼓演奏 | 2 |
| giga | 2 |
| 安达与岛村 | 2 |
| 开口跪 | 2 |
| 英短 | 2 |
| 冷门 | 2 |
| 越级 | 2 |
| 三角洲行动操作高燃 | 2 |
| EDM | 2 |
| 暗区 | 2 |
| 即兴舞蹈 | 2 |
| 即兴 | 2 |
| 闺蜜 | 2 |
| MyGo!!!!! | 2 |
| gugugaga | 2 |
| Tomorin | 2 |
| Bang Dream | 2 |
| 努力 | 2 |
| 免费 | 2 |
| hl2 | 2 |
| AMD | 2 |
| 明日方舟终末地全面测试 | 2 |

已删去频数小于2的标签。

:::

## 统计摘要

:::info

1. 下列信息于七月二十一日更新。
2. 后续的更新只会同步各个标签的数量，不会对下方内容进行编辑。

:::

- 总TAG数量: 3,513
- 唯一出现次数值数量: 67
- 最小出现次数: 1.0
- 最大出现次数: 443.0
- 平均出现次数: 3.18
- 中位数出现次数: 1.0
- 最常见的出现次数: 1.0 (共 2,377 个TAG)
- 长尾分布：出现次数为1的TAG: 2,377 (67.7%)
- 出现次数大于100的TAG: 8 (0.2%)

出现次数分布前10位:

|出现次数|频数|
|:-:|:-:|
|1.0|2377|
|2.0|446|
|3.0|216|
|4.0|98|
|5.0|74|
|6.0|46|
|7.0|40|
|8.0|32|
|9.0|20|
|10.0|21|

假设 tag 出现频率 $f(x)$ 服从幂律分布形式：

$$
f(x) \propto x^{-\alpha}, \quad x \in [x_{\min}, +\infty), \quad x_{\min} > 0.
$$

在对数坐标下可线性化为：

$$
\log f(x) = -\alpha \log x + c.
$$

其中：

- $f(x)$ 表示出现次数为 $x$ 的标签数量；
- $\alpha$ 为幂律指数；
- $c = \log k$ 为常数项。

我们使用Desmos对排名前十的数据进行最小二乘拟合（$y \sim kx^{\alpha}$），得到方程：

$$
f(x) = 2374.13\,x^{-2.32}, \quad R^2 \approx 0.9994.
$$

这一分析表明李晨煜的兴趣范围较为分散，tag分布具有明显的长尾效应。

## 发散探究

上述探究结论不禁让我们联想到统计学中的著名理论：***齐普夫定律***。一般认为，Zipf在1949年提出了Zipf律。Zipf在研究不同语言的词频的时候就讨论了一个规律：获取某种语言的文本语料，分割成词，分完后统计词频并按从大到小排序(例如对于汉语来说排在最前的是“的”，英语是“the”)。将结果画在图上，横轴是排序大小，纵轴是对应的词出现的次数，二者在双对数坐标下呈现直线特征^[[解读幂律(Power Law)分布与无标度(Scale Free)网络.陈清华.集智斑图.](https://pattern.swarma.org/article/21)]。这一定律说明：语言中的少数高频词占据了大部分文本，而大量低频词仅出现一次或几次。这也体现了人类在千百年的进化后得到的一种“偷懒”能力，说明自然万物都是趋于稳定的。

:::note

- 下列内容部分引用自维基百科上有关帕累托法则的相关内容^[[帕累托法则. 维基百科.](https://zh.wikipedia.org/wiki/%E5%B8%95%E7%B4%AF%E6%89%98%E6%B3%95%E5%88%99)]。
- ~~下列内容可能由于翻译人员的理解不佳或业务水平能力的低下导致存在语言表述不清、部分专有名词翻译出错等问题，例如：错误地将该语境下的*law*翻译作*法律*，请结合实际进行理解或对内容进行取舍，亦可尝试阅读维基百科上的英文版本。~~
- 下列文本已经过修正，提高了可读性。*（8月5日更新）*

:::

在经济学中，这一分布趋势也有所体现，具体表现形式即为 ***帕累托法则***。帕累托法则（英语：Pareto principle，或称**80/20法则**、**关键少数法则**、**二八法则**、**巴莱多定律**）^[[THE APPLICATION OF THE PARETO PRINCIPLE IN SOFTWARE ENGINEERING. Ankunda R. Kiremire 19th October, 2011](http://www2.latech.edu/~box/ase/papers2011/Ankunda_termpaper.PDF) (PDF). [2017-10-22].]指出，约仅有 **20%** 的因素影响 **80%** 的结果。也就是说：所有变因中，最重要的仅有 **20%** ，虽然剩余的 **80%** 占了多数，其影响程度却远低于“关键的少数”^[Bunkley, Nick, [Joseph Juran, 103, Pioneer in Quality Control, Dies](https://www.nytimes.com/2008/03/03/business/03juran.html), 纽约时报, March 3, 2008 [2017-10-22]]。

帕累托最初的观察与人口和财富有关。他注意到，意大利约有80%的土地由20%的人口所有。^[Pareto, Vilfredo; Page, Alfred N., Translation of Manuale di economia politica ("Manual of political economy"), A.M. Kelley, 1971, ISBN 978-0-678-00881-2]之后，他调查了其他国家。令人惊讶的是，其他国家也存在类似的分布模式。许多产品的市场被约三个寡头垄断。^[[全球份額調查：優勢企業走向寡頭化](https://cn.nikkei.com/industry/management-strategy/31312-2018-07-25-04-59-11.html),（原始内容[存档](https://web.archive.org/web/20200925012535/https://cn.nikkei.com/industry/management-strategy/31312-2018-07-25-04-59-11.html)于2020-09-25）]

1992年的“联合国开发计划署报告”将这个不平等现象以非常直观和易于理解的形式呈现出来，即所谓的“香槟杯”效应^[Gorostiaga, Xabier, World has become a 'champagne glass' globalization will fill it fuller for a wealthy few, National Catholic Reporter, January 27, 1995]。该报告显示全球收入分配高度不平衡，全球最富有的 **20%** 人口控制着世界总收入的82.7%。^[United Nations Development Program, 1992 Human Development Report, Oxford University Press, New York, 1992]^[[Human Development Report 1992, Chapter 3](http://hdr.undp.org/en/reports/global/hdr1992/chapters/),（原始内容[存档](https://web.archive.org/web/20150315203549/http://hdr.undp.org/en/reports/global/hdr1992/chapters)于2015-03-15）]

| 人口分组       | 收入占比 |
|----------------|----------|
| 最富有 20%     | 82.70%   |
| 次高 20%       | 11.75%   |
| 中间 20%       | 2.30%    |
| 次低 20%       | 1.85%    |
| 最贫穷 20%     | 1.40%    |

*80/20法则*在许多领域被视为经验法则，但它常被误用。例如，仅仅因为 **80%** 的案例符合某种模式，就断定其“符合80/20法则”是错误的；还必须满足解决问题的资源投入也仅需 **20%** 这一条件。此外，在类别或观察样本数量过少时应用80/20法则也是一种滥用。

例如前文提及，在美国，20%的患者消耗了80%的医疗资源。但仔细思考真实情况，疾病本就有轻重缓急之分。消耗80%医疗资源的人群，很可能是因为病情较重。此外还需考虑美国医疗费用昂贵、人们就医决策等因素。在这些考虑之下，二八法则提供的数字本身可能并不具备充分的解释力，这种简单化的观念可能导致部分读者未加深入思考就对该情况产生误解。

帕累托法则是更广泛的 **帕累托分布** （Pareto distribution）的一个特例。如果表征帕累托分布的参数之一——帕累托指数 `α` 满足 `α = log₄5 ≈ 1.16`，那么就有80%的效应来自20%的原因。

因此，80%的效应中的80%又来自那前20%原因中的前20%。80%的80%是64%；20%的20%是4%，所以这就意味着存在一个“64/4法则”；同理也意味着“51.2/0.8法则”。类似地，对于底层80%的原因和它们产生的20%效应，底层80%中的底层80%只贡献了那剩余20%效应中的20%。这与世界人口/财富分布表大致相符：底层60%人口拥有的财富占比为5.5%（1.85% + 2.30% + 1.40%），接近于64/4法则中底层64%对应4%效应的比例。

64/4的相关性也意味着在4%至64%之间有一个32%的“相对公平”区域（即中间60%人口对应的财富占比累计为 11.75% + 2.30% + 1.85% = 15.9%，但原文意指效应分布的中间部分）。前20%原因中后80%的部分（即前20%原因中除最关键4%外的16%）贡献了64%效应中的20%（即12.8%），而底层80%原因中前20%的部分（即底层80%中表现最好的16%）贡献了底层20%效应中的80%（即16%）[^1]。

术语80/20只是描述这一普遍原理的简称。在具体个案中，分布也可能更接近80/10或80/30。没有必要要求两个数字相加为100%，因为它们衡量的是不同事物的比例（例如，“客户数量占比”与“销售额占比”）。然而，每个比例本身都不能超过100%。例如，如上所述，“64/4法则”（两个数字相加不等于100%）在逻辑上等价于“80/20法则”（两个数字相加为100%）。因此，独立指定两个百分比并不能比通过指定一个比例并让另一个作为其补数（相对于100%）来定义更广泛的分布。所以，两者相加为100%的情况（如80:20）具有对称性：如果80%的效应来自前20%的原因，那么剩余的20%效应必然来自底层80%的原因。这种组合比例（如80:20）可用于衡量不平衡程度：96:4的比例表示极度不平衡，80:20表示显著不平衡（对应的基尼系数约为60%），70:30表示中度不平衡（基尼系数约40%），而55:45则略显不平衡。

帕累托法则是**幂律关系**（power law relationship）的一个实例，这种关系也出现在火山爆发和地震等现象中。^[Bak, Per, How Nature Works: the science of self-organized criticality, Springer, 1999, page 89, ISBN 0-387-94791-4] 因为它（幂律分布）*在很宽的尺度范围内具有自相似性*，其结果与完全不同的正态分布现象产生的结果截然不同。这一事实解释了复杂金融工具为何频繁崩溃，因为这些工具的设计往往基于（错误的）假设，例如认为股价波动遵循正态分布（高斯分布）。^[Taleb, Nassim, The Black Swan, 2007, pages 229–252, 274–285]

[^1]:1. **第一层级（80/20法则）**  
        - 前20%的群体（原因）→ 创造80%的财富（效应）  
        - 后80%的群体（原因）→ 创造20%的财富（效应）  
     2. **第二层级（64/4法则）**  
        - **对"前20%群体"进一步分解**：  
            - 其中前20%的**子群体**（占全社会 *总群体* 的 `20% × 20% = 4%`)  
            → 创造原80%财富中的80%（占全社会 *总财富* 的 `80% × 80% = 64%`)  
            - 其中后80%的**子群体**（占全社会 *总群体* 的 `20% × 80% = 16%`)  
            → 创造原80%财富中的20%（占全社会 *总财富* 的 `80% × 20% = 16%`)  
        - **对"后80%群体"进一步分解**：  
            - 其中前20%的**子群体**（占全社会 *总群体* 的 `80% × 20% = 16%`)  
            → 创造原20%财富中的80%（占全社会 *总财富* 的 `20% × 80% = 16%`)  
            - 其中后80%的**子群体**（占全社会 *总群体* 的 `80% × 80% = 64%`)  
            → 创造原20%财富中的20%（占全社会 *总财富* 的 `20% × 20% = 4%`)

    实际上：4/64法则是对20/80法则的递归。
