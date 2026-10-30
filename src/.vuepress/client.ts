import { defineClientConfig } from "vuepress/client";
import FootnoteTooltip from "./components/FootnoteTooltip.vue";
import MetingPlayer from "./components/MetingPlayer.vue";
import PagePreview from "./components/PagePreview.vue";
import TableEnhancer from "./components/TableEnhancer.vue";
import VercountStats from "./components/VercountStats.vue";
import Blog from "./layouts/Blog.vue";

export default defineClientConfig({
	//...

	layouts: {
		// ...
		Blog,
	},
	enhance({ app }) {
		// 注册组件
		app.component("VercountStats", VercountStats);
		app.component("FootnoteTooltip", FootnoteTooltip);
		// <Meting> 是文章里已有的写法；注册同名组件即可整体替换原 APlayer 实现。
		app.component("Meting", MetingPlayer);
		app.component("MetingPlayer", MetingPlayer);
		app.component("PagePreview", PagePreview);
	},

	// ⚠️ 注意：删除原来的 layouts 配置块
	// 改用 rootComponents，这样组件会挂载在页面根部，不会破坏原有 Layout
	//
	// ⚠️ 以下组件都带一个 `mounted` 开关（SSR 与水合首帧渲染空内容）：
	// Teleport 在 SSR 下只产出注释、客户端却要插入真实节点，两侧结构不一致会让水合失败
	// 并导致整页白屏（Cannot read properties of null (reading 'insertBefore')）。
	// 改动时别删这个开关。
	rootComponents: [VercountStats, FootnoteTooltip, TableEnhancer, PagePreview],
});
