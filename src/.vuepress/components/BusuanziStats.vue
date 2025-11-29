<script setup lang="ts">
import { onMounted, watch, nextTick, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const show = ref(false);

// 加载不蒜子脚本
const loadBusuanziScript = () => {
  // 检查是否已经加载过
  if (document.querySelector('script[src*="busuanzi"]')) {
    return;
  }
  
  const script = document.createElement('script');
  script.src = '//cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js';
  script.defer = true;
  document.head.appendChild(script);
};

// 核心逻辑：处理不蒜子统计
const handleBusuanzi = () => {
  show.value = false;

  nextTick(() => {
    const pageInfo = document.querySelector(".page-info");
    if (pageInfo) {
      show.value = true;
      
      // 确保不蒜子脚本已加载
      loadBusuanziScript();
      
      // 手动触发不蒜子更新（如果busuanzi对象存在）
      if (typeof window !== 'undefined' && (window as any).busuanzi) {
        (window as any).busuanzi.fetch();
      }
    }
  });
};

onMounted(() => {
  // 先加载不蒜子脚本
  loadBusuanziScript();
  
  setTimeout(() => {
    handleBusuanzi();
  }, 500);
});

// 监听路由变化
watch(
  () => route.path,
  () => {
    setTimeout(() => {
      handleBusuanzi();
    }, 500);
  }
);
</script>

<template>
  <ClientOnly>
    <Teleport to=".page-info" v-if="show">
      <span class="page-info-item busuanzi-info-wrapper" aria-label="阅读量" data-balloon-pos="up">
        <!-- 使用主题提供的图标 -->
        <span class="icon">
          <svg focusable="false" viewBox="0 0 576 512" style="width: 1em; height: 1em; vertical-align: -0.125em;">
            <path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"></path>
          </svg>
        </span>
        
        <!-- 不蒜子数据容器 -->
        <span id="busuanzi_container_page_pv">
          <span id="busuanzi_page_pv">加载中</span> 次阅读
        </span>
      </span>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.busuanzi-info-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  margin-left: 0.5em;
  font-size: 0.875em;
  color: inherit;
}

.busuanzi-info-wrapper .icon {
  display: inline-flex;
  align-items: center;
}

.busuanzi-info-wrapper .icon svg {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}
</style>