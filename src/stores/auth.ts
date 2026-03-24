import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchUserInfo } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loaded = ref(false)

  const loggedIn = computed(() => Boolean(user.value?.id))
  const welcomeUsername = computed(() => user.value?.username || '用户')

  async function refresh() {
    try {
      const data = await fetchUserInfo()
      if (data?.success && data.user) {
        user.value = { id: data.user.id, username: data.user.username || '' }
      } else {
        user.value = null
      }
    } catch {
      user.value = null
    } finally {
      loaded.value = true
    }
    syncWindowUser()
    return user.value
  }

  function clear() {
    user.value = null
    syncWindowUser()
  }

  function syncWindowUser() {
    if (typeof window !== 'undefined') {
      window.currentUser = user.value
    }
  }

  return {
    user,
    loaded,
    loggedIn,
    welcomeUsername,
    refresh,
    clear,
    syncWindowUser,
  }
})
