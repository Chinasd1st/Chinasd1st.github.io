---
url: /post/2026/03/CJKGlyphMixProblem.md
description: >-
  中日韩混排字形串味怎么办？从 Unicode Han Unification 根源讲起，分享局部 lang 标记 + Noto
  字体栈的实用方案，避免全局设置导致的 UI 异常。
---
# 中日韩混排的字形难题：从日文页面字体适配说起

> 封面：By Emphrase - Own work, Public Domain, Link

## 起因：网站纯日文文章的字体问题

前几天把 VCCL 的声库统计数据搬到网站上来后，因为网页内容几乎全都是日文，我便想着使用日文字体解决字形不匹配的问题。使用日文字体很简单，在 head 中引入 Google Fonts 即可，参考我之前换用 Noto Sans SC 的流程：

```typescript title=".vuepress/config.ts"
...
[
      "link",
      {
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap",
        rel: "stylesheet",
      },
],
...
```

随后在博客的 `palette.scss` 中编辑字体引用即可。由于并不是全站都使用JP字形，需要用选择器进行限定。在限定之前，我们还需要标记哪些网页需要使用JP字形。首先想到的是在 **YAML Frontmatter** 中编辑网页的 `lang` 属性（直接改为ja-JP）；

```yaml
lang: ja-JP
```

但是这么操作就会导致网页下方的Twikoo字体出现异常：不难推知Twikoo组件直接通过网页html标签中的lang属性来推测网页语言，这样一来不仅中文汉字只能显示为宋体（SimSun），UI的语言也会变为英语。此外，网页正文外的内容，如 `navbar` 、`sidebar` 等，也会被迫变为JP字形。

于是我考虑弃用这一方法。既然修改全局根语言属性会引发全局 UI 与第三方组件的异常，那么最优解就是仅对目标页面的正文内容做语言与字体的限定，而 Theme Hope 恰好提供了对应的原生能力。查阅 Theme Hope 文档可知，官方提供了在 YAML Frontmatter 中[自定义容器 Class](https://theme-hope.vuejs.press/zh/guide/layout/page.html#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AE%B9%E5%99%A8-class)的选项。默认情况下，每个页面都会渲染在 `class` 为 `theme-container` 的 `div` 中。修改页面容器的类名就允许我们使用SCSS选择器匹配特定语言的标记来实现替换字体。

```yaml
containerClass: lang-ja
```

```scss title=".vuepress/styles/palette.scss"
.theme-container.lang-ja div#markdown-content {
  font-family: "TorusPro", "Noto Sans JP", "Noto Sans SC", sans-serif;
}
```

这个选择器即匹配形如

```html
<element class="theme-container lang-ja">
  …
    <div id="markdown-content">
```

的元素。由于网页中没有类名也是 `theme-container lang-ja` 的元素，所以没有必要强耦合div这一标签。

## 什么造成了中日韩字形如此混乱？

在互联网上，我们时常遇到一个汉字在不同的字体中显示不同的情况。这是因为不同语言中汉字的字形并非完全相同，甚至有很大差异。这一切的源头要追溯到 Unicode 的设计决策。这种同一汉字在不同语言环境下的字形差异，根源在于 Unicode 的 CJK 统一表意文字设计，也就是业内常说的**Han Unification（汉字统一编码）**。当年 Unicode 与 ISO/IEC 10646 国际编码标准融合时，为了避免同源同义的汉字重复编码，决定将中、日、韩三地同源、语义对等、仅存在地域字形差异的汉字，合并到同一个 Unicode 码位中。\[^1]

![“直”在不同地区的不同字形，参见直 - 中日韩汉字求同询异 - 书同文汉字网](/img/2026.3.22/1-zhi.webp)

![“返”在不同地区的不同字形 - By \<a href="//commons.wikimedia.org/wiki/User:Emphrase" title="User:Emphrase">Emphrase\</a> - \<span class="int-own-work" lang="en">Own work\</span>, \<a href="https://creativecommons.org/licenses/by-sa/4.0" title="Creative Commons Attribution-Share Alike 4.0">CC BY-SA 4.0\</a>, \<a href="https://commons.wikimedia.org/w/index.php?curid=83392604">Link\</a>](/img/2026.3.22/Source_Han_Sans_Version_Difference.svg)

![Source Han Sans 五地区字形对比（简中/台繁/港繁/日/韩）- By \<a href="//commons.wikimedia.org/wiki/User:Emphrase" title="User:Emphrase">Emphrase\</a> - \<span class="int-own-work" lang="en">Own work\</span>, Public Domain, \<a href="https://commons.wikimedia.org/w/index.php?curid=83381606">Link\</a>](/img/2026.3.22/Source_Han_Sans_Version_2_Specimen.svg)

针对同一码位的地域字形差异，行业有两种主流解决方案：一是像 **Noto Sans** 系列这样，按地区拆分独立的字体文件，直接通过字体引入决定渲染字形；二是制作 CJK 超集字体，在单文件内为同一码位准备多套字形变体，通过 **OpenType** 的 `locl（Localized Forms）`特性，匹配元素的lang属性自动切换对应字形。\[^2]

* 当 `lang="ja"` 时 → 显示日文字形
* 当 `lang="zh-Hans"` 时 → 显示简中字形
* 当 `lang="zh-Hant"` 时 → 显示繁中字形

若仅给页面全局设置单一lang属性，一篇文章内的中日韩混排内容，必然会出现部分文字字形错配；而 HTML 规范原生支持局部语言标记，可对不同语言的内容单独设置lang属性，这也是解决混排字形问题的W3C原生标准方案。

这可以说是 Unicode 在几十年前留下的技术债。当年为了节省码位而将汉字统一编码，却把“同一码位该显示哪种字形”的决定权交给了字体厂商和渲染引擎，导致开发者与设计师至今仍需花费大量精力处理兼容问题。

1993年，日本电子信息技术产业协会（一般社団法人电子情报技术产业协会，JEIDA）出版了一本小册子，标题为“未来の文字コード体系に私達は不安をもっています｡”（我们对未来的字符编码体系感到不安，[JPNO 20985671](https://ndlsearch.ndl.go.jp/en/openurl?cs=api_openurl\&f-ndl_jpno=20985671)），总结了对Unicode采用的汉字统一（Han Unification）方法的主要批评。\[^1]

## 多邻国的解决方案

多邻国作为全球主流的语言学习平台，天然存在大量多语言混排的内容场景。通过分析其页面源码可以发现，多邻国采用了HTML 原生精细化语言标记的核心方案：页面全局根标签设置主语言，所有日语学习内容的区块、短语，均通过`<span lang="ja">`标签单独标记日语属性，同时为不同lang属性的元素配置对应的字体栈。这套方案的核心，是通过精准的语言标记，同时触发字体的locl地域字形特性与 CSS 字体 fallback 规则，确保日语汉字始终渲染正确的日文字形，同时不影响其他语言内容的正常展示。

## SCSS泛用CJK混排方案

以下是我总结的scss代码：

```scss
/* 简中优先 */
:root {
  --font-sans: "Noto Sans SC", "Source Han Sans SC", system-ui, sans-serif;
}

/* 日文 */
.lang-ja,
:lang(ja) {
  font-family: "Noto Sans JP", "Source Han Sans JP", var(--font-sans);
}

/* 韩文 */
.lang-ko,
:lang(ko) {
  font-family: "Noto Sans KR", "Source Han Sans KR", var(--font-sans);
}
```

\[^1]: [Wikipedia. Han unification.](https://en.wikipedia.org/wiki/Han_unification)
\[^2]: <https://fonts.google.com/noto>
