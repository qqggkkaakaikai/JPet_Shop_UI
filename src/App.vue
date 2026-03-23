<template>
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue'
import { initCatCursor } from '@/utils/initCatCursor'

onMounted(() => {
  initCatCursor()
})
</script>
