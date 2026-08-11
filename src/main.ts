import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/index.css'
import './styles/overrides.css'
import './styles/footer.css'

createApp(App).use(createPinia()).mount('#app')
