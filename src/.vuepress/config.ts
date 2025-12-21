import { defineUserConfig } from "vuepress";
import metingPlugin from "vuepress-plugin-meting2";
import dotenv from "dotenv";
// import { commentPlugin } from '@vuepress/plugin-comment'
// import { prismjsPlugin } from '@vuepress/plugin-prismjs'

import theme from "./theme.ts"; // 修改这行
// import navbar from "./navbar.js";
// import sidebar from "./sidebar.js";

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

  theme, // 使用导入的theme配置

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});