import { hopeTheme } from "vuepress-theme-hope";
import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://chinasd1st.github.io",

  author: {
    name: "Silentnrtx",
    url: "https://chinasd1st.github.io",
  },

  logo: "https://theme-hope-assets.vuejs.press/logo.svg",

  repo: "Chinasd1st/Chinasd1st.github.io",

  docsDir: "src",

  lastUpdated: true,

  // 导航栏
  navbar,

  // 侧边栏
  sidebar,

  // 页脚
  footer: "小奶奶网站 <a href='https://stats.uptimerobot.com/NCUFdoSfM4' target='_blank'>Status</a><br /> 今日pv <span id='busuanzi_today_pv'><i class='fa fa-spinner fa-spin'></i></span> 次 / 总pv <span id='busuanzi_site_pv'><i class='fa fa-spinner fa-spin'></i></span> 次",
  displayFooter: true,
  changelog: true,

  navbarLayout: {
    start: ["Brand"],
    center: ["Links"],
    end: ["Repo", "Outlook", "Search"],
  },

  // 博客相关
  blog: {
    description: "美食家",
    intro: "/intro.html",
    avatar: "/assets/avatar/SP6C_01.jpg",
    medias: {
      BiliBili: "https://space.bilibili.com/520682236",
      Twitter: "https://x.com/Silentnrtx",
    },
  },

  // 加密配置
  /*encrypt: {
    config: {
      "/old/2025/02/RyoukiArticle": {
        hint: "密码在群公告中",
        password: process.env.PASSWORD!,
      },
    },
  },*/

  // 多语言配置
  metaLocales: {
    editLink: "在 GitHub 上编辑此页",
  },

  // 如果想要实时查看任何改变，启用它。注: 这对更新性能有很大负面影响
  // hotReload: true,

  // 此处开启了很多功能用于演示，你应仅保留用到的功能。
  markdown: {
    footnote: true,
    mermaid: true,
    revealjs: true,
    math: {
      type: "katex", // 或 'mathjax'
    },
    align: true,
    attrs: true,
    codeTabs: true,
    component: true,
    demo: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    flowchart: true,
    plantuml: true,
    spoiler: true,
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              content: "Recommended",
            };
        },
      },
    ],
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true,
    highlighter: {
      // 代码高亮配置
      type: "shiki",
      lineNumbers: true,
      notationFocus: true,
      notationDiff: true,
      notationWordHighlight: true
    },
    chartjs: true,
    echarts: true,
  },

  // 在这里配置主题提供的插件
  plugins: {
    watermark: {
      enabled: false, // 必须开启插件，否则 frontmatter 无效
    },

    docsearch: {
      appId: process.env.ALGOLIA_APP_ID!,          // 从 Algolia 获取
      apiKey: process.env.ALGOLIA_SEARCH_API_KEY!, // Search-Only API Key
      indexName: "chinasd1stio",
      // 可选：自定义搜索参数

      // 可选：覆盖默认样式
      locales: {
        '/': {
          placeholder: '搜索文档',
          translations: {
            button: {
              buttonText: '搜索',
            },
          },
        },
      },
    },

    blog: {},

    // notice: [
    //   {
    //     path: "/",
    //     title: "网站更新",
    //     content:
    //       "网站近日使用SCSS对APlayer增加了深色模式支持，但在包含有播放器的界面切换深浅色主题时会遇到卡顿，目前暂无有效办法解决这一问题。",
    //     actions: [{ text: "确认" }],
    //     // fullscreen: true,
    //     showOnce: true,
    //   },
    // ],

    components: {
      components: ["Badge", "VPCard", "VidStack", "BiliBili", "PDF"],
    },

    comment: {
      provider: "Twikoo",
      envId:
        "https://spontaneous-lebkuchen-f17631.netlify.app/.netlify/functions/twikoo", // 腾讯云环境ID或自建地址
    },

    icon: {
      assets: "fontawesome-with-brands",
      type: "fontawesome",
    },
  },
});