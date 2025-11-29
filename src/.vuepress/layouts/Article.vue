<!-- src/.vuepress/layouts/Article.vue -->
<template>
  <ParentLayout>
    <template #page-info-before>
      <PageViewInfo />
    </template>
  </ParentLayout>
</template>

<script setup>
import ParentLayout from "vuepress-theme-hope/layouts/Article"; 
import PageViewInfo from "../components/BusuanziStats.vue";   
</script>
