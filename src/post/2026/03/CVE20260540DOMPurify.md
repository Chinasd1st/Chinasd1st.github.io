---
date: 2026-03-13
category:
  - 计算机技术
tags: 
  - 计算机
  - 漏洞
icon: bug
---

# DOMPurify XSS 漏洞绕过：对我的影响——开源是否更安全？

最近笔者闲来无事关注一些互联网资讯时发现 DOMPurify 爆了一个漏洞，因为我的站点大量依赖（大嘘） Mermaid 来画图，而 Mermaid 的上游依赖有 DOMPurify，这令人忍俊不禁。

## 具体漏洞

DOMPurify 是一个用于 HTML、MathML 和 SVG 的高性能、可容错的 DOM 级 XSS 清洗库。

在 3.1.3-3.3.1 和 2.5.3-2.5.8 版本中，其 `SAFE_FOR_XML` 配置相关的正则表达式由于缺失了对五个 Rawtext 元素（noscript, xmp, noembed, noframes, iframe）的处理，导致存在逻辑缺陷。

攻击者可以通过在属性值中构造包含闭合标签（如 `</noscript>`）的恶意载荷，在清洗后的内容被放置于上述 Rawtext 上下文时实现闭合绕过，从而触发跨站脚本攻击（XSS）。^[[阿里云漏洞库. DOMPurify 属性清洗绕过 XSS 漏洞(CVE-2026-0540).](https://avd.aliyun.com/detail?id=AVD-2026-0540)]

CVSS v4.0 ≈ 5.1, AV:N/AC:L/AT:N/PR:N/UI:A/VC:N/VI:N/VA:N/SC:L/SI:L/SA:N^[[NVD - CVE-2026-0540.](https://nvd.nist.gov/vuln/detail/CVE-2026-0540)]

### 受影响版本

- **3.x 分支**：3.1.3 ≤ x ≤ 3.3.1
- **2.x 分支**：2.5.3 ≤ x ≤ 2.5.8

### External Links

GitHub Advisory GHSA-v2wj-7wpq-c8vv：<https://github.com/advisories/GHSA-v2wj-7wpq-c8vv>

NVD Detail: <https://nvd.nist.gov/vuln/detail/CVE-2026-0540>

## 对我的直接影响

这一漏洞对本人的影响约等于0。
Mermaid 在 Vuepress 中是客户端渲染，并且 Twikoo 评论系统作为一个轻量级的 MD 评论组件原生不支持 Mermaid 图表渲染，进而导致攻击者根本没有乘虚而入的机会。外加我使用纯静态部署 + Github Pages，没人会费力攻击。

如果你的项目中可能受到影响，可以运行`npm audit fix`来自动更新到`^3.3.2 || ^2.5.9`来解决问题。

```sh
$ npm audit

found 3 vulnerabilities (1 moderate, 2 high)
run `npm audit fix` to fix them, or `npm audit` for details

$ npm audit fix

...

```

## 警钟

DOMPurify这一次爆雷并非孤案，就在同天，CVE-2025-15599 披露 DOMPurify 存在 SAFE_FOR_XML 正则遗漏 `<textarea>` 等 rawtext 元素处理的问题，提醒广大前端开发者注意关注供应链漏洞。

而这还是小巫见大巫。譬如去年十二月的 **React2Shell** 致命漏洞（CVE-2025-55182）,CVSS评分直接来到一个满分10分，Cloudflare 在紧急部署防护规则时，间接导致了一次约半小时的局部停摆。^[[Critical Security Vulnerability in React Server Components – React.](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)] ^[[Cloudflare outage on December 5, 2025.](https://blog.cloudflare.com/5-december-2025-outage)]RSC的引入虽优化了前端网页的性能，但也在无形间产生了安全风险。一旦协议验证不足，后果就是服务器直接沦陷。前端开发越来越“全栈化”，我们享受便利的同时，也把后端风险带进了浏览器生态。

针对这类事件（Github Actions 供应链投毒等），有人将其归咎于开源社区的风险，然而事实并非如此。正如 **真理元素（Veritasium）** 2月26日发布的有关 XZ 投毒事件视频中所言：

> In fact, who's to say that there aren't already state spies working as paid software engineers at some of the larger companies putting in exactly backdoors like this? But then there would be no community member running free testing and detecting this by chance. This backdoor, if anything, underlines the ethos of open source. ^[[Youtube. The Internet Was Weeks Away From Disaster and No One Knew.](https://www.youtube.com/watch?v=aoag03mSuXQ)]

这类后门事件反而证明了开源精神的核心不在于所谓的“权威”，而是这份难能可贵的公开透明。
