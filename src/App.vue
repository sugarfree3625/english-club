<template>
  <div id="app-root" @keydown="handleGlobalKeydown">
    <!-- 🔥 ФОН -->
    <ParticlesBackground />
    
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
          
          <button class="btn btn-o btn-sm lang-btn" @click="toggleLocale" :title="locale === 'ru' ? 'Switch to English' : 'Переключить на русский'">
            <span class="lang-flag">{{ locale === 'ru' ? '🇷🇺' : '🇬🇧' }}</span>
          </button>
          
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

    <XPFloating ref="xpFloating" />

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

    <!-- 🎓 ОНБОРДИНГ ДЛЯ НОВИЧКОВ -->
    <div class="onboarding-overlay" v-if="showOnboarding">
      <div class="onboarding-card">
        <div class="onboarding-progress">
          <div v-for="(step, i) in onboardingSteps" :key="i" class="onboarding-dot" :class="{ active: i === currentOnboardingStep, done: i < currentOnboardingStep }"></div>
        </div>
        <div class="onboarding-icon-wrap">
          <span class="onboarding-icon">{{ onboardingSteps[currentOnboardingStep].icon }}</span>
        </div>
        <h2 class="onboarding-title">{{ onboardingSteps[currentOnboardingStep].title }}</h2>
        <p class="onboarding-text">{{ onboardingSteps[currentOnboardingStep].text }}</p>
        <div class="onboarding-actions">
          <button v-if="currentOnboardingStep > 0" class="onboarding-btn secondary" @click="currentOnboardingStep--">← Назад</button>
          <button class="onboarding-btn primary" @click="nextOnboardingStep">
            {{ currentOnboardingStep < onboardingSteps.length - 1 ? 'Далее' : '🎉 Начать!' }}
          </button>
        </div>
        <button class="onboarding-skip" @click="skipOnboarding">Пропустить</button>
      </div>
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
import ParticlesBackground from './components/ParticlesBackground.vue';
import XPFloating from './components/XPFloating.vue';
import { useI18n } from './composables/useI18n';
import { playClick, playSuccess, playError } from './composables/useSound';

export default {
  name: 'App',
  components: { ScrollToTop, WelcomeModal, PricingModal, ParticlesBackground, XPFloating },
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
        { icon: '👋', title: 'Добро пожаловать!', text: 'English Club — разговорный клуб нового поколения. Здесь ты будешь практиковать английский с удовольствием.' },
        { icon: '📅', title: 'Записывайся на занятия', text: 'Выбирай удобное время в календаре. Индивидуальные и групповые занятия с преподавателем.' },
        { icon: '💬', title: 'Общайся в чатах', text: 'Личные сообщения, групповые чаты, голосовые и видеозвонки — всё для живого общения.' },
        { icon: '📚', title: 'Пополняй словарь', text: 'Добавляй новые слова, учи их с помощью карточек и тестов. Отслеживай прогресс.' },
        { icon: '📝', title: 'Выполняй задания', text: 'Получай домашние задания от преподавателя, отправляй ответы и получай оценки.' },
        { icon: '🏆', title: 'Зарабатывай достижения', text: 'За активность ты получаешь XP, повышаешь уровень и открываешь крутые награды.' },
        { icon: '🚀', title: 'Ты готов!', text: 'Запишись на первое занятие, добавь слова в словарь или напиши в чат. Удачи!' }
      ]
    }; 
  },
  methods: {
    addToast(m, type='info', d=3000) { const id = ++this.toastId; this.toasts.push({ id, message: m, type }); if (type === 'success') playSuccess(); else if (type === 'error') playError(); else playClick(); setTimeout(() => this.removeToast(id), d); },
    showXP(amount, x, y) { this.$refs.xpFloating?.showXP(amount, x, y); },
    removeToast(id) { this.toasts = this.toasts.filter(t => t.id !== id); },
    goHome() { if (this.user) this.$router.push('/dashboard'); else this.$router.push('/'); },
    toggleTheme() { this.themeAnimating = true; this.isDark = !this.isDark; document.body.classList.toggle('dark', this.isDark); document.body.classList.toggle('light', !this.isDark); localStorage.setItem('theme', this.isDark ? 'dark' : 'light'); playClick(); setTimeout(() => { this.themeAnimating = false; }, 500); },
    async globalSearch() { if(this.globalSearchQuery.length<2){this.globalResults={posts:[],sessions:[]};return;} try{const r=await axios.get(`/api/search?q=${this.globalSearchQuery}`);this.globalResults=r.data;}catch(e){this.globalResults={posts:[],sessions:[]};} },
    handleGlobalKeydown(e) { if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();this.showGlobalSearch=true;this.$nextTick(()=>this.$refs.globalSearchInput?.focus());} if(e.key==='Escape'){this.showGlobalSearch=false;this.menuOpen=false;} },
    
    // 🎓 ОНБОРДИНГ
    checkOnboarding() { const done = localStorage.getItem('onboarding_done'); if (!done && this.user) { setTimeout(() => { this.showOnboarding = true; }, 800); } },
    nextOnboardingStep() { if (this.currentOnboardingStep < this.onboardingSteps.length - 1) { this.currentOnboardingStep++; } else { this.showOnboarding = false; localStorage.setItem('onboarding_done', 'true'); } },
    skipOnboarding() { this.showOnboarding = false; localStorage.setItem('onboarding_done', 'true'); },
    
    // 👋 WELCOME РАЗ В ДЕНЬ
    checkWelcome() { if (!this.user) return; const today = new Date().toDateString(); const lastShown = localStorage.getItem('welcome_shown_date'); if (lastShown !== today) { this.isNewUser = !localStorage.getItem('onboarding_done'); setTimeout(() => { this.showWelcome = true; }, 600); localStorage.setItem('welcome_shown_date', today); } },
    
    async login() { try { const r = await axios.post('/api/login', { email: this.loginEmail, password: this.loginPassword }); if (r.data.token) { localStorage.setItem('token', r.data.token); localStorage.setItem('user', JSON.stringify(r.data.user)); this.user = r.data.user; this.showLogin = false; this.loginEmail = ''; this.loginPassword = ''; this.addToast('Добро пожаловать! 👋', 'success'); this.$router.push('/dashboard'); this.checkOnboarding(); this.checkWelcome(); } else if (r.data.success) { this.user = r.data.user; this.showLogin = false; this.loginEmail = ''; this.loginPassword = ''; this.addToast('Добро пожаловать! 👋', 'success'); this.$router.push('/dashboard'); this.checkOnboarding(); this.checkWelcome(); } } catch(e) { this.addToast(e.response?.data?.error || 'Ошибка входа', 'error'); } },
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
  provide() { return { addToast: this.addToast, showXP: this.showXP }; }
};
</script>

<style>
:root { --bg: #f8fafc; --surface: #ffffff; --t: #1e293b; --t2: #64748b; --b: #e2e8f0; --p: #6366f1; --p2: #2dd4bf; }
body.dark { --bg: #0b1120; --surface: rgba(15,15,30,0.95); --t: #e2e8f0; --t2: #94a3b8; --b: rgba(255,255,255,0.08); }
body { background: var(--bg); color: var(--t); font-family: 'Inter', 'Plus Jakarta Sans', sans-serif; margin: 0; transition: background-color 0.4s ease, color 0.4s ease; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 3px; }
.page-fade-enter-active, .page-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.page-fade-enter-from { opacity: 0; transform: translateY(8px); } .page-fade-leave-to { opacity: 0; transform: translateY(-8px); }
.toast-list-enter-active { animation: slideInRight 0.3s ease; } .toast-list-leave-active { animation: slideOutRight 0.3s ease; }
@keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100px); } }
.dropdown-fade-enter-active { animation: dropdownIn 0.2s ease; } .dropdown-fade-leave-active { animation: dropdownOut 0.2s ease; }
@keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dropdownOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }
.lang-btn { font-size: 1.1rem; padding: 6px 10px !important; } .lang-flag { transition: transform 0.3s ease; } .lang-btn:hover .lang-flag { transform: scale(1.2); }
.theme-btn { position: relative; overflow: hidden; } .theme-icon-wrapper { display: inline-block; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.theme-icon-wrapper.rotating { animation: themeSpin 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes themeSpin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.3); } 100% { transform: rotate(360deg) scale(1); } }

/* 🎓 ОНБОРДИНГ */
.onboarding-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.onboarding-card { background: linear-gradient(145deg, rgba(20,20,50,0.98), rgba(15,15,35,0.98)); border: 1px solid rgba(99,102,241,0.3); border-radius: 28px; padding: 40px 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1); animation: onboardIn 0.5s ease; }
@keyframes onboardIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.onboarding-progress { display: flex; justify-content: center; gap: 6px; margin-bottom: 24px; }
.onboarding-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.15); transition: all 0.3s; }
.onboarding-dot.active { background: #6366f1; box-shadow: 0 0 10px rgba(99,102,241,0.6); width: 9px; height: 9px; }
.onboarding-dot.done { background: #10b981; }
.onboarding-icon-wrap { margin-bottom: 20px; }
.onboarding-icon { font-size: 4rem; display: block; animation: iconFloat 2s ease-in-out infinite; }
@keyframes iconFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.onboarding-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; font-weight: 700; color: #fff; margin: 0 0 10px; }
.onboarding-text { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin: 0 0 24px; }
.onboarding-actions { display: flex; gap: 10px; justify-content: center; }
.onboarding-btn { padding: 10px 24px; border-radius: 14px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.onboarding-btn.primary { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.onboarding-btn.primary:hover { box-shadow: 0 8px 25px rgba(99,102,241,0.4); transform: translateY(-2px); }
.onboarding-btn.secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; }
.onboarding-skip { background: none; border: none; color: #64748b; cursor: pointer; margin-top: 16px; font-size: 0.8rem; font-family: inherit; }
.onboarding-skip:hover { color: #94a3b8; }
</style>

<style scoped>
.logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
</style>