<template>
	<!--
		这些 slot 只是「占位」：作为 rootComponent，本组件的 DOM 位于页面布局之外
		（在页脚之后），直接渲染工具栏会跑到页面底部。因此 enrich() 会把每个 slot
		移动到对应表格的旁边，:ref 回调负责重新插入。
	-->
	<div
		v-for="table in enhanced"
		:key="table.id"
		:ref="(el) => setSlot(table.id, el)"
		class="vp-table-enhance-slot"
	>
		<div class="vp-table-enhance__bar">
			<input
				v-if="table.filterable"
				class="vp-table-enhance__filter"
				type="search"
				:placeholder="table.placeholder"
				:aria-label="table.placeholder"
				@input="onFilter(table, $event)"
			/>
			<span v-else class="vp-table-enhance__hint">点击表头可排序</span>

			<span class="vp-table-enhance__count">{{ table.countLabel }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePageData } from "vuepress/client";

/**
 * 表格自动增强 —— MediaWiki「可排序表格」在本项目的对应物
 *
 * 项目现状：49 篇文章共 3,827 行 Markdown 表格，单篇最大 2,532 行。
 * 这些表格既不能排序也不能筛选，是当前最大的可用性缺口。
 *
 * 设计取舍：
 * 1. **不改任何 .md**。本组件作为 rootComponent 直接增强已渲染的 <table>，
 *    存量文章零改动即可受益，也不介入主题的 markdown 渲染链。
 * 2. **按需增强**。小表格保持原样——给一张 3 行的表套工具栏只是噪音，
 *    还会拖慢每个页面。只有超过阈值才接管。
 * 3. **不做分页**。筛选框本身就是对 2,500 行的即时全文检索，
 *    比翻页更符合"查数据"的用途，也少一整套状态管理。
 * 4. 两种表头约定都兼容：`<thead>`（本项目主流），或无 <thead> 但首行全为 <th>。
 *    后者的第二行往往是分组名而非列名（如「类型/番剧」表），此时禁用排序以免语义错乱。
 */

const props = withDefaults(
	defineProps<{
		/** 选中页面正文容器（本项目实测为 #markdown-content，主题旧版为 .theme-hope-content） */
		contentSelector?: string;
		/** 达到该行数启用筛选框 */
		filterThreshold?: number;
		/**
		 * 少于该列数不接管。
		 * 取 2 而不是 3：本项目最大的表格恰好只有「名称 / 数量」两列、却有 2,512 行，
		 * 这种长列表正是最需要筛选的。真正该排除的是 1 列的装饰性表格。
		 */
		minColumns?: number;
		/** 两列表格至少要有这么多行才接管（避免给「维度/权重」这类小对照表加工具栏） */
		twoColumnMinRows?: number;
	}>(),
	{
		contentSelector: "#markdown-content",
		filterThreshold: 8,
		minColumns: 2,
		twoColumnMinRows: 20,
	},
);

/** 兼容不同主题版本的正文容器类名 */
const CONTENT_SELECTORS = ["#markdown-content", ".theme-hope-content", "#main-content"];

/** 原始行序：排序可反复重置，基准顺序必须只记录一次 */
const baseOrder = new WeakMap<HTMLTableRowElement, number>();

/** state.id → 工具栏占位元素 */
const slots = new Map<string, HTMLElement>();
/** state.id → 期望的 DOM 位置（表格前方） */
const slotTargets = new Map<string, { parent: Node; before: Node | null }>();

const setSlot = (id: string, el: unknown): void => {
	const node = (el as HTMLElement | null) ?? null;
	if (node) slots.set(id, node);
	else slots.delete(id);
};

/** 把占位工具栏搬到对应表格前面 */
const mountSlot = (id: string): void => {
	const slot = slots.get(id);
	const target = slotTargets.get(id);
	if (!slot || !target) return;
	if (slot.parentElement === target.parent && slot.nextSibling === target.before) return;
	target.parent.insertBefore(slot, target.before);
};

const mountAllSlots = (): void => {
	for (const id of slotTargets.keys()) mountSlot(id);
};

interface EnhanceState {
	id: string;
	root: HTMLElement;
	table: HTMLTableElement;
	rows: HTMLTableRowElement[];
	filterable: boolean;
	placeholder: string;
	countLabel: string;
	total: number;
	query: string;
	sortColumn: number;
	sortDirection: 1 | -1 | 0;
}

const pageData = usePageData();
const enhanced = ref<EnhanceState[]>([]);

let observer: MutationObserver | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let seq = 0;

const TEXT = (node: Element | null): string => (node?.textContent || "").replace(/\s+/g, " ").trim();

/** 单元格排序值：优先数值，其次日期，最后按字符串比较 */
const sortValue = (cell: Element | null): { n: number | null; t: string } => {
	const text = TEXT(cell);
	const cleaned = text
		.replace(/[,\s\u00a0]/g, "")
		.replace(/[%％]$/, "")
		.replace(/[¥$€£]/g, "");

	if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
		const n = Number(cleaned);
		if (Number.isFinite(n)) return { n, t: text };
	}

	const date = /^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/.exec(text);
	if (date) {
		return {
			n: Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3] || 1)),
			t: text,
		};
	}

	return { n: null, t: text };
};

/** 定位表头行与数据行；返回 null 表示这张表不值得/不适合接管 */
const analyze = (table: HTMLTableElement, minColumns: number, twoColumnMinRows: number) => {
	const tbodyRows = [...table.tBodies].flatMap((body) => [...body.rows]);
	let headRow: HTMLTableRowElement | null = null;
	let sortableHeader: HTMLTableRowElement | null = null;
	let rows: HTMLTableRowElement[] = [];

	if (table.tHead && table.tHead.rows.length > 0) {
		headRow = table.tHead.rows[table.tHead.rows.length - 1];
		sortableHeader = headRow;
		rows = tbodyRows;
	} else {
		const all = [...table.rows];
		const first = all[0];
		if (first && first.cells.length > 0 && [...first.cells].every((c) => c.tagName === "TH")) {
			headRow = first;
			rows = all.slice(1);
			// 第二行若也全是 <th>，说明它是分组名而非列名，排序语义不成立
			const second = rows[0];
			sortableHeader =
				second && second.cells.length > 0 && [...second.cells].every((c) => c.tagName === "TH")
					? null
					: first;
		} else {
			rows = all;
		}
	}

	if (!headRow || rows.length === 0) return null;
	if (headRow.cells.length < minColumns) return null;
	// 两列表格多为「维度/权重」这类小对照表，行数不够就不打扰它
	if (headRow.cells.length === 2 && rows.length < twoColumnMinRows) return null;

	return { headRow, sortableHeader, rows };
};

/** 把 DOM 行序与显隐一次性落盘 */
const paint = (state: EnhanceState): void => {
	const query = state.query.trim().toLowerCase();

	// 表格被 ::: details 折叠时行不可见，此时跳过排序/显隐，等展开后 enrich 再刷新
	if (state.table.closest("details:not([open])")) {
		state.countLabel = `${state.rows.length} 行`;
		return;
	}

	// 1) 先算目标顺序（基准顺序必须用 baseOrder，否则重置时会按上一次的排序结果还原）
	const parent = state.rows[0]?.parentElement;
	const targetOrder =
		state.sortDirection === 0
			? [...state.rows].sort((a, b) => (baseOrder.get(a) ?? 0) - (baseOrder.get(b) ?? 0))
			: (() => {
					const column = state.sortColumn;
					const decorated = state.rows.map((row) => ({
						row,
						value: sortValue(row.cells[column] ?? null),
					}));
					const numeric = decorated.every((d) => d.value.n !== null);

					decorated.sort((a, b) => {
						let diff: number;
						if (numeric) diff = (a.value.n as number) - (b.value.n as number);
						else diff = a.value.t.localeCompare(b.value.t, "zh-Hans-CN", { numeric: true });
						if (diff === 0) {
							return (baseOrder.get(a.row) ?? 0) - (baseOrder.get(b.row) ?? 0);
						}
						return diff * state.sortDirection;
					});

					return decorated.map((d) => d.row);
				})();

	// 2) 落盘顺序 + 筛选显隐。
	//
	// 性能要点（实测于本项目 2,511 行的最大表格）：
	// 在「已渲染」的长表格上逐个 appendChild 会触发浏览器重排整张表，约 6 秒；
	// 而只改行样式约 37ms。因此这里做脏检查——顺序没变就完全不碰 DOM，
	// 让筛选/清除筛选这类操作永远走快路径，只有真正改变顺序的排序才付重排代价。
	if (parent) {
		// state.rows 始终与 DOM 顺序保持一致，可直接与目标顺序比对
		let needsReorder = state.rows.length !== targetOrder.length;
		if (!needsReorder) {
			for (let i = 0; i < targetOrder.length; i += 1) {
				if (state.rows[i] !== targetOrder[i]) {
					needsReorder = true;
					break;
				}
			}
		}

		if (needsReorder) {
			for (const row of targetOrder) parent.appendChild(row);
			state.rows = targetOrder;
		}

		let shown = 0;
		for (const row of state.rows) {
			const matches = !query || TEXT(row).toLowerCase().includes(query);
			if (matches) {
				shown += 1;
				row.style.setProperty("--vp-table-display", "table-row");
			} else {
				row.style.setProperty("--vp-table-display", "none");
			}
		}
		state.total = shown;
	}

	state.countLabel =
		query || state.sortDirection !== 0
			? `${state.total} / ${state.rows.length} 行`
			: `${state.rows.length} 行`;
};

const onFilter = (state: EnhanceState, event: Event): void => {
	state.query = (event.target as HTMLInputElement).value;
	paint(state);
};

const onHeaderClick = (event: Event): void => {
	const th = (event.target as Element | null)?.closest?.("th");
	if (!th || !(th instanceof HTMLTableCellElement)) return;
	if (!th.classList.contains("vp-table-sortable")) return;

	const state = enhanced.value.find((s) => s.table.contains(th));
	if (!state) return;

	const column = th.cellIndex;
	if (state.sortColumn === column) {
		state.sortDirection = state.sortDirection === 1 ? -1 : state.sortDirection === -1 ? 0 : 1;
	} else {
		state.sortColumn = column;
		state.sortDirection = 1;
	}

	// 清理旧指示
	for (const cell of [...(state.table.tHead?.rows[0]?.cells ?? [])]) {
		cell.classList.remove("vp-table-sort-asc", "vp-table-sort-desc");
		cell.removeAttribute("aria-sort");
	}
	// 无 <thead> 的表，表头可能在 tbody 里
	for (const row of [...state.table.rows].slice(0, 2)) {
		for (const cell of [...row.cells]) {
			cell.classList.remove("vp-table-sort-asc", "vp-table-sort-desc");
			cell.removeAttribute("aria-sort");
		}
	}

	if (state.sortDirection !== 0) {
		th.classList.add(state.sortDirection === 1 ? "vp-table-sort-asc" : "vp-table-sort-desc");
		th.setAttribute("aria-sort", state.sortDirection === 1 ? "ascending" : "descending");
	}

	paint(state);
};

const onHeaderKeydown = (event: KeyboardEvent): void => {
	if (event.key !== "Enter" && event.key !== " ") return;
	if (!(event.target as Element | null)?.closest?.("th.vp-table-sortable")) return;
	event.preventDefault();
	onHeaderClick(event);
};

/** ::: details 展开后表格行才可测量，此时补一次刷新 */
const onToggle = (event: Event): void => {
	const details = event.target;
	if (!(details instanceof HTMLDetailsElement) || !details.open) return;
	for (const state of enhanced.value) {
		if (state.root === details) paint(state);
	}
};

/** 扫描正文，接管够格的表格 */
const enrich = (): void => {
	const host =
		document.querySelector(props.contentSelector) ??
		CONTENT_SELECTORS.map((selector) => document.querySelector(selector)).find(Boolean);

	if (!host) {
		// 正文容器还没渲染出来：清掉上一页的状态，等观察器再触发
		if (enhanced.value.length > 0) enhanced.value = [];
		return;
	}

	// 关键：本次 run 必须整体替换增强列表（正文已被替换），但不能把「本轮没有新表格」
	// 误判成「页面没有表格」——否则一次多余的重扫就会清空工具栏状态。
	const next: EnhanceState[] = [];
	let freshFound = 0;

	// 正文已被替换：清掉上一页的定位信息
	slots.clear();
	slotTargets.clear();

	for (const table of [...host.querySelectorAll<HTMLTableElement>("table")]) {
		// 标记打在 table 上：表格所在的容器会被整块替换，table 引用会在下一次
		// enrich 时重新查询，两者不会错位。
		if (table.dataset.tableEnhanced === "true") continue;

		const info = analyze(table, props.minColumns, props.twoColumnMinRows);
		if (!info) continue;

		table.dataset.tableEnhanced = "true";
		table.classList.add("vp-table-enhanced");
		freshFound += 1;

		// 记录一次基准行序，供「重置排序」还原
		info.rows.forEach((row, index) => {
			if (!baseOrder.has(row)) baseOrder.set(row, index);
		});

		if (info.sortableHeader) {
			for (const cell of [...info.sortableHeader.cells]) {
				cell.classList.add("vp-table-sortable");
				cell.setAttribute("tabindex", "0");
				cell.setAttribute("aria-sort", "none");
			}
		}

		const id = `vp-table-${seq++}`;

		// 工具栏的目标位置：表格正前方（表格可能在 <details> 的折叠容器里）
		const parent = table.parentNode;
		if (parent) slotTargets.set(id, { parent, before: table });

		next.push({
			id,
			root: (table.closest("details") as HTMLElement | null) ?? table,
			table,
			rows: info.rows,
			filterable: info.rows.length >= props.filterThreshold,
			placeholder: `在这 ${info.rows.length} 行中筛选…`,
			countLabel: `${info.rows.length} 行`,
			total: info.rows.length,
			query: "",
			sortColumn: -1,
			sortDirection: 0,
		});
	}

	// 只在本轮确实接管了新表格时替换；否则保留已有状态
	if (freshFound > 0) {
		enhanced.value = next;
		void nextTick(mountAllSlots);
	}
};

const scheduleEnrich = (): void => {
	if (flushTimer) clearTimeout(flushTimer);
	flushTimer = setTimeout(() => {
		flushTimer = null;
		enrich();
	}, 120);
};

// 切页后正文被替换，表格要重新接管
watch(
	() => pageData.value.path,
	async () => {
		await nextTick();
		scheduleEnrich();
	},
);

onMounted(() => {
	void nextTick(enrich);

	// 水合/切页/懒加载都可能后插表格，用观察器兜底（防抖，避免长表格渲染期抖动）
	observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			const target = mutation.target as Element | null;
			if (!target || typeof target.querySelector !== "function") continue;
			if (target.querySelector("table:not([data-table-enhanced])")) {
				scheduleEnrich();
				return;
			}		}
	});
	observer.observe(document.body, { childList: true, subtree: true });

	// 委托到 document：表格节点可能被整体替换
	document.addEventListener("click", onHeaderClick);
	document.addEventListener("keydown", onHeaderKeydown);
	document.addEventListener("toggle", onToggle, true);
});

onBeforeUnmount(() => {
	if (flushTimer) clearTimeout(flushTimer);
	observer?.disconnect();
	observer = null;
	document.removeEventListener("click", onHeaderClick);
	document.removeEventListener("keydown", onHeaderKeydown);
	document.removeEventListener("toggle", onToggle, true);
	slots.clear();
	slotTargets.clear();
});
</script>

<style lang="scss">
/* 非 scoped：目标节点来自 SSR/v-html，scoped 属性不会命中 */

/* 工具栏容器：由 JS 从 rootComponent 搬到对应表格前面 */
.vp-table-enhance-slot {
	margin: 0.9rem 0 -0.1rem;
}

.vp-table-enhance {
	&__bar {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		margin-bottom: 6px;
		padding: 6px 10px;
		font-size: 13px;
		color: var(--vp-c-text-mute, #8a8a8f);
		background: var(--vp-c-bg-soft, #f6f6f7);
		border: 1px solid var(--vp-c-border, #e2e2e3);
		border-radius: 8px;
	}

	&__filter {
		flex: 1 1 200px;
		min-width: 140px;
		height: 30px;
		padding: 0 10px;
		font: inherit;
		font-size: 13px;
		color: var(--vp-c-text, #3c3c43);
		background: var(--vp-c-bg, #fff);
		border: 1px solid var(--vp-c-border, #e2e2e3);
		border-radius: 6px;
		outline: none;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;

		&:focus {
			border-color: var(--vp-c-accent, #3e73c4);
			box-shadow: 0 0 0 3px var(--vp-c-accent-soft, rgb(62 115 196 / 16%));
		}
	}

	&__hint {
		flex: 1 1 auto;
	}

	&__count {
		flex: none;
		font-variant-numeric: tabular-nums;
	}
}

/* ---------------------------- 表格本体 ---------------------------- */

.vp-table-enhanced th.vp-table-sortable {
	cursor: pointer;
	user-select: none;
	white-space: nowrap;
	transition: background-color 0.15s ease;

	&:hover {
		background: var(--vp-c-accent-soft, rgb(62 115 196 / 16%));
	}

	&:focus-visible {
		outline: 2px solid var(--vp-c-accent, #3e73c4);
		outline-offset: -2px;
	}
}

/* 排序指示：默认双向箭头，升/降序高亮 */
.vp-table-sortable::after {
	content: "⇅";
	display: inline-block;
	margin-left: 0.35em;
	font-size: 0.85em;
	opacity: 0.32;
	transform: translateY(-1px);
}

.vp-table-enhanced th.vp-table-sort-asc::after {
	content: "↑";
	opacity: 0.95;
	color: var(--vp-c-accent, #3e73c4);
}

.vp-table-enhanced th.vp-table-sort-desc::after {
	content: "↓";
	opacity: 0.95;
	color: var(--vp-c-accent, #3e73c4);
}

/* 行显隐由增强状态接管 */
.vp-table-enhanced tbody tr {
	display: var(--vp-table-display, table-row);
}

@media print {
	.vp-table-enhance {
		display: none !important;
	}

	.vp-table-enhanced tbody tr {
		display: table-row !important;
	}
}
</style>
