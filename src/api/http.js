import axios from 'axios'
import { getContextPath } from '@/utils/context'

const http = axios.create({
  withCredentials: true,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  config.baseURL = getContextPath()
  return config
})

http.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (payload && typeof payload.code === 'number' && payload.code >= 400) {
      return Promise.reject(new Error(payload.message || '请求失败'))
    }
    return response
  },
  (error) => {
    const message = error?.response?.data?.message || error.message || '网络请求失败'
    return Promise.reject(new Error(message))
  },
)

export default http
