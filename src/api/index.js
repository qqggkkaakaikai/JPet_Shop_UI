import http from './http'
import { getContextPath } from '@/utils/context'

function unwrap(response) {
  return response?.data?.data
}

export const productApi = {
  list(params = {}) {
    return http.get('/api/products', { params }).then(unwrap)
  },
  get(id) {
    return http.get('/api/products', { params: { id } }).then(unwrap)
  },
}

export const cartApi = {
  list(userId) {
    return http.get('/api/cart', { params: { userId } }).then(unwrap)
  },
  listUnpurchased(userId) {
    return http.get('/api/cart/unpurchased', { params: { userId } }).then(unwrap)
  },
  listPurchased(userId) {
    return http.get('/api/cart/purchased', { params: { userId } }).then(unwrap)
  },
  add(payload) {
    return http.post('/api/cart', payload).then(unwrap)
  },
  updateQuantity(cartItemId, quantity) {
    return http.put('/api/cart', null, { params: { cartItemId, quantity } }).then(unwrap)
  },
  updatePurchased(cartItemId, purchased) {
    return http.put('/api/cart', null, { params: { cartItemId, purchased: purchased ? 1 : 0 } }).then(unwrap)
  },
  remove(cartItemId) {
    return http.delete('/api/cart', { params: { cartItemId } }).then(unwrap)
  },
}

export async function fetchUserInfo() {
  const { data } = await http.get('/user/info')
  return data
}

export async function checkUsername(username) {
  const base = getContextPath()
  const res = await fetch(
    `${base}/user/checkUsername?username=${encodeURIComponent(username)}`,
    { credentials: 'include' },
  )
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { exists: false, message: text }
  }
}

export function captchaUrl() {
  return `${getContextPath()}/captcha?t=${Date.now()}`
}
