import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { setContextPath } from './utils/context'

setContextPath(import.meta.env.VITE_CONTEXT_PATH ?? '')

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
