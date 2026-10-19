<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { usePageData } from "vuepress/client";

/**
 * Vercount 阅读量统计（替换原不蒜子 BusuanziStats）
 *
 * 为什么需要这个组件，而不能只靠官方那段 <script>：
 * 官方脚本只挂一次 DOMContentLoaded，**在 SPA 路由切换时不会重新计数**。
 * 本站是 VuePress 单页应用，站内点进文章时 URL 变了但页面没重载，
 * 若不管，除首屏之外的文章永远不会产生计数。所以这里在每次路由变化后
 * 手动打一次同一个接口，把本页 PV 写回 DOM。
 *
 * 计数接口与官方脚本一致（POST，body 里 url + isNewUv）：
 *   POST https://events.vercount.one/api/v2/log
 *   → { status: "success", data: { site_pv, page_pv, site_uv } }
 * isNewUv 只决定是否把本次访问计入独立访客（UV）。本站已由官方脚本在首屏
 * 写下了 uv cookie，因此这里固定传 false，绝不虚增 UV。
 *
 * 水合注意：根节点用 `mounted` 开关做 client-only（Teleport 在 SSR 下只产出注释，
 * 客户端却要插真实节点，两侧不一致会让水合失败导致整页白屏）。
 */

declare global {
	interface Window {
		vercountRequestSent?: boolean;
	}
}

const ENDPOINT = "https://events.vercount.one/api/v2/log";
const PLACEHOLDER = "Loading";

const route = useRoute();
const pageData = usePageData();

/** client-only 开关：SSR 与水合首帧不渲染 Teleport，避免水合失配 */
const mounted = ref(false);
/** 是否存在 .page-info 容器（仅文章页有） */
const show = ref(false);
const pageView = ref(PLACEHOLDER);
const siteView = ref(PLACEHOLDER);
const siteUv = ref(PLACEHOLDER);

const isArticlePage = computed(() => {
	return (
		route.path.includes("/post/") ||
		route.path.includes("/old/") ||
		pageData.value?.frontmatter?.article !== false
	);
});

/** 写入所有同名 DOM 节点（页脚等处也用了同样的 id） */
const renderTo = (id: string, value: string): void => {
	for (const el of document.querySelectorAll(`#${id}`)) {
		el.textContent = value;
	}
};

const fetchCounts = async (): Promise<void> => {
	if (!isArticlePage.value) return;
	if (typeof window === "undefined") return;

	try {
		const response = await fetch(ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ url: window.location.href, isNewUv: false }),
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const payload = await response.json();
		const data = payload?.data ?? payload;
		if (!data) return;

		const page = Number(data.page_pv ?? 0);
		const site = Number(data.site_pv ?? 0);
		const uv = Number(data.site_uv ?? 0);

		pageView.value = String(page);
		siteView.value = String(site);
		siteUv.value = String(uv);

		// 页脚等静态占位符不归 Vue 管，直接写 DOM
		renderTo("vercount_value_page_pv", String(page));
		renderTo("vercount_value_site_pv", String(site));
		renderTo("vercount_value_site_uv", String(uv));
	} catch (error) {
		console.warn("[vercount] 计数请求失败：", error);
		pageView.value = "---";
	}
};

const refresh = (): void => {
	show.value = false;
	void nextTick(() => {
		if (!document.querySelector(".page-info")) return;
		show.value = true;
		void fetchCounts();
	});
};

onMounted(() => {
	mounted.value = true;
	// 等主题把 .page-info 渲染出来
	setTimeout(refresh, 300);
});

watch(
	() => route.path,
	() => {
		window.vercountRequestSent = false;
		pageView.value = PLACEHOLDER;
		setTimeout(refresh, 300);
	},
);
</script>

<template>
	<Teleport v-if="mounted && show" to=".page-info">
		<span class="page-pageview-info" aria-label="阅读量" data-balloon-pos="up">
			<i class="fa-solid fa-eye pageview-icon"></i>
			<span class="vp-pageview">
				<span class="vercount-value">
					<span id="vercount_value_page_pv">{{ pageView }}</span>
				</span>
				次阅读
			</span>
		</span>
	</Teleport>
</template>

<style scoped>
.pageview-icon {
	margin-inline-end: 0.25em;
}

.vercount-value {
	color: var(--theme-color);
}
</style>
