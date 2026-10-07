<template>
	<Teleport to="body">
		<div
			v-show="visible"
			ref="popoverRef"
			class="footnote-tooltip"
			:class="[{ 'is-visible': entered }, `is-${arrowSide}`]"
			:style="popoverStyle"
			role="tooltip"
			@mouseleave="onPopoverLeave"
		>
			<span class="footnote-tooltip__arrow" aria-hidden="true" />
			<div
				:key="currentId.value"
				ref="contentRef"
				class="footnote-tooltip__content"
				:class="{ 'vp-doc': inheritContentStyle }"
				v-html="contentHtml"
			/>
			<div v-if="overflowing" class="footnote-tooltip__more">滚动查看完整内容 ↓</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

/**
 * 脚注悬浮预览（Wikipedia 风格 Reference Tooltips）
 *
 * 设计要点：
 * 1. 接入时机：脚注正文由 vuepress-theme-hope 渲染在页面底部的 <section class="footnotes">
 *    （该节点被主题 CSS 置为 display:none）。本组件作为 rootComponent 与 <RouterView> 平级，
 *    挂载时机**早于**页面内容水合完成，因此不能用 onMounted 直接扫描；改用 MutationObserver
 *    监听 <body>，一旦脚注节点出现即补标记，再用「document 上的 mouseover/mouseout 委托 +
 *    closest() 重新解析」跟踪指针，这样切页、懒加载、加密解锁等动态插入的场景都无需重新绑定。
 *    注意不能依赖 mouseout 的 relatedTarget 判断「是否离开自己」：Chrome 里
 *    `node.contains(node)` 返回 true，会让这类判断失效（本项目实测过该坑）。
 * 2. 渲染方式：不引入客户端 markdown 解析器，而是从真实的脚注 DOM 中克隆节点。这样 KaTeX
 *    公式、Vue 组件、代码高亮、图片尺寸等与正文完全一致；克隆时剔除 id / href 以免破坏页内锚点。
 */
const props = withDefaults(
	defineProps<{
		/** 判定脚注引用节点的选择器 */
		selector?: string;
		/** 悬浮多久后显示（ms），避免扫过时误触发 */
		showDelay?: number;
		/** 移开后多久隐藏（ms），留出移动到浮窗内继续阅读的时间 */
		hideDelay?: number;
		/** 浮窗宽度上限（px） */
		maxWidth?: number;
		/** 浮窗高度上限（px） */
		maxHeight?: number;
		/** 浮窗与视口边缘的最小间距（px） */
		viewportMargin?: number;
		/** 给脚注引用补 data-footnote-ref / class，便于统一选中 */
		autoAnchor?: boolean;
		/** 让浮窗继承正文排版（vp-doc 的样式作用域） */
		inheritContentStyle?: boolean;
		/** 是否允许在浮窗内滚动查看超出部分 */
		scrollable?: boolean;
	}>(),
	{
		selector: "",
		showDelay: 150,
		hideDelay: 180,
		maxWidth: 560,
		maxHeight: 340,
		viewportMargin: 10,
		autoAnchor: true,
		inheritContentStyle: true,
		scrollable: true,
	},
);

const REF_SELECTOR =
	'sup.footnote-ref > a[href^="#footnote"], .footnote-ref > a[href^="#footnote"]';

/** 箭头尺寸与距圆角的最小距离（px） */
const ARROW_SIZE = 10;
const ARROW_INSET = 16;

const route = useRoute();

const visible = ref(false);
/** 入场动画终态：先渲染「透明 + 偏移」的一帧，再置 true 触发过渡 */
const entered = ref(false);
const contentHtml = ref("");
const overflowing = ref(false);
/** 浮窗相对于引用的方向，用于决定箭头朝向与入场位移 */
const arrowSide = ref<"top" | "bottom">("top");
const popoverStyle = ref<Record<string, string>>({
	"--ft-max-width": `${props.maxWidth}px`,
	"--ft-max-height": `${props.maxHeight}px`,
});

const popoverRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

/** 当前指针所在的脚注引用节点 */
let hoveredAnchor: HTMLAnchorElement | null = null;
/** 正在展示浮窗的引用节点（用于高亮） */
let activeAnchor: HTMLAnchorElement | null = null;
/** 当前浮窗对应的脚注编号，防止异步回调串号 */
const currentId = ref("");
/** 当前触发节点与浮窗定位数据 */
let currentAnchor: HTMLElement | null = null;
let currentAlign: { left: number; width: number } | null = null;

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let observer: MutationObserver | null = null;
let touchHandler: ((event: MouseEvent) => void) | null = null;

const clearTimers = (): void => {
	if (showTimer) {
		clearTimeout(showTimer);
		showTimer = null;
	}
	if (hideTimer) {
		clearTimeout(hideTimer);
		hideTimer = null;
	}
};

/** 找出脚注引用链接：本页脚注优先，其次主题/插件标记，最后按 id 前缀兜底 */
const resolveAnchor = (target: EventTarget | null): HTMLAnchorElement | null => {
	if (!(target instanceof Element)) return null;

	const bySelector = target.closest<HTMLAnchorElement>(props.selector || REF_SELECTOR);
	if (bySelector) return bySelector;

	const byFlag = target.closest<HTMLAnchorElement>('[data-footnote-ref]');
	if (byFlag) return byFlag;

	const link = target.closest<HTMLAnchorElement>('a[href^="#footnote"]');
	if (link && /^#footnote[-_]?\d/.test(link.getAttribute("href") || "")) return link;

	return null;
};

/** `#footnote7:2` / `#footnote7-2` → `#footnote7`，后续查表统一按数字匹配 */
const normalizeHash = (hash: string): string => {
	const matched = /^#(footnote[-_]?\d+)/i.exec(hash);
	return matched ? `#${matched[1]}` : hash;
};

/** 面板太窄时退化为全宽，避免浮窗被裁切 */
const resolveAlign = (anchor: HTMLElement): { left: number; width: number } => {
	const rect = anchor.getBoundingClientRect();
	const margin = props.viewportMargin;
	const maxWidth = Math.min(props.maxWidth, window.innerWidth - margin * 2);
	const available = window.innerWidth - rect.left - margin;

	if (available >= Math.min(maxWidth, 320)) {
		return { left: rect.left, width: Math.min(maxWidth, available) };
	}

	const left = Math.min(Math.max(margin, rect.left), window.innerWidth - margin - maxWidth);
	return { left, width: maxWidth };
};

/** 优先放在引用上方，空间不足则放到下方；都放不下时取空间更大的一侧 */
const updatePosition = (): void => {
	const popover = popoverRef.value;
	if (!popover || !currentAnchor || !currentAlign || !currentAnchor.isConnected) return;

	const anchorRect = currentAnchor.getBoundingClientRect();
	const margin = props.viewportMargin;
	const offset = 8 + ARROW_SIZE / 2;

	const shell = parseFloat(getComputedStyle(popover).getPropertyValue("--ft-max-height"));
	const maxHeight = Math.min(
		Number.isFinite(shell) ? shell : props.maxHeight,
		window.innerHeight - margin * 2,
	);

	popover.style.maxHeight = `${Math.max(120, maxHeight)}px`;

	const height = popover.offsetHeight;
	const spaceAbove = anchorRect.top - margin;
	const spaceBelow = window.innerHeight - anchorRect.bottom - margin;

	let top: number;
	if (spaceAbove >= height + offset) top = anchorRect.top - height - offset;
	else if (spaceBelow >= height + offset) top = anchorRect.bottom + offset;
	else if (spaceAbove >= spaceBelow) top = Math.max(margin, anchorRect.top - height - offset);
	else top = Math.min(window.innerHeight - margin - height, anchorRect.bottom + offset);

	const left = currentAlign.left;
	const width = currentAlign.width;
	const clampedTop = Math.max(margin, top);

	// 引用中心相对浮窗的水平位置 → 箭头的落点
	const anchorCenter = anchorRect.left + anchorRect.width / 2;
	const arrow = Math.min(Math.max(anchorCenter - left, ARROW_INSET), Math.max(ARROW_INSET, width - ARROW_INSET));

	arrowSide.value = clampedTop < anchorRect.top ? "top" : "bottom";

	popover.style.left = `${left}px`;
	popover.style.width = `${width}px`;
	popover.style.top = `${clampedTop}px`;
	popover.style.setProperty("--ft-arrow", `${Math.round(arrow)}px`);
};

const checkOverflow = (): void => {
	const content = contentRef.value;
	overflowing.value = props.scrollable && !!content && content.scrollHeight > content.clientHeight + 2;
};

/**
 * 克隆脚注内容：剔除重复 id / 无意义的返回链接，并把主题针对「正文外链列表」的
 * 样式（负外边距、序号列表）重置为普通段落排版。
 */
const extractContent = (id: string): string => {
	const source = document.getElementById(id);
	if (!source) return "";

	const clone = source.cloneNode(true) as HTMLElement;

	clone.querySelectorAll("a.footnote-backref, .footnote-anchor, [id]").forEach((node) => {
		node.removeAttribute("id");
	});
	clone.querySelectorAll("[href^='#'], [href^='javascript:']").forEach((node) => {
		node.removeAttribute("href");
	});

	return clone.innerHTML;
};

const replayContent = (content: HTMLElement): void => {
	content.classList.remove("is-entering");
	void content.offsetWidth;
	content.classList.add("is-entering");
};

const show = (anchor: HTMLAnchorElement, id: string): void => {
	clearTimers();

	const html = extractContent(id);
	if (!html) return;

	const changed = currentId.value !== id;
	const reopening = !entered.value && !visible.value;

	// 高亮当前引用，明确"这个浮窗属于哪一处标注"
	if (activeAnchor && activeAnchor !== anchor) activeAnchor.classList.remove("is-active");
	activeAnchor = anchor;
	anchor.classList.add("is-active");

	hoveredAnchor = anchor;
	currentAnchor = anchor;
	currentAlign = resolveAlign(anchor);
	currentId.value = id;
	contentHtml.value = html;
	visible.value = true;

	// 内容渲染出来后才能量高度，二次修正位置
	void nextTick(() => {
		if (currentId.value !== id) return;
		const content = contentRef.value;
		if (content) {
			content.scrollTop = 0;
			// 切换到另一条脚注：只让内容重新入场，浮窗本身不跳
			if (changed && !reopening) replayContent(content);
		}
		updatePosition();
		checkOverflow();

		if (reopening) {
			// 让浏览器先完成一次「透明 + 偏移」的绘制，再切到终态，
			// 否则类名与首帧同批生效，transition 会被直接跳过。
			void popoverRef.value?.offsetWidth;
			entered.value = true;
		}
	});
};

/** 立即隐藏（不动 hoveredAnchor，便于同一引用反复触发时复用） */
const hideNow = (): void => {
	if (activeAnchor) {
		activeAnchor.classList.remove("is-active");
		activeAnchor = null;
	}
	entered.value = false;
	visible.value = false;
	currentAnchor = null;
	currentAlign = null;
	currentId.value = "";
	contentHtml.value = "";
	overflowing.value = false;
};

/** 延迟隐藏：留出从引用移到浮窗里的时间 */
const scheduleHide = (delay = props.hideDelay): void => {
	clearTimers();
	hideTimer = setTimeout(() => {
		hideTimer = null;
		hideNow();
	}, delay);
};

/** 把脚注引用标记成「可悬浮预览」 */
const markAnchors = (root: ParentNode = document): void => {
	if (!props.autoAnchor) return;

	root.querySelectorAll<HTMLAnchorElement>(REF_SELECTOR).forEach((link) => {
		// 脚注正文里的返回链接不算引用
		if (link.closest(".footnotes")) return;
		link.setAttribute("data-footnote-ref", "true");
		link.classList.add("footnote-ref-link");
		link.setAttribute("aria-haspopup", "true");
	});
};

const isInsidePopover = (node: EventTarget | null): boolean =>
	node instanceof Node && !!popoverRef.value?.contains(node);

/**
 * 指针状态集中判定。
 *
 * 这里刻意不依赖 mouseout 的 relatedTarget：Chrome 中 `node.contains(node)` 为 true，
 * 会让「离开自己」的判定失效；而且指针在同一个 <sup> 内的文本节点间游走时，
 * mouseout 的目标可能已经不是引用链接本身。改为每次 mouseover/mouseout 都用
 * closest() 重新解析所处的引用节点，再与 hoveredAnchor 比较，行为完全确定。
 */
const trackPointer = (event: MouseEvent): void => {
	const anchor = resolveAnchor(event.target);

	if (anchor) {
		const id = normalizeHash(anchor.hash || anchor.getAttribute("href") || "").slice(1);
		if (!id || !document.getElementById(id)) return;

		// 仍停在同一个引用上：取消待隐藏
		if (anchor === hoveredAnchor) {
			if (hideTimer) clearTimers();
			return;
		}

		hoveredAnchor = anchor;
		clearTimers();
		showTimer = setTimeout(() => {
			showTimer = null;
			show(anchor, id);
		}, props.showDelay);
		return;
	}

	if (isInsidePopover(event.target)) {
		// 移入浮窗内继续阅读，保持显示
		if (hideTimer) clearTimers();
		return;
	}

	if (hoveredAnchor || visible.value) {
		hoveredAnchor = null;
		scheduleHide();
	}
};

const onPopoverLeave = (): void => {
	hoveredAnchor = null;
	scheduleHide();
};

const onFocusIn = (event: FocusEvent): void => {
	const anchor = resolveAnchor(event.target);
	if (!anchor) return;

	const id = normalizeHash(anchor.hash || anchor.getAttribute("href") || "").slice(1);
	if (!id || !document.getElementById(id)) return;

	clearTimers();
	show(anchor, id);
};

const onFocusOut = (): void => {
	hoveredAnchor = null;
	scheduleHide(0);
};

const onScrollOrResize = (): void => {
	if (visible.value) updatePosition();
};

const onKeydown = (event: KeyboardEvent): void => {
	if (event.key === "Escape" && visible.value) {
		hoveredAnchor = null;
		clearTimers();
		hideNow();
	}
};

onMounted(() => {
	markAnchors();

	// 内容水合/切页后可能才出现脚注，持续观察并按需补标记
	observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			const el = mutation.target as Element | null;
			if (el && typeof el.querySelector === "function" && el.querySelector(".footnote-ref, .footnotes")) {
				markAnchors(el);
			}
		}
	});
	observer.observe(document.body, { childList: true, subtree: true });

	document.addEventListener("mouseover", trackPointer, true);
	document.addEventListener("mouseout", trackPointer, true);
	document.addEventListener("focusin", onFocusIn, true);
	document.addEventListener("focusout", onFocusOut, true);
	document.addEventListener("keydown", onKeydown);
	window.addEventListener("scroll", onScrollOrResize, { passive: true, capture: true });
	window.addEventListener("resize", onScrollOrResize, { passive: true });
	window.addEventListener("pointerdown", onScrollOrResize, { passive: true });

	// 触屏设备没有 hover：轻点引用直接弹出预览，避免"点了没反应"
	if (window.matchMedia("(hover: none)").matches) {
		touchHandler = (event: MouseEvent) => {
			const anchor = resolveAnchor(event.target);
			if (!anchor) return;

			const id = normalizeHash(anchor.hash || anchor.getAttribute("href") || "").slice(1);
			if (!id || !document.getElementById(id)) return;

			event.preventDefault();
			event.stopPropagation();
			show(anchor, id);
		};
		document.addEventListener("click", touchHandler, true);
	}
});

onBeforeUnmount(() => {
	clearTimers();
	observer?.disconnect();
	observer = null;

	document.removeEventListener("mouseover", trackPointer, true);
	document.removeEventListener("mouseout", trackPointer, true);
	document.removeEventListener("focusin", onFocusIn, true);
	document.removeEventListener("focusout", onFocusOut, true);
	document.removeEventListener("keydown", onKeydown);
	window.removeEventListener("scroll", onScrollOrResize, { capture: true });
	window.removeEventListener("resize", onScrollOrResize);
	window.removeEventListener("pointerdown", onScrollOrResize);

	if (touchHandler) {
		document.removeEventListener("click", touchHandler, true);
		touchHandler = null;
	}
});

// 路由变化意味着整篇正文被替换，悬停中的浮窗必须立刻失效
watch(
	() => route.path,
	() => {
		clearTimers();
		hoveredAnchor = null;
		hideNow();
	},
);
</script>

<style lang="scss">
.footnote-tooltip {
	--ft-max-width: 560px;
	--ft-max-height: 340px;

	position: fixed;
	top: 0;
	left: 0;
	z-index: 1200;
	display: flex;
	flex-direction: column;
	gap: 4px;
	box-sizing: border-box;
	margin: 0;
	padding: 10px 14px;
	width: max-content;
	max-width: min(var(--ft-max-width), calc(100vw - 20px));
	max-height: var(--ft-max-height);
	overflow: hidden;
	overscroll-behavior: contain;

	color: var(--vp-c-text, #3c3c43);
	font-size: 14px;
	font-weight: 400;
	line-height: 1.65;
	text-align: left;

	background: var(--vp-c-bg-elv, #fff);
	border: 1px solid var(--vp-c-border, #e2e2e3);
	border-radius: 8px;
	box-shadow: 0 6px 24px rgb(0 0 0 / 14%);

	--ft-arrow: 24px;

	opacity: 0;
	// 微动效：从引用一侧「长出」一点，位移方向随浮窗在引用的上/下方而变
	transform: translate3d(0, var(--ft-enter, 4px), 0) scale(0.98);
	transform-origin: var(--ft-arrow) 100%;
	transition:
		opacity 0.17s ease,
		transform 0.2s cubic-bezier(0.22, 0.68, 0.32, 1);
	pointer-events: none;
	will-change: opacity, transform;

	&.is-top {
		--ft-enter: 5px;
		transform-origin: var(--ft-arrow) 100%;
	}

	&.is-bottom {
		--ft-enter: -5px;
		transform-origin: var(--ft-arrow) 0;
	}

	&.is-visible {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}

	// 指向被悬浮引用的箭头
	&__arrow {
		position: absolute;
		left: var(--ft-arrow);
		width: 9px;
		height: 9px;
		background: var(--vp-c-bg-elv, #fff);
		transition: left 0.18s ease;
		pointer-events: none;
	}

	&.is-top > &__arrow {
		bottom: -5px;
		transform: translateX(-50%) rotate(45deg);
		border-right: 1px solid var(--vp-c-border, #e2e2e3);
		border-bottom: 1px solid var(--vp-c-border, #e2e2e3);
		border-bottom-right-radius: 2px;
	}

	&.is-bottom > &__arrow {
		top: -5px;
		transform: translateX(-50%) rotate(45deg);
		border-top: 1px solid var(--vp-c-border, #e2e2e3);
		border-left: 1px solid var(--vp-c-border, #e2e2e3);
		border-top-left-radius: 2px;
	}

	// 被悬浮引用的高亮（配合浮窗一起出现）
	.footnote-ref-link {
		cursor: pointer;
		border-radius: 3px;
		transition: background-color 0.18s ease, box-shadow 0.18s ease;

		&.is-active {
			background: var(--vp-c-accent-soft, rgb(62 115 196 / 16%));
			box-shadow: 0 0 0 2px var(--vp-c-accent-soft, rgb(62 115 196 / 16%));
		}
	}

	&__content {
		flex: 1 1 auto;
		min-height: 0;
		overflow-x: hidden;
		overflow-y: auto;
		overscroll-behavior: contain;
		// 覆盖主题为「正文下方脚注列表」设置的负外边距
		margin: 0 !important;

		// 切换到另一条脚注时内容的重新入场
		&.is-entering {
			animation: ft-content-in 0.22s cubic-bezier(0.22, 0.68, 0.32, 1) both;
		}

		> :first-child {
			margin-top: 0;
		}

		> :last-child {
			margin-bottom: 0;
		}

		.footnote-item,
		li {
			margin-top: 0 !important;
			padding-top: 0 !important;
			list-style: none;
			list-style-type: none;
		}

		ol,
		ul {
			margin: 0;
			padding-left: 0;
		}

		ol ol,
		ol ul,
		ul ol,
		ul ul {
			padding-left: 1.2em;
			list-style: revert;
		}

		p {
			margin: 0.35em 0;
		}

		p:first-child {
			margin-top: 0;
		}

		p:last-child {
			margin-bottom: 0;
		}

		a.footnote-backref,
		.footnote-anchor {
			display: none;
		}

		a {
			color: var(--vp-c-accent, #3e73c4);
			word-break: break-all;
		}

		img {
			max-width: 100%;
			max-height: 180px;
			border-radius: 6px;
			object-fit: contain;
		}

		figure {
			margin: 0.4em 0;
		}

		pre,
		table {
			max-width: 100%;
			overflow-x: auto;
		}

		// 公式/长表格超出宽度时允许横向滚动
		.katex-display {
			overflow-x: auto;
			overflow-y: hidden;
			padding: 2px 0;
		}
	}

	&__more {
		flex: none;
		padding-top: 4px;
		color: var(--vp-c-text-mute, #8a8a8f);
		font-size: 12px;
		background: var(--vp-c-bg-elv, #fff);
		border-top: 1px dashed var(--vp-c-border, #e2e2e3);
		animation: ft-fade-in 0.25s ease both;
	}
}

@keyframes ft-content-in {
	from {
		opacity: 0;
		transform: translate3d(0, 5px, 0);
		filter: blur(1.5px);
	}

	to {
		opacity: 1;
		transform: none;
		filter: none;
	}
}

@keyframes ft-fade-in {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

@media (prefers-reduced-motion: reduce) {
	.footnote-tooltip,
	.footnote-tooltip__arrow,
	.footnote-tooltip__content,
	.footnote-tooltip .footnote-ref-link {
		transition: none !important;
		animation: none !important;
	}

	.footnote-tooltip {
		transform: none;
	}
}

@media print {
	.footnote-tooltip {
		display: none !important;
	}
}
</style>
