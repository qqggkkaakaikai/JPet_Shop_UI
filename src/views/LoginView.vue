<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getContextPath } from '@/utils/context'
import { captchaUrl } from '@/api'
import { checkUsername } from '@/api'

import '@/styles/legacy/login.css'

const ctx = getContextPath()
const route = useRoute()
const router = useRouter()

const loginHeaderStyle = ref({})
const captchaSrc = ref(captchaUrl())
const errorMsg = ref('')
const successMsg = ref('')
const inputUsername = ref('')

const registerOpen = ref(false)
const usernameError = ref('')
const isCheckingUsername = ref(false)
let usernameCheckTimeout = null

function getLoginSuccessTarget() {
  const raw = route.query.redirect
  if (typeof raw === 'string' && raw.startsWith('/')) {
    return raw
  }
  return '/index'
}

function getSeason(month) {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

function getSeasonBackground() {
  const currentMonth = dayjs().month() + 1
  const season = getSeason(currentMonth)
  const map = {
    spring: `${ctx}/images/spring.jpg`,
    summer: `${ctx}/images/summer.jpg`,
    autumn: `${ctx}/images/autumn.jpg`,
    winter: `${ctx}/images/winter.jpg`,
  }
  return map[season] || map.spring
}

function applyQueryMessages() {
  const q = route.query
  errorMsg.value = q.err ? String(q.err) : ''
  successMsg.value = ''
  if (q.u) inputUsername.value = String(q.u)
  if (q.regOk) {
    successMsg.value = String(q.regOk)
    errorMsg.value = ''
  }
  if (q.regErr) {
    errorMsg.value = String(q.regErr)
    successMsg.value = ''
  }
}

onMounted(() => {
  loginHeaderStyle.value = {
    backgroundImage: `url(${getSeasonBackground()})`,
  }
  applyQueryMessages()
  setTimeout(() => {
    if (errorMsg.value) fadeOut('.error-message-box')
    if (successMsg.value) fadeOut('.success-message-box', 3000)
  }, 100)
})

watch(() => route.query, applyQueryMessages)

function fadeOut(selector, delay = 5000) {
  const el = document.querySelector(selector)
  if (!el) return
  setTimeout(() => {
    el.style.transition = 'opacity 0.5s ease-out'
    el.style.opacity = '0'
    setTimeout(() => {
      el.style.display = 'none'
    }, 500)
  }, delay)
}

function refreshCaptcha() {
  captchaSrc.value = captchaUrl()
}

function openRegisterModal(e) {
  e.preventDefault()
  registerOpen.value = true
}

function closeRegisterModal() {
  registerOpen.value = false
  usernameError.value = ''
}

async function checkLoggedIn() {
  try {
    const r = await fetch(`${ctx}/user/info`, { credentials: 'include' })
    const info = await r.json()
    return Boolean(info?.success && info.user)
  } catch {
    return false
  }
}

async function onLoginSubmit(e) {
  e.preventDefault()
  const form = e.target
  const body = new URLSearchParams(new FormData(form))
  try {
    const res = await fetch(`${ctx}/user/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      redirect: 'manual',
    })

    // 最稳妥：无论后端返回 302/200/opaqueredirect，优先以会话是否建立为准
    if (await checkLoggedIn()) {
      await router.replace(getLoginSuccessTarget())
      return
    }

    const loc = res.headers.get('Location') || ''
    if (loc.includes('/login?')) {
      const query = loc.split('?')[1] || ''
      const params = new URLSearchParams(query)
      const err = params.get('err')
      const u = params.get('u')
      errorMsg.value = err ? decodeURIComponent(err.replace(/\+/g, ' ')) : ''
      inputUsername.value = u ? decodeURIComponent(u.replace(/\+/g, ' ')) : inputUsername.value
      refreshCaptcha()
      return
    }

    /**
     * Vite 开发代理有时会把 302 变成 200（带 HTML），此时根据会话判断是否已登录。
     * 另：opaque redirect 下 status 可能为 0，同样回退检查 /user/info。
     */
    if (res.status === 200 || res.status === 0 || res.type === 'opaqueredirect') {
      if (await checkLoggedIn()) {
        await router.replace(getLoginSuccessTarget())
        return
      }
    }

    errorMsg.value =
      '登录失败：请确认验证码与图片完全一致（点击图片可刷新），账号密码正确。默认 admin 密码为 Admin123。'
    refreshCaptcha()
  } catch (err) {
    const detail = err instanceof Error ? `（${err.message}）` : ''
    errorMsg.value = `网络错误：请确认后端已在 8080 启动，且使用 npm run dev 并访问 /spa/ 路径。${detail}`
    refreshCaptcha()
  }
}

function validateRegister(form) {
  let hasError = false
  const username = form.username.value
  if (username.length < 3) {
    document.getElementById('usernameError').textContent = '用户名长度至少3位'
    hasError = true
  } else {
    document.getElementById('usernameError').textContent = ''
  }
  const phone = form.phone.value
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    document.getElementById('phoneError').textContent = '请输入有效的手机号'
    hasError = true
  } else {
    document.getElementById('phoneError').textContent = ''
  }
  const email = form.email.value
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    document.getElementById('emailError').textContent = '请输入有效的邮箱地址'
    hasError = true
  } else {
    document.getElementById('emailError').textContent = ''
  }
  const password = form.password.value
  if (password.length < 6) {
    document.getElementById('passwordError').textContent = '密码长度至少6位'
    hasError = true
  } else if (!/(?=.*[a-z])/.test(password)) {
    document.getElementById('passwordError').textContent = '密码必须包含小写字母'
    hasError = true
  } else if (!/(?=.*[A-Z])/.test(password)) {
    document.getElementById('passwordError').textContent = '密码必须包含大写字母'
    hasError = true
  } else if (!/(?=.*\d)/.test(password)) {
    document.getElementById('passwordError').textContent = '密码必须包含数字'
    hasError = true
  } else {
    document.getElementById('passwordError').textContent = ''
  }
  const confirmPassword = form.confirmPassword.value
  if (confirmPassword !== password) {
    document.getElementById('confirmPasswordError').textContent = '两次输入的密码不一致'
    hasError = true
  } else {
    document.getElementById('confirmPasswordError').textContent = ''
  }
  return !hasError
}

async function onRegisterSubmit(e) {
  e.preventDefault()
  const form = e.target
  if (!validateRegister(form)) return

  const body = new URLSearchParams(new FormData(form))
  const res = await fetch(`${ctx}/user/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual',
  })
  const loc = res.headers.get('Location') || ''
  registerOpen.value = false
  form.reset()
  if (res.status === 302 || res.status === 303 || res.status === 301) {
    const qs = loc.includes('?') ? loc.split('?')[1] : ''
    const params = new URLSearchParams(qs)
    if (loc.includes('regOk=')) {
      successMsg.value = decodeURIComponent(params.get('regOk') || '').replace(/\+/g, ' ')
      errorMsg.value = ''
    } else if (loc.includes('regErr=')) {
      errorMsg.value = decodeURIComponent(params.get('regErr') || '').replace(/\+/g, ' ')
      successMsg.value = ''
    } else if (loc.includes('err=')) {
      errorMsg.value = decodeURIComponent(params.get('err') || '').replace(/\+/g, ' ')
    }
  }
}

async function onRegisterUsernameInput(e) {
  const username = e.target.value.trim()
  clearTimeout(usernameCheckTimeout)
  if (username.length < 3) {
    usernameError.value = ''
    return
  }
  usernameCheckTimeout = setTimeout(async () => {
    if (isCheckingUsername.value) return
    isCheckingUsername.value = true
    usernameError.value = '检查中...'
    try {
      const data = await checkUsername(username)
      if (data.exists) {
        usernameError.value = data.message
      } else {
        usernameError.value = '✓ ' + data.message
      }
    } catch {
      usernameError.value = ''
    } finally {
      isCheckingUsername.value = false
    }
  }, 500)
}
</script>

<template>
  <div class="App">
    <div id="loginHeader" class="App-header" :style="loginHeaderStyle">
      <form class="login-form" @submit="onLoginSubmit">
        <text class="login-form-text">用户登录界面</text>

        <div v-if="errorMsg" class="error-message-box">{{ errorMsg }}</div>
        <div v-if="successMsg" class="success-message-box">{{ successMsg }}</div>

        <div class="login-group">
          <label class="login-form-label">账号</label>
          <input
            v-model="inputUsername"
            class="login-form-input"
            :class="{ 'input-error': !!errorMsg }"
            type="text"
            name="username"
            placeholder="请输入账号"
            required
          />
        </div>
        <div class="login-group">
          <label class="login-form-label">密码</label>
          <input
            class="login-form-input"
            :class="{ 'input-error': !!errorMsg }"
            type="password"
            name="password"
            placeholder="请输入密码"
            required
          />
        </div>
        <div class="login-group captcha-group">
          <label class="login-form-label">验证码</label>
          <div class="captcha-container">
            <input
              class="login-form-input captcha-input"
              :class="{ 'input-error': !!errorMsg }"
              type="text"
              name="captcha"
              placeholder="请输入验证码"
              maxlength="4"
              required
              @input="
                (e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                }
              "
            />
            <img
              id="captchaImage"
              :src="captchaSrc"
              alt="验证码"
              class="captcha-image"
              @click="refreshCaptcha"
            />
          </div>
        </div>
        <button class="login-form-button" type="submit">登录</button>
        <a class="login-form-link" href="#" @click="openRegisterModal">没有账号？注册一个</a>
      </form>
    </div>

    <div
      v-show="registerOpen"
      id="registerOverlay"
      class="register-overlay"
      style="display: flex"
      @click="closeRegisterModal"
    >
      <div class="register-content" @click.stop>
        <div class="register-header">
          <h2 class="register-title">用户注册</h2>
          <button type="button" class="register-close" @click="closeRegisterModal">
            <span class="register-close-icon">×</span>
          </button>
        </div>

        <form id="registerForm" class="register-form" @submit="onRegisterSubmit">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input
              class="form-input"
              type="text"
              name="username"
              placeholder="请输入用户名"
              required
              minlength="3"
              @input="onRegisterUsernameInput"
            />
            <span id="usernameError" class="error-message">{{ usernameError }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input
              class="form-input"
              type="tel"
              name="phone"
              placeholder="请输入手机号"
              required
              pattern="^1[3-9]\d{9}$"
            />
            <span id="phoneError" class="error-message"></span>
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input class="form-input" type="email" name="email" placeholder="请输入邮箱" required />
            <span id="emailError" class="error-message"></span>
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input
              id="password"
              class="form-input"
              type="password"
              name="password"
              placeholder="请输入密码"
              required
              minlength="6"
            />
            <span id="passwordError" class="error-message"></span>
          </div>
          <div class="form-group">
            <label class="form-label">确认密码</label>
            <input
              id="confirmPassword"
              class="form-input"
              type="password"
              name="confirmPassword"
              placeholder="请输入确认密码"
              required
            />
            <span id="confirmPasswordError" class="error-message"></span>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeRegisterModal">取消</button>
            <button type="submit" class="btn-submit">注册</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
