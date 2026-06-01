<template>
  <div id="app-root" @keydown="handleGlobalKeydown">
    <header class="header">
      <div class="header-inner">
        <div class="logo" @click="goHome">
          <span class="logo-text">{{ settings.club_name || 'English Club' }}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-o btn-sm search-trigger" @click="showGlobalSearch = true" title="Поиск (Ctrl+K)">
            <i class="fas fa-search"></i>
            <span class="search-shortcut">Ctrl+K</span>
          </button>
          
          <!-- Кнопка языка -->
          <button class="btn btn-o btn-sm lang-btn" @click="toggleLocale" :title="locale === 'ru' ? 'Switch to English' : 'Переключить на русский'">
            <span class="lang-flag">{{ locale === 'ru' ? '🇷🇺' : '🇬🇧' }}</span>
          </button>
          
          <!-- Кнопка темы -->
          <button class="btn btn-o btn-sm theme-btn" @click="toggleTheme" :title="isDark ? 'Светлая тема' : 'Тёмная тема'">
            <span class="theme-icon-wrapper" :class="{ rotating: themeAnimating }">
              <span class="theme-icon">{{ isDark ? '☀️' : '🌙' }}</span>
            </span>
          </button>
          
          <div v-if="!user"><button class="btn btn-p btn-sm ripple" @click="showLogin = true">{{ t('login') }}</button></div>
          <div v-else style="position:relative">
            <button class="btn btn-o btn-sm user-btn" @click="menuOpen = !menuOpen">
              <img :src="user.avatar_url || 'https://ui-avatars.com/api/?name='+user.username" class="user-avatar">
              <span>{{ user.username }}</span>
            </button>
            <transition name="dropdown-fade">
              <div v-if="menuOpen" class="dropdown">
                <a @click="$router.push('/calendar');menuOpen=false"><i class="fas fa-calendar"></i> {{ t('calendar') }}</a>
                <a @click="$router.push('/messages');menuOpen=false"><i class="fas fa-comments"></i> {{ t('messages') }}</a>
                <a @click="$router.push('/dashboard');menuOpen=false"><i class="fas fa-chart-line"></i> {{ t('dashboard') }}</a>
                <a @click="$router.push('/profile');menuOpen=false"><i class="fas fa-user"></i> {{ t('profile') }}</a>
                <a @click="showPricing = true; menuOpen=false" v-if="user?.role === 'admin'"><i class="fas fa-crown"></i> Тарифы</a>
                <a @click="$router.push('/admin');menuOpen=false" v-if="user?.role === 'admin'"><i class="fas fa-sliders-h"></i> {{ t('admin') }}</a>
                <a @click="logout();menuOpen=false"><i class="fas fa-sign-out-alt"></i> {{ t('logout') }}</a>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </header>

    <WelcomeModal v-if="showWelcome" :user="user" :isNew="isNewUser" @close="showWelcome = false" />
    <PricingModal v-if="showPricing" @close="showPricing = false" />

    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" :user="user" :settings="settings" @update-user="user = $event" />
      </transition>
    </router-view>
    <ScrollToTop />

    <div class="modal-overlay" v-if="showGlobalSearch" @click.self="showGlobalSearch = false">
      <div class="global-search-modal">
        <div class="global-search-header"><i class="fas fa-search"></i><input ref="globalSearchInput" v-model="globalSearchQuery" @input="globalSearch" placeholder="Поиск по сайту... (Esc для закрытия)" class="global-search-input" @keydown.esc="showGlobalSearch = false"><span class="search-shortcut-badge">ESC</span></div>
        <div class="global-search-results" v-if="globalResults.posts?.length || globalResults.sessions?.length">
          <div v-if="globalResults.posts?.length" class="search-section"><h4>📰 Посты</h4><div v-for="p in globalResults.posts" :key="'p'+p.id" class="search-result-item" @click="showGlobalSearch = false; $router.push('/calendar')"><span class="search-result-title">{{ p.title }}</span><span class="search-result-badge">Пост</span></div></div>
          <div v-if="globalResults.sessions?.length" class="search-section"><h4>📅 Встречи</h4><div v-for="s in globalResults.sessions" :key="'s'+s.id" class="search-result-item" @click="showGlobalSearch = false; $router.push('/calendar')"><span class="search-result-title">{{ s.title }}</span><span class="search-result-badge">Встреча</span></div></div>
        </div>
        <div v-else-if="globalSearchQuery.length >= 2" class="search-empty">Ничего не найдено</div>
      </div>
    </div>

    <div class="onboarding-overlay" v-if="showOnboarding">
      <div class="onboarding-card"><div class="onboarding-icon">{{ onboardingSteps[currentOnboardingStep].icon }}</div><h2>{{ onboardingSteps[currentOnboardingStep].title }}</h2><p>{{ onboardingSteps[currentOnboardingStep].text }}</p><div class="onboarding-steps"><div v-for="(step, i) in onboardingSteps" :key="i" class="onboarding-step-dot" :class="{ active: i === currentOnboardingStep }"></div></div><div class="onboarding-actions"><button v-if="currentOnboardingStep > 0" class="btn btn-o btn-sm" @click="currentOnboardingStep--">← Назад</button><button class="btn btn-p btn-sm" @click="nextOnboardingStep">{{ currentOnboardingStep < onboardingSteps.length - 1 ? 'Далее →' : 'Понятно! 🎉' }}</button></div><button class="onboarding-skip" @click="showOnboarding = false">Пропустить</button></div>
    </div>

    <div class="toast-container">
      <transition-group name="toast-list">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type" @click="removeToast(toast.id)"><span class="toast-icon">{{ toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : 'ℹ️' }}</span><span class="toast-msg">{{ toast.message }}</span></div>
      </transition-group>
    </div>

    <div class="modal-overlay" v-if="showLogin" @click.self="showLogin = false"><div class="modal"><h3>👋 {{ t('login') }}</h3><input class="input" v-model="loginEmail" placeholder="Email"><input class="input" v-model="loginPassword" placeholder="Пароль" type="password"><button class="btn btn-p w-100 ripple" @click="login">{{ t('login') }}</button><p style="margin-top:14px;text-align:center;font-size:0.85rem;color:var(--t2)">Нет аккаунта? <a href="#" @click.prevent="showLogin=false;showReg=true" style="color:var(--p);font-weight:600">{{ t('register') }}</a></p><button class="btn btn-o w-100 mt-2" @click="showLogin=false">Закрыть</button></div></div>

    <div class="modal-overlay" v-if="showReg" @click.self="showReg = false"><div class="modal"><h3>✨ {{ t('register') }}</h3><input class="input" v-model="regUsername" placeholder="Имя"><input class="input" v-model="regEmail" placeholder="Email"><input class="input" v-model="regPassword" placeholder="Пароль" type="password"><select class="input" v-model="regLevel"><option value="A1">🟢 Beginner</option><option value="B1" selected>🔵 Intermediate</option><option value="C1">🟣 Advanced</option></select><button class="btn btn-p w-100 ripple" @click="register">{{ t('register') }}</button><p style="margin-top:14px;text-align:center;font-size:0.85rem;color:var(--t2)">Есть аккаунт? <a href="#" @click.prevent="showReg=false;showLogin=true" style="color:var(--p);font-weight:600">{{ t('login') }}</a></p><button class="btn btn-o w-100 mt-2" @click="showReg=false">Закрыть</button></div></div>
  </div>
</template>

<script>
import axios from 'axios';
import ScrollToTop from './components/ScrollToTop.vue';
import WelcomeModal from './components/WelcomeModal.vue';
import PricingModal from './components/PricingModal.vue';
import { useI18n } from './composables/useI18n';
import { playClick, playSuccess, playError } from './composables/useSound';

export default {
  name: 'App',
  components: { ScrollToTop, WelcomeModal, PricingModal },
  setup() {
    const { locale, t, toggleLocale } = useI18n();
    return { locale, t, toggleLocale };
  },
  data() { 
    return { 
      user: null, settings: {}, isDark: false, themeAnimating: false, menuOpen: false, showPricing: false,
      showLogin: false, showReg: false, showWelcome: false, isNewUser: false,
      loginEmail: '', loginPassword: '', regUsername: '', regEmail: '', regPassword: '', regLevel: 'B1',
      toasts: [], toastId: 0,
      showGlobalSearch: false, globalSearchQuery: '', globalResults: { posts: [], sessions: [] },
      showOnboarding: false, currentOnboardingStep: 0,
      onboardingSteps: [
        { icon: '🗣️', title: 'English Club', text: 'Погрузись в языковую среду. Живое общение, достижения и прогресс каждый день.' },
        { icon: '📅', title: 'Записывайся на встречи', text: 'Выбирай удобное время и присоединяйся к видеозвонкам.' },
        { icon: '💬', title: 'Общайся в чатах', text: 'Личные сообщения, групповые чаты и голосовые сообщения.' },
        { icon: '🏆', title: 'Получай достижения', text: 'За активность ты получаешь достижения и повышаешь уровень.' },
        { icon: '🚀', title: 'Ты готов!', text: 'Запишись на первую встречу или напиши сообщение в чате. Удачи!' }
      ]
    }; 
  },
  methods: {
    addToast(m, type='info', d=3000) {
      const id = ++this.toastId;
      this.toasts.push({ id, message: m, type });
      if (type === 'success') playSuccess();
      else if (type === 'error') playError();
      else playClick();
      setTimeout(() => this.removeToast(id), d);
    },
    removeToast(id) { this.toasts = this.toasts.filter(t => t.id !== id); },
    goHome() {
      if (this.user) this.$router.push('/dashboard');
      else this.$router.push('/');
    },
    toggleTheme() { 
      this.themeAnimating = true;
      this.isDark = !this.isDark; 
      document.body.classList.toggle('dark', this.isDark);
      document.body.classList.toggle('light', !this.isDark);
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
      playClick();
      setTimeout(() => { this.themeAnimating = false; }, 500);
    },
    async globalSearch() { if(this.globalSearchQuery.length<2){this.globalResults={posts:[],sessions:[]};return;} try{const r=await axios.get(`/api/search?q=${this.globalSearchQuery}`);this.globalResults=r.data;}catch(e){this.globalResults={posts:[],sessions:[]};} },
    handleGlobalKeydown(e) { if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();this.showGlobalSearch=true;this.$nextTick(()=>this.$refs.globalSearchInput?.focus());} if(e.key==='Escape'){this.showGlobalSearch=false;this.menuOpen=false;} },
    nextOnboardingStep() { if(this.currentOnboardingStep<this.onboardingSteps.length-1){this.currentOnboardingStep++;}else{this.showOnboarding=false;localStorage.setItem('onboarding_done','true');} },
    checkOnboarding() { if(!localStorage.getItem('onboarding_done')&&this.user){setTimeout(()=>{this.showOnboarding=true;},1000);} },
    checkWelcome() { if(this.user){ this.isNewUser=!localStorage.getItem('onboarding_done'); setTimeout(()=>{this.showWelcome=true;},800); } },
    async login() { 
      try {
        const r = await axios.post('/api/login', { email: this.loginEmail, password: this.loginPassword });
        if (r.data.token) {
          localStorage.setItem('token', r.data.token);
          localStorage.setItem('user', JSON.stringify(r.data.user));
          this.user = r.data.user;
          this.showLogin = false;
          this.loginEmail = '';
          this.loginPassword = '';
          this.addToast('Добро пожаловать! 👋', 'success');
          this.$router.push('/dashboard');
          this.checkOnboarding();
          this.checkWelcome();
        } else if (r.data.success) {
          this.user = r.data.user;
          this.showLogin = false;
          this.loginEmail = '';
          this.loginPassword = '';
          this.addToast('Добро пожаловать! 👋', 'success');
          this.$router.push('/dashboard');
          this.checkOnboarding();
          this.checkWelcome();
        }
      } catch(e) {
        this.addToast(e.response?.data?.error || 'Ошибка входа', 'error');
      } 
    },
    async register() { try{const r=await axios.post('/api/reg',{username:this.regUsername,email:this.regEmail,password:this.regPassword,level:this.regLevel});if(r.data.success){this.showReg=false;this.showLogin=true;this.addToast('Регистрация успешна! ✨','success');}}catch(e){this.addToast(e.response?.data?.error||'Ошибка регистрации','error');} },
    async logout() { if(!confirm('Выйти из аккаунта?'))return; try{await axios.post('/api/out');this.addToast('До встречи! 👋','info'); localStorage.removeItem('welcome_dismissed'); }catch(e){} this.user=null;this.menuOpen=false;this.$router.push('/'); }
  },
  async created() {
    try{const r=await axios.get('/api/me');if(r.data.ok){this.user=r.data.user;this.checkOnboarding();this.checkWelcome();}}catch(e){}
    try{const s=await axios.get('/api/settings');this.settings=s.data;}catch(e){}
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') { this.isDark = true; document.body.classList.add('dark'); }
    else if (saved === 'light') { this.isDark = false; document.body.classList.add('light'); }
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) { this.isDark = true; document.body.classList.add('dark'); }
  },
  provide() { return { addToast:this.addToast }; }
};
</script>

<style>
/* ГЛОБАЛЬНЫЕ СТИЛИ */
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --t: #1e293b;
  --t2: #64748b;
  --b: #e2e8f0;
  --p: #6366f1;
  --p2: #2dd4bf;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 15px rgba(0,0,0,0.08);
  --shadow-lg: 0 10px 30px rgba(0,0,0,0.12);
}

body.dark {
  --bg: #0b1120;
  --surface: rgba(15,15,30,0.95);
  --t: #e2e8f0;
  --t2: #94a3b8;
  --b: rgba(255,255,255,0.08);
  --p: #6366f1;
  --p2: #2dd4bf;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 15px rgba(0,0,0,0.4);
  --shadow-lg: 0 10px 30px rgba(0,0,0,0.5);
}

body {
  background: var(--bg);
  color: var(--t);
  font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
  margin: 0;
  transition: background-color 0.4s ease, color 0.4s ease;
}

* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

/* КНОПКА ЯЗЫКА */
.lang-btn {
  position: relative;
  overflow: hidden;
  font-size: 1.1rem;
  padding: 6px 10px !important;
}

.lang-flag {
  transition: transform 0.3s ease;
}

.lang-btn:hover .lang-flag {
  transform: scale(1.2);
}

/* АНИМАЦИЯ КНОПКИ ТЕМЫ */
.theme-btn {
  position: relative;
  overflow: hidden;
}

.theme-icon-wrapper {
  display: inline-block;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-icon-wrapper.rotating {
  animation: themeSpin 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes themeSpin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.3); }
  100% { transform: rotate(360deg) scale(1); }
}

/* СКРОЛЛБАР */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }

/* АНИМАЦИИ */
.page-fade-enter-active, .page-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.page-fade-enter-from { opacity: 0; transform: translateY(8px); }
.page-fade-leave-to { opacity: 0; transform: translateY(-8px); }

.toast-list-enter-active { animation: slideInRight 0.3s ease; }
.toast-list-leave-active { animation: slideOutRight 0.3s ease; }
@keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100px); } }

.dropdown-fade-enter-active { animation: dropdownIn 0.2s ease; }
.dropdown-fade-leave-active { animation: dropdownOut 0.2s ease; }
@keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dropdownOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }
</style>

<style scoped>
.logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
</style>
