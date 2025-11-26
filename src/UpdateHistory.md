---
icon: clock-rotate-left
date: 2023-10-28
category:
  - 存档
  - 网站事宜
---

# 更新历史

## 2025.11.26 v1.0.0

- <Badge type="tip" text="CoreUpdate" vertical="middle" /> 改用Vuepress Theme Hope主题（本改动实则早在2025年2月就已作出）
- <Badge type="tip" text="CoreUpdate" vertical="middle" /> 引入`@vuepress/plugin-docsearch`等多个组件，支持由algolia提供的搜索服务
- <Badge type="info" text="Info" vertical="middle" /> 改进原先不规范的版本号命名，换用Semantic Versioning 2.0.0(`主版本号.次版本号.修订号`) 作为命名规范
- <Badge type="info" text="Info" vertical="middle" /> 更换字体：

``` scss title=".vuepress/styles/palette.scss" :line-numbers=2
$vp-font: 'Torus, "Noto Sans SC", sans-serif';
$vp-font-heading: 'Torus, "Noto Sans SC", sans-serif';
$vp-font-mono: 'Cascadia Code, "Noto Sans SC", Consolas, "Courier New", monospace'
```

``` scss title=".vuepress/styles/index.scss" :line-numbers=9
@font-face {
  font-family: "Torus";
  src: url("/assets/fonts/Torus-SemiBold.ttf") format("truetype");
  font-weight: 600; /* SemiBold */
  font-style: normal;
  font-display: swap;
}
body {
  font-family: "Torus", "Noto Sans SC", sans-serif;
}
```

- <Badge type="info" text="Iprv" vertical="middle" /> 处理Aplayer在深色模式下的样式问题

``` scss title=".vuepress/styles/index.scss" :line-numbers=3
.aplayer {
  // 确保背景色可以被覆盖
  background: transparent !important;
  color: var(--text-color) !important;
}
```

- <Badge type="info" text="Iprv" vertical="middle" /> 优化文件directory，按照yyyy/mm/dd的结构进行分类
- <Badge type="info" text="Iprv" vertical="middle" /> 引入`fontawesome-with-brands` icon库，增强页面内容丰度
- <Badge type="info" text="？？？" vertical="middle" /> 2025年2月以来已经写了16篇文章，令人感叹（

## 2025.02.03 v0.0.4

- <Badge type="tip" text="ContentUpdate" vertical="middle" /> 新增板块[猎奇文章合集](/old/2025/02/RyoukiArticle.md)，内含多篇由Deepseek LLM生成的文章（包括《万象汇盒马鲜生发生高空坠物事故 一儿童不幸身亡》、《永辉超市智能货架酿惨剧 四岁女童命丧"无人化"安全隐患》、《黄睿涵被他的黄毛奶奶锁在家里，但是他要去看肖战的新电影》、《卤汁与锈斑》等）
- <Badge type="important" text="CoreUpdate" vertical="middle" /> 新增四个插件（如下）

```js title=".vuepress/config.js"
import { readingTimePlugin } from '@vuepress/plugin-reading-time'; //支持显示阅读所需时间（未启用）
import { noticePlugin } from '@vuepress/plugin-notice';//支持在网页右上角显示通知
import { watermarkPlugin } from '@vuepress/plugin-watermark';//支持添加水印（仅在猎奇文章合集页面启用）
import { copyrightPlugin } from '@vuepress/plugin-copyright';//支持在用户复制时追加版权信息（未启用）
// 或禁止复制（仅在猎奇文章合集页面启用）
```

## 2025.01.12 v0.0.3

- <Badge type="tip" text="ContentUpdate" vertical="middle" /> 极限挑战S20E02更名为[极限挑战：生命挑战](/old/2024/10/dianBi.md)，增加了电击逃生 - 智勇大挑战，化学逃生 - 智慧与勇气的较量两个板块
- <Badge type="tip" text="ContentUpdate" vertical="middle" /> 小奶奶新闻新增2024年度回顾和2025.01.12某三人钻某店铺大门的视频
- <Badge type="important" text="CoreUpdate" vertical="middle" /> 增加`markdownItKatex`扩展，更新网站内核至`vuepress2.0.0-rc.19`
- <Badge type="info" text="Iprv" vertical="middle" /> 小奶奶新闻界面视频支持预加载

## 2024.12.02 新增文理联赛讽刺作品集

[文理联赛讽刺作品合集](/old/2024/12/ASCompetition.md)

## 2024.09.29 v0.0.2

网站更新为`vuepress v2.0.0-rc.12`内核（原为`vuepress v1.x`），内容样式大幅调整，同时做出以下更新：

- 删除所有网站内视频，如有需要可查看阿里云盘内相关内容
- 删除gitalk组件（已于`v.alpha-0.0.3`版本恢复）
- 删除APlayer播放器（已于`v.alpha-0.0.3`版本恢复）

## 2023.11.13 紧急通知

网站最近新添加四个插件：

- [@vuepress/plugin-medium-zoom](https://vuepress.vuejs.org/zh/plugin/official/plugin-medium-zoom.html)
- [@vuepress/plugin-nprogress](https://vuepress.vuejs.org/zh/plugin/official/plugin-nprogress.html)
- [@vuepress/plugin-active-header-links](https://vuepress.vuejs.org/zh/plugin/official/plugin-active-header-links.html)
- [@vuepress/back-to-top](https://vuepress.vuejs.org/zh/plugin/official/plugin-back-to-top.html)

在这期间，网站可能出现不稳定、加载失败、页面无法跳转等现象。若有出现上述情况，请尝试以下解决方案：

- 按下键盘`ctrl`+`R`键进行网页强制刷新
- （没有）（苦露西

注：王浩宇先生投稿的几首诗，由于时间问题，没有进行编辑，请见谅。

另：我们的网站还没有*icon*，现向大家征集一个网站icon。

## 2023.11.4 v0.0.1

本次更新，我们将网站的目录结构进行了重构。
