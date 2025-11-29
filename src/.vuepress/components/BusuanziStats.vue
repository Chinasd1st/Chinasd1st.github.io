<script setup lang="ts">
import { onMounted, watch, nextTick, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const show = ref(false);
const pageView = ref("0");
const siteView = ref("0");

// 不蒜子请求函数
const fetchBusuanzi = async () => {
  if ((window as any).busuanziRequestSent) return;
  
  try {
    (window as any).busuanziRequestSent = true;
    const u = new URL('https://cdn.busuanzi.cc/');
    
    const response = await fetch(u.protocol + '//' + u.host + '/api.php', {
      method: 'POST',
      body: JSON.stringify({
        url: location.href,
        referrer: document.referrer
      })
    });
    
    const data = await response.json();
    
    // 更新数据
    for (const key in data) {
      if (key === 'busuanzi_page_pv') {
        pageView.value = data[key];
      } else if (key === 'busuanzi_site_pv') {
        siteView.value = data[key];
      }
      
      // 同时更新DOM元素（如果有的话）
      const elements = document.querySelectorAll('#' + key);
      elements.forEach(e => {
        (e as HTMLElement).innerText = data[key];
      });
    }
  } catch (error) {
    console.error('不蒜子统计获取失败:', error);
    // 失败时显示默认值
    pageView.value = "---";
  }
};

// 检查并初始化不蒜子
const initBusuanzi = () => {
  show.value = false;

  nextTick(() => {
    const pageInfo = document.querySelector(".page-info");
    if (pageInfo) {
      show.value = true;
      
      // 重置请求状态，允许重新请求
      (window as any).busuanziRequestSent = false;
      
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
    (window as any).busuanziRequestSent = false;
    
    setTimeout(() => {
      initBusuanzi();
    }, 300);
  }
);
</script>

<template>
  <ClientOnly>
    <Teleport to=".page-info" v-if="show">
      <span class="page-info-item busuanzi-info-wrapper" aria-label="阅读量" data-balloon-pos="up">
        <span class="icon">
          <svg focusable="false" viewBox="0 0 576 512" style="width: 1em; height: 1em; vertical-align: -0.125em;">
            <path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"></path>
          </svg>
        </span>
        
        <!-- 使用响应式数据 -->
        <span class="busuanzi-container">
          <span class="busuanzi-value">{{ pageView }}</span> 次阅读
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

.busuanzi-container {
  white-space: nowrap;
}

.busuanzi-value {
  font-weight: 600;
  color: var(--theme-color);
}
</style>