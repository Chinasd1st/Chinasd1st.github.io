import { defineClientConfig } from "vuepress/client";
import BusuanziStats from "./components/BusuanziStats.vue";
import FootnoteTooltip from "./components/FootnoteTooltip.vue";
import PagePreview from "./components/PagePreview.vue";
import TableEnhancer from "./components/TableEnhancer.vue";
import Blog from "./layouts/Blog.vue";

export default defineClientConfig({
	//...

	layouts: {
		// ...
		Blog,
	},
	enhance({ app }) {
		// 注册组件
		app.component("BusuanziStats", BusuanziStats);
		app.component("FootnoteTooltip", FootnoteTooltip);
		app.component("PagePreview", PagePreview);
	},

	// ⚠️ 注意：删除原来的 layouts 配置块
	// 改用 rootComponents，这样组件会挂载在页面根部，不会破坏原有 Layout
	//
	// ⚠️ 这三个组件都依赖事件委托 + 观察器，必须与正文同级挂载才能捕获脚注、链接与表格。
	// 它们内部各自带一个 `mounted` 开关（SSR 与水合首帧渲染空内容）：Teleport 在 SSR 下
	// 只产出注释、客户端却要插入真实节点，两侧结构不一致会让水合失败并导致整页白屏
	// （Cannot read properties of null (reading 'insertBefore')）。改动时别删这个开关。
	rootComponents: [BusuanziStats, FootnoteTooltip, TableEnhancer, PagePreview],
});
