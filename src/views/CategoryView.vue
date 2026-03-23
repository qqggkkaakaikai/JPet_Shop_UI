<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ShopHeader from '@/components/ShopHeader.vue'
import ShopNav from '@/components/ShopNav.vue'
import ProductDetailModal from '@/components/ProductDetailModal.vue'
import { getImagePath } from '@/utils/imagePath'
import { useAuthStore } from '@/stores/auth'
import { useCatalogStore } from '@/stores/catalog'
import { useCartBadgeStore } from '@/stores/cartBadge'
import { cartApi } from '@/api'
import { useRouter } from 'vue-router'

import '@/styles/legacy/common.css'
import '@/styles/legacy/productDetail.css'
import '@/styles/legacy/category.css'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const catalog = useCatalogStore()
const cartBadge = useCartBadgeStore()

const selectedCategory = ref('全部')
const sortBy = ref('default')

const categoryButtons = computed(() => catalog.categories())

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
    case 'price-asc':
      list.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      list.sort((a, b) => b.price - a.price)
      break
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name))
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

async function quickAddToCart(product) {
  if (!auth.user?.id) {
    alert('请先登录')
    router.push('/login')
    return
  }
  const p = { ...product }
  const spec = p.specifications?.[0] ?? null
  const size = p.sizes?.[0] ?? null
  const color = p.colors?.[0] ?? null
  try {
    await cartApi.add({
      userId: auth.user.id,
      productId: p.id,
      quantity: 1,
      selectedAttributes: { color, size, specification: spec },
      isPurchased: false,
    })
    alert('已添加到购物车')
    cartBadge.refresh()
  } catch (e) {
    alert(e.message || '添加失败')
  }
}

onMounted(async () => {
  await catalog.loadAll()
  await auth.refresh()
  await cartBadge.refresh()
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
          <option value="price-asc">价格从低到高</option>
          <option value="price-desc">价格从高到低</option>
          <option value="name">名称排序</option>
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
            <div class="kinds-item-footer">
              <span class="kinds-item-price">¥{{ product.price }}</span>
              <button type="button" class="kinds-item-btn" @click="quickAddToCart(product)">
                加入购物车
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ProductDetailModal v-model="detailOpen" :product="detailProduct" />
  </div>
</template>
