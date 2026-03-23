<script setup>
import { onMounted, reactive, ref } from 'vue'
import ShopHeader from '@/components/ShopHeader.vue'
import ShopNav from '@/components/ShopNav.vue'
import { getContextPath } from '@/utils/context'
import { getImagePath } from '@/utils/imagePath'
import { useAuthStore } from '@/stores/auth'
import { useCartBadgeStore } from '@/stores/cartBadge'

import '@/styles/legacy/common.css'
import '@/styles/legacy/user.css'

const ctx = getContextPath()
const auth = useAuthStore()
const cartBadge = useCartBadgeStore()

const userInfo = reactive({
  name: '',
  email: '',
  phone: '',
  registerTime: '',
  introduction: '热爱购物，享受生活！',
})

const isEditing = ref(false)
const editButtonsHtml = ref('edit')

function loadUserInfo() {
  const saved = localStorage.getItem('userInfo')
  if (saved) {
    try {
      Object.assign(userInfo, JSON.parse(saved))
    } catch {
      /* ignore */
    }
  }
  if (auth.user?.username && !userInfo.name) {
    userInfo.name = auth.user.username
  }
}

function enableEdit() {
  isEditing.value = true
  editButtonsHtml.value = 'save'
}

function cancelEdit() {
  isEditing.value = false
  editButtonsHtml.value = 'edit'
  loadUserInfo()
}

function saveUserInfo() {
  localStorage.setItem('userInfo', JSON.stringify({ ...userInfo }))
  cancelEdit()
  alert('保存成功！')
}

function changeAvatar() {
  alert('头像更换功能开发中...')
}

function menuAlert(msg) {
  alert(msg)
}

function logout() {
  if (confirm('确定要退出登录吗？')) {
    window.location.href = `${ctx}/user/logout`
  }
}

onMounted(async () => {
  await auth.refresh()
  await cartBadge.refresh()
  loadUserInfo()
})
</script>

<template>
  <div class="App">
    <ShopHeader />
    <ShopNav active="profile" />

    <div class="user-box">
      <div class="user-header">
        <h2 class="user-header-text">个人中心</h2>
        <div id="editButtons">
          <template v-if="editButtonsHtml === 'edit'">
            <button type="button" class="user-header-btn-edit" @click="enableEdit">编辑资料</button>
          </template>
          <template v-else>
            <button type="button" class="user-header-btn-save" @click="saveUserInfo">保存</button>
            <button type="button" class="user-header-btn-cancel" @click="cancelEdit">取消</button>
          </template>
        </div>
      </div>

      <div class="user-content">
        <div class="user-avatar-section">
          <img :src="getImagePath('images/logo192.png')" alt="用户头像" class="user-avatar" id="userAvatar" />
          <button
            v-show="isEditing"
            id="changeAvatarBtn"
            type="button"
            class="change-avatar-btn"
            @click="changeAvatar"
          >
            更换头像
          </button>
        </div>

        <div id="userInfoForm" class="user-info">
          <div class="user-info-item">
            <label>用户名：</label>
            <span v-show="!isEditing" id="userName" class="user-info-name">{{ userInfo.name }}</span>
            <input v-show="isEditing" id="userNameInput" v-model="userInfo.name" type="text" />
          </div>
          <div class="user-info-item">
            <label>邮箱：</label>
            <span v-show="!isEditing" id="userEmail" class="user-info-email">{{ userInfo.email }}</span>
            <input v-show="isEditing" id="userEmailInput" v-model="userInfo.email" type="email" />
          </div>
          <div class="user-info-item">
            <label>手机号：</label>
            <span v-show="!isEditing" id="userPhone" class="user-info-phone">{{ userInfo.phone }}</span>
            <input v-show="isEditing" id="userPhoneInput" v-model="userInfo.phone" type="tel" />
          </div>
          <div class="user-info-item">
            <label>注册时间：</label>
            <span id="registerTime" class="user-info-register-time">{{ userInfo.registerTime }}</span>
          </div>
          <div class="user-info-item full-width">
            <label>个人简介：</label>
            <span v-show="!isEditing" id="userIntro" class="user-info-personal-introduction">{{
              userInfo.introduction
            }}</span>
            <textarea
              v-show="isEditing"
              id="userIntroInput"
              v-model="userInfo.introduction"
              rows="3"
            />
          </div>
        </div>
      </div>

      <div class="user-menu">
        <h3>我的服务</h3>
        <div class="menu-items">
          <div class="menu-item" @click="menuAlert('订单功能开发中...')">
            <span>📦</span>
            <span>我的订单</span>
          </div>
          <div class="menu-item" @click="menuAlert('收藏功能开发中...')">
            <span>❤️</span>
            <span>我的收藏</span>
          </div>
          <div class="menu-item" @click="menuAlert('地址管理功能开发中...')">
            <span>📍</span>
            <span>收货地址</span>
          </div>
          <div class="menu-item" @click="menuAlert('优惠券功能开发中...')">
            <span>💳</span>
            <span>优惠券</span>
          </div>
          <div class="menu-item" @click="menuAlert('设置功能开发中...')">
            <span>⚙️</span>
            <span>设置</span>
          </div>
          <div class="menu-item" @click="menuAlert('帮助中心功能开发中...')">
            <span>❓</span>
            <span>帮助中心</span>
          </div>
        </div>
      </div>

      <div class="user-footer">
        <button type="button" class="user-footer-btn-logout" @click="logout">退出登录</button>
      </div>
    </div>
  </div>
</template>
