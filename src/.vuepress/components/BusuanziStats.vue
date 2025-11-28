<script setup lang="ts">
import { onMounted, watch, nextTick, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
// 控制是否显示，只有当页面上存在 .page-info 元素时才显示
const show = ref(false);

// 核心逻辑：获取不蒜子数据
const fetchBusuanzi = () => {
  // 先重置显示状态，等待 DOM 更新
  show.value = false;

  nextTick(() => {
    // 1. 检查是否存在 .page-info 容器
    const pageInfo = document.querySelector(".page-info");
    if (pageInfo) {
      show.value = true; // 目标存在，允许 Teleport
      
      // 2. 触发不蒜子脚本
      if (typeof window !== "undefined") {
        // @ts-ignore
        if (window.bszCaller) {
            // @ts-ignore
            window.bszCaller.fetch("//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js");
        }
      }
    }
  });
};

onMounted(() => {
  // 稍微延迟一下，确保主题的 Layout 已经渲染完毕
  setTimeout(() => {
    fetchBusuanzi();
  }, 500);
});

// 监听路由变化（切换文章时）
watch(
  () => route.path,
  () => {
    // 路由变化时，页面 DOM 会重绘，需要重新检查 .page-info 是否存在
    setTimeout(() => {
        fetchBusuanzi();
    }, 500); 
  }
);
</script>

<template>
  <ClientOnly>
    <!-- Teleport 负责把内容传送到 class="page-info" 的 div 内部 -->
    <Teleport to=".page-info" v-if="show">
      <span class="page-info-item busuanzi-info-wrapper" aria-label="阅读量" data-balloon-pos="up">
        
        <!-- 替换为 Font Awesome 眼睛图标 -->
        <i class="fas fa-eye icon page-view-icon"></i>
        
        <!-- 不蒜子数据容器 -->
        <span id="busuanzi_container_page_pv" style="display: none">
          <span id="busuanzi_page_pv"></span> 次阅读
        </span>
      </span>
    </Teleport>
  </ClientOnly>
</template>

<style>
/* 这里的样式不需要 scoped，因为是 Teleport 出去的 */
.busuanzi-info-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  margin-left: 0.5em; /* 与前面的标签保持间距 */
  font-size: 0.875em;
  color: inherit;
}

/* 适配 Font Awesome 图标样式，继承主题的 icon 样式 */
.busuanzi-info-wrapper .icon {
  /* 确保 i 标签继承了 Theme Hope 的 icon 样式 */
  width: 1em;
  height: 1em;
  /* 强制设置垂直对齐，覆盖 Font Awesome SVG 渲染带来的影响 */
  vertical-align: middle !important; 
  /* 针对 Font Awesome 4/5/6 转换 SVG 后内部的 path 或 svg 元素进行垂直调整 */
  position: relative;
  top: -1px; /* 稍微向上微调，以达到视觉上的完美居中 */
}

/* 针对 Font Awesome 转换出的 SVG 元素本身进行调整 */
.busuanzi-info-wrapper .icon svg {
  vertical-align: unset !important;
}
</style>