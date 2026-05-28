import './assets/global.css';
import axios from 'axios';

// Настройка axios
axios.defaults.baseURL = 'https://english-club-v1.onrender.com';
axios.defaults.withCredentials = true;

// Добавляем JWT токен ко всем запросам
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Если сервер вернул 401 — разлогиниваем
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Только если мы не на странице входа
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';

const app = createApp(App);
app.use(router);
app.mount('#app');
