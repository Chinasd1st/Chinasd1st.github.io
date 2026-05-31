<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { usePageData } from "vuepress/client";

// ==================== 全局类型声明 ====================
declare global {
	interface Window {
		busuanziRequestSent?: boolean;
	}
}
// ================================================

const route = useRoute();
const pageData = usePageData();
const show = ref(false);
const pageView = ref("0");
const siteView = ref("0");

// 判断当前是否在文章详情页
const isArticlePage = computed(() => {
	return (
		route.path.includes("/post/") ||
		route.path.includes("/old/") ||
		// 根据 frontmatter 判断
		pageData.value?.frontmatter?.article !== false
	);
});

// 获取正确的统计URL
const getStatUrl = () => {
	if (isArticlePage.value) {
		return location.href;
	}
	return null;
};

// 不蒜子请求函数
const fetchBusuanzi = async () => {
	const statUrl = getStatUrl();
	if (!statUrl) {
		pageView.value = "---";
		return;
	}

	if (window.busuanziRequestSent) return;

	try {
		window.busuanziRequestSent = true;
		const u = new URL("https://cdn.busuanzi.cc/");

		const response = await fetch(`${u.protocol}//${u.host}/api.php`, {
			method: "POST",
			body: JSON.stringify({
				url: statUrl,
				referrer: document.referrer,
			}),
		});

		const data = await response.json();

		// 更新数据
		for (const key in data) {
			if (key === "busuanzi_page_pv") {
				pageView.value = data[key];
			} else if (key === "busuanzi_site_pv") {
				siteView.value = data[key];
			}

			// 同时更新DOM元素（如果有的话）
			const elements = document.querySelectorAll(`#${key}`);
			elements.forEach((e) => {
				(e as HTMLElement).innerText = data[key];
			});
		}
	} catch (error) {
		console.error("不蒜子统计获取失败:", error);
		pageView.value = "---";
	}
};

// 检查并初始化不蒜子
const initBusuanzi = () => {
	show.value = false;

	nextTick(() => {
		const pageInfo = document.querySelector(".page-info");
		if (pageInfo && isArticlePage.value) {
			show.value = true;

			// 重置请求状态，允许重新请求
			window.busuanziRequestSent = false;

			// 立即执行不蒜子请求
			setTimeout(() => {
				fetchBusuanzi();
			}, 100);
		}
	});
};

onMounted(() => {
	// 确保DOM完全渲染后再执行
	setTimeout(() => {
		initBusuanzi();
	}, 300);
});

// 监听路由变化
watch(
	() => route.path,
	() => {
		// 路由变化时重置状态
		pageView.value = "0";
		window.busuanziRequestSent = false;

		setTimeout(() => {
			initBusuanzi();
		}, 300);
	},
);
</script>

<template>
	<ClientOnly>
		<Teleport to=".page-info" v-if="show">
			<span class="page-pageview-info" aria-label="阅读量" data-balloon-pos="up">
				<i class="fa-solid fa-eye pageview-icon"></i>
				<span class="vp-pageview">
					<span class="busuanzi-value">{{ pageView }}</span> 次阅读
				</span>
			</span>
		</Teleport>
	</ClientOnly>
</template>

<style scoped>
.pageview-icon {
	margin-inline-end: 0.25em;
}

.busuanzi-value {
	color: var(--theme-color);
}
</style>