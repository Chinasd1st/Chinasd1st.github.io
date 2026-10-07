<template>
	<Teleport v-if="mounted" to="body">
		<div
			v-show="visible"
			ref="popoverRef"
			class="vp-page-preview"
			:class="[{ 'is-visible': entered }, `is-side-${side}`]"
			:style="popoverStyle"
			role="tooltip"
			@mouseenter="cancelHide"
			@mouseleave="onPopoverLeave"
		>
			<span class="vp-page-preview__arrow" aria-hidden="true" />

			<div v-if="state === 'loading'" class="vp-page-preview__skeleton">
				<span class="vp-page-preview__sk-line" />
				<span class="vp-page-preview__sk-line is-short" />
				<span class="vp-page-preview__sk-line" />
			</div>

			<div v-else-if="state === 'ready'" class="vp-page-preview__body">
				<div class="vp-page-preview__text">
					<div class="vp-page-preview__title">{{ meta.title }}</div>
					<p class="vp-page-preview__desc">{{ meta.description }}</p>
					<div class="vp-page-preview__meta">
						<span v-for="item in meta.tags" :key="item" class="vp-page-preview__tag">{{ item }}</span>
					</div>
				</div>
				<img
					v-if="meta.cover"
					class="vp-page-preview__cover"
					:src="meta.cover"
					:alt="meta.title"
					loading="lazy"
					decoding="async"
					@error="onCoverError"
				/>
			</div>

			<div v-else class="vp-page-preview__empty">无法加载预览，点击可打开该页面</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePageData } from "vuepress/client";
import { useRoute } from "vue-router";

/**
 * 站内链接悬浮预览 —— MediaWiki「Page Previews / Navigation popups」的对应物
 *
 * 为什么可行且零依赖：本项目用 vuepress-plugin-seo，每个页面的 <head> 里已经写好了
 * og:title / og:description / og:image。所以只要同源 fetch 目标页 HTML，
 * 用 DOMParser 读这几个 meta 就有完整的预览数据——不需要新插件，也不需要构建期索引。
 *
 * 关键设计：
 * 1. **只在真正悬停后才请求**（intent delay），并用 Map 缓存结果与进行中的 Promise，
 *    同一篇文章反复划过只请求一次。
 * 2. **跳过所有会影响阅读的链接**：脚注引用（由 FootnoteTooltip 负责）、外链、
 *    页内锚点、同一篇文章的内部锚点，都不该弹预览。
 * 3. **预取下一跳**：拿到 HTML 后顺手 <link rel=prefetch> 目标页，点进去更快。
 */

const props = withDefaults(
	defineProps<{
		/** 悬停多久后开始请求（ms） */
		showDelay?: number;
		hideDelay?: number;
		maxWidth?: number;
		viewportMargin?: number;
		/** 少于该长度的描述不显示 */
		minDescription?: number;
	}>(),
	{
		showDelay: 220,
		hideDelay: 220,
		maxWidth: 400,
		viewportMargin: 10,
		minDescription: 0,
	},
);

interface PreviewMeta {
	title: string;
	description: string;
	cover: string;
	tags: string[];
	url: string;
}

const route = useRoute();
const pageData = usePageData();

/** 站点 base（如 "/" 或 "/blog/"），用于拼接 public 资源与索引 key */
const siteBase = (): string => {
	const base = (pageData.value as { base?: string } | undefined)?.base;
	return typeof base === "string" && base ? base : "/";
};

const visible = ref(false);
/** client-only 开关：SSR 与水合首帧不渲染 Teleport，避免水合失配 */
const mounted = ref(false);
const entered = ref(false);
const state = ref<"loading" | "ready" | "empty">("loading");
const side = ref<"right" | "left" | "top" | "bottom">("right");
const meta = ref<PreviewMeta>({ title: "", description: "", cover: "", tags: [], url: "" });

const popoverRef = ref<HTMLElement | null>(null);
const popoverStyle = ref<Record<string, string>>({ "--vp-pp-max-width": `${props.maxWidth}px` });

/** 进行中的预览请求：url → 数据（天然去重） */
const inflight = new Map<string, Promise<PreviewMeta | null>>();
const prefetched = new Set<string>();

/** 构建期生成的站内预览索引：route path → 元信息 */
let previewIndex: Record<string, { title: string; description: string; cover: string; tags: string[] }> | null =
	null;
let indexPromise: Promise<void> | null = null;

/** 只加载一次索引；缺失时静默降级为解析 og 元信息 */
const loadIndex = async (): Promise<void> => {
	if (previewIndex || indexPromise) return indexPromise ?? undefined;

	indexPromise = fetch(`${siteBase()}previews.json`, { credentials: "same-origin" })
		.then((response) => (response.ok ? response.json() : null))
		.then((data) => {
			previewIndex = data && typeof data === "object" ? data : {};
		})
		.catch(() => {
			previewIndex = {};
		});

	return indexPromise;
};

let hoveredLink: HTMLAnchorElement | null = null;
let currentUrl = "";
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let prefetchTimer: ReturnType<typeof setTimeout> | null = null;
let observer: MutationObserver | null = null;

const clearTimers = (): void => {
	for (const timer of [showTimer, hideTimer]) if (timer) clearTimeout(timer);
	showTimer = null;
	hideTimer = null;
};

const isInsidePopover = (node: EventTarget | null): boolean =>
	node instanceof Node && !!popoverRef.value?.contains(node);

/** 把链接 href 规范化成"这个页面"的 URL（去掉锚点与查询串） */
const resolvePageUrl = (anchor: HTMLAnchorElement): string | null => {
	// 脚注引用交给 FootnoteTooltip，不重复弹窗
	if (anchor.hasAttribute("data-footnote-ref")) return null;
	if (anchor.closest(".footnotes")) return null;

	const raw = anchor.getAttribute("href");
	if (!raw || raw.startsWith("#")) return null;
	if (/^(mailto:|tel:|javascript:)/i.test(raw)) return null;

	let url: URL;
	try {
		url = new URL(anchor.href, window.location.href);
	} catch {
		return null;
	}

	if (url.origin !== window.location.origin) return null;

	const here = new URL(window.location.href);
	// 同一篇文章（含页内锚点）不预览
	if (url.pathname === here.pathname) return null;

	url.hash = "";
	url.search = "";
	return url.href;
};

/** 站点 base 会被拼进 url.pathname，而索引 key 是「去 base」的 route path */
const toRoutePath = (url: string): string => {
	const { pathname } = new URL(url);
	const base = siteBase();
	return base !== "/" && pathname.startsWith(base) ? pathname.slice(base.length - 1) : pathname;
};

/** 从目标页 HTML 里读 og: 元信息 */
const parseMeta = (html: string, url: string): PreviewMeta | null => {
	const doc = new DOMParser().parseFromString(html, "text/html");
	const pick = (selector: string): string => {
		const el = doc.querySelector(selector);
		return el ? (el.getAttribute("content") || "").trim() : "";
	};

	const title = pick('meta[property="og:title"]') || (doc.title || "").trim();
	const description =
		pick('meta[property="og:description"]') || pick('meta[name="description"]');
	const cover = pick('meta[property="og:image"]');
	const tags = [...doc.querySelectorAll('meta[property="article:tag"]')]
		.map((el) => (el.getAttribute("content") || "").trim())
		.filter(Boolean)
		.slice(0, 4);

	if (!title) return null;
	if (description.length < props.minDescription) return null;

	return { title, description, cover, tags, url };
};

const load = (url: string, path: string): Promise<PreviewMeta | null> => {
	const cached = inflight.get(url);
	if (cached) return cached;

	const task = (async (): Promise<PreviewMeta | null> => {
		// 1) 优先走构建期索引：零网络请求、dev 下同样可用
		await loadIndex();
		const entry = previewIndex?.[path];
		if (entry?.title) {
			return {
				title: entry.title,
				description: entry.description,
				cover: entry.cover,
				tags: entry.tags ?? [],
				url,
			};
		}

		// 2) 索引里没有（新页面 / 索引缺失）才回退到解析目标页的 og 元信息
		const response = await fetch(url, { credentials: "same-origin" });
		if (!response.ok) return null;
		return parseMeta(await response.text(), url);
	})().catch(() => null);

	inflight.set(url, task);
	return task;
};

/** 命中后顺手预取页面本身，点进去更快 */
const schedulePrefetch = (url: string): void => {
	if (prefetched.has(url)) return;
	prefetched.add(url);
	if (prefetchTimer) clearTimeout(prefetchTimer);
	prefetchTimer = setTimeout(() => {
		prefetchTimer = null;
		const link = document.createElement("link");
		link.rel = "prefetch";
		link.href = url;
		document.head.appendChild(link);
		// 让浏览器有机会在空闲时处理
		(window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback?.(
			() => void 0,
		);
	}, 400);
};

/**
 * 正文文本列的左右边界。
 *
 * 只有「链接所在列的左右两侧确实有空白」时才能把浮窗放在旁边，否则会盖住正文。
 * 本项目在 ≥1280px 时正文列居中、左右留白很大；一旦收窄，留白消失，
 * 此时应该退化为在上/下方弹出，而不是压住文字。
 */
const textColumnBounds = (anchor: HTMLElement): { left: number; right: number } | null => {
	const host =
		anchor.closest<HTMLElement>("#markdown-content") ??
		document.querySelector<HTMLElement>("#markdown-content");
	if (!host) return null;

	const rect = host.getBoundingClientRect();
	return rect.width > 0 ? { left: rect.left, right: rect.right } : null;
};

const measureAndPlace = (anchor: HTMLAnchorElement): void => {
	const popover = popoverRef.value;
	if (!popover) return;

	const rect = anchor.getBoundingClientRect();
	const margin = props.viewportMargin;
	const gap = 10;
	const width = Math.min(props.maxWidth, window.innerWidth - margin * 2);
	const height = popover.offsetHeight;

	const bounds = textColumnBounds(anchor);

	// 右侧可用宽度：受视口与正文列右边界双重限制
	const rightLimit = bounds ? Math.min(window.innerWidth, bounds.right) : window.innerWidth;
	const spaceRight = rightLimit - rect.right - margin;
	// 左侧同理
	const leftLimit = bounds ? Math.max(0, bounds.left) : 0;
	const spaceLeft = rect.left - leftLimit - margin;

	const roomBelow = window.innerHeight - rect.bottom - margin;
	const roomAbove = rect.top - margin;

	let left: number;
	let top: number;

	if (spaceRight >= width + gap) {
		side.value = "right";
		left = rect.right + gap;
		top = rect.top;
	} else if (spaceLeft >= width + gap) {
		side.value = "left";
		left = rect.left - width - gap;
		top = rect.top;
	} else {
		// 两侧都没有真正的空白：放在上/下方，并让浮窗尽量与正文列对齐
		if (height + gap <= roomBelow || height + gap > roomAbove) side.value = "bottom";
		else side.value = "top";

		const alignRight = bounds ? Math.min(window.innerWidth, bounds.right) : window.innerWidth;
		left = Math.min(Math.max(margin, rect.left), Math.max(margin, alignRight - width - margin));
		top = side.value === "bottom" ? rect.bottom + gap : rect.top - height - gap;
	}

	top = Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - margin - height));

	popover.style.width = `${width}px`;
	popover.style.left = `${Math.round(left)}px`;
	popover.style.top = `${Math.round(top)}px`;

	// 箭头对准链接中心
	const arrow =
		side.value === "left"
			? rect.left - left
			: side.value === "right"
				? rect.left + rect.width / 2 - left
				: rect.left + rect.width / 2 - left;
	const clamped = Math.min(Math.max(arrow, 14), Math.max(14, width - 14));
	popover.style.setProperty("--vp-pp-arrow", `${Math.round(clamped)}px`);
	popover.style.setProperty("--vp-pp-arrow-y", `${Math.round(rect.top + rect.height / 2 - top)}px`);
};

const open = async (anchor: HTMLAnchorElement, url: string): Promise<void> => {
	clearTimers();

	hoveredLink = anchor;
	currentUrl = url;
	state.value = "loading";
	meta.value = { title: "", description: "", cover: "", tags: [], url };

	visible.value = true;
	await nextTick();
	if (currentUrl !== url) return;
	measureAndPlace(anchor);

	// 先做一次入场绘制，再切终态，否则 transition 会被跳过
	void popoverRef.value?.offsetWidth;
	entered.value = true;

	const result = await load(url, toRoutePath(url));
	if (currentUrl !== url) return;

	if (!result) {
		state.value = "empty";
	} else {
		meta.value = result;
		state.value = "ready";
		schedulePrefetch(url);
	}

	await nextTick();
	if (currentUrl !== url || !hoveredLink?.isConnected) return;
	measureAndPlace(hoveredLink);
};

const hide = (): void => {
	clearTimers();
	hideTimer = setTimeout(() => {
		hideTimer = null;
		entered.value = false;
		visible.value = false;
		hoveredLink = null;
		currentUrl = "";
	}, props.hideDelay);
};

const cancelHide = (): void => {
	if (hideTimer) {
		clearTimeout(hideTimer);
		hideTimer = null;
	}
};

const onPopoverLeave = (): void => {
	hoveredLink = null;
	hide();
};

const onDelegatedOver = (event: MouseEvent): void => {
	const target = event.target;
	if (!(target instanceof Element)) return;

	if (isInsidePopover(target)) {
		cancelHide();
		return;
	}

	const anchor = target.closest<HTMLAnchorElement>("a[href]");
	if (!anchor) {
		if (hoveredLink) {
			hoveredLink = null;
			hide();
		}
		return;
	}

	if (anchor === hoveredLink) {
		cancelHide();
		return;
	}

	const url = resolvePageUrl(anchor);
	if (!url) {
		if (hoveredLink) {
			hoveredLink = null;
			hide();
		}
		return;
	}

	hoveredLink = anchor;
	clearTimers();
	showTimer = setTimeout(() => {
		showTimer = null;
		if (hoveredLink === anchor) void open(anchor, url);
	}, props.showDelay);
};

const onDelegatedOut = (event: MouseEvent): void => {
	const target = event.target;
	if (!(target instanceof Element)) return;

	// 从链接移到浮窗内：保持
	const related = event.relatedTarget;
	if (related instanceof Node && (isInsidePopover(related) || hoveredLink?.contains(related))) return;

	if (target.closest("a[href]") === hoveredLink || isInsidePopover(target)) {
		if (isInsidePopover(target) && related instanceof Node && popoverRef.value?.contains(related)) {
			return;
		}
		hoveredLink = null;
		hide();
	}
};

const onScrollOrResize = (): void => {
	if (!visible.value) return;
	if (hoveredLink?.isConnected) measureAndPlace(hoveredLink);
	else {
		hoveredLink = null;
		hide();
	}
};

const onKeydown = (event: KeyboardEvent): void => {
	if (event.key === "Escape" && visible.value) {
		hoveredLink = null;
		clearTimers();
		entered.value = false;
		visible.value = false;
	}
};

const onCoverError = (): void => {
	meta.value = { ...meta.value, cover: "" };
};

onMounted(() => {
	// 水合完成后才渲染 Teleport 内容
	mounted.value = true;

	document.addEventListener("mouseover", onDelegatedOver, true);
	document.addEventListener("mouseout", onDelegatedOut, true);
	document.addEventListener("keydown", onKeydown);
	window.addEventListener("scroll", onScrollOrResize, { passive: true, capture: true });
	window.addEventListener("resize", onScrollOrResize, { passive: true });

	// 切页后正文被替换，任何待显示的预览都要作废
	observer = new MutationObserver(() => {
		if (hoveredLink && !hoveredLink.isConnected) {
			hoveredLink = null;
			clearTimers();
			entered.value = false;
			visible.value = false;
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });
});

onBeforeUnmount(() => {
	clearTimers();
	if (prefetchTimer) clearTimeout(prefetchTimer);
	observer?.disconnect();
	observer = null;

	document.removeEventListener("mouseover", onDelegatedOver, true);
	document.removeEventListener("mouseout", onDelegatedOut, true);
	document.removeEventListener("keydown", onKeydown);
	window.removeEventListener("scroll", onScrollOrResize, { capture: true });
	window.removeEventListener("resize", onScrollOrResize);
});

watch(
	() => route.path,
	() => {
		hoveredLink = null;
		clearTimers();
		entered.value = false;
		visible.value = false;
	},
);
</script>

<style lang="scss">
/* 非 scoped：节点 teleport 到 body，scoped 属性虽在，但保持与其它浮层一致 */

.vp-page-preview {
	--vp-pp-max-width: 400px;
	--vp-pp-arrow: 24px;
	--vp-pp-arrow-y: 24px;

	position: fixed;
	top: 0;
	left: 0;
	z-index: 1100;
	box-sizing: border-box;
	display: flex;
	gap: 10px;
	max-width: min(var(--vp-pp-max-width), calc(100vw - 20px));
	padding: 12px 14px;
	overflow: hidden;

	color: var(--vp-c-text, #3c3c43);
	font-size: 13px;
	line-height: 1.6;

	background: var(--vp-c-bg-elv, #fff);
	border: 1px solid var(--vp-c-border, #e2e2e3);
	border-radius: 10px;
	box-shadow: 0 8px 28px rgb(0 0 0 / 16%);

	opacity: 0;
	transform: translate3d(var(--vp-pp-enter-x, 4px), 0, 0) scale(0.985);
	transition:
		opacity 0.16s ease,
		transform 0.2s cubic-bezier(0.22, 0.68, 0.32, 1);
	pointer-events: none;
	will-change: opacity, transform;

	&.is-side-left {
		--vp-pp-enter-x: -4px;
	}

	&.is-side-top,
	&.is-side-bottom {
		--vp-pp-enter-x: 0;
	}

	&.is-visible {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}

	/* 指向被悬停的链接 */
	&__arrow {
		position: absolute;
		width: 9px;
		height: 9px;
		background: var(--vp-c-bg-elv, #fff);
		pointer-events: none;
	}

	&.is-side-right > &__arrow {
		left: -5px;
		top: var(--vp-pp-arrow-y);
		transform: translateY(-50%) rotate(45deg);
		border-left: 1px solid var(--vp-c-border, #e2e2e3);
		border-bottom: 1px solid var(--vp-c-border, #e2e2e3);
	}

	&.is-side-left > &__arrow {
		right: -5px;
		top: var(--vp-pp-arrow-y);
		transform: translateY(-50%) rotate(45deg);
		border-top: 1px solid var(--vp-c-border, #e2e2e3);
		border-right: 1px solid var(--vp-c-border, #e2e2e3);
	}

	&.is-side-bottom > &__arrow {
		top: -5px;
		left: var(--vp-pp-arrow);
		transform: translateX(-50%) rotate(45deg);
		border-top: 1px solid var(--vp-c-border, #e2e2e3);
		border-left: 1px solid var(--vp-c-border, #e2e2e3);
	}

	&.is-side-top > &__arrow {
		bottom: -5px;
		left: var(--vp-pp-arrow);
		transform: translateX(-50%) rotate(45deg);
		border-right: 1px solid var(--vp-c-border, #e2e2e3);
		border-bottom: 1px solid var(--vp-c-border, #e2e2e3);
	}

	&__body {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		min-width: 0;
		flex: 1 1 auto;
	}

	&__text {
		flex: 1 1 auto;
		min-width: 0;
	}

	&__title {
		margin: 0 0 4px;
		color: var(--vp-c-text, #3c3c43);
		font-size: 14px;
		font-weight: 700;
		line-height: 1.4;
		// 长标题最多两行
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__desc {
		margin: 0;
		color: var(--vp-c-text-mute, #6b6b70);
		font-size: 13px;
		// 摘要恒定高度，避免浮窗尺寸跳动
		display: -webkit-box;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	&__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 8px;

		&:empty {
			display: none;
		}
	}

	&__tag {
		padding: 1px 7px;
		color: var(--vp-c-text-mute, #6b6b70);
		font-size: 11px;
		line-height: 1.6;
		background: var(--vp-c-bg-soft, #f2f2f3);
		border-radius: 999px;
	}

	&__cover {
		flex: none;
		width: 88px;
		height: 88px;
		object-fit: cover;
		border-radius: 6px;
		background: var(--vp-c-bg-soft, #f2f2f3);
	}

	&__empty {
		color: var(--vp-c-text-mute, #8a8a8f);
		font-size: 13px;
	}

	/* 加载态骨架 */
	&__skeleton {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	&__sk-line {
		height: 11px;
		border-radius: 4px;
		background: linear-gradient(
			90deg,
			var(--vp-c-bg-soft, #f2f2f3) 25%,
			var(--vp-c-border, #e2e2e3) 37%,
			var(--vp-c-bg-soft, #f2f2f3) 63%
		);
		background-size: 400% 100%;
		animation: vp-pp-shimmer 1.3s ease-in-out infinite;

		&.is-short {
			width: 55%;
		}
	}
}

@keyframes vp-pp-shimmer {
	from {
		background-position: 100% 0;
	}

	to {
		background-position: 0 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	.vp-page-preview {
		transition: none;
		transform: none;
	}

	.vp-page-preview__sk-line {
		animation: none;
	}
}

@media print {
	.vp-page-preview {
		display: none !important;
	}
}
</style>
