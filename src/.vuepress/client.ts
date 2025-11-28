import { defineClientConfig } from "vuepress/client";
import Blog from "./layouts/Blog.vue";
import BusuanziStats from "./components/BusuanziStats.vue";

export default defineClientConfig({
  //...

  layouts: {
    // ...
    Blog,
  },
  enhance({ app }) {
    // 注册组件
    app.component("BusuanziStats", BusuanziStats);
  },

  // ⚠️ 注意：删除原来的 layouts 配置块
  // 改用 rootComponents，这样组件会挂载在页面根部，不会破坏原有 Layout
  rootComponents: [BusuanziStats],
});