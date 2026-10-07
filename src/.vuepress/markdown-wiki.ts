import type MarkdownIt from "markdown-it";

/**
 * wiki 风格容器语法：`::: hatnote` / `::: seealso` / `::: navbox`
 *
 * 为什么是 markdown-it 插件而不是纯 Vue 组件：
 * 容器内容仍走 markdown 解析，正文里的链接、加粗、列表都能正常渲染；
 * 而 <SeeAlso :items="[...]" /> 这类写法在 markdown 里承载不了 markdown 语法。
 *
 * 为什么不直接用 markdown-it-container：
 * 该包不在本项目依赖里（vuepress-theme-hope 也没把它暴露给用户配置），
 * 为一个约 70 行的容器解析去动 pnpm-lock 不值得，因此用核心 ruler 自己实现。
 *
 * 实现思路（这里踩过坑，记录下来）：
 * `:::` 不是 markdown-it 的块级标记。若直接在 token 流里找它，会遇到两种截然不同的
 * token 形态（同段落闭合 / 跨段落闭合），而且标记会黏进列表项，导致标签失衡。
 * 更稳的做法是**先改源码**：扫描行，把标记行替换成唯一的 HTML 注释占位符。
 * 注释是块级 token，会把段落切开，不再黏进列表项；容器体于是自然成为两个占位符之间的
 * 一段完整 token 区间，原样交给 renderer 即可（内层 `::: note` 等也会正常生效）。
 */

type RenderKind = "hatnote" | "seealso" | "navbox";

interface ContainerSpec {
	/** 默认标题；空字符串表示无标题 */
	defaultTitle: string;
	open(title: string): string;
	close(): string;
}

const escapeHtml = (text: string): string =>
	text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

const SPECS: Record<RenderKind, ContainerSpec> = {
	// MediaWiki {{about}} / {{for}}：斜体消歧义提示
	hatnote: {
		defaultTitle: "",
		open: (title) =>
			`<div class="wiki-hatnote">` +
			(title ? `<span class="wiki-hatnote__label">${escapeHtml(title)}</span>` : ""),
		close: () => "</div>\n",
	},
	// MediaWiki {{see also}}：「参见」区块
	seealso: {
		defaultTitle: "参见",
		open: (title) =>
			`<div class="wiki-seealso">` +
			`<div class="wiki-seealso__title">${escapeHtml(title)}</div>` +
			`<div class="wiki-seealso__body">`,
		close: () => "</div></div>\n",
	},
	// MediaWiki {{navbox}}：专题导航底栏
	navbox: {
		defaultTitle: "相关条目",
		open: (title) =>
			`<div class="wiki-navbox">` +
			`<div class="wiki-navbox__title">${escapeHtml(title)}</div>` +
			`<div class="wiki-navbox__body">`,
		close: () => "</div></div>\n",
	},
};

/** 开标记：`::: name 可选标题` */
const OPEN_RE = /^\s*:::\s*([a-z][a-z0-9-]*)\s*(.*?)\s*$/i;
/** 闭标记：独占一行的 `:::` */
const CLOSE_RE = /^\s*:::\s*$/;

const MARK = "vpwiki";
const openMark = (n: number): string => `<!--${MARK}:open:${n}-->`;
const closeMark = (n: number): string => `<!--${MARK}:close:${n}-->`;
const OPEN_MARK_RE = /^<!--vpwiki:open:(\d+)-->$/;
const CLOSE_MARK_RE = /^<!--vpwiki:close:(\d+)-->$/;

const isHtmlBlockToken = (token: any): boolean =>
	token.type === "html_block" || (token.type === "html_inline" && token.block === true);

export const wikiMarkdownPlugin = (md: MarkdownIt): void => {
	/** 每个容器实例的渲染信息：id → { 规格, 标题 } */
	const instances = new Map<number, { spec: ContainerSpec; title: string }>();

	/**
	 * 1) 预处理：把 `:::` 标记行换成注释占位符，同时记下每个实例的标题。
	 *
	 * 跑在 block 规则之前（before("block")）。递归渲染容器体时会再次进入 core ruler，
	 * 但那时正文里的 `:::` 已被替换、instances 也已按 id 建好，因此天然幂等。
	 */
	md.core.ruler.before("block", "wiki_fence_prepare", (state) => {
		if (!state.src.includes(":::")) return;

		// 按行切分但保留行尾，避免破坏列表 / 引用块的解析
		const parts = state.src.split(/(\r?\n)/);
		const out: string[] = [];
		const stack: number[] = [];
		let next = 0;
		// 代码围栏状态：围栏内的 `:::` 是示例文本，必须原样保留
		let fenceChar = "";
		let fenceLength = 0;

		for (let k = 0; k < parts.length; k += 2) {
			const line = parts[k];
			const eol = parts[k + 1] ?? "";

			// markdown-it 的围栏规则：≥3 个 ` 或 ~，闭合需同字符且不短于开启
			const fence = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(line);
			if (fence) {
				const char = fence[1][0];
				if (fenceChar === "") {
					fenceChar = char;
					fenceLength = fence[1].length;
				} else if (char === fenceChar && fence[1].length >= fenceLength) {
					fenceChar = "";
					fenceLength = 0;
				}
				out.push(line, eol);
				continue;
			}

			if (fenceChar !== "") {
				out.push(line, eol);
				continue;
			}

			const openMatch = OPEN_RE.exec(line);
			if (openMatch) {
				const kind = openMatch[1].toLowerCase() as RenderKind;
				const spec = SPECS[kind];
				if (spec) {
					const id = next++;
					instances.set(id, {
						spec,
						title: openMatch[2].replace(/^["']|["']$/g, "") || spec.defaultTitle,
					});
					stack.push(id);
					out.push(openMark(id), eol);
					continue;
				}
			}

			if (CLOSE_RE.test(line) && stack.length > 0) {
				out.push(closeMark(stack.pop() as number), eol);
				continue;
			}

			out.push(line, eol);
		}

		if (next > 0) state.src = out.join("");
	});

	/**
	 * 2) 后处理：把「成对」的占位符换成容器开闭标签，中间内容原样保留。
	 *
	 * 只替换正确配对的实例：未闭合的开标记会退回成 HTML 注释（浏览器不显示），
	 * 这样既不会在页面上露出 `:::`，也不会产生失衡的 <div>。
	 * 配对用栈校验嵌套顺序，避免 `A…B…/A…/B` 这种交叉写法把标签弄乱。
	 */
	md.core.ruler.push("wiki_containers", (state) => {
		const tokens = state.tokens;

		const markOf = (token: any): { kind: "open" | "close"; id: number } | null => {
			if (!isHtmlBlockToken(token)) return null;
			const raw = token.content.trim();
			const open = OPEN_MARK_RE.exec(raw);
			if (open) return { kind: "open", id: Number(open[1]) };
			const close = CLOSE_MARK_RE.exec(raw);
			if (close) return { kind: "close", id: Number(close[1]) };
			return null;
		};

		// 标记哪些实例是正确嵌套配对的
		const paired = new Set<number>();
		const stack: number[] = [];
		for (const token of tokens) {
			const mark = markOf(token);
			if (!mark) continue;
			if (mark.kind === "open") stack.push(mark.id);
			else if (stack[stack.length - 1] === mark.id) paired.add(stack.pop() as number);
		}

		let touched = false;
		for (const token of tokens) {
			const mark = markOf(token);
			if (!mark) continue;

			const instance = instances.get(mark.id);
			if (instance && paired.has(mark.id)) {
				touched = true;
				token.content =
					mark.kind === "open"
						? instance.spec.open(instance.title)
						: instance.spec.close();
			} else {
				// 未配对：退回注释，页面上不可见
				token.content = `<!--${MARK}:unpaired-->`;
			}
		}

		if (touched) instances.clear();
	});

	/**
	 * 3) 兜底：递归渲染容器体时若留下占位符残留，清掉避免漏到页面。
	 */
	md.core.ruler.push("wiki_cleanup", (state) => {
		if (instances.size === 0) return;

		for (const token of state.tokens) {
			if (!isHtmlBlockToken(token)) continue;
			if (/^<!--vpwiki:/.test(token.content.trim())) token.content = "";
		}
		instances.clear();
	});
};
