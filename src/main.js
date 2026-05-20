import axios from 'axios';

axios.defaults.baseURL = 'https://english-club-v1.onrender.com';
axios.defaults.withCredentials = true;

import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';

const app = createApp(App);
app.use(router);
app.mount('#app');