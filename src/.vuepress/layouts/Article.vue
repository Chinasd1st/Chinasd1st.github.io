<!-- src/.vuepress/layouts/Article.vue -->
<template>
  <ParentLayout>
    <template #page-info-before>
      <PageViewInfo />
    </template>
  </ParentLayout>
</template>

<script setup>
import ParentLayout from "vuepress-theme-hope/layouts/Article"; // 不需要加 .js
import PageViewInfo from "../components/BusuanziStats.vue";      // 你自己写的组件
</script>
