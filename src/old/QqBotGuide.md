---
date: 2024-09-23
category:
  - 存档
  - 其他
---

# QQ机器人使用指南

::: danger 该机器人暂时停止使用。
:::

[[toc]]

## 简介

本机器人基于[Koishi](https://koishi.chat/)开源项目搭建。该项目使用MIT许可证。  
开不开看我心情。  
标有<Badge type="warning" text="Experimental" vertical="middle" />的指令为实验指令，功能可能无法正常使用。

## Kbot

[项目主页](https://github.com/Kabuda-czh/koishi-plugin-kbot)

### bilibili

```bash
/bilibili ( -a | -b | -r | -s | -l | -v | -d | -re | -ck ) <value>
```

Bilibili 相关功能

别名：/bilibili，/Bilibili。

最低权限: 2 级

可用的选项有：

- `-a, --add <upInfo>`  添加订阅, 请输入要添加的 up 主的 uid 或者 名字

- `-b, --batch [...upInfo]`  批量添加订阅, 请输入要添加的 up 主的 uid 或者 名字, 以逗号分隔

- `-r, --remove <upInfo>`  移除订阅, 请输入要移除的 up 主的 uid 或者 名字

- `-s, --search <upInfo>` 查看最新动态, 请输入要查看动态的 up 主的 uid 或者 名字

- `-l, --list`  展示当前订阅 up 主列表

- `-v, --vup <upInfo>`  查成分, 请输入要查看成分的 up 主的 uid 或者 名字

- `-d, --danmu <upInfo>`  查弹幕, 请输入要查看弹幕的 up 主的 uid 或者 名字

- `--re, --refresh`  更新 vup

- `--ck, --cookie <cookie>` 更新 cookie

使用示例： bilibili -a 123456 或者 bilibili -a 名字

### twitter <Badge type="warning" text="Experimental" vertical="middle" />

```bash
/twitter ( -a | -b | -r | -s | -ck | -l ) <value>
```

Twitter 相关功能

别名：/twitter，/Twitter。

最低权限: 2 级

可用的选项有：

- `-a, --add <userId>`  添加订阅, 请输入要添加的 twitter 博主的 id 名字(指 @后的字符串)

- `-b, --batch [...userId]`  批量添加订阅, 请输入要添加的 twitter 博主的 id 名字(指 @后的字符串), 以逗号分隔

- `-r, --remove <userId>`  移除订阅, 请输入要移除的 twitter 博主的 id 名字(指 @后的字符串)

- `-s, --search <userId>`  查看最新动态, 请输入要查看动态的 twitter 博主的 id 名字(指 @后的字符串)

- `-ck, --cookie <cookie>`  设置 twitter cookie, 请在登录 twitter 后使用浏览器的开发者工具获取

- `-l, --list`  展示当前订阅 twitter 博主列表



### 天气

```bash
天气 <city>
```

查询城市天气。

### 今日新闻

```bash
今日新闻
```

获取60秒看世界新闻。

别名：新闻。

## 塔罗牌

```bash
/塔罗牌
```

抽塔罗牌，主题为碧蓝档案。

## music

```bash
music <keyword...>
```

搜索歌曲并生成语音

别名：mdff，点歌。

可用的选项有：

- `-p, --platform <platform>`  点歌平台，目前支持 qq, netease, 默认为 netease

## emojihub-bili

输入指令，获取一张对应表情包

目前共支持40套表情包

点击下方展开所有支持指令

::: details 点击查看指令

| 表情包名称 |
|------------|
| 随机emojihub表情包 |
| 本地图库示例表情包 |
| 网络图片示例表情包 |
| 2233娘小剧场表情包 |
| acomu414表情包 |
| ba表情包 |
| capoo表情包 |
| chiikawa表情包 |
| downvote表情包 |
| doro表情包 |
| eveonecat表情包 |
| fufu表情包 |
| girlsbandcry表情包 |
| kemomimi表情包 |
| koishi-meme表情包 |
| mygo表情包 |
| seseren表情包 |
| 阿夸表情包 |
| 阿尼亚表情包 |
| 白圣女表情包 |
| 白圣女漫画表情包 |
| 柴郡表情包 |
| 甘城猫猫表情包 |
| 孤独摇滚表情包 |
| 狗妈表情包 |
| 滑稽表情包 |
| 疾旋鼬表情包 |
| 流萤表情包 |
| 龙图表情包 |
| 小c表情包 |
| 男娘武器库表情包 |
| 千恋万花表情包 |
| 赛马娘表情包 |
| 瑟莉亚表情包 |
| 小黑子表情包 |
| 心海表情包 |
| 绪山真寻表情包 |
| 亚托莉表情包 |
| 永雏小菲表情包 |
| 宇佐紀表情包 |

:::

## pixluna

```bash
pixluna <tag...>
```

来张色图

别名：色图。

可用的选项有：

- `-n, --number <value>`
- `-s, --source <source>`

可用的子指令有：

- `/pixluna get`  直接通过图源获取图片
- `/pixluna source`  查看图源

下列内容引用自[插件repo](https://www.npmjs.com/package/koishi-plugin-pixluna/v/2.3.2)：

>
>使用方法:
>
>指令pixluna，输入pixluna即可，后面可以跟上关键词 如
>
>```bash
>pixluna 黑丝
>```
>
>即可随机获取一张黑丝的图片
>
>-n 选项为指定获取的图片数量，默认为一张，最大不超过10张，如
>
>```bash
>pixluna -n 5 黑丝
>```
>
>即可随机获取5张黑丝的图片，关键词一定要放在最后面

### 支持图源

- pixiv
  - discovery
  - following
- lolicon-like
  - lolicon（目前使用）
  - lolisuki
- danbooru
- e621
- gelbooru
- konachan
- lolibooru
- safebooru
- sakanku
- yande

## 扫雷

koishi-plugin-minesweeper-ending 是一个基于 Koishi 框架的插件，实现了一个简单无猜扫雷残局。

指令：ed

别名：扫雷残局，minesweeper-ending。

可用的选项有：

- `-f, --force`

可用的子指令有：

- `ed|残局`：开启一局扫雷残局
- `ed.s|打开`：开始扫雷游戏，需要一次性输入序号打开所有的空格
  - 序号必须是连续的，示例：破解 0412
  - 快捷指令，可以使用 s0412, 该指令等价于 破解 0412
- `ed.f|标记`: 输入雷的序号，将所有雷标记出来同样可以获得胜利
  - 快捷指令，可以使用 f0412 , 该指令等价于 标记 0412
- `ed.flag`: 开启或关闭标记模式，可以使用 0412 代替 f0412 或 s0412, 取决于当前是否开启标记模式
- `ed.end|不玩了`：停止扫雷游戏，会清除当前的游戏状态
- `ed.l|揭晓`：获取扫雷所有的答案
- `ed.n|刷新残局`：刷新残局
- `ed.r|雷神殿|雷神榜`：查看扫雷排行榜，会显示前十名玩家的昵称和积分。成功破解积分+1*剩余bv；破解失败积分-1。
- `ed.fight`: 开启挑战
- `ed.挑战榜`: 查看挑战模式排行榜
- `ed.生涯`: 查看扫雷生涯：胜率、头衔、积分、局数

### 规则

- 残局模式
  1. 玩家在群里发送 `残局`将开启游戏
  2. 使用 `打开` 或 `标记` 命令，打开BV或标记雷
  3. 玩家需要将所有非雷方块打开或者将所有雷标记出来方终结比赛，终结比赛的玩家获得双倍积分
  4. 胜利玩家将获得 `剩余BV*1` 积分奖励，未能一次性开出所有BV或标记出所有雷的玩家将扣除1积分
  5. 标错或开错将触发冷却，一段时间内禁止玩家操作
  6. 答不全的玩家获得一半的积分
- 挑战模式
  1. 输入 `fight` 开启挑战， 玩家每天能挑战一次, 超过将扣除残局模式获得的积分
  2. 输入 `挑战榜` 查看挑战模式排行榜, 排名第一的玩家将获得 `雷帝` 的头衔

## tagger

```bash
/tagger [rec | view-results] <value>
```

图片反推AI生成标签，角色识别，nsfw程度判断

可用的子指令有：

- `/tagger rec`  图片反推AI生成标签，角色识别，nsfw程度判断
- `/tagger view-results`  查看过往的识别结果

## EEW (EarlyEarthquakeWarning)

```bash
/eew [关闭|开启|测试|平台|目标|重置|状态]
```

提供紧急地震速报相关内容，WebsocketAPI由[Wolfx Project](https://wolfx.jp/)提供

插件相关使用详见<https://www.npmjs.com/package/koishi-plugin-earthquake-early-warning/v/0.1.5>

## waifu

```bash
/marry
/divorce <target>
/force-marry <target>
/propose <target>
```

娶群友

别名：marry，娶群友，今日老婆。

可用的子指令有：

- `divorce`  和群友离婚
- `force-marry`  强娶群友
- `propose`  向群友求婚

## 扩展巴科斯范式（EBNF）表示法

```ebnf
// bilibili指令
/bilibili ( 
  -a <upInfo> | 
  -b <upInfo>{,<upInfo>} | 
  -r <upInfo> | 
  -s <upInfo> | 
  -l | 
  -v <upInfo> | 
  -d <upInfo> | 
  --re | 
  --ck <cookie> 
)

// twitter指令
/twitter ( 
  -a <userId> | 
  -b <userId>{,<userId>} | 
  -r <userId> | 
  -s <userId> | 
  -ck <cookie> | 
  -l 
)

// 天气指令
天气 <city>

// 今日新闻指令
今日新闻 | 新闻

// 塔罗牌指令
/塔罗牌

// music指令
music [ -p <platform> ] <keyword>{ <keyword> }
// 其中platform可选值: qq | netease (默认netease)

// pixluna指令
pixluna [ -n <value> ] [ -s <source> ] <tag>{ <tag> }

// pixluna子指令
/pixluna get
/pixluna source

// 扫雷指令
ed | 扫雷残局 | minesweeper-ending

// 扫雷子指令
ed.s <序号>{ <序号> } | 打开 <序号>{ <序号> } | s<序号>{ <序号> }
ed.f <序号>{ <序号> } | 标记 <序号>{ <序号> } | f<序号>{ <序号> }
ed.flag
ed.end | 不玩了
ed.l | 揭晓
ed.n | 刷新残局
ed.r | 雷神殿 | 雷神榜
ed.fight
ed.挑战榜
ed.生涯

// tagger指令
/tagger rec <value>
/tagger view-results <value>

// EEW指令
/eew ( 关闭 | 开启 | 测试 | 平台 | 目标 | 重置 | 状态 )

// waifu指令
/marry
/divorce <target>
/force-marry <target>
/propose <target>

```
