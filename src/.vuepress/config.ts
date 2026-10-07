import { clarityAnalyticsPlugin } from "@vuepress/plugin-clarity-analytics";
import { llmsPlugin } from "@vuepress/plugin-llms";
import dotenv from "dotenv";
import { writeFile } from "node:fs/promises";
import { defineUserConfig } from "vuepress";
import metingPlugin from "vuepress-plugin-meting2";
// import { umamiAnalyticsPlugin } from '@vuepress/plugin-umami-analytics'
// import { commentPlugin } from '@vuepress/plugin-comment'
// import { prismjsPlugin } from '@vuepress/plugin-prismjs'

import theme from "./theme.ts"; // 修改这行
import { wikiMarkdownPlugin } from "./markdown-wiki.ts";

// import navbar from "./navbar.js";
// import sidebar from "./sidebar.js";

dotenv.config({ path: ".env.local" });

/**
 * 生成站内链接悬浮预览用的索引（public/previews.json）。
 *
 * 为什么在构建期生成：
 * 运行期去 fetch 目标页 HTML 在 vite dev 下拿不到内容（直接请求 .html 只会返回 SPA 外壳，
 * 真正的 meta 是客户端注入的），只有构建产物才有完整 <head>。构建期直接从 VuePress 的
 * page 对象取 title/description/cover/tags，dev 与生产同一份数据，且悬停时零网络请求。
 */
const generatePreviewIndex = async (app: {
	pages: Array<{ path: string; title?: string; frontmatter: Record<string, unknown> }>;
	dir: { public: (...args: string[]) => string };
}): Promise<void> => {
	const index: Record<string, { title: string; description: string; cover: string; tags: string[] }> = {};

	for (const page of app.pages) {
		const fm = page.frontmatter || {};
		const toText = (value: unknown): string => {
			if (typeof value === "string") return value;
			if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join(" / ");
			if (value && typeof value === "object" && "name" in value) {
				return String((value as { name?: unknown }).name ?? "");
			}
			return "";
		};

		const title = toText(fm.title) || page.title || "";
		if (!title) continue;

		index[page.path] = {
			title,
			description: toText(fm.description),
			cover: toText(fm.cover),
			tags: Array.isArray(fm.tag) ? fm.tag.filter((t) => typeof t === "string").slice(0, 3) : [],
		};
	}

	// app.dir.* 在 vuepress 2 里是「路径解析函数」而不是字符串
	await writeFile(app.dir.public("previews.json"), JSON.stringify(index), "utf8");
};

export default defineUserConfig({
	head: [
		["link", { rel: "icon", href: "/favicon.ico" }],
		[
			"link",
			{ rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
		],
		[
			"link",
			{ rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
		],
		[
			"link",
			{ rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48x48.png" },
		],
		[
			"link",
			{ rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
		],
		[
			"link",
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
		],
		[
			"link",
			{
				rel: "icon",
				type: "image/png",
				sizes: "192x192",
				href: "/android-chrome-192x192.png",
			},
		],
		[
			"link",
			{
				rel: "icon",
				type: "image/png",
				sizes: "512x512",
				href: "/android-chrome-512x512.png",
			},
		],
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
			"link",
			{
				href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap",
				rel: "stylesheet",
			},
		],
		[
			"script",
			{
				defer: true,
				async: true,
				src: "https://cloud.umami.is/script.js",
				"data-website-id": "0775eaf8-19ed-4d8b-ae56-c62a750e0691",
				"data-exclude-hash": "true", // ← 核心属性
				"data-auto-track": "true",
			},
		],
		[
			"link",
			{
				rel: "stylesheet",
				href: "https://cdn.jsdelivr.net/npm/@fontsource/cascadia-code@5.2.3/index.min.css",
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
		clarityAnalyticsPlugin({
			id: "w0s3h16l6o",
		}),
	],

	lang: "zh-CN",
	title: "小奶奶博客",
	description: "分享各种小奶奶内容 这使人感到有趣味",

	// wiki 风格容器：::: hatnote / ::: seealso / ::: navbox
	extendsMarkdown: (md) => {
		md.use(wikiMarkdownPlugin);
	},

	// 页面就绪后写出站内链接悬浮预览的索引
	onPrepared: (app) => generatePreviewIndex(app as never),

	theme, // 使用导入的theme配置

	// 和 PWA 一起启用
	// shouldPrefetch: false,
});
