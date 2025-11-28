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
        <svg class="svg-inline--fa fa-eye" focusable="false" data-prefix="fas" data-icon="eye" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"></path></svg>
        
        <!-- 不蒜子数据容器 -->
        <span id="busuanzi_container_page_pv">
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