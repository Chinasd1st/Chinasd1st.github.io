import { defineUserConfig } from "vuepress";
import { hopeTheme } from "vuepress-theme-hope";
import metingPlugin from "vuepress-plugin-meting2";
import dotenv from "dotenv";
// import { commentPlugin } from '@vuepress/plugin-comment'
// import { prismjsPlugin } from '@vuepress/plugin-prismjs'

import theme from "./theme.js";
import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

// 可选：用环境变量管理密钥，避免硬编码
const {
  ALGOLIA_APP_ID,
  ALGOLIA_INDEX_NAME,
  ALGOLIA_SEARCH_API_KEY, // 这是search-only key，前端可公开
} = process.env as Record<string, string>;

dotenv.config();

export default defineUserConfig({

  head: [
    // busuanzi 访问统计
    [
      "script",
      {
        async: "true",
        src: "//api.busuanzi.cc/static/3.6.9/busuanzi.min.js",
      },
    ],
  ],

  base: "/",

  plugins: [
    metingPlugin({
      metingOptions: {
        global: false, // 开启关闭全局播放器
        server: "netease",
        api: "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&auth=:auth&r=:r",
        type: "album",
        mid: "253946279",
      },
      aplayerOptions: {
        theme: "#1e7fe6ff",
      },
    }),
  ],

  lang: "zh-CN",
  title: "小奶奶博客",
  description: "分享各种小奶奶内容 这使人感到有趣味",

  theme: hopeTheme({
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
    footer:
      "小奶奶网站 <a href='https://stats.uptimerobot.com/NCUFdoSfM4' target='_blank'>Status</a>",
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
      medias: {
        // Baidu: "https://example.com",
        BiliBili: "https://space.bilibili.com/520682236",
        // Bitbucket: "https://example.com",
        // Dingding: "https://example.com",
        // Discord: "https://example.com",
        // Dribbble: "https://example.com",
        // Email: "mailto:info@example.com",
        // Evernote: "https://example.com",
        // Facebook: "https://example.com",
        // Flipboard: "https://example.com",
        // Gitee: "https://example.com",
        // GitHub: "https://example.com",
        // Gitlab: "https://example.com",
        // Gmail: "mailto:info@example.com",
        // Instagram: "https://example.com",
        // Lark: "https://example.com",
        // Lines: "https://example.com",
        // Linkedin: "https://example.com",
        // Pinterest: "https://example.com",
        // Pocket: "https://example.com",
        // QQ: "https://example.com",
        // Qzone: "https://example.com",
        // Reddit: "https://example.com",
        // Rss: "https://example.com",
        // Steam: "https://example.com",
        Twitter: "https://x.com/Silentnrtx",
        // Wechat: "https://example.com",
        // Weibo: "https://example.com",
        // Whatsapp: "https://example.com",
        // Youtube: "https://example.com",
        // Zhihu: "https://example.com",
        // VuePressThemeHope: {
        //   icon: "https://theme-hope-assets.vuejs.press/logo.svg",
        //   link: "https://theme-hope.vuejs.press",
      },
    },

    // 加密配置
    encrypt: {
      config: {
        "/old/2025/02/RyoukiArticle": {
          hint: "密码在群公告中",
          password: process.env.PASSWORD!,
        },
      },
    },

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
      },

      // 取消注释它们如果你需要 TeX 支持
      // markdownMath: {
      //   // 启用前安装 katex
      //   type: "katex",
      //   // 或者安装 mathjax-full
      //   type: "mathjax",
      // },

      // 如果你需要幻灯片，安装 @vuepress/plugin-revealjs 并取消下方注释
      // revealjs: {
      //   plugins: ["highlight", "math", "search", "notes", "zoom"],
      // },

      // 在启用之前安装 chart.js
      chartjs: true,

      // insert component easily

      // 在启用之前安装 echarts
      echarts: true,

      // 在启用之前安装 flowchart.ts
      // flowchart: true,

      // 在启用之前安装 mermaid
      // mermaid: true,

      // playground: {
      //   presets: ["ts", "vue"],
      // },

      // 在启用之前安装 @vue/repl
      // vuePlayground: true,

      // 在启用之前安装 sandpack-vue3
      // sandpack: true,
    },

    // 在这里配置主题提供的插件
    plugins: {
      // search: true,
      // search: {
      //   插件选项
      // },
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

      notice: [
        {
          path: "/",
          title: "网站更新",
          content:
            "网站近日使用SCSS对APlayer增加了深色模式支持，但在包含有播放器的界面切换深浅色主题时会遇到卡顿，目前暂无有效办法解决这一问题。",
          actions: [{ text: "确认" }],
          // fullscreen: true,
          showOnce: true,
        },
      ],

      // 启用之前需安装 @waline/client
      // 警告: 这是一个仅供演示的测试服务，在生产环境中请自行部署并使用自己的服务！
      // comment: {
      //   provider: "Waline",
      //   serverURL: "https://waline-comment.vuejs.press",
      // },

      components: {
        components: ["Badge", "VPCard", "VidStack", "BiliBili","PDF"],
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

      // 如果你需要 PWA。安装 @vuepress/plugin-pwa 并取消下方注释
      // pwa: {
      //   favicon: "/favicon.ico",
      //   cacheHTML: true,
      //   cacheImage: true,
      //   appendBase: true,
      //   apple: {
      //     icon: "/assets/icon/apple-icon-152.png",
      //     statusBarColor: "black",
      //   },
      //   msTile: {
      //     image: "/assets/icon/ms-icon-144.png",
      //     color: "#ffffff",
      //   },
      //   manifest: {
      //     icons: [
      //       {
      //         src: "/assets/icon/chrome-mask-512.png",
      //         sizes: "512x512",
      //         purpose: "maskable",
      //         type: "image/png",
      //       },
      //       {
      //         src: "/assets/icon/chrome-mask-192.png",
      //         sizes: "192x192",
      //         purpose: "maskable",
      //         type: "image/png",
      //       },
      //       {
      //         src: "/assets/icon/chrome-512.png",
      //         sizes: "512x512",
      //         type: "image/png",
      //       },
      //       {
      //         src: "/assets/icon/chrome-192.png",
      //         sizes: "192x192",
      //         type: "image/png",
      //       },
      //     ],
      //     shortcuts: [
      //       {
      //         name: "Demo",
      //         short_name: "Demo",
      //         url: "/demo/",
      //         icons: [
      //           {
      //             src: "/assets/icon/guide-maskable.png",
      //             sizes: "192x192",
      //             purpose: "maskable",
      //             type: "image/png",
      //           },
      //         ],
      //       },
      //     ],
      //   },
      // },
    },
  }),

  // theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});