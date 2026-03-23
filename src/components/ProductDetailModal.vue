<script setup>
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getImagePath } from '@/utils/imagePath'
import { calculateProductPrice } from '@/utils/productPrice'
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock'
import { cartApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useCartBadgeStore } from '@/stores/cartBadge'

const props = defineProps({
  modelValue: Boolean,
  product: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const auth = useAuthStore()
const cartBadge = useCartBadgeStore()

const selected = reactive({ color: null, size: null, spec: null })
const quantity = ref(1)

watch(
  () => props.product,
  (p) => {
    if (!p) return
    selected.color = p.colors?.length ? p.colors[0] : null
    selected.size = p.sizes?.length ? p.sizes[0] : null
    selected.spec = p.specifications?.length ? p.specifications[0] : null
    quantity.value = 1
  },
  { immediate: true },
)

const currentPrice = computed(() =>
  props.product ? calculateProductPrice(props.product, selected.spec, selected.size) : 0,
)

const originalPrice = computed(() => Math.floor(currentPrice.value * 1.2))

watch(
  () => props.modelValue,
  (open) => {
    if (open) lockBodyScroll()
    else unlockBodyScroll()
  },
)

function close() {
  emit('update:modelValue', false)
  unlockBodyScroll()
}

function ensureLoggedIn() {
  if (!auth.user?.id) {
    alert('请先登录')
    router.push('/login')
    return false
  }
  return true
}

function changeQuantity(delta) {
  const max = props.product?.stock ?? 999
  let v = Number(quantity.value) + delta
  v = Math.max(1, Math.min(v, max))
  quantity.value = v
}

function pickOption(type, value) {
  if (type === 'color') selected.color = value
  if (type === 'size') selected.size = value
  if (type === 'spec') selected.spec = value
}

async function submitCart(goCartAfter) {
  if (!props.product || !ensureLoggedIn()) return
  const p = props.product
  const payload = {
    userId: auth.user.id,
    productId: p.id,
    quantity: quantity.value,
    selectedAttributes: {
      color: selected.color,
      size: selected.size,
      specification: selected.spec,
    },
    isPurchased: false,
  }
  try {
    await cartApi.add(payload)
    alert('已添加到购物车')
    await cartBadge.refresh()
    close()
    if (goCartAfter) router.push('/cart')
  } catch (e) {
    alert(e.message || '添加购物车失败')
  }
}

function addDetailToCart() {
  submitCart(false)
}

function buyNow() {
  submitCart(true)
}

onUnmounted(() => {
  unlockBodyScroll()
})
</script>

<template>
  <div
    v-if="modelValue && product"
    id="productDetailModal"
    class="product-detail-overlay"
    style="display: flex"
    @click="close"
  >
    <div class="product-detail-container" @click.stop>
      <button type="button" class="detail-close-btn" @click="close">✕</button>
      <div class="detail-content" id="productDetailContent">
        <div class="detail-left">
          <div class="detail-image-box">
            <img :src="getImagePath(product.image)" :alt="product.name" />
          </div>
          <div class="detail-sales-info">
            <span class="sales-count">已售 {{ product.sales }} 件</span>
            <span class="stock-count">库存 {{ product.stock }} 件</span>
          </div>
        </div>
        <div class="detail-right">
          <h2 class="detail-product-name" :data-product-id="product.id">{{ product.name }}</h2>
          <p class="detail-product-category">{{ product.category }}</p>
          <div class="detail-price-box">
            <span id="detailPrice" class="detail-price">¥{{ currentPrice.toFixed(2) }}</span>
            <span id="detailOriginalPrice" class="detail-original-price"
              >¥{{ originalPrice.toFixed(2) }}</span
            >
          </div>
          <div class="detail-description">
            <h3>商品介绍</h3>
            <p>{{ product.detailDescription }}</p>
          </div>
          <div v-if="product.weight" class="detail-spec-info">
            <span class="spec-label">重量：</span>
            <span class="spec-value">{{ product.weight }}</span>
          </div>
          <div v-if="product.dimensions" class="detail-spec-info">
            <span class="spec-label">商品尺寸：</span>
            <span class="spec-value">{{ product.dimensions }}</span>
          </div>
          <div v-if="product.colors?.length" class="detail-option-box">
            <h4>选择颜色</h4>
            <div id="colorOptions" class="option-buttons">
              <button
                v-for="(c, idx) in product.colors"
                :key="'c' + idx"
                type="button"
                class="option-btn"
                :class="{ active: selected.color === c }"
                @click="pickOption('color', c)"
              >
                {{ c }}
              </button>
            </div>
          </div>
          <div v-if="product.sizes?.length" class="detail-option-box">
            <h4>选择尺寸</h4>
            <div id="sizeOptions" class="option-buttons">
              <button
                v-for="(s, idx) in product.sizes"
                :key="'s' + idx"
                type="button"
                class="option-btn"
                :class="{ active: selected.size === s }"
                @click="pickOption('size', s)"
              >
                {{ s }}
              </button>
            </div>
          </div>
          <div v-if="product.specifications?.length" class="detail-option-box">
            <h4>选择规格</h4>
            <div id="specOptions" class="option-buttons">
              <button
                v-for="(sp, idx) in product.specifications"
                :key="'sp' + idx"
                type="button"
                class="option-btn"
                :class="{ active: selected.spec === sp }"
                @click="pickOption('spec', sp)"
              >
                {{ sp }}
              </button>
            </div>
          </div>
          <div class="detail-option-box">
            <h4>选择数量</h4>
            <div class="quantity-control">
              <button type="button" class="quantity-btn" @click="changeQuantity(-1)">-</button>
              <input
                id="detailQuantity"
                v-model.number="quantity"
                type="number"
                class="quantity-input"
                min="1"
                :max="product.stock"
              />
              <button type="button" class="quantity-btn" @click="changeQuantity(1)">+</button>
            </div>
          </div>
          <div class="detail-actions">
            <button type="button" class="detail-add-cart-btn" @click="addDetailToCart">加入购物车</button>
            <button type="button" class="detail-buy-now-btn" @click="buyNow">立即购买</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
