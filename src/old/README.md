---
title: 小奶奶网站（原主页存档）
home: true
heroText: 小奶奶网站
tagline: 分享各种小奶奶内容 这使人感到有趣味
actions:
  - text: 进入
    link: /old/Grandmother
    type: primary
features:
- title: 关于网站
  details: 冯圣杰先生有点小女性，因此我们创建了这个网站。
- title: 网站内容
  details: 包含许多猎奇和精神污染作品，突破人类底线。
- title: 您能因此获得什么？
  details: 没有。
footer: Site by Silentnrtx
---

## 2025.02.06 网站无法访问的临时解决方案

经实验，Github Pages被中国移动屏蔽，请尽量使用WLAN访问。  
该项目目前已部署至Vercel，**境外用户**可通过下方任意一个URL进行访问。  

```txt
https://xnnweb2.vercel.app/
https://xnnweb2-silentnrtxs-projects.vercel.app/
https://xnnweb2-git-main-silentnrtxs-projects.vercel.app/
```

- 方案一（Windows）：安装[Steamcommunity 302](https://www.dogfight360.com/blog/686/)后运行（需要管理员权限），在设置中看到“本地反代服务选择”一项，勾选“Github 访问”前复选框，重启应用后尝试访问网站。
- 方案二（Windows/Android）：安装[Watt Toolkit](https://steampp.net/)（原Steam++），开启本地反代方法与Steamcommunity 302大同小异，但该方法未经测试。

## 2025.02.03 本站近日新增

- 更新版本号至v.alpha-0.0.4
- <Badge type="tip" text="ContentUpdate" vertical="middle" /> 新增板块[猎奇文章合集](/2025/02/RyoukiArticle.md)，内含多篇由Deepseek LLM生成的文章（包括《万象汇盒马鲜生发生高空坠物事故 一儿童不幸身亡》、《永辉超市智能货架酿惨剧 四岁女童命丧"无人化"安全隐患》、《黄睿涵被他的黄毛奶奶锁在家里，但是他要去看肖战的新电影》、《卤汁与锈斑》等）

> 2025.02.05于该页面更新特别板块：2024年度最猎奇图片

- <Badge type="important" text="CoreUpdate" vertical="middle" /> 新增五个插件（如下）

```js title=".vuepress/config.js"
import { readingTimePlugin } from '@vuepress/plugin-reading-time'; //支持显示阅读所需时间（未启用）
import { noticePlugin } from '@vuepress/plugin-notice';//支持在网页右上角显示通知
import { watermarkPlugin } from '@vuepress/plugin-watermark';//支持添加水印（仅在猎奇文章合集页面启用）
import { copyrightPlugin } from '@vuepress/plugin-copyright';//支持在用户复制时追加版权信息（未启用）
// 或禁止复制（仅在猎奇文章合集页面启用）
import { revealJsPlugin } from '@vuepress/plugin-revealjs'//支持显示幻灯片
```
