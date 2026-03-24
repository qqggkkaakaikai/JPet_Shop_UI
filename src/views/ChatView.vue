<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ShopHeader from '@/components/ShopHeader.vue'
import ShopNav from '@/components/ShopNav.vue'

import '@/styles/legacy/common.css'
import '@/styles/legacy/chat.css'

const router = useRouter()

const chatType = ref('official')
const chatName = ref('官方客服')
const chatAvatar = ref('💬')
const messages = ref([])
const messageInput = ref('')
const messagesEl = ref(null)

function formatTime(d = new Date()) {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getWelcomeMessage() {
  if (chatType.value === 'official') {
    return '您好！我是官方客服，有什么可以帮助您的吗？😊'
  }
  return `您好！欢迎来到${chatName.value}，请问有什么可以帮您？`
}

function getChatHistory() {
  const key = `chat_${chatType.value}_${chatName.value}`
  const history = localStorage.getItem(key)
  return history ? JSON.parse(history) : []
}

function saveChatMessage(type, content) {
  const key = `chat_${chatType.value}_${chatName.value}`
  const history = getChatHistory()
  history.push({ type, content, timestamp: Date.now() })
  if (history.length > 50) history.shift()
  localStorage.setItem(key, JSON.stringify(history))
}

function scrollToBottom() {
  const el = messagesEl.value
  if (el) el.scrollTop = el.scrollHeight
}

function loadHistory() {
  const history = getChatHistory()
  if (!history.length) {
    messages.value = [{ type: 'service', content: getWelcomeMessage(), time: formatTime() }]
  } else {
    messages.value = history.map((h) => ({
      type: h.type,
      content: h.content,
      time: formatTime(new Date(h.timestamp)),
    }))
  }
  nextTick(scrollToBottom)
}

function generateReply(userMessage) {
  const replies = {
    发货: '您的订单已经发货，物流信息请在订单详情中查看。预计3-5天送达。',
    退货: '如需退货，请在订单页面申请退货退款，我们会在24小时内审核。',
    价格: '我们的商品都是正品保证，价格实惠。现在还有优惠活动哦！',
    质量: '我们的商品都经过严格质检，质量有保证。如有质量问题，7天内可无理由退换。',
    推荐: '根据您的喜好，我推荐您看看我们的热销商品，性价比很高！',
    你好: '您好！很高兴为您服务，请问有什么可以帮助您的吗？',
    谢谢: '不客气！如果还有其他问题，随时联系我哦！😊',
    猫粮: '我们的猫粮采用优质原料，营养均衡，深受顾客喜爱。您可以试试我们的天然猫粮！',
    狗粮: '我们有多种狗粮可选，适合不同年龄和体型的狗狗。推荐您看看营养狗粮系列！',
    优惠: '现在店铺有满减活动，购物满200元减20元，满500元减60元！',
    包邮: '单笔订单满99元即可包邮，部分偏远地区除外。',
    客服: '我是您的专属客服，随时为您解答问题！',
    在吗: '在的！有什么可以帮您的吗？',
  }
  for (const key of Object.keys(replies)) {
    if (userMessage.includes(key)) return replies[key]
  }
  const defaultReplies = [
    '好的，我明白了。我会尽快为您处理！',
    '感谢您的咨询，请问还有其他需要帮助的吗？',
    '收到！我会立即为您查询相关信息。',
    '明白了，稍等片刻，我帮您核实一下。',
    '好的呢，我已经记录下您的问题，会尽快处理！',
  ]
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
}

function addMessage(type, content, save = true) {
  messages.value.push({
    type,
    content,
    time: formatTime(),
  })
  if (save) saveChatMessage(type, content)
  nextTick(scrollToBottom)
}

function sendChatMessage() {
  const content = messageInput.value.trim()
  if (!content) return
  addMessage('user', content)
  messageInput.value = ''
  setTimeout(() => {
    addMessage('service', generateReply(content), true)
  }, 1000 + Math.random() * 1000)
}

function handleKeyPress(e) {
  if (e.key === 'Enter') sendChatMessage()
}

function showEmojiPicker() {
  const emojis = ['😊', '😂', '❤️', '👍', '🙏', '😭', '😍', '🤔', '😘', '🎉', '🐱', '🐶', '🐾']
  messageInput.value += emojis[Math.floor(Math.random() * emojis.length)]
}

function goBack() {
  router.push('/index')
}

onMounted(() => {
  chatType.value = sessionStorage.getItem('chatType') || 'official'
  chatName.value = sessionStorage.getItem('chatName') || '官方客服'
  if (chatType.value === 'official') {
    chatAvatar.value = '🏢'
  } else {
    const name = chatName.value
    if (name.includes('喵星人')) chatAvatar.value = '🐱'
    else if (name.includes('汪星人')) chatAvatar.value = '🐶'
    else if (name.includes('营养')) chatAvatar.value = '🍖'
    else if (name.includes('出行')) chatAvatar.value = '✈️'
    else chatAvatar.value = '🏪'
  }
  loadHistory()
})
</script>

<template>
  <div class="App chat-app">
    <ShopHeader />
    <ShopNav />

    <div class="chat-page-shell">
      <div class="chat-container">
        <div class="chat-header">
          <div class="meteor-layer" aria-hidden="true">
            <span class="meteor meteor-1" />
            <span class="meteor meteor-2" />
            <span class="meteor meteor-3" />
            <span class="meteor meteor-4" />
          </div>
          <button type="button" class="back-btn" @click="goBack">← 返回</button>
          <div class="chat-title">
            <span id="chatAvatar" class="chat-avatar">{{ chatAvatar }}</span>
            <span id="chatName">{{ chatName }}</span>
          </div>
          <div class="chat-status">在线</div>
        </div>

        <div id="chatMessages" ref="messagesEl" class="chat-messages">
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="message"
            :class="m.type === 'user' ? 'user' : 'service'"
          >
            <div class="message-avatar">{{ m.type === 'user' ? '👤' : chatAvatar }}</div>
            <div class="message-content">
              <div class="message-bubble">{{ m.content }}</div>
              <div class="message-time">{{ m.time }}</div>
            </div>
          </div>
        </div>

        <div class="chat-input-box">
          <button type="button" class="emoji-btn" @click="showEmojiPicker">😊</button>
          <input
            id="messageInput"
            v-model="messageInput"
            type="text"
            placeholder="请输入消息..."
            @keypress="handleKeyPress"
          />
          <button type="button" class="send-btn" @click="sendChatMessage">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>
