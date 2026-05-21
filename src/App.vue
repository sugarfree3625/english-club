<template>
    <div id="app-root">
      <header class="header">
        <div class="header-inner">
          <div class="logo" @click="$router.push('/')">
            <span>{{ settings.club_name || 'English Club' }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-o btn-sm" @click="toggleTheme">{{ isDark ? '☀️' : '🌙' }}</button>
            <div v-if="!user">
              <button class="btn btn-p btn-sm" @click="showLogin = true">Войти</button>
            </div>
            <div v-else style="position:relative">
              <button class="btn btn-o btn-sm" @click="menuOpen = !menuOpen">
                <img :src="user.avatar_url || 'https://ui-avatars.com/api/?name='+user.username" style="width:22px;height:22px;border-radius:50%"> {{ user.username }}
              </button>
              <div v-if="menuOpen" class="dropdown">
                <a @click="$router.push('/dashboard');menuOpen=false">📅 Дашборд</a>
                <a @click="$router.push('/profile');menuOpen=false">👤 Профиль</a>
                <a @click="logout();menuOpen=false">🚪 Выйти</a>
              </div>
            </div>
          </div>
        </div>
      </header>
  
      <router-view :user="user" :settings="settings" @update-user="user = $event" />
  
      <!-- Модалка входа -->
      <div class="modal-overlay" v-if="showLogin" @click.self="showLogin = false">
        <div class="modal">
          <h3>Войти</h3>
          <input class="input" v-model="loginEmail" placeholder="Email">
          <input class="input" v-model="loginPassword" placeholder="Пароль" type="password">
          <button class="btn btn-p w-100" @click="login">Войти</button>
          <p style="margin-top:10px;text-align:center;font-size:0.85rem">
            Нет аккаунта? <a href="#" @click.prevent="showLogin = false; showReg = true">Регистрация</a>
          </p>
          <button class="btn btn-o w-100 mt-2" @click="showLogin = false">Закрыть</button>
        </div>
      </div>
  
      <!-- Модалка регистрации -->
      <div class="modal-overlay" v-if="showReg" @click.self="showReg = false">
        <div class="modal">
          <h3>Регистрация</h3>
          <input class="input" v-model="regUsername" placeholder="Имя">
          <input class="input" v-model="regEmail" placeholder="Email">
          <input class="input" v-model="regPassword" placeholder="Пароль" type="password">
          <select class="input" v-model="regLevel">
            <option value="A1">Beginner</option>
            <option value="B1" selected>Intermediate</option>
            <option value="C1">Advanced</option>
          </select>
          <button class="btn btn-p w-100" @click="register">Зарегистрироваться</button>
          <p style="margin-top:10px;text-align:center;font-size:0.85rem">
            Есть аккаунт? <a href="#" @click.prevent="showReg = false; showLogin = true">Войти</a>
          </p>
          <button class="btn btn-o w-100 mt-2" @click="showReg = false">Закрыть</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'App',
    data() {
      return {
        user: null,
        settings: {},
        isDark: false,
        menuOpen: false,
        showLogin: false,
        showReg: false,
        loginEmail: '',
        loginPassword: '',
        regUsername: '',
        regEmail: '',
        regPassword: '',
        regLevel: 'B1'
      };
    },
    async created() {
      try { const r = await axios.get('/api/me'); if (r.data.ok) this.user = r.data.user; } catch(e) {}
      try { const s = await axios.get('/api/settings'); this.settings = s.data; } catch(e) {}
      this.isDark = localStorage.getItem('theme') === 'dark';
      if (this.isDark) document.body.classList.add('dark');
    },
    methods: {
      toggleTheme() {
        this.isDark = !this.isDark;
        document.body.classList.toggle('dark', this.isDark);
        localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
      },
      async login() {
        try {
          const r = await axios.post('/api/login', { email: this.loginEmail, password: this.loginPassword });
          if (r.data.success) { this.user = r.data.user; this.showLogin = false; this.loginEmail = ''; this.loginPassword = ''; this.$router.push('/dashboard'); }
        } catch(e) { alert('Ошибка входа'); }
      },
      async register() {
        try {
          const r = await axios.post('/api/reg', { username: this.regUsername, email: this.regEmail, password: this.regPassword, level: this.regLevel });
          if (r.data.success) { this.showReg = false; this.showLogin = true; alert('Регистрация успешна! Войдите.'); }
        } catch(e) { alert('Ошибка регистрации'); }
      },
      async logout() {
        try { await axios.post('/api/out'); } catch(e) {}
        this.user = null; this.menuOpen = false; this.$router.push('/');
      }
    }
  };
  </script>
  
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  :root { --p: #6366f1; --bg: #f8fafc; --t: #1e293b; --b: #e2e8f0; --r: 16px; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--t); min-height: 100vh; }
  body.dark { background: #0f172a; color: #e2e8f0; }
  body.dark .header { background: rgba(30,41,59,0.9); border-color: #334155; }
  body.dark .modal { background: #1e293b; color: #e2e8f0; }
  body.dark .input { background: #334155; border-color: #475569; color: #e2e8f0; }
  body.dark .dropdown { background: #1e293b; border-color: #334155; }
  body.dark .dropdown a { color: #e2e8f0; }
  .header { position: sticky; top: 0; z-index: 1000; background: #fff; border-bottom: 1px solid var(--b); }
  .header-inner { max-width: 1280px; margin: 0 auto; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; }
  .logo { font-size: 1.2rem; font-weight: 800; cursor: pointer; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; }
  .btn-p { background: var(--p); color: #fff; }
  .btn-o { border: 2px solid var(--p); color: var(--p); background: transparent; }
  .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
  .w-100 { width: 100%; }
  .dropdown { position: absolute; top: 100%; right: 0; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); min-width: 160px; padding: 6px 0; border: 1px solid var(--b); z-index: 100; }
  .dropdown a { display: block; padding: 8px 14px; cursor: pointer; font-size: 0.85rem; color: var(--t); }
  .dropdown a:hover { background: #f1f5f9; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
  .modal { background: #fff; border-radius: var(--r); padding: 24px; max-width: 400px; width: 90%; }
  .input { width: 100%; padding: 10px; border: 2px solid var(--b); border-radius: 10px; font-family: inherit; font-size: 0.9rem; margin-bottom: 10px; }
  .input:focus { outline: none; border-color: var(--p); }
  </style>
