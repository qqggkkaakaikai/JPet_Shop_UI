import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import IndexView from '@/views/IndexView.vue'
import CategoryView from '@/views/CategoryView.vue'
import CartView from '@/views/CartView.vue'
import ProfileView from '@/views/ProfileView.vue'
import MedicalView from '@/views/MedicalView.vue'
import BoardingView from '@/views/BoardingView.vue'
import ChatView from '@/views/ChatView.vue'
import LoginView from '@/views/LoginView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

/** 与 LoginInterceptor 一致：/chat 不强制登录 */
const PUBLIC_PATHS = new Set(['/login', '/chat'])

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/index' },
    { path: '/index', name: 'index', component: IndexView },
    { path: '/category', name: 'category', component: CategoryView },
    { path: '/cart', name: 'cart', component: CartView },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/medical', name: 'medical', component: MedicalView },
    { path: '/boarding', name: 'boarding', component: BoardingView },
    { path: '/chat', name: 'chat', component: ChatView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFoundView },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.loaded) {
    await auth.refresh()
  }

  if (to.path === '/login') {
    if (auth.loggedIn) {
      return { path: '/index' }
    }
    return true
  }

  if (PUBLIC_PATHS.has(to.path)) {
    return true
  }

  if (!auth.loggedIn) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }
  return true
})

export default router
