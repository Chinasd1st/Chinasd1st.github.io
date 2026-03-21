import { defineUserConfig } from "vuepress";
import metingPlugin from "vuepress-plugin-meting2";
import dotenv from "dotenv";
import { llmsPlugin } from '@vuepress/plugin-llms'
// import { umamiAnalyticsPlugin } from '@vuepress/plugin-umami-analytics'
// import { commentPlugin } from '@vuepress/plugin-comment'
// import { prismjsPlugin } from '@vuepress/plugin-prismjs'

import theme from "./theme.ts"; // 修改这行
// import navbar from "./navbar.js";
// import sidebar from "./sidebar.js";

dotenv.config({ path: '.env.local' });

export default defineUserConfig({

  head: [
    // busuanzi 访问统计
    [
      "script",
      {
        defer: true,
        src: "//cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js",
      },
    ],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
        [
      "link",
      {
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap",
        rel: "stylesheet",
      },
    ],
    [
      'script',
      {
        defer: true,
        src: 'https://cloud.umami.is/script.js',
        'data-website-id': '0775eaf8-19ed-4d8b-ae56-c62a750e0691',
        'data-exclude-hash': 'true',  // ← 核心属性
        'data-auto-track': "true"
      },
    ],
  ],

  base: "/",

  plugins: [
    llmsPlugin({
      // 选项
    }),
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
    /* umamiAnalyticsPlugin({
      id: "0775eaf8-19ed-4d8b-ae56-c62a750e0691",
      cache: true,
    }),*/
  ],

  lang: "zh-CN",
  title: "小奶奶博客",
  description: "分享各种小奶奶内容 这使人感到有趣味",

  theme, // 使用导入的theme配置

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});