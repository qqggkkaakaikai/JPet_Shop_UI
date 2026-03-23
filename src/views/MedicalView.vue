<script setup>
import { computed, onMounted, ref } from 'vue'
import ShopHeader from '@/components/ShopHeader.vue'
import ShopNav from '@/components/ShopNav.vue'
import { getImagePath } from '@/utils/imagePath'
import { doctors } from '@/data/doctors'
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock'
import { useAuthStore } from '@/stores/auth'
import { useCartBadgeStore } from '@/stores/cartBadge'

import '@/styles/legacy/common.css'
import '@/styles/legacy/medical.css'
import '@/styles/legacy/medical-inline.css'

const auth = useAuthStore()
const cartBadge = useCartBadgeStore()

const searchInput = ref('')
const searchTipsVisible = ref(false)

const filteredDoctors = computed(() => {
  const keyword = searchInput.value.toLowerCase().trim()
  if (!keyword) return doctors
  return doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(keyword) ||
      d.specialty.toLowerCase().includes(keyword) ||
      d.title.toLowerCase().includes(keyword),
  )
})

function searchDoctors() {
  const keyword = searchInput.value.toLowerCase().trim()
  searchTipsVisible.value = Boolean(keyword)
}

function clearSearch() {
  searchInput.value = ''
  searchTipsVisible.value = false
}

const chatOpen = ref(false)
const currentDoctor = ref(null)
const chatMessages = ref([])
const chatInput = ref('')

function openChat(doctorId) {
  const d = doctors.find((x) => x.id === doctorId)
  if (!d) return
  currentDoctor.value = d
  chatMessages.value = [
    {
      role: 'doctor',
      content: `您好，我是${d.name}，${d.title}。请问您的宠物有什么问题吗？`,
      time: new Date().toLocaleTimeString(),
    },
  ]
  chatOpen.value = true
  lockBodyScroll()
}

function closeChat() {
  chatOpen.value = false
  chatInput.value = ''
  unlockBodyScroll()
}

function sendChatMessage() {
  const message = chatInput.value.trim()
  if (!message || !currentDoctor.value) return
  const time = new Date().toLocaleTimeString()
  chatMessages.value.push({ role: 'user', content: message, time })
  chatInput.value = ''
  setTimeout(() => {
    chatMessages.value.push({
      role: 'doctor',
      content:
        '我已经了解您的情况了。根据您的描述，建议您观察宠物的症状，如果持续恶化，建议尽快到医院进行检查。',
      time: new Date().toLocaleTimeString(),
    })
  }, 1000)
}

function handleChatKeyPress(e) {
  if (e.key === 'Enter') sendChatMessage()
}

onMounted(async () => {
  await auth.refresh()
  await cartBadge.refresh()
})
</script>

<template>
  <div class="App">
    <ShopHeader />
    <ShopNav active="medical" />

    <div class="medical-diagnosis-container">
      <div class="medical-header">
        <h2>🏥 线上宠物诊断</h2>
        <p class="medical-subtitle">专业医生在线解答，让您的爱宠得到及时的健康关怀</p>
      </div>

      <div class="search-section">
        <div class="search-box">
          <input
            id="searchInput"
            v-model="searchInput"
            type="text"
            class="search-input"
            placeholder="输入病情关键词或医生姓名搜索（如：皮肤病、咳嗽、呕吐等）"
            @keyup="searchDoctors"
          />
          <button type="button" class="search-btn" @click="searchDoctors">🔍 搜索</button>
        </div>
        <div v-show="searchTipsVisible" id="searchTips" class="search-tips" style="display: flex">
          <span>搜索结果：找到 <span id="searchCount">{{ filteredDoctors.length }}</span> 位相关医生</span>
          <button type="button" class="clear-search-btn" @click="clearSearch">清空搜索</button>
        </div>
      </div>

      <div id="doctorsGrid" class="doctors-grid">
        <div v-if="!filteredDoctors.length" class="no-doctors">
          <p>😢 未找到相关医生</p>
          <p>请尝试其他关键词</p>
        </div>
        <div v-for="doctor in filteredDoctors" v-else :key="doctor.id" class="doctor-card">
          <div class="doctor-avatar-box" @click="openChat(doctor.id)">
            <img :src="getImagePath(doctor.avatar)" :alt="doctor.name" class="doctor-avatar" />
            <div class="online-badge">在线</div>
          </div>
          <div class="doctor-info">
            <h3 class="doctor-name">{{ doctor.name }}</h3>
            <p class="doctor-title">{{ doctor.title }}</p>
            <div class="doctor-stats">
              <span class="rating">⭐ {{ doctor.rating }}</span>
              <span class="consultations">💬 {{ doctor.consultations }}次咨询</span>
            </div>
            <div class="doctor-specialty">
              <strong>擅长：</strong>{{ doctor.specialty }}
            </div>
            <p class="doctor-description">{{ doctor.description }}</p>
            <div class="doctor-experience">
              <span>🎓 从业 {{ doctor.experience }}</span>
            </div>
          </div>
          <button type="button" class="consult-btn" @click="openChat(doctor.id)">立即咨询</button>
        </div>
      </div>
    </div>

    <div
      v-show="chatOpen"
      id="chatDialog"
      class="chat-overlay"
      style="display: flex"
      @click="closeChat"
    >
      <div class="chat-container" @click.stop>
        <div class="chat-header">
          <div class="doctor-info-header">
            <img
              id="chatDoctorAvatar"
              :src="currentDoctor ? getImagePath(currentDoctor.avatar) : ''"
              alt="医生头像"
              class="doctor-avatar-small"
            />
            <div>
              <h3 id="chatDoctorName">{{ currentDoctor?.name }}</h3>
              <p id="chatDoctorTitle">{{ currentDoctor?.title }}</p>
            </div>
          </div>
          <button type="button" class="chat-close-btn" @click="closeChat">✕</button>
        </div>
        <div id="chatMessages" class="chat-messages">
          <div
            v-for="(m, i) in chatMessages"
            :key="i"
            class="message"
            :class="m.role === 'user' ? 'user-message' : 'doctor-message'"
          >
            <div class="message-content">{{ m.content }}</div>
            <div class="message-time">{{ m.time }}</div>
          </div>
        </div>
        <div class="chat-input-box">
          <input
            id="chatInput"
            v-model="chatInput"
            type="text"
            placeholder="请描述宠物的症状..."
            @keypress="handleChatKeyPress"
          />
          <button type="button" @click="sendChatMessage">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>
