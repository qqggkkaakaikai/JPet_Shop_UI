<script setup>
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCartBadgeStore } from '@/stores/cartBadge'

defineProps({
  active: { type: String, default: 'index' },
})

const router = useRouter()
const cartBadge = useCartBadgeStore()
const { count, visible } = storeToRefs(cartBadge)

function go(path) {
  router.push(path)
}
</script>

<template>
  <div class="tab-btn-box">
    <button class="tab-btn" :class="{ active: active === 'index' }" type="button" @click="go('/index')">
      首页
    </button>
    <button class="tab-btn" :class="{ active: active === 'category' }" type="button" @click="go('/category')">
      商品
    </button>
    <button class="tab-btn" :class="{ active: active === 'medical' }" type="button" @click="go('/medical')">
      商品上架审核
    </button>
    <button class="tab-btn" :class="{ active: active === 'cart' }" type="button" @click="go('/cart')">
      商品物流
      <span v-show="visible" class="cart-badge" id="cartBadge">{{ count }}</span>
    </button>
    <button class="tab-btn" :class="{ active: active === 'profile' }" type="button" @click="go('/profile')">
      我的
    </button>
  </div>
</template>

<style scoped>
.cart-badge {
  display: inline-block;
}
</style>
