<template>
  <div class="profile-page-wrapper">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="container">
      <div class="profile-page">
        <!-- Сайдбар -->
        <ProfileSidebar
          :user="user"
          :currentTab="tab"
          :isStudent="isStudent"
          :isParent="isParent"
          :isTutor="isTutor"
          @switch-tab="switchTab"
          @upload-avatar="uploadAvatar"
          @link-telegram="linkTelegram"
          @export-pdf="exportPDF"
        />

        <!-- Основной контент -->
        <div class="profile-main">
          <ProfileTabInfo v-if="tab === 'info'" :user="user" />
          <ProfileTabAchievements v-if="tab === 'achievements'" :achievements="allAchievements" :earned="earnedCount" :total="totalCount" :percent="completionPercent" />
          <ProfileTabSchedule v-if="tab === 'myschedule'" :upcoming="myUpcomingSlots" :past="myPastSlots" :showStudent="isParent" @export="exportMyICS" />
          <ProfileTabWords v-if="tab === 'words'" :words="words" :loading="wordsLoading" @add-word="addWord" @delete-word="delWord" />
          <ProfileTabNotes v-if="tab === 'notes'" :note="note" @update-note="updateNote" />

          <div v-if="tab === 'myhomework'" class="card fade-in">
            <h3>📋 Мои задания</h3>
            <div class="homework-widget" v-for="h in myHomework" :key="h.id" :class="{ done: h.status === 'completed' }">
              <div class="homework-widget-header"><span>{{ h.status === 'completed' ? '✅' : '📝' }}</span><strong>{{ h.title }}</strong></div>
            </div>
            <p v-if="!myHomework.length" class="empty-text">Нет заданий</p>
          </div>

          <ProfileTabStudents v-if="tab === 'children'" :students="myStudents" title="Мои дети" @view="viewStudent" />
          <ProfileTabStudents v-if="tab === 'students'" :students="allStudents" title="Ученики" :showActions="true" :isAdmin="user?.role === 'admin'" @view="viewStudent" @bind="openBindParent" @homework="openHomeworkTab" @feedback="openFeedback" />
          <ProfileTabFeedbacks v-if="tab === 'feedbacks'" :feedbacks="feedbacks" />
          <ProfileTabHomework v-if="tab === 'homework'" :students="allStudents" :loading="homeworkLoading" @create-homework="createHomework" />

          <div v-if="tab === 'history'" class="card fade-in">
            <h3>История встреч</h3>
            <div class="session-item" v-for="b in pastBookings" :key="b.bid"><strong>{{ b.title }}</strong><small>{{ new Date(b.date).toLocaleString('ru') }}</small></div>
            <p v-if="!pastBookings.length" class="empty-text">Нет истории</p>
          </div>
        </div>
      </div>

      <!-- Все модалки в одном компоненте -->
      <ProfileModals
        :viewingStudent="viewingStudent"
        :showBindParent="showBindParent"
        :parentResults="parentResults"
        :showFeedback="showFeedback"
        @close-view="viewingStudent = null"
        @close-bind="showBindParent = false"
        @search-parents="searchParents"
        @bind-parent="doBindParent"
        @close-feedback="showFeedback = false"
        @submit-feedback="doAddFeedback"
      />

      <ConfettiExplosion :active="showConfetti" />
      <AchievementUnlock v-if="newAchievement" :achievement="newAchievement" />
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ConfettiExplosion from '../components/ConfettiExplosion.vue';
import ProfileSidebar from '../components/profile/ProfileSidebar.vue';
import ProfileTabInfo from '../components/profile/ProfileTabInfo.vue';
import ProfileTabAchievements from '../components/profile/ProfileTabAchievements.vue';
import ProfileTabSchedule from '../components/profile/ProfileTabSchedule.vue';
import ProfileTabStudents from '../components/profile/ProfileTabStudents.vue';
import ProfileTabWords from '../components/profile/ProfileTabWords.vue';
import ProfileTabNotes from '../components/profile/ProfileTabNotes.vue';
import ProfileTabFeedbacks from '../components/profile/ProfileTabFeedbacks.vue';
import ProfileTabHomework from '../components/profile/ProfileTabHomework.vue';
import ProfileModals from '../components/profile/ProfileModals.vue';
import AchievementUnlock from '../components/AchievementUnlock.vue';
import { exportProgressPDF } from '../composables/useExportPDF.js';

export default {
  name: 'ProfilePage',
  components: { ConfettiExplosion, ProfileSidebar, ProfileTabInfo, ProfileTabAchievements, ProfileTabSchedule, ProfileTabStudents, ProfileTabWords, ProfileTabNotes, ProfileTabFeedbacks, ProfileTabHomework, ProfileModals, AchievementUnlock },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      tab: 'info',
      words: [], wordsLoading: false,
      note: '', allBookings: [],
      allAchievements: [], earnedCount: 0, totalCount: 30, showConfetti: false,
      myHomework: [], homeworkLoading: false,
      myStudents: [], allStudents: [], viewingStudent: null,
      mySlots: [],
      showBindParent: false, bindStudentId: null, parentResults: [],
      showFeedback: false, fbStudentId: null,
      newAchievement: null, feedbacks: []
    };
  },
  computed: {
    isStudent() { return !this.user?.role || this.user.role === 'user' || this.user.role === 'student'; },
    isParent() { return this.user?.role === 'parent'; },
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; },
    pastBookings() { return this.allBookings.filter(b => b.status === 'attended' || new Date(b.date) < new Date()); },
    completionPercent() { return this.totalCount > 0 ? Math.round((this.earnedCount / this.totalCount) * 100) : 0; },
    myUpcomingSlots() { return this.mySlots.filter(s => new Date(s.start_time) >= new Date()); },
    myPastSlots() { return this.mySlots.filter(s => new Date(s.start_time) < new Date()); }
  },
  async mounted() {
    await this.loadInitialData();
    this.loadAchievements();
    this.restoreTab();
  },
  methods: {
    async loadInitialData() {
      try {
        const [w, n, b] = await Promise.all([axios.get('/api/words'), axios.get('/api/notes'), axios.get('/api/myb')]);
        this.words = w.data || [];
        this.note = n.data.note || '';
        this.allBookings = b.data || [];
      } catch (e) { console.error('Ошибка загрузки:', e); }
    },
    restoreTab() {
      const savedTab = localStorage.getItem('profile_tab');
      if (savedTab) { this.tab = savedTab; localStorage.removeItem('profile_tab'); if (savedTab === 'feedbacks') this.loadFeedbacks(); if (savedTab === 'achievements') this.loadAchievements(); }
    },
    switchTab(btn) { this.tab = btn.tab; if (btn.load) this[btn.load](); },

    // Словарь
    async addWord({ en, ru }) {
      this.wordsLoading = true;
      try {
        const res = await axios.post('/api/words', { en, ru });
        if (res.status === 201 || res.status === 200) {
          const wordsRes = await axios.get('/api/words');
          this.words = wordsRes.data || [];
          this.addToast('Слово добавлено! 📚', 'success');
        }
      } catch (err) {
        const msg = err.response?.data?.error || 'Не удалось добавить слово';
        this.addToast(msg, 'error');
      } finally { this.wordsLoading = false; }
    },
    async delWord(id) {
      try {
        await axios.delete(`/api/words/${id}`);
        this.words = this.words.filter(w => w.id !== id);
        this.addToast('Удалено', 'success');
      } catch { this.addToast('Ошибка удаления', 'error'); }
    },

    // Заметки
    updateNote(val) { this.note = val; clearTimeout(this._t); this._t = setTimeout(() => axios.put('/api/notes', { note: this.note }).catch(() => {}), 500); },

    // Достижения
    async loadAchievements() {
      try {
        const r = await axios.get('/api/achievements');
        const newData = (r.data || []).map(a => ({ ...a, progressPercent: a.progressPercent || a.progress_percent || (a.earned ? 100 : 0) }));
        const newlyUnlocked = newData.filter(a => { const old = this.allAchievements.find(o => o.code === a.code); return old && !old.earned && a.earned; });
        this.allAchievements = newData;
        this.earnedCount = newData.filter(a => a.earned).length;
        if (newlyUnlocked.length > 0 && !this._shown) { this._shown = true; this.newAchievement = newlyUnlocked[0]; this.showConfetti = true; }
      } catch (e) { console.error('Ошибка достижений:', e); }
    },

    // Фидбеки
    async loadFeedbacks() { try { this.feedbacks = (await axios.get('/api/feedback/my')).data || []; } catch { this.addToast('Ошибка загрузки', 'error'); } },
    openFeedback(s) { this.fbStudentId = s.id; this.showFeedback = true; },
    async doAddFeedback(data) { try { await axios.post('/api/feedback', { ...data, student_id: this.fbStudentId }); this.showFeedback = false; this.addToast('Отправлено! 📊', 'success'); } catch { this.addToast('Ошибка', 'error'); } },

    // Домашние задания
    async loadMyHomework() { try { this.myHomework = (await axios.get('/api/homework/my')).data || []; } catch {} },
    openHomeworkTab(s) { this.hwStudent = s.id; this.tab = 'homework'; },
    async createHomework(data) { try { await axios.post('/api/homework', data); this.addToast('Создано! 📝', 'success'); } catch (e) { this.addToast(e.response?.data?.error || 'Ошибка', 'error'); } },

    // Ученики и родители
    async loadMyStudents() { try { this.myStudents = (await axios.get('/api/parent/students')).data || []; } catch { this.addToast('Ошибка загрузки', 'error'); } },
    async loadAllStudents() { try { this.allStudents = ((await axios.get('/api/users')).data || []).filter(u => u.role !== 'admin' && u.role !== 'host'); } catch {} },
    async viewStudent(s) { try { this.viewingStudent = (await axios.get(`/api/parent/student/${s.id}`)).data; } catch { this.addToast('Ошибка загрузки', 'error'); } },
    openBindParent(s) { this.bindStudentId = s.id; this.showBindParent = true; },
    async searchParents(q) { try { this.parentResults = ((await axios.get(`/api/users?q=${q}`)).data || []).filter(u => u.role === 'parent'); } catch {} },
    async doBindParent(pid) { 
  try { 
    await axios.post('/api/parent/bind', { 
      student_id: this.bindStudentId, 
      parent_id: pid 
    }); 
    this.showBindParent = false; 
    this.parentSearch = ''; 
    this.addToast('Привязан! ✅', 'success'); 
  } catch(e) { 
    if (e.response?.status === 409) {
      this.addToast('Эта связь уже существует', 'info');
      this.showBindParent = false;
    } else {
      this.addToast(e.response?.data?.error || 'Ошибка', 'error');
    }
  } 
},

    // Слоты и остальное
    async loadMySlots() { try { this.mySlots = (await axios.get('/api/slots')).data || []; } catch {} },
    exportMyICS() { window.open('/api/slots/export', '_blank'); },
    async exportPDF() {
      try { const r = await axios.get('/api/achievements'); const stats = { messages: 0, meetings: 0, words: 0, achievements: this.allAchievements.filter(a => a.earned).length }; exportProgressPDF(this.user, stats, r.data || []); } catch { this.addToast('Ошибка', 'error'); }
    },
    async linkTelegram() { try { window.open((await axios.get('/api/tg-link')).data.link, '_blank'); } catch { this.addToast('Ошибка', 'error'); } },
    async uploadAvatar(e) {
      const file = e.target.files[0]; if (!file || file.size > 5*1024*1024) { this.addToast('Файл > 5MB', 'error'); return; }
      try { const form = new FormData(); form.append('img', file); const r = await axios.post('/api/nimg', form); if (r.data.url) { await axios.put('/api/me', { avatar_url: r.data.url }); this.user.avatar_url = r.data.url; this.$emit('update-user', { ...this.user, avatar_url: r.data.url }); this.addToast('Фото обновлено! 📸', 'success'); } } catch { this.addToast('Ошибка загрузки', 'error'); }
    }
  }
};
</script>

<style scoped>
.profile-page-wrapper { min-height: 100vh; background: #0b1120; position: relative; overflow: hidden; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.2; pointer-events: none; }
.bg-orb-1 { width: 600px; height: 600px; background: #6366f1; top: -200px; left: -200px; animation: floatOrb1 15s ease-in-out infinite; }
.bg-orb-2 { width: 500px; height: 500px; background: #2dd4bf; bottom: -200px; right: -200px; animation: floatOrb2 15s ease-in-out infinite; }
@keyframes floatOrb1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-30px) scale(1.05); } }
@keyframes floatOrb2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,20px) scale(1.05); } }
.container { max-width: 1280px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }
.profile-page { display: flex; gap: 28px; }
.profile-main { flex: 1; min-width: 0; }
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.empty-text { text-align: center; color: #64748b; padding: 30px; }
.session-item { padding: 14px 18px; background: rgba(255,255,255,0.03); border-radius: 14px; margin-bottom: 8px; border-left: 3px solid #6366f1; }
.session-item strong { color: #fff; }
.session-item small { color: #94a3b8; }
.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 768px) { .profile-page { flex-direction: column; } }
</style>
