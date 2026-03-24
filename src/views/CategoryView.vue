<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ShopHeader from '@/components/ShopHeader.vue'
import ShopNav from '@/components/ShopNav.vue'
import ProductDetailModal from '@/components/ProductDetailModal.vue'
import { getImagePath } from '@/utils/imagePath'
import { useCatalogStore } from '@/stores/catalog'
import { useRouter } from 'vue-router'

import '@/styles/legacy/common.css'
import '@/styles/legacy/productDetail.css'
import '@/styles/legacy/category.css'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()

const selectedCategory = ref('全部')
const sortBy = ref('default')

const categoryButtons = computed(() => catalog.categories())

function getPurchaseCount(product) {
  const v = Number(product.purchaseCount ?? product.sales ?? 0)
  return Number.isFinite(v) ? v : 0
}

function getHeatScore(product) {
  const raw = product.heatScore
  if (raw !== undefined && raw !== null) {
    const v = Number(raw)
    if (Number.isFinite(v)) return v
  }
  return getPurchaseCount(product)
}

function getStockCount(product) {
  const v = Number(product.stockCount ?? product.stock ?? 0)
  return Number.isFinite(v) ? v : 0
}

const filteredProducts = computed(() => {
  let list =
    selectedCategory.value === '全部'
      ? [...catalog.products]
      : catalog.products.filter((p) => p.category === selectedCategory.value)

  const searchKeyword = route.query.search
  if (searchKeyword && String(searchKeyword).length) {
    const kw = String(searchKeyword).toLowerCase()
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        (p.description && p.description.toLowerCase().includes(kw)),
    )
  }

  switch (sortBy.value) {
    case 'heat-asc':
      list.sort((a, b) => getHeatScore(a) - getHeatScore(b))
      break
    case 'heat-desc':
      list.sort((a, b) => getHeatScore(b) - getHeatScore(a))
      break
    case 'purchase-asc':
      list.sort((a, b) => getPurchaseCount(a) - getPurchaseCount(b))
      break
    case 'purchase-desc':
      list.sort((a, b) => getPurchaseCount(b) - getPurchaseCount(a))
      break
    default:
      break
  }
  return list
})

function selectCategory(cat) {
  selectedCategory.value = cat
}

function clearFilter() {
  selectedCategory.value = '全部'
  sortBy.value = 'default'
  router.replace({ path: '/category' })
}

const detailOpen = ref(false)
const detailProduct = ref(null)

function openProductDetail(p) {
  detailProduct.value = p
  detailOpen.value = true
}

onMounted(async () => {
  await catalog.loadAll()
})

watch(
  () => route.query.search,
  () => {},
)
</script>

<template>
  <div class="App">
    <ShopHeader />
    <ShopNav active="category" />

    <div class="kinds-ui-box">
      <div class="head-tag-box">
        <div class="category-tags">
          <span class="head-tag-text">商品分类：</span>
          <div id="categoryButtons">
            <button
              v-for="(cat, index) in categoryButtons"
              :key="cat"
              type="button"
              class="category-btn"
              :class="{ active: selectedCategory === cat }"
              :style="{ '--index': index }"
              @click="selectCategory(cat)"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <div class="selected-filters">
          <span class="head-tag-text">当前筛选：</span>
          <span id="selectedCategory" class="head-tag-text-selected">{{ selectedCategory }}</span>
          <button
            v-show="selectedCategory !== '全部'"
            id="clearFilterBtn"
            type="button"
            class="head-tag-btn-clear"
            @click="clearFilter"
          >
            清空筛选
          </button>
        </div>
      </div>

      <div class="filter-select-box">
        <span class="filter-select-text">排序方式：</span>
        <select id="sortSelect" v-model="sortBy" class="filter-select-select">
          <option value="default">默认排序</option>
          <option value="heat-asc">按热度递增</option>
          <option value="heat-desc">按热度递减</option>
          <option value="purchase-asc">按购买量递增</option>
          <option value="purchase-desc">按购买量递减</option>
        </select>
      </div>

      <div id="productList" class="kinds-list-box">
        <div v-if="!filteredProducts.length" class="no-products">暂无商品</div>
        <div v-for="product in filteredProducts" v-else :key="product.id" class="kinds-item">
          <img
            :src="getImagePath(product.image)"
            :alt="product.name"
            style="cursor: pointer"
            @click="openProductDetail(product)"
          />
          <div class="kinds-item-info">
            <h4 class="kinds-item-name" style="cursor: pointer" @click="openProductDetail(product)">
              {{ product.name }}
            </h4>
            <p class="kinds-item-description">{{ product.description }}</p>
            <div class="kinds-item-metrics">
              <span>购买人数：{{ getPurchaseCount(product) }}</span>
              <span>热度：{{ getHeatScore(product) }}</span>
              <span>库存：{{ getStockCount(product) }}</span>
            </div>
            <div class="kinds-item-footer">
              <span class="kinds-item-price">¥{{ Number(product.price || 0).toFixed(0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ProductDetailModal v-model="detailOpen" :product="detailProduct" />
  </div>
</template>
