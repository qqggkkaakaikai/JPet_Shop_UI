<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ShopHeader from '@/components/ShopHeader.vue'
import ShopNav from '@/components/ShopNav.vue'
import ProductDetailModal from '@/components/ProductDetailModal.vue'
import { getImagePath } from '@/utils/imagePath'
import { getContextPath } from '@/utils/context'
import { useAuthStore } from '@/stores/auth'
import { useCatalogStore } from '@/stores/catalog'
import { useCartBadgeStore } from '@/stores/cartBadge'
import { cartApi } from '@/api'

import '@/styles/legacy/common.css'
import '@/styles/legacy/productDetail.css'
import '@/styles/legacy/index.css'

const ctx = getContextPath()
const router = useRouter()
const auth = useAuthStore()
const catalog = useCatalogStore()
const cartBadge = useCartBadgeStore()

const bannerData = [
  {
    image: getImagePath('images/沙发小猫.jpg'),
    title: '温暖陪伴，舒适生活',
    subtitle: '给毛孩子一个温馨的家',
  },
  {
    image: getImagePath('images/草地小狗.jpg'),
    title: '自由奔跑，快乐成长',
    subtitle: '让爱宠享受健康快乐每一天',
  },
  {
    image: getImagePath('images/yL1CSVRwjzJExhRPqQt0nw3c3bf89dd6ed5b79d3ddfd7e5634345a.jpg'),
    title: '优质宠物用品专家',
    subtitle: '为爱宠精选每一件好物',
  },
]

const currentBannerIndex = ref(0)
const bannerTitle = computed(() => bannerData[currentBannerIndex.value].title)
const bannerSubtitle = computed(() => bannerData[currentBannerIndex.value].subtitle)
const bannerImage = computed(() => bannerData[currentBannerIndex.value].image)

let bannerTimer = null

function prevBanner() {
  currentBannerIndex.value =
    (currentBannerIndex.value - 1 + bannerData.length) % bannerData.length
}

function nextBanner() {
  currentBannerIndex.value = (currentBannerIndex.value + 1) % bannerData.length
}

function gotoBanner(i) {
  currentBannerIndex.value = i
}

function startBannerAutoPlay() {
  if (bannerTimer) clearInterval(bannerTimer)
  bannerTimer = setInterval(nextBanner, 3000)
}

const friendPosts = [
  {
    name: '铲屎官小王',
    message: '给我家主子买的新猫爬架，它超喜欢！每天都在上面玩耍~',
  },
  {
    name: '狗狗的麻麻',
    message: '这款狗粮营养很全面，我家狗狗吃了毛发都变亮了，推荐！',
  },
  {
    name: '猫奴小李',
    message: '自动饮水机真的好用，再也不用担心猫咪喝不到新鲜水了',
  },
  {
    name: '铲屎官小张',
    message: '刚给狗狗换了新项圈，夜跑也很安全，反光效果超棒！',
  },
  {
    name: '喵主子守护者',
    message: '猫咪洗护套装真心好用，毛发顺滑有光泽，味道也好闻。',
  },
]

const hotProducts = computed(() => catalog.products.slice(0, 4))

const detailOpen = ref(false)
const detailProduct = ref(null)

function openProductDetail(product) {
  detailProduct.value = product
  detailOpen.value = true
}

function closeProductDetail() {
  detailOpen.value = false
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

const storeRows = ref([])
const noStoreService = ref(true)

async function loadStoreServices() {
  if (!auth.user?.id) {
    storeRows.value = []
    noStoreService.value = true
    return
  }
  try {
    const items = await cartApi.list(auth.user.id)
    const stores = new Map()
    ;(items || []).forEach((item) => {
      const product = item.product || {}
      const category = product.category || item.category
      const storeName = getStoreNameByCategory(category)
      if (!stores.has(storeName)) {
        stores.set(storeName, {
          name: storeName,
          avatar: getStoreAvatar(category),
          lastMessage: '您购买的商品已发货',
        })
      }
    })
    storeRows.value = Array.from(stores.values())
    noStoreService.value = storeRows.value.length === 0
  } catch {
    storeRows.value = []
    noStoreService.value = true
  }
}

function getStoreNameByCategory(category) {
  const storeMap = {
    猫咪用品: '喵星人专卖店',
    狗狗用品: '汪星人生活馆',
    饮食用品: '宠物营养中心',
    出行用品: '宠物出行专家',
    狗狗: '宠物之家',
  }
  return storeMap[category] || '宠物用品店'
}

function getStoreAvatar(category) {
  const avatarMap = {
    猫咪用品: '🐱',
    狗狗用品: '🐶',
    饮食用品: '🍖',
    出行用品: '✈️',
    狗狗: '🏠',
  }
  return avatarMap[category] || '🏪'
}

function openChat(type, name) {
  sessionStorage.setItem('chatType', type)
  sessionStorage.setItem('chatName', name)
  router.push('/chat')
}

const searchInput = ref('')
const suggestions = ref([])
const suggestionsVisible = ref(false)
let searchTimeout = null

function hideSuggestions() {
  suggestionsVisible.value = false
}

function searchProductsForAutocomplete(keyword) {
  if (!keyword?.trim()) {
    hideSuggestions()
    return
  }
  fetch(`${ctx}/api/products?keyword=${encodeURIComponent(keyword.trim())}`, {
    credentials: 'include',
  })
    .then((r) => r.json())
    .then((result) => {
      if (result.code === 200 && result.data) {
        suggestions.value = result.data.slice(0, 10)
        suggestionsVisible.value = true
      } else hideSuggestions()
    })
    .catch(() => hideSuggestions())
}

function onSearchInput() {
  const keyword = searchInput.value.trim()
  clearTimeout(searchTimeout)
  if (!keyword) {
    hideSuggestions()
    return
  }
  searchTimeout = setTimeout(() => searchProductsForAutocomplete(keyword), 300)
}

function highlightKeyword(text, keyword) {
  if (!keyword) return text
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function selectSuggestion(product) {
  hideSuggestions()
  openProductDetail(product)
}

function performSearch() {
  const keyword = searchInput.value.trim()
  hideSuggestions()
  if (!keyword) {
    alert('请输入搜索关键词')
    return
  }
  router.push({ path: '/category', query: { search: keyword } })
}

function onDocClick(e) {
  const el = e.target
  if (!el.closest?.('.search-box-wrapper')) hideSuggestions()
}

const tooltip = ref(null)
const tooltipStyle = ref({})
let tooltipTimeout = null

function showProductTooltip(event, product) {
  clearTimeout(tooltipTimeout)
  tooltip.value = product
  tooltipStyle.value = { left: `${event.pageX + 20}px`, top: `${event.pageY + 20}px` }
}

function hideProductTooltip() {
  tooltipTimeout = setTimeout(() => {
    tooltip.value = null
  }, 200)
}

function onTooltipEnter() {
  clearTimeout(tooltipTimeout)
}

const friendWrapper = ref(null)

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  await catalog.loadAll()
  startBannerAutoPlay()
  await auth.refresh()
  await cartBadge.refresh()
  await loadStoreServices()

  const wrapper = friendWrapper.value
  const scroller = wrapper?.querySelector?.('#friendPostsScroller')
  if (wrapper && scroller) {
    const posts = Array.from(scroller.children)
    if (posts.length) {
      posts.forEach((post) => scroller.appendChild(post.cloneNode(true)))
    }
    let isPaused = false
    let touchTimeoutId = null
    const pause = () => {
      if (isPaused) return
      scroller.style.animationPlayState = 'paused'
      isPaused = true
    }
    const resume = () => {
      if (!isPaused) return
      scroller.style.animationPlayState = 'running'
      isPaused = false
    }
    wrapper.addEventListener('mouseenter', pause)
    wrapper.addEventListener('mouseleave', resume)
    wrapper.addEventListener(
      'touchstart',
      () => {
        pause()
        if (touchTimeoutId) clearTimeout(touchTimeoutId)
      },
      { passive: true },
    )
    wrapper.addEventListener('touchend', () => {
      if (touchTimeoutId) clearTimeout(touchTimeoutId)
      touchTimeoutId = setTimeout(resume, 1200)
    })
  }
})

watch(
  () => auth.user,
  () => {
    loadStoreServices()
    cartBadge.refresh()
  },
)

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  if (bannerTimer) clearInterval(bannerTimer)
})
</script>

<template>
  <div class="App">
    <ShopHeader floating-pets />
    <ShopNav active="index" />

    <div class="user-info-bar">
      <span class="welcome-text">欢迎，{{ auth.welcomeUsername }}</span>
      <a class="logout-btn" :href="ctx + '/user/logout'">退出登录</a>
    </div>

    <div class="search-bar-container">
      <div class="search-box-wrapper">
        <input
          id="productSearchInput"
          v-model="searchInput"
          type="text"
          class="search-input"
          placeholder="搜索商品名称..."
          autocomplete="off"
          @input="onSearchInput"
          @keydown.enter.prevent="performSearch"
          @keydown.esc="hideSuggestions"
        />
        <button type="button" class="search-button" @click="performSearch">🔍</button>
        <div
          v-show="suggestionsVisible"
          id="searchSuggestions"
          class="search-suggestions"
        >
          <div v-if="!suggestions.length" class="no-suggestions">未找到相关商品</div>
          <div
            v-for="p in suggestions"
            v-else
            :key="p.id"
            class="search-suggestion-item"
            @click="selectSuggestion(p)"
          >
            <img :src="getImagePath(p.image)" :alt="p.name" class="suggestion-image" />
            <div class="suggestion-info">
              <div class="suggestion-name" v-html="highlightKeyword(p.name, searchInput.trim())" />
              <div class="suggestion-price">¥{{ Number(p.price).toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="shop-head-box">
      <div class="banner-title">
        <h2 id="bannerTitle">{{ bannerTitle }}</h2>
        <p id="bannerSubtitle" class="banner-subtitle">{{ bannerSubtitle }}</p>
      </div>
      <img id="bannerImage" :src="bannerImage" alt="轮播图" class="banner-image" />
      <button type="button" class="banner-btn-left" @click="prevBanner">‹</button>
      <button type="button" class="banner-btn-right" @click="nextBanner">›</button>
      <div id="bannerIndicators" class="banner-indicators">
        <span
          v-for="(_, i) in bannerData"
          :key="i"
          class="indicator"
          :class="{ active: i === currentBannerIndex }"
          @click="gotoBanner(i)"
        />
      </div>
    </div>

    <div class="shop-main-ui">
      <div ref="friendWrapper" class="left-pyq-box">
        <h3>🐾 宠友圈</h3>
        <div id="friendPostsWrapper" class="friend-posts-wrapper">
          <div id="friendPostsScroller" class="friend-posts-scroller">
            <div v-for="(post, idx) in friendPosts" :key="idx" class="friend-post">
              <div class="friend-header">
                <img :src="getImagePath('images/logo192.png')" alt="" class="friend-avatar" />
                <span class="friend-name">{{ post.name }}</span>
              </div>
              <p class="friend-message">{{ post.message }}</p>
              <img :src="getImagePath('images/logo192.png')" alt="宠物用品" class="friend-product-image" />
            </div>
          </div>
        </div>
      </div>

      <div class="center-goods-box">
        <h3>🔥 热销宠物用品</h3>
        <div id="productGrid" class="goods-grid">
          <div v-if="!hotProducts.length" class="no-products">暂无商品</div>
          <div
            v-for="product in hotProducts"
            v-else
            :key="product.id"
            class="goods-item"
            @mouseenter="showProductTooltip($event, product)"
            @mouseleave="hideProductTooltip"
          >
            <img
              :src="getImagePath(product.image)"
              :alt="product.name"
              style="cursor: pointer"
              @click="openProductDetail(product)"
            />
            <h4 style="cursor: pointer" @click="openProductDetail(product)">{{ product.name }}</h4>
            <p class="goods-description">{{ product.description }}</p>
            <div class="goods-footer">
              <span class="goods-price">¥{{ product.price }}</span>
              <button type="button" class="goods-btn" @click="quickAddToCart(product)">
                加入购物车
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="right-customer-service-message-box">
        <h3>💬 客服消息</h3>
        <div class="service-list">
          <div class="service-item" @click="openChat('official', '官方客服')">
            <div class="service-avatar">
              <span class="avatar-icon">🏢</span>
            </div>
            <div class="service-info">
              <div class="service-name">官方客服</div>
              <div class="service-last-message">有什么可以帮助您的吗？</div>
            </div>
            <div class="service-badge">
              <span class="unread-count">1</span>
            </div>
          </div>

          <div v-for="s in storeRows" :key="s.name" class="service-item" @click="openChat('store', s.name)">
            <div class="service-avatar">
              <span class="avatar-icon">{{ s.avatar }}</span>
            </div>
            <div class="service-info">
              <div class="service-name">{{ s.name }}</div>
              <div class="service-last-message">{{ s.lastMessage }}</div>
            </div>
          </div>

          <div v-show="noStoreService" id="noStoreService" class="no-service-tip">
            <p>暂无店铺客服</p>
            <p class="tip-desc">购买商品后可联系店铺客服</p>
          </div>
        </div>
      </div>
    </div>

    <ProductDetailModal v-model="detailOpen" :product="detailProduct" @close="closeProductDetail" />

    <div
      v-if="tooltip"
      id="productTooltip"
      class="product-tooltip"
      :style="tooltipStyle"
      @mouseenter="onTooltipEnter"
      @mouseleave="hideProductTooltip"
    >
      <div class="tooltip-header">
        <h3>{{ tooltip.name }}</h3>
        <span class="tooltip-price">¥{{ Number(tooltip.price).toFixed(2) }}</span>
      </div>
      <div class="tooltip-content">
        <p class="tooltip-description">{{ tooltip.description || '暂无描述' }}</p>
        <div class="tooltip-specs">
          <span v-if="tooltip.category">类别：{{ tooltip.category }}</span>
          <span v-if="tooltip.stock !== undefined">库存：{{ tooltip.stock }}</span>
          <span v-if="tooltip.sales !== undefined">已售：{{ tooltip.sales }}</span>
        </div>
      </div>
      <div class="tooltip-footer">
        <button type="button" class="tooltip-btn" @click="openProductDetail(tooltip)">查看详情</button>
        <button type="button" class="tooltip-btn primary" @click="quickAddToCart(tooltip)">
          加入购物车
        </button>
      </div>
    </div>
  </div>
</template>
