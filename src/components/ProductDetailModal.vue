<script setup>
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { getImagePath } from '@/utils/imagePath'
import { calculateProductPrice } from '@/utils/productPrice'
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock'

const props = defineProps({
  modelValue: Boolean,
  product: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const selected = reactive({ color: null, size: null, spec: null })
const editedDescription = ref('')
const editingDescription = ref(false)
const customBasePrice = ref(null)
const specCustomPrices = reactive({})
const editableStock = ref(0)

watch(
  () => props.product,
  (p) => {
    if (!p) return
    selected.color = p.colors?.length ? p.colors[0] : null
    selected.size = p.sizes?.length ? p.sizes[0] : null
    selected.spec = p.specifications?.length ? p.specifications[0] : null
    editedDescription.value = p.detailDescription || ''
    editingDescription.value = false
    editableStock.value = Number(p.stock || 0)
    customBasePrice.value = null
    Object.keys(specCustomPrices).forEach((k) => delete specCustomPrices[k])
  },
  { immediate: true },
)

const fallbackPrice = computed(() =>
  props.product ? calculateProductPrice(props.product, selected.spec, selected.size) : 0,
)

const currentPrice = computed(() => {
  if (!props.product) return 0
  if (selected.spec && specCustomPrices[selected.spec] !== undefined) {
    return specCustomPrices[selected.spec]
  }
  if (customBasePrice.value !== null) {
    return customBasePrice.value
  }
  return fallbackPrice.value
})

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

function pickOption(type, value) {
  if (type === 'color') selected.color = value
  if (type === 'size') selected.size = value
  if (type === 'spec') selected.spec = value
}

function editDescription() {
  editingDescription.value = true
}

function saveDescription() {
  editingDescription.value = false
  if (props.product) {
    props.product.detailDescription = editedDescription.value.trim()
  }
}

function editCurrentPrice() {
  const current = currentPrice.value.toFixed(2)
  const input = window.prompt('请输入新的价格（元）', current)
  if (input === null) return
  const next = Number(input)
  if (!Number.isFinite(next) || next <= 0) {
    alert('请输入有效的价格')
    return
  }
  if (selected.spec) {
    specCustomPrices[selected.spec] = Number(next.toFixed(2))
  } else {
    customBasePrice.value = Number(next.toFixed(2))
  }
}

function getSpecPrice(spec) {
  if (!props.product) return 0
  if (specCustomPrices[spec] !== undefined) return specCustomPrices[spec]
  return calculateProductPrice(props.product, spec, selected.size)
}

function editSpecPrice(spec) {
  const input = window.prompt(`设置 ${spec} 的价格（元）`, getSpecPrice(spec).toFixed(2))
  if (input === null) return
  const next = Number(input)
  if (!Number.isFinite(next) || next <= 0) {
    alert('请输入有效的价格')
    return
  }
  specCustomPrices[spec] = Number(next.toFixed(2))
}

function changeStock(delta) {
  const next = Math.max(0, Number(editableStock.value || 0) + delta)
  editableStock.value = next
  if (props.product) props.product.stock = next
}

function applyStock() {
  const next = Math.max(0, Math.floor(Number(editableStock.value || 0)))
  editableStock.value = next
  if (props.product) props.product.stock = next
  alert(`库存已更新为 ${next} 件（演示模式）`)
}

function temporaryOffShelf() {
  if (!props.product) return
  const ok = window.confirm(`确定将「${props.product.name}」暂时下架吗？`)
  if (!ok) return
  alert('已标记为暂时下架（演示模式）')
  close()
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
          <div class="detail-description detail-description-left" @click="editDescription">
            <h3>商品介绍（点击编辑）</h3>
            <textarea
              v-if="editingDescription"
              v-model="editedDescription"
              class="description-editor"
              rows="5"
              @click.stop
              @blur="saveDescription"
            />
            <p v-else>{{ editedDescription || '点击这里填写商品介绍' }}</p>
          </div>
        </div>
        <div class="detail-right">
          <h2 class="detail-product-name" :data-product-id="product.id">{{ product.name }}</h2>
          <p class="detail-product-category">{{ product.category }}</p>
          <div class="detail-price-box clickable-price" @click="editCurrentPrice">
            <span id="detailPrice" class="detail-price">¥{{ currentPrice.toFixed(2) }}</span>
            <span id="detailOriginalPrice" class="detail-original-price"
              >¥{{ originalPrice.toFixed(2) }}</span
            >
            <span class="price-edit-tip">点击价格可修改</span>
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
            <div class="spec-price-editor">
              <div v-for="(sp, idx) in product.specifications" :key="'spep' + idx" class="spec-price-row">
                <span class="spec-name">{{ sp }}</span>
                <span class="spec-price">¥{{ getSpecPrice(sp).toFixed(2) }}</span>
                <button type="button" class="spec-edit-btn" @click="editSpecPrice(sp)">修改</button>
              </div>
            </div>
          </div>
          <div class="detail-option-box">
            <h4>库存情况</h4>
            <div class="stock-control">
              <button type="button" class="stock-btn" @click="changeStock(-1)">-</button>
              <input
                id="detailStock"
                v-model.number="editableStock"
                type="number"
                class="stock-input"
                min="0"
              />
              <button type="button" class="stock-btn" @click="changeStock(1)">+</button>
              <button type="button" class="stock-apply-btn" @click="applyStock">保存库存</button>
            </div>
          </div>
          <div class="detail-actions">
            <button type="button" class="detail-off-shelf-btn" @click="temporaryOffShelf">
              暂时下架商品
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
