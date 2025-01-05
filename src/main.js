import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import 'vue-select/dist/vue-select.css';

const app = createApp(App)
app.use(vuetify);
app.mount('#app')
