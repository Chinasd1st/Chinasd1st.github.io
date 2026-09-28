---
date: 2026-06-30
category:
    - 计算机技术
tags: 
    - 音乐
    - Python
    - API
    - 网易云
    - 分析
    - 统计
    - 李晨煜
icon: code
description: 使用 NeteaseCloudMusicApi + Python 实现网易云音乐歌单数据采集与可视化分析。包含 API 接口文档、完整响应示例、Pandas 数据清洗、Matplotlib/Seaborn 多维度图表（时长分布、热度分析、艺术家排名、音频质量对比），附完整源码。
# cover: /img/Cover/2026.6.15/cover.webp
---

# 使用 NeteaseCloudMusicApi 实现对特定歌单的分析及可视化

## Intro

本分析结果依赖 [nooblong/NeteaseCloudMusicApiBackup](https://github.com/nooblong/NeteaseCloudMusicApiBackup) 提供的 API 文档及逆向解析方法实现数据提取。这一项目分发自 [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)，但因网易云方面向仓库所有人致函，迫使其存档这一仓库。由于网易云接口限制，歌单详情只会提供 10 首歌。而这一项目通过伪造 `csrf_token` 等手段实现单次最高1000首歌曲数据的获取。

[[toc]]

## 安装

```bash
$ git clone git@gitlab.com:Binaryify/NeteaseCloudMusicApi.git

Cloning into 'NeteaseCloudMusicApiBackup'...

$ cd NeteaseCloudMusicApi

$ npm install

> NeteaseCloudMusicApi@4.25.0 prepare
> husky install

husky - Git hooks installed

added 562 packages, and audited 563 packages in 9s
```

或 Vercel 部署：

> 以下内容引用自仓库内文档。

1. `fork` 此项目
2. 在 `Vercel` 官网点击 `New Project`
3. 点击 `Import Git Repository` 并选择你 `fork` 的此项目并点击 `import`
4. 点击 `PERSONAL ACCOUNT` 的 `select`
5. 直接点`Continue`
6. `PROJECT NAME`自己填,`FRAMEWORK PRESET` 选 `Other` 然后直接点 `Deploy` 接着等部署完成即可。

访问 Vercel 部署的接口,需要额外加一个 `realIP` 参数,如 `/song/url?id=191254&realIP=116.25.146.177`

## 调用

端点：`/playlist/track/all`

### 请求query

| 参数     | 必选 | 类型  | 默认值       | 说明                 |
| -------- | ---- | ----- | ------------ | -------------------- |
| `id`     | 是   | `int` | —            | 歌单 ID              |
| `limit`  | 否   | `int` | 歌单歌曲总数 | 限制获取歌曲的数量   |
| `offset` | 否   | `int` | `0`          | 获取歌曲的起始偏移量 |

### 返回参数

| 字段 | 类型 | 描述 |
|------|------|------|
| `songs` | `array` | 歌曲列表 |
| `songs[].name` | `string` | 歌曲名称 |
| `songs[].id` | `int` | 歌曲 ID |
| `songs[].pst` | `int` | 是否为付费歌曲（0: 否, 1: 是） |
| `songs[].t` | `int` | 是否被删除（0: 否） |
| `songs[].ar` | `array` | 艺术家列表 |
| `songs[].ar[].id` | `int` | 艺术家 ID |
| `songs[].ar[].name` | `string` | 艺术家名称 |
| `songs[].ar[].tns` | `array` | 艺术家别名列表 |
| `songs[].ar[].alias` | `array` | 艺术家简称列表 |
| `songs[].alia` | `array` | 歌曲别名列表 |
| `songs[].pop` | `int` | 热度值（0-100） |
| `songs[].st` | `int` | 是否被删除（0: 否, 1: 是） |
| `songs[].rt` | `string` | 未知 |
| `songs[].fee` | `int` | 付费类型（0: 免费, 1: VIP, 4: 购买专辑, 8: 低音质免费） |
| `songs[].v` | `int` | 版本号 |
| `songs[].crbt` | `null` | 未知 |
| `songs[].cf` | `string` | 未知 |
| `songs[].al` | `object` | 专辑信息 |
| `songs[].al.id` | `int` | 专辑 ID |
| `songs[].al.name` | `string` | 专辑名称 |
| `songs[].al.picUrl` | `string` | 专辑封面 URL |
| `songs[].al.tns` | `array` | 专辑别名列表 |
| `songs[].al.pic_str` | `string` | 封面图片 ID |
| `songs[].al.pic` | `int` | 封面图片 ID（数值） |
| `songs[].dt` | `int` | 时长（毫秒） |
| `songs[].h` | `object` | 高质量音频信息（320kbps） |
| `songs[].h.br` | `int` | 比特率（bps） |
| `songs[].h.fid` | `int` | 文件 ID |
| `songs[].h.size` | `int` | 文件大小（字节） |
| `songs[].h.vd` | `int` | 音量差值 |
| `songs[].h.sr` | `int` | 采样率（Hz） |
| `songs[].m` | `object` | 中等质量音频信息（192kbps） |
| `songs[].l` | `object` | 低质量音频信息（128kbps） |
| `songs[].sq` | `object` | 无损质量音频信息 |
| `songs[].hr` | `object` | Hi-Res 音频信息（可能为 null） |
| `songs[].a` | `null` | 未知 |
| `songs[].cd` | `string` | CD 编号 |
| `songs[].no` | `int` | 曲目编号 |
| `songs[].rtUrl` | `null` | 未知 |
| `songs[].ftype` | `int` | 文件类型 |
| `songs[].rtUrls` | `array` | 未知 |
| `songs[].djId` | `int` | DJ ID（非电台歌曲为 0） |
| `songs[].copyright` | `int` | 版权标识 |
| `songs[].s_id` | `int` | 未知 |
| `songs[].mark` | `int` | 标记位 |
| `songs[].originCoverType` | `int` | 原始封面类型 |
| `songs[].originSongSimpleData` | `null` | 原始歌曲简要数据 |
| `songs[].tagPicList` | `null` | 标签图片列表 |
| `songs[].resourceState` | `boolean` | 资源状态 |
| `songs[].version` | `int` | 版本号 |
| `songs[].songJumpInfo` | `null` | 跳转信息 |
| `songs[].entertainmentTags` | `null` | 娱乐标签 |
| `songs[].awardTags` | `null` | 获奖标签 |
| `songs[].displayTags` | `array` | 展示标签列表 |
| `songs[].artistClassics` | `boolean` | 未知（是否为艺术家经典作品？） |
| `songs[].markTags` | `array` | 标记标签 |
| `songs[].songFeature` | `null` | 歌曲特征 |
| `songs[].single` | `int` | 是否为单曲 |
| `songs[].noCopyrightRcmd` | `null` | 无版权推荐 |
| `songs[].mv` | `int` | MV ID（无 MV 为 0） |
| `songs[].rtype` | `int` | 未知 |
| `songs[].rurl` | `null` | 未知 |
| `songs[].mst` | `int` | 未知 |
| `songs[].cp` | `int` | 版权方 ID |
| `songs[].publishTime` | `int` | 发布时间戳（毫秒） |
| `songs[].tns` | `array` | 歌曲别名（副标题）列表 |

### 响应示例

```json :collapsed-lines
{
  "songs": [
    {
      "name": "マーシャル・マキシマイザー",
      "mainTitle": null,
      "additionalTitle": null,
      "id": 3346111579,
      "pst": 0,
      "t": 0,
      "ar": [
        {
          "id": 37281800,
          "name": "柊マグネタイト",
          "tns": [],
          "alias": []
        },
        {
          "id": 47893107,
          "name": "可不",
          "tns": [],
          "alias": []
        }
      ],
      "alia": [],
      "pop": 75,
      "st": 0,
      "rt": "",
      "fee": 0,
      "v": 37,
      "crbt": null,
      "cf": "",
      "al": {
        "id": 360738339,
        "name": "マーシャル・マキシマイザー",
        "picUrl": "https://p2.music.126.net/rpV-Js2cv5mbuH52FovQeg==/109951172687301109.jpg",
        "tns": ["Marshall Maximizer"],
        "pic_str": "109951172687301109",
        "pic": 109951172687301100
      },
      "dt": 163686,
      "h": {
        "br": 320000,
        "fid": 0,
        "size": 6550509,
        "vd": -68611,
        "sr": 44100
      },
      "m": {
        "br": 192000,
        "fid": 0,
        "size": 3930323,
        "vd": -66161,
        "sr": 44100
      },
      "l": {
        "br": 128000,
        "fid": 0,
        "size": 2620230,
        "vd": -64808,
        "sr": 44100
      },
      "sq": {
        "br": 1089771,
        "fid": 0,
        "size": 22300647,
        "vd": -68578,
        "sr": 44100
      },
      "hr": null,
      "a": null,
      "cd": "01",
      "no": 1,
      "rtUrl": null,
      "ftype": 0,
      "rtUrls": [],
      "djId": 0,
      "copyright": 0,
      "s_id": 0,
      "mark": 262272,
      "originCoverType": 0,
      "originSongSimpleData": null,
      "tagPicList": null,
      "resourceState": true,
      "version": 3,
      "songJumpInfo": null,
      "entertainmentTags": null,
      "awardTags": null,
      "displayTags": [],
      "artistClassics": false,
      "markTags": [],
      "songFeature": null,
      "single": 0,
      "noCopyrightRcmd": null,
      "mv": 0,
      "rtype": 0,
      "rurl": null,
      "mst": 9,
      "cp": 2707442,
      "publishTime": 0,
      "tns": ["Marshall Maximizer"]
    }
  ]
}
```

## 统计及可视化

以下是本人用 Mimo v2.5 生成的代码，使用前安装依赖：

```bash
pip install pandas matplotlib seaborn
```

```python :collapsed-lines
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
import numpy as np

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

# 读取JSON文件
with open('all.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

songs = data['songs']
print(f"共读取 {len(songs)} 首歌曲")

# 创建DataFrame
df = pd.DataFrame(songs)

# 数据清洗和特征工程
df['duration_min'] = df['dt'] / 60000
df['artist_count'] = df['ar'].apply(len)
df['main_artist'] = df['ar'].apply(lambda x: x[0]['name'] if x else 'Unknown')
df['all_artists'] = df['ar'].apply(lambda x: ', '.join([artist['name'] for artist in x]))
df['album_name'] = df['al'].apply(lambda x: x['name'] if x else 'Unknown')
df['album_pic_url'] = df['al'].apply(lambda x: x.get('picUrl', '') if x else '')
df['hq_size_mb'] = df['h'].apply(lambda x: x['size'] / (1024*1024) if x else 0)
df['mq_size_mb'] = df['m'].apply(lambda x: x['size'] / (1024*1024) if x else 0)
df['lq_size_mb'] = df['l'].apply(lambda x: x['size'] / (1024*1024) if x else 0)
df['sq_size_mb'] = df['sq'].apply(lambda x: x['size'] / (1024*1024) if x else 0)
df['hq_bitrate'] = df['h'].apply(lambda x: x.get('br', 0) if x else 0)
df['sample_rate'] = df['h'].apply(lambda x: x.get('sr', 0) if x else 0)
df['copyright_id'] = df['cp'].apply(lambda x: x if x else 0)

# 过滤采样率异常值
df_filtered = df[df['sample_rate'] > 0].copy()

# 基本统计信息
print("\n=== 基本统计信息 ===")
print(f"歌曲总数: {len(df)}")
print(f"唯一艺术家数: {df['main_artist'].nunique()}")
print(f"唯一专辑数: {df['album_name'].nunique()}")
print(f"平均歌曲时长: {df['duration_min'].mean():.2f} 分钟")
print(f"平均热度值: {df['pop'].mean():.1f}")

# ============== 图表1：基础分析 ==============
fig = plt.figure(figsize=(20, 15))

# 1. 歌曲时长分布
plt.subplot(2, 3, 1)
plt.hist(df['duration_min'], bins=30, edgecolor='black', alpha=0.7, color='skyblue')
plt.title('歌曲时长分布', fontsize=14, fontweight='bold')
plt.xlabel('时长（分钟）')
plt.ylabel('歌曲数量')
plt.grid(axis='y', alpha=0.3)

# 2. 热度值分布
plt.subplot(2, 3, 2)
plt.hist(df['pop'], bins=20, edgecolor='black', alpha=0.7, color='lightcoral')
plt.title('热度值分布', fontsize=14, fontweight='bold')
plt.xlabel('热度值')
plt.ylabel('歌曲数量')
plt.grid(axis='y', alpha=0.3)

# 3. 艺术家歌曲数量Top10
plt.subplot(2, 3, 3)
artist_counts = df['main_artist'].value_counts().head(10)
bars = plt.bar(range(len(artist_counts)), artist_counts.values, color='lightgreen')
plt.title('艺术家歌曲数量 Top 10', fontsize=14, fontweight='bold')
plt.xlabel('艺术家')
plt.ylabel('歌曲数量')
plt.xticks(range(len(artist_counts)), artist_counts.index, rotation=45, ha='right')
plt.grid(axis='y', alpha=0.3)

# 4. 艺术家数量分布
plt.subplot(2, 3, 4)
artist_count_dist = df['artist_count'].value_counts().sort_index()
plt.bar(artist_count_dist.index, artist_count_dist.values, color='gold')
plt.title('歌曲合作艺术家数量分布', fontsize=14, fontweight='bold')
plt.xlabel('艺术家数量')
plt.ylabel('歌曲数量')
plt.grid(axis='y', alpha=0.3)

# 5. 音频质量大小对比（箱线图）
plt.subplot(2, 3, 5)
quality_data = df[['hq_size_mb', 'mq_size_mb', 'lq_size_mb', 'sq_size_mb']].copy()
quality_data.columns = ['高质量', '中等质量', '低质量', '无损质量']
quality_data.boxplot(grid=False)
plt.title('不同音频质量文件大小分布', fontsize=14, fontweight='bold')
plt.ylabel('文件大小（MB）')
plt.grid(axis='y', alpha=0.3)

# 6. 热度值与歌曲时长的关系
plt.subplot(2, 3, 6)
plt.scatter(df['duration_min'], df['pop'], alpha=0.5, s=30, color='purple')
plt.title('热度值与歌曲时长关系', fontsize=14, fontweight='bold')
plt.xlabel('时长（分钟）')
plt.ylabel('热度值')
plt.grid(alpha=0.3)

plt.tight_layout()
plt.savefig('music_analysis.png', dpi=300, bbox_inches='tight')
plt.show()

# ============== 图表2：深度分析（优化版）==============
fig2, axes = plt.subplots(2, 2, figsize=(15, 12))

# 1. 热度值Top10歌曲（带时长信息）
plt.subplot(2, 2, 1)
top_songs = df.nlargest(10, 'pop')[['name', 'pop', 'duration_min', 'main_artist']].reset_index(drop=True)
y_pos = np.arange(len(top_songs))
bars = plt.barh(y_pos, top_songs['pop'], color='salmon', edgecolor='black', linewidth=0.5)
# 在条形上添加时长标签
for i, (pop, dur) in enumerate(zip(top_songs['pop'], top_songs['duration_min'])):
    plt.text(pop + 0.5, i, f'{dur:.1f}min', va='center', fontsize=9)
plt.yticks(y_pos, [f"{row['name'][:15]}..." if len(row['name']) > 15 else row['name'] 
                   for _, row in top_songs.iterrows()])
plt.title('热度值最高的10首歌曲（含时长）', fontsize=14, fontweight='bold')
plt.xlabel('热度值')
plt.gca().invert_yaxis()
plt.grid(axis='x', alpha=0.3)

# 2. 艺术家平均热度Top10（过滤低频，只保留>=3首歌的艺术家）
plt.subplot(2, 2, 2)
artist_stats = df.groupby('main_artist').agg(
    song_count=('name', 'count'),
    avg_pop=('pop', 'mean')
).query('song_count >= 3').sort_values('avg_pop', ascending=False).head(10)
bars = plt.barh(range(len(artist_stats)), artist_stats['avg_pop'], color='mediumseagreen', edgecolor='black', linewidth=0.5)
# 添加歌曲数量标签
for i, (pop, count) in enumerate(zip(artist_stats['avg_pop'], artist_stats['song_count'])):
    plt.text(pop + 0.5, i, f'{count}首', va='center', fontsize=9)
plt.yticks(range(len(artist_stats)), artist_stats.index)
plt.title('艺术家平均热度 Top 10（歌曲数≥3）', fontsize=14, fontweight='bold')
plt.xlabel('平均热度值')
plt.gca().invert_yaxis()
plt.grid(axis='x', alpha=0.3)

# 3. 按艺术家统计专辑数量Top10
plt.subplot(2, 2, 3)
artist_album_count = df.groupby('main_artist')['album_name'].nunique().sort_values(ascending=False).head(10)
plt.barh(range(len(artist_album_count)), artist_album_count.values, color='mediumpurple', edgecolor='black', linewidth=0.5)
plt.yticks(range(len(artist_album_count)), artist_album_count.index)
plt.title('艺术家专辑数量 Top 10', fontsize=14, fontweight='bold')
plt.xlabel('专辑数量')
plt.gca().invert_yaxis()
plt.grid(axis='x', alpha=0.3)

# 4. 采样率分布（过滤异常值）
plt.subplot(2, 2, 4)
sr_counts = df_filtered['sample_rate'].value_counts()
plt.pie(sr_counts.values, labels=[f'{sr/1000}kHz' for sr in sr_counts.index], 
        autopct='%1.1f%%', startangle=90, colors=['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA'])
plt.title('高质量音频采样率分布', fontsize=14, fontweight='bold')

plt.tight_layout()
plt.savefig('music_analysis_2.png', dpi=300, bbox_inches='tight')
plt.show()

# ============== 图表3：新增分析 ==============
fig3, axes = plt.subplots(2, 2, figsize=(15, 12))

# 1. 歌曲时长 vs 热度散点图（带回归线）
plt.subplot(2, 2, 1)
sns.regplot(data=df, x='duration_min', y='pop', scatter_kws={'alpha':0.3, 's':20}, 
            line_kws={'color':'red', 'linewidth':2})
plt.title('歌曲时长与热度关系（带回归线）', fontsize=14, fontweight='bold')
plt.xlabel('时长（分钟）')
plt.ylabel('热度值')
plt.grid(alpha=0.3)

# 2. 版权方分布Top10
plt.subplot(2, 2, 2)
cp_counts = df['copyright_id'].value_counts().head(10)
plt.bar(range(len(cp_counts)), cp_counts.values, color='orange', edgecolor='black', linewidth=0.5)
plt.title('版权方分布 Top 10', fontsize=14, fontweight='bold')
plt.xlabel('版权方ID')
plt.ylabel('歌曲数量')
plt.xticks(range(len(cp_counts)), cp_counts.index, rotation=45, ha='right')
plt.grid(axis='y', alpha=0.3)

# 3. 音频码率分布直方图
plt.subplot(2, 2, 3)
bitrate_kbps = df['hq_bitrate'] / 1000
plt.hist(bitrate_kbps, bins=30, edgecolor='black', alpha=0.7, color='cyan')
plt.title('高质量音频码率分布', fontsize=14, fontweight='bold')
plt.xlabel('码率 (kbps)')
plt.ylabel('歌曲数量')
plt.grid(axis='y', alpha=0.3)

# 4. 艺术家合作网络（简化版：多艺术家歌曲数量）
plt.subplot(2, 2, 4)
collab_songs = df[df['artist_count'] > 1].copy()
collab_songs['collab_artists'] = collab_songs['ar'].apply(lambda x: tuple(sorted([a['name'] for a in x])))
top_collabs = collab_songs['collab_artists'].value_counts().head(10)
# 将元组转换为字符串用于显示
collab_labels = [' & '.join(c) for c in top_collabs.index]
bars = plt.barh(range(len(top_collabs)), top_collabs.values, color='pink', edgecolor='black', linewidth=0.5)
plt.yticks(range(len(top_collabs)), [label[:30] + '...' if len(label) > 30 else label 
                                      for label in collab_labels])
plt.title('艺术家合作组合 Top 10', fontsize=14, fontweight='bold')
plt.xlabel('合作歌曲数量')
plt.gca().invert_yaxis()
plt.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig('music_analysis_3.png', dpi=300, bbox_inches='tight')
plt.show()

# ============== 图表4：热度分段分析 ==============
fig4, axes = plt.subplots(2, 2, figsize=(15, 12))

# 1. 热度分段统计
plt.subplot(2, 2, 1)
bins = [0, 20, 40, 60, 80, 100]
labels = ['0-20', '21-40', '41-60', '61-80', '81-100']
df['pop_range'] = pd.cut(df['pop'], bins=bins, labels=labels, include_lowest=True)
pop_range_counts = df['pop_range'].value_counts().sort_index()
plt.bar(range(len(pop_range_counts)), pop_range_counts.values, 
        color=['#FF6B6B', '#FFA07A', '#FFD700', '#98FB98', '#00CED1'], edgecolor='black', linewidth=0.5)
plt.title('热度分段统计', fontsize=14, fontweight='bold')
plt.xlabel('热度范围')
plt.ylabel('歌曲数量')
plt.xticks(range(len(pop_range_counts)), pop_range_counts.index)
plt.grid(axis='y', alpha=0.3)

# 2. 不同热度段的平均时长
plt.subplot(2, 2, 2)
pop_duration = df.groupby('pop_range', observed=True)['duration_min'].mean()
plt.bar(range(len(pop_duration)), pop_duration.values, color='teal', edgecolor='black', linewidth=0.5)
plt.title('不同热度段的平均歌曲时长', fontsize=14, fontweight='bold')
plt.xlabel('热度范围')
plt.ylabel('平均时长（分钟）')
plt.xticks(range(len(pop_duration)), pop_duration.index)
plt.grid(axis='y', alpha=0.3)

# 3. 热度Top10艺术家的歌曲热度分布（箱线图）
plt.subplot(2, 2, 3)
top10_artists = df['main_artist'].value_counts().head(10).index
df_top10 = df[df['main_artist'].isin(top10_artists)]
artists_order = df_top10.groupby('main_artist')['pop'].mean().sort_values(ascending=False).index
sns.boxplot(data=df_top10, x='main_artist', y='pop', order=artists_order, palette='Set2')
plt.title('Top 10艺术家歌曲热度分布', fontsize=14, fontweight='bold')
plt.xlabel('艺术家')
plt.ylabel('热度值')
plt.xticks(rotation=45, ha='right')
plt.grid(axis='y', alpha=0.3)

# 4. 时长分段与热度关系热力图
plt.subplot(2, 2, 4)
dur_bins = pd.cut(df['duration_min'], bins=[0, 2, 3, 4, 5, 20], labels=['0-2', '2-3', '3-4', '4-5', '5+'])
cross_tab = pd.crosstab(dur_bins, df['pop_range'])
sns.heatmap(cross_tab, annot=True, fmt='d', cmap='YlOrRd', cbar_kws={'label': '歌曲数量'})
plt.title('时长与热度交叉分析', fontsize=14, fontweight='bold')
plt.xlabel('热度范围')
plt.ylabel('时长范围（分钟）')

plt.tight_layout()
plt.savefig('music_analysis_4.png', dpi=300, bbox_inches='tight')
plt.show()

# ============== 图表5：专辑分析 ==============
fig5, axes = plt.subplots(2, 2, figsize=(15, 12))

# 1. 专辑热度Top10
plt.subplot(2, 2, 1)
album_pop = df.groupby('album_name').agg(
    song_count=('name', 'count'),
    avg_pop=('pop', 'mean')
).query('song_count >= 2').sort_values('avg_pop', ascending=False).head(10)
bars = plt.barh(range(len(album_pop)), album_pop['avg_pop'], color='coral', edgecolor='black', linewidth=0.5)
for i, (pop, count) in enumerate(zip(album_pop['avg_pop'], album_pop['song_count'])):
    plt.text(pop + 0.5, i, f'{count}首', va='center', fontsize=9)
plt.yticks(range(len(album_pop)), [name[:25] + '...' if len(name) > 25 else name for name in album_pop.index])
plt.title('专辑平均热度 Top 10（歌曲数≥2）', fontsize=14, fontweight='bold')
plt.xlabel('平均热度值')
plt.gca().invert_yaxis()
plt.grid(axis='x', alpha=0.3)

# 2. 专辑歌曲数量分布
plt.subplot(2, 2, 2)
album_song_counts = df.groupby('album_name')['name'].count().value_counts().sort_index()
plt.bar(album_song_counts.index, album_song_counts.values, color='teal', edgecolor='black', linewidth=0.5)
plt.title('专辑歌曲数量分布', fontsize=14, fontweight='bold')
plt.xlabel('专辑包含歌曲数')
plt.ylabel('专辑数量')
plt.grid(axis='y', alpha=0.3)

# 3. 热度分段的音频质量对比
plt.subplot(2, 2, 3)
pop_quality = df.groupby('pop_range', observed=True)[['hq_size_mb', 'mq_size_mb', 'lq_size_mb']].mean()
pop_quality.plot(kind='bar', ax=plt.gca(), width=0.8)
plt.title('不同热度段的音频文件大小', fontsize=14, fontweight='bold')
plt.xlabel('热度范围')
plt.ylabel('平均文件大小（MB）')
plt.xticks(rotation=0)
plt.legend(['高质量', '中等质量', '低质量'])
plt.grid(axis='y', alpha=0.3)

# 4. 发布时间分布（如果有publishTime数据）
plt.subplot(2, 2, 4)
# 检查publishTime是否有有效数据
publish_data = df[df['publishTime'] > 0]['publishTime']
if len(publish_data) > 0:
    publish_years = pd.to_datetime(publish_data, unit='ms').dt.year.value_counts().sort_index()
    plt.bar(publish_years.index, publish_years.values, color='lightblue', edgecolor='black', linewidth=0.5)
    plt.title('歌曲发布时间分布', fontsize=14, fontweight='bold')
    plt.xlabel('年份')
    plt.ylabel('歌曲数量')
else:
    # 如果publishTime无效，显示版权方歌曲数量Top10
    cp_song_count = df['copyright_id'].value_counts().head(10)
    plt.bar(range(len(cp_song_count)), cp_song_count.values, color='lightblue', edgecolor='black', linewidth=0.5)
    plt.title('版权方歌曲数量 Top 10', fontsize=14, fontweight='bold')
    plt.xlabel('版权方ID')
    plt.ylabel('歌曲数量')
    plt.xticks(range(len(cp_song_count)), cp_song_count.index, rotation=45, ha='right')
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('music_analysis_5.png', dpi=300, bbox_inches='tight')
plt.show()

# 打印数据结构分析报告
print("\n=== 数据结构分析报告 ===")
print("1. 数据结构: JSON格式，包含songs数组")
print("2. 每首歌曲包含以下主要字段:")
print("   - name: 歌曲名称")
print("   - id: 歌曲唯一标识")
print("   - ar: 艺术家数组（包含id、name、别名）")
print("   - al: 专辑信息（包含id、name、封面URL）")
print("   - dt: 歌曲时长（毫秒）")
print("   - h/m/l/sq: 不同质量音频信息（码率、大小、音量差、采样率）")
print("   - pop: 热度值（0-100）")
print("   - cp: 版权信息")
print("3. 主要发现:")
print(f"   - 最长歌曲: {df.loc[df['duration_min'].idxmax(), 'name']} ({df['duration_min'].max():.2f}分钟)")
print(f"   - 最短歌曲: {df.loc[df['duration_min'].idxmin(), 'name']} ({df['duration_min'].min():.2f}分钟)")
print(f"   - 最热门歌曲: {df.loc[df['pop'].idxmax(), 'name']} (热度: {df['pop'].max()})")

# 保存清洗后的数据为CSV
df.to_csv('music_data_cleaned.csv', index=False, encoding='utf-8-sig')
print("\n清洗后的数据已保存为 music_data_cleaned.csv")
print("可视化图表已保存为 music_analysis_1~5.png")

```

以下是李晨煜网易云账号下歌单[“喜欢的音乐”](https://music.163.com/#/playlist?id=8843319661)的统计数据：

| 统计项 | 数值 |
| ---- | ---- |
| 歌曲总数量 | 1000 首 |
| 唯一艺术家总数 | 427 位 |
| 唯一专辑总数 | 776 张 |
| 单曲平均时长 | 3.12 分钟 |
| 歌曲平均热度 | 81.0（满分100） |

| 类型 | 歌曲名称 | 对应数值 |
| ---- | ---- | ---- |
| 最长歌曲 | Dialogue Vol.1「前略、終わらない鼓動と」 | 19.18 分钟 |
| 最短歌曲 | 悬疑哈基米 | 0.43 分钟 |
| 热度最高歌曲 | 求&影 (feat. 重音テト) | 热度 100 |

![music_analysis.webp](/img/2026.6.30/music_analysis.webp)
![music_analysis_2.webp](/img/2026.6.30/music_analysis_2.webp)
![music_analysis_3.webp](/img/2026.6.30/music_analysis_3.webp)

:::warning 歌曲时长与热度没有直接相关性。图中回归曲线有误。
:::

![music_analysis_4.webp](/img/2026.6.30/music_analysis_4.webp)
![music_analysis_5.webp](/img/2026.6.30/music_analysis_5.webp)
