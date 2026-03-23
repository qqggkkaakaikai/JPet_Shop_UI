<script setup>
import { getImagePath } from '@/utils/imagePath'

defineProps({
  /** 仅首页展示立体猫狗装饰 */
  floatingPets: { type: Boolean, default: false },
})
</script>

<template>
  <div class="shop-header">
    <span class="paw-decoration paw-1">🐾</span>
    <span class="paw-decoration paw-2">🐾</span>
    <span class="paw-decoration paw-3">🐾</span>
    <span class="paw-decoration paw-4">🐾</span>
    <span class="paw-decoration paw-5">🐾</span>
    <span class="paw-decoration paw-6">🐾</span>

    <div v-if="floatingPets" class="floating-pets">
      <div class="floating-pet pet-dog">
        <img :src="getImagePath('images/logo-小狗.png')" alt="立体小狗标识" />
      </div>
      <div class="floating-pet pet-cat">
        <img :src="getImagePath('images/logo-小猫.png')" alt="萌猫标识" />
      </div>
    </div>

    <div class="shop-logo">
      <span class="logo-icon">🐾</span>
      <span class="logo-pet-left">🐱</span>
      <span class="logo-pet-right">🐶</span>
    </div>
    <div class="shop-info">
      <h1 class="shop-name">爱宠生活馆</h1>
      <p class="shop-slogan">用心呵护每一只毛孩子</p>
    </div>
  </div>
</template>
