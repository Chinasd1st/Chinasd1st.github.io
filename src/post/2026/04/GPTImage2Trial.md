---
date: 2026-04-25
category:
    - 人工智能
tags: 
    - OpenAI
    - ChatGPT
    - LLM
    - 文生图
    - AI
icon: comment-nodes
cover: /img/Cover/2026.4.25/cover.webp
---
# ChatGPT Images 2.0 实测：角色 + 城市特色平面海报生成效果

2026年4月21日，OpenAI 正式向所有 ChatGPT 用户全量推送了 **GPT Images 2.0** 图像生成模型。这次更新被视为继 DALL·E 3 之后，OpenAI 在文生图领域的一次重大迭代。GPT Images 2.0 在图像细节、文字渲染、风格控制以及复杂构图能力上都有显著提升，尤其在平面设计、海报排版等需要精准控制的场景中表现更为出色。

本人在模型全量推送后第一时间体验了这一模型的文生图能力。以下是相关测试结果。

- 提示词参考：
  - [gpt image 2生成的赛马娘平面构成海报. Sunny_Wind. 哔哩哔哩.](https://www.bilibili.com/video/BV1SBobBuEYY)

- OpenAI 介绍页：
  - [ChatGPT 图像 2.0 现已上线. OpenAI](https://openai.com/zh-Hans-CN/index/introducing-chatgpt-images-2-0/)

## 角色 + 地区特色平面海报

### 小樽市

:::tip 生成提示词
帮我生成一张平面构成海报，主题为日本北海道小樽市，介绍当地运河、玻璃工坊与复古文艺特色，部分构成要素用镂空排版，用 反色蒙版 遮住人物一部分，呈现现代设计感，以给出的参考图人物为标准参考，配色主色：#F8BBD0（柔粉）、#CE93D8（淡紫），辅色：#F5F5F5（奶白）、#424242（深灰），点缀：#FFB347（暖橙），要求有英日文字点缀，整体充满几何感，横向排版 Make the aspect ratio 16:9
:::

> **角色参考**：小春六花(こはるりっか) [X@rikka_info](https://x.com/rikka_info/status/1803548318829871198?s=20)

![Reference](/img/2026.4.25/1_1/ref.webp)

![Result](/img/2026.4.25/1_1/1_1.webp)

### 春日部市

::: tip 生成提示词
帮我生成一张平面构成海报，主题为日本埼玉县春日部市，介绍当地风俗特色、旅游景点，部分构成要素用镂空排版，用 反色蒙版 遮住人物一部分，呈现出现代设计感，以给出参考图的人物为标准参考，配色主色：#6c3c24（深棕色）#ffcd31（亮黄）、辅色：#5ddeff（亮蓝）（层次）点缀：亮色（多彩），要求有英日文字点缀，整体充满几何感，横向排版 Make the aspect ratio 16:9
:::

> **角色参考**：春日部つむぎ@合成音声ギャル [X@KasukabeTsumugi](https://x.com/KasukabeTsumugi/status/1601450341824102400)

![Reference](/img/2026.4.25/1_2/ref.webp)

![Result](/img/2026.4.25/1_2/1_2.webp)

[Arena](https://arena.ai)的结果（`gpt-image-2 (medium)`）：

![Result](/img/2026.4.25/1_2/1_2_1.webp)

如果 ChatGPT 的额度用完了，不妨试试[Arena](https://arena.ai)，运气好可能会抽到GPT-Image-2（

## 角色一致性 + 提示词服从性测试

### BanG Dream! AI Singing Synthesizer 夢ノ結唱 Banner

::: tip 生成提示词

帮我生成一张平面构成海报，主题为BanG Dream! AI Singing Synthesizer企划夢ノ結唱 ，部分构成要素用镂空排版，用 反色蒙版 遮住人物一部分，蒙版可使用夢ノ結唱汉字，呈现现代设计感，以给出的参考图人物为标准参考，配色：主色辅色参考图中人物主题色，要求有英日文字点缀，整体充满几何感，设计风格参考Bangdream官方，横向排版 ，Make the aspect ratio 16:9，深色主题

| 位置 | 角色名 | HEX     |
| ---- | ------ | ------- |
| 上左 | PASTEL | #33ddaa |
| 上右 | HALO   | #ffdd00 |
| 中   | POPY   | #ff3377 |
| 下左 | AVER   | #881144 |
| 下右 | ROSE   | #3344aa |

:::

![Reference](/img/2026.4.25/2_1/ref.webp)

![Result](/img/2026.4.25/2_1/2_1.webp)

未给出角色和对应 HEX 信息的版本：

![Result](/img/2026.4.25/2_1/2_1_1.webp)

### 黒鉄たま Single *Catch a Fire* Banner

::: tip 生成提示词

帮我生成一张平面构成海报，主题为 電音部企划下角色黒鉄たま曲目《Catch a Fire》，部分构成要素用镂空排版，用 反色蒙版 遮住人物一部分，呈现现代设计感，以给出的参考图人物为标准参考，配色：主色辅色参考图中人物主题色，要求有英日文字点缀，整体充满几何感，横向排版 ，Make the aspect ratio 16:9，深色主题

:::

![Reference](/img/2026.4.25/2_2/ref.webp)

![Result](/img/2026.4.25/2_2/2_2.webp)

GPT 在没有给出电音部 LOGO 的前提下主动查找相关图片并且添加到了生成结果中。

## 图片美学要素分析

::: tip 生成提示词

生成一张摄影美学鉴赏图，分析画面的元素、光影、构图、引导等等，精美，现代，扁平化设计。

:::

![Reference](/img/2026.4.25/3_1/ref.webp)

![Result](/img/2026.4.25/3_1/3_1.webp)

## 总结

GPT Image 2.0 在海报、Banner 等平面设计场景下表现出了较好的提示词服从性与角色一致性（不会刻意修改参考图中的人物特征）。尽管在元素堆叠的逻辑性以及蒙版的准确性上依旧存在问题，但是结合 GPT Image 的迭代速度来看，或许在明年的今天这些问题都将烟消云散。

此外，Image 2.0 仅需简短几句提示词就可以得到相对不错的结果，但是实际使用时建议严格指定画面设计风格以及所使用的技法、主题色等等，这样可以减少抽卡次数。
