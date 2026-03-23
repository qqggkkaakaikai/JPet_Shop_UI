<script setup>
import { computed, onMounted, ref } from 'vue'
import ShopHeader from '@/components/ShopHeader.vue'
import ShopNav from '@/components/ShopNav.vue'
import { getImagePath } from '@/utils/imagePath'
import { boardingStores } from '@/data/boardingStores'
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock'
import { useAuthStore } from '@/stores/auth'
import { useCartBadgeStore } from '@/stores/cartBadge'

import '@/styles/legacy/common.css'
import '@/styles/legacy/boarding.css'
import '@/styles/legacy/boarding-inline.css'

const auth = useAuthStore()
const cartBadge = useCartBadgeStore()

const cities = computed(() => {
  const c = ['全部']
  boardingStores.forEach((s) => {
    if (!c.includes(s.city)) c.push(s.city)
  })
  return c
})

const selectedCity = ref('全部')

const filteredStores = computed(() =>
  selectedCity.value === '全部'
    ? boardingStores
    : boardingStores.filter((s) => s.city === selectedCity.value),
)

const detailOpen = ref(false)
const detailStore = ref(null)
const currentSlideIndex = ref(0)

function openStoreDetail(store) {
  detailStore.value = store
  currentSlideIndex.value = 0
  detailOpen.value = true
  lockBodyScroll()
}

function closeStoreDetail() {
  detailOpen.value = false
  unlockBodyScroll()
}

const hasMultipleImages = computed(
  () => detailStore.value?.images && detailStore.value.images.length > 1,
)

function changeSlide(dir) {
  if (!detailStore.value?.images?.length) return
  const n = detailStore.value.images.length
  currentSlideIndex.value = (currentSlideIndex.value + dir + n) % n
}

function goToSlide(index) {
  currentSlideIndex.value = index
}

function makeReservation() {
  const s = detailStore.value
  if (!s) return
  alert(`预约功能开发中...\n门店：${s.name}\n请致电 ${s.phone} 进行预约`)
}

function callStore(phone) {
  window.location.href = `tel:${phone}`
}

onMounted(async () => {
  await auth.refresh()
  await cartBadge.refresh()
})
</script>

<template>
  <div class="App">
    <ShopHeader />
    <ShopNav active="boarding" />

    <div class="boarding-container">
      <div class="boarding-header">
        <h2>🏠 宠物寄养服务</h2>
        <p class="boarding-subtitle">专业寄养，安心托付 · 让您的爱宠享受家的温暖</p>
      </div>

      <div class="features-section">
        <div class="feature-item">
          <span class="feature-icon">🏡</span>
          <h4>舒适环境</h4>
          <p>独立房间配置</p>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📹</span>
          <h4>实时监控</h4>
          <p>24小时视频监控</p>
        </div>
        <div class="feature-item">
          <span class="feature-icon">👨‍⚕️</span>
          <h4>专业护理</h4>
          <p>专业团队照料</p>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎾</span>
          <h4>活动娱乐</h4>
          <p>定时户外活动</p>
        </div>
      </div>

      <div class="city-filter-section">
        <h3>选择城市</h3>
        <div id="cityButtons" class="city-buttons">
          <button
            v-for="city in cities"
            :key="city"
            type="button"
            class="city-btn"
            :class="{ active: selectedCity === city }"
            @click="selectedCity = city"
          >
            {{ city }}
          </button>
        </div>
        <p class="filter-result">找到 <strong id="storeCount">{{ filteredStores.length }}</strong> 家门店</p>
      </div>

      <div id="storesGrid" class="stores-grid">
        <div v-for="store in filteredStores" :key="store.id" class="store-card">
          <div class="store-cover" @click="openStoreDetail(store)">
            <img :src="getImagePath(store.coverImage)" :alt="store.name" />
            <div class="store-badge">{{ store.city }}</div>
          </div>
          <div class="store-content">
            <h3 class="store-name" @click="openStoreDetail(store)">{{ store.name }}</h3>
            <div class="store-rating">
              <span class="rating-score">⭐ {{ store.rating }}</span>
              <span class="rating-reviews">({{ store.reviews }}条评价)</span>
            </div>
            <div class="store-address">
              📍 {{ store.district }} · {{ store.address.substring(0, 20) }}...
            </div>
            <div class="store-price">💰 {{ store.price }}</div>
            <div class="store-services">
              <span v-for="(service, i) in store.services.slice(0, 3)" :key="i" class="service-tag">{{
                service
              }}</span>
            </div>
            <button type="button" class="view-detail-btn" @click="openStoreDetail(store)">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-show="detailOpen && detailStore"
      id="storeDetailModal"
      class="store-detail-overlay"
      style="display: flex"
      @click="closeStoreDetail"
    >
      <div class="store-detail-container" @click.stop>
        <button type="button" class="detail-close-btn" @click="closeStoreDetail">✕</button>
        <div id="storeDetailContent" class="store-detail-content">
          <template v-if="detailStore">
            <div class="store-detail-header">
              <h2>{{ detailStore.name }}</h2>
              <div class="store-rating-large">
                <span class="rating-score">⭐ {{ detailStore.rating }}</span>
                <span class="rating-reviews">({{ detailStore.reviews }}条评价)</span>
              </div>
            </div>

            <div v-if="hasMultipleImages" class="store-carousel">
              <div id="carouselContainer" class="carousel-container">
                <img
                  v-for="(img, index) in detailStore.images"
                  :key="index"
                  :src="getImagePath(img)"
                  :alt="detailStore.name"
                  class="carousel-image"
                  :class="{ active: index === currentSlideIndex }"
                  :style="{ display: index === currentSlideIndex ? 'block' : 'none' }"
                />
              </div>
              <button type="button" class="carousel-btn prev" @click="changeSlide(-1)">❮</button>
              <button type="button" class="carousel-btn next" @click="changeSlide(1)">❯</button>
              <div class="carousel-indicators">
                <span
                  v-for="(_, index) in detailStore.images"
                  :key="index"
                  class="indicator"
                  :class="{ active: index === currentSlideIndex }"
                  @click="goToSlide(index)"
                />
              </div>
            </div>
            <div v-else class="store-single-image">
              <img
                :src="getImagePath(detailStore.images?.[0] || detailStore.coverImage)"
                :alt="detailStore.name"
              />
            </div>

            <div class="store-address-price">
              <div class="address-info">
                <span class="icon">📍</span>
                <div class="address-text">
                  <h4>门店地址</h4>
                  <p>{{ detailStore.address }}</p>
                </div>
              </div>
              <div class="price-info">
                <span class="icon">💰</span>
                <div class="price-text">
                  <h4>价格区间</h4>
                  <p class="price-range">{{ detailStore.price }}</p>
                </div>
              </div>
            </div>

            <div class="store-description-section">
              <h3>🏠 门店介绍</h3>
              <p class="store-description">{{ detailStore.description }}</p>
              <div class="store-details-grid">
                <div class="detail-item">
                  <h4>📞 联系电话</h4>
                  <p>{{ detailStore.phone }}</p>
                </div>
                <div class="detail-item">
                  <h4>🕐 营业时间</h4>
                  <p>{{ detailStore.openTime }}</p>
                </div>
                <div class="detail-item">
                  <h4>📍 所在区域</h4>
                  <p>{{ detailStore.city }} · {{ detailStore.district }}</p>
                </div>
              </div>
              <div class="services-facilities">
                <div class="service-group">
                  <h4>🎁 提供服务</h4>
                  <div class="tags">
                    <span v-for="(s, i) in detailStore.services" :key="i" class="tag">{{ s }}</span>
                  </div>
                </div>
                <div class="service-group">
                  <h4>🏢 设施配置</h4>
                  <div class="tags">
                    <span v-for="(f, i) in detailStore.facilities" :key="i" class="tag">{{ f }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="contact-reservation-section">
              <h3>📞 联系与预定</h3>
              <p class="contact-tips">欢迎致电咨询或直接在线预约，我们将竭诚为您的爱宠服务！</p>
              <div class="store-detail-actions">
                <button type="button" class="action-btn primary" @click="makeReservation">
                  <span class="btn-icon">📅</span>
                  在线预约
                </button>
                <button type="button" class="action-btn" @click="callStore(detailStore.phone)">
                  <span class="btn-icon">📞</span>
                  电话咨询
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
