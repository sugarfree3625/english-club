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
          <ProfileTabWords v-if="tab === 'words'" :words="words" :loading="wordsLoading" @add-word="addWord" @delete-word="delWord" @update-word-status="updateWordStatus" />
          <ProfileTabNotes v-if="tab === 'notes'" :note="note" @update-note="updateNote" />

          <!-- ЗАДАНИЯ (ОБНОВЛЁННАЯ ВКЛАДКА) -->
          <div v-if="tab === 'myhomework'" class="homework-tab fade-in">
            <h3 class="tab-title">📋 {{ isTutor ? 'Все задания' : isParent ? 'Задания детей' : 'Мои задания' }}</h3>
            
            <div v-if="homeworkLoading" class="empty-text">Загрузка...</div>
            
            <template v-else>
              <div class="homework-list">
                <div v-for="h in allHomework" :key="h.id" 
                  class="homework-card" 
                  :class="{ overdue: isOverdue(h), completed: h.status === 'completed' }"
                  @click="selectedHomework = h">
                  
                  <div class="hw-left">
                    <div class="hw-type-icon">{{ typeIcon(h.type) }}</div>
                    <div class="hw-info">
                      <div class="hw-title">{{ h.title }}</div>
                      <div class="hw-meta">
                        <span v-if="h.student_name" class="hw-student">👨‍🎓 {{ h.student_name }}</span>
                        <span v-if="h.due_date" class="hw-due" :class="{ 'text-red': isOverdue(h) }">
                          📅 {{ formatDate(h.due_date) }}
                        </span>
                        <span class="hw-status" :class="h.status">{{ statusLabel(h.status) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="hw-right">
                    <div v-if="h.grade" class="hw-grade">⭐ {{ h.grade }}/{{ h.max_grade || 10 }}</div>
                    <div v-else class="hw-xp">🎯 {{ h.experience || 50 }} XP</div>
                  </div>
                </div>
              </div>
              <p v-if="!allHomework.length" class="empty-text">Нет заданий</p>
            </template>
          </div>

          <ProfileTabStudents v-if="tab === 'children'" :students="myStudents" title="Мои дети" @view="viewStudent" />
          <ProfileTabStudents v-if="tab === 'students'" :students="allStudents" title="Ученики" :showActions="true" :isAdmin="user?.role === 'admin'" @view="viewStudent" @bind="openBindParent" @homework="openHomeworkTab" @feedback="openFeedback" />
          <ProfileTabFeedbacks v-if="tab === 'feedbacks'" :feedbacks="feedbacks" />
          <ProfileTabAllFeedbacks v-if="tab === 'allfeedbacks'" :isAdmin="isTutor" />
          <ProfileTabHomework v-if="tab === 'homework'" :students="allStudents" :loading="homeworkLoading" @create-homework="createHomework" />

          <div v-if="tab === 'history'" class="card fade-in">
            <h3>История встреч</h3>
            <div class="session-item" v-for="b in pastBookings" :key="b.bid"><strong>{{ b.title }}</strong><small>{{ new Date(b.date).toLocaleString('ru') }}</small></div>
            <p v-if="!pastBookings.length" class="empty-text">Нет истории</p>
          </div>
        </div>
      </div>

      <!-- Модалка задания -->
      <HomeworkModal 
        v-if="selectedHomework"
        :homework="selectedHomework"
        :userRole="user?.role"
        :userId="user?.id"
        @close="selectedHomework = null"
        @submit-answer="submitHomeworkAnswer"
        @submit-grade="submitHomeworkGrade"
        @change-status="changeHomeworkStatus"
      />

      <!-- Остальные модалки -->
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
import ProfileTabAllFeedbacks from '../components/profile/ProfileTabAllFeedbacks.vue';
import ProfileTabSchedule from '../components/profile/ProfileTabSchedule.vue';
import ProfileTabStudents from '../components/profile/ProfileTabStudents.vue';
import ProfileTabWords from '../components/profile/ProfileTabWords.vue';
import ProfileTabNotes from '../components/profile/ProfileTabNotes.vue';
import ProfileTabFeedbacks from '../components/profile/ProfileTabFeedbacks.vue';
import ProfileTabHomework from '../components/profile/ProfileTabHomework.vue';
import ProfileModals from '../components/profile/ProfileModals.vue';
import AchievementUnlock from '../components/AchievementUnlock.vue';
import HomeworkModal from '../components/profile/HomeworkModal.vue';
import { exportProgressPDF } from '../composables/useExportPDF.js';

export default {
  name: 'ProfilePage',
  components: { ConfettiExplosion, ProfileSidebar, ProfileTabAllFeedbacks, ProfileTabInfo, ProfileTabAchievements, ProfileTabSchedule, ProfileTabStudents, ProfileTabWords, ProfileTabNotes, ProfileTabFeedbacks, ProfileTabHomework, ProfileModals, AchievementUnlock, HomeworkModal },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      tab: 'info',
      words: [], wordsLoading: false,
      note: '', allBookings: [],
      allAchievements: [], earnedCount: 0, totalCount: 50, showConfetti: false,
      allHomework: [], myHomework: [], homeworkLoading: false,
      selectedHomework: null,
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
    // ==================== ЗАГРУЗКА ====================
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

    // ==================== СЛОВАРЬ ====================
    async addWord({ en, ru, transcription, part_of_speech, category, example }) {
      this.wordsLoading = true;
      try {
        const res = await axios.post('/api/words', { en, ru, transcription, part_of_speech, category, example });
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
    async updateWordStatus({ id, status, next_review, repeat_count, correct_count, wrong_count }) {
      try {
        await axios.put(`/api/words/${id}`, { status, next_review, repeat_count, correct_count, wrong_count });
        const word = this.words.find(w => w.id === id);
        if (word) {
          if (status) word.status = status;
          if (next_review) word.next_review = next_review;
          if (repeat_count !== undefined) word.repeat_count = repeat_count;
          if (correct_count !== undefined) word.correct_count = correct_count;
          if (wrong_count !== undefined) word.wrong_count = wrong_count;
        }
      } catch(e) { console.error('Ошибка обновления слова:', e); }
    },
    async delWord(id) {
      try {
        await axios.delete(`/api/words/${id}`);
        this.words = this.words.filter(w => w.id !== id);
        this.addToast('Удалено', 'success');
      } catch { this.addToast('Ошибка удаления', 'error'); }
    },

    // ==================== ЗАМЕТКИ ====================
    updateNote(val) { this.note = val; clearTimeout(this._t); this._t = setTimeout(() => axios.put('/api/notes', { note: this.note }).catch(() => {}), 500); },

    // ==================== ДОСТИЖЕНИЯ ====================
    async loadAchievements() {
      try {
        const r = await axios.get('/api/achievements');
        const newData = (r.data || []).map(a => ({ ...a, progressPercent: a.progressPercent || a.progress_percent || (a.earned ? 100 : 0) }));
        const newlyUnlocked = newData.filter(a => { const old = this.allAchievements.find(o => o.code === a.code); return old && !old.earned && a.earned; });
        this.allAchievements = newData;
        this.totalCount = newData.length;
        this.earnedCount = newData.filter(a => a.earned).length;
        if (newlyUnlocked.length > 0 && !this._shown) { this._shown = true; this.newAchievement = newlyUnlocked[0]; this.showConfetti = true; }
      } catch (e) { console.error('Ошибка достижений:', e); }
    },

    // ==================== ФИДБЕКИ ====================
    async loadFeedbacks() { try { this.feedbacks = (await axios.get('/api/feedback/my')).data || []; } catch { this.addToast('Ошибка загрузки', 'error'); } },
    async loadAllFeedbacks() {},
    openFeedback(s) { this.fbStudentId = s.id; this.showFeedback = true; },
    async doAddFeedback(data) { try { await axios.post('/api/feedback', { ...data, student_id: this.fbStudentId }); this.showFeedback = false; this.addToast('Отправлено! 📊', 'success'); } catch { this.addToast('Ошибка', 'error'); } },

    // ==================== ЗАДАНИЯ (ОБНОВЛЁННЫЕ) ====================
    async loadMyHomework() {
      this.homeworkLoading = true;
      try {
        if (this.isTutor) {
          this.allHomework = (await axios.get('/api/homework/all')).data || [];
        } else if (this.isParent) {
          this.allHomework = (await axios.get('/api/homework/children')).data || [];
        } else {
          this.allHomework = (await axios.get('/api/homework/my')).data || [];
        }
      } catch(e) { console.error('Ошибка загрузки заданий:', e); }
      finally { this.homeworkLoading = false; }
    },
    openHomeworkTab(s) { this.hwStudent = s.id; this.tab = 'homework'; },
    async createHomework(data) {
      try {
        await axios.post('/api/homework', data);
        this.addToast('Задание создано! 📝', 'success');
        await this.loadMyHomework();
      } catch(e) { this.addToast(e.response?.data?.error || 'Ошибка', 'error'); }
    },
    async submitHomeworkAnswer({ answer }) {
      try {
        await axios.put(`/api/homework/${this.selectedHomework.id}`, { student_answer: answer, status: 'submitted' });
        this.addToast('Ответ отправлен! 📤', 'success');
        this.selectedHomework = null;
        await this.loadMyHomework();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },
    async submitHomeworkGrade({ grade, comment }) {
      try {
        await axios.put(`/api/homework/${this.selectedHomework.id}`, { grade, teacher_comment: comment, status: 'completed' });
        this.addToast('Оценено! ⭐', 'success');
        this.selectedHomework = null;
        await this.loadMyHomework();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },
    async changeHomeworkStatus({ status }) {
      try {
        await axios.put(`/api/homework/${this.selectedHomework.id}`, { status });
        this.addToast('Статус обновлён! ✅', 'success');
        this.selectedHomework = null;
        await this.loadMyHomework();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },

    // ==================== УЧЕНИКИ И РОДИТЕЛИ ====================
    async loadMyStudents() { try { this.myStudents = (await axios.get('/api/parent/students')).data || []; } catch { this.addToast('Ошибка загрузки', 'error'); } },
    async loadAllStudents() { try { this.allStudents = ((await axios.get('/api/users')).data || []).filter(u => u.role !== 'admin' && u.role !== 'host'); } catch {} },
    async viewStudent(s) { try { this.viewingStudent = (await axios.get(`/api/parent/student/${s.id}`)).data; } catch { this.addToast('Ошибка загрузки', 'error'); } },
    openBindParent(s) { this.bindStudentId = s.id; this.showBindParent = true; },
    async searchParents(q) { try { this.parentResults = ((await axios.get(`/api/users?q=${q}`)).data || []).filter(u => u.role === 'parent'); } catch {} },
    async doBindParent(pid) { 
      try { 
        await axios.post('/api/parent/bind', { student_id: this.bindStudentId, parent_id: pid }); 
        this.showBindParent = false; 
        this.parentSearch = ''; 
        this.addToast('Привязан! ✅', 'success'); 
      } catch(e) { 
        if (e.response?.status === 409) { this.addToast('Эта связь уже существует', 'info'); this.showBindParent = false; }
        else { this.addToast(e.response?.data?.error || 'Ошибка', 'error'); }
      } 
    },

    // ==================== СЛОТЫ ====================
    async loadMySlots() { try { this.mySlots = (await axios.get('/api/slots')).data || []; } catch {} },
    exportMyICS() { window.open('/api/slots/export', '_blank'); },

    // ==================== ПРОЧЕЕ ====================
    async exportPDF() {
      try { const r = await axios.get('/api/achievements'); const stats = { messages: 0, meetings: 0, words: 0, achievements: this.allAchievements.filter(a => a.earned).length }; exportProgressPDF(this.user, stats, r.data || []); } catch { this.addToast('Ошибка', 'error'); }
    },
    async linkTelegram() { try { window.open((await axios.get('/api/tg-link')).data.link, '_blank'); } catch { this.addToast('Ошибка', 'error'); } },
    async uploadAvatar(e) {
      const file = e.target.files[0]; if (!file || file.size > 5*1024*1024) { this.addToast('Файл > 5MB', 'error'); return; }
      try { const form = new FormData(); form.append('img', file); const r = await axios.post('/api/nimg', form); if (r.data.url) { await axios.put('/api/me', { avatar_url: r.data.url }); this.user.avatar_url = r.data.url; this.$emit('update-user', { ...this.user, avatar_url: r.data.url }); this.addToast('Фото обновлено! 📸', 'success'); } } catch { this.addToast('Ошибка загрузки', 'error'); }
    },

    // ==================== ХЕЛПЕРЫ ====================
    typeIcon(type) { const icons = { homework: '📝', test: '🎯', essay: '📄', audio: '🎤' }; return icons[type] || '📝'; },
    statusLabel(status) { const labels = { assigned: 'Назначено', in_progress: 'В работе', submitted: 'На проверке', completed: 'Выполнено' }; return labels[status] || status; },
    isOverdue(h) { return h.due_date && new Date(h.due_date) < new Date() && h.status !== 'completed'; },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'short' }) : ''; }
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

/* ЗАДАНИЯ */
.homework-tab { }
.tab-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 18px; }
.homework-list { display: flex; flex-direction: column; gap: 8px; }
.homework-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; cursor: pointer; transition: all 0.2s; }
.homework-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.3); transform: translateY(-1px); }
.homework-card.overdue { border-left: 3px solid #ef4444; }
.homework-card.completed { opacity: 0.7; border-left: 3px solid #10b981; }
.hw-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.hw-type-icon { font-size: 1.3rem; flex-shrink: 0; }
.hw-info { flex: 1; min-width: 0; }
.hw-title { color: #fff; font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hw-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; font-size: 0.75rem; color: #94a3b8; }
.hw-student { color: #818cf8; }
.hw-due.text-red { color: #ef4444; font-weight: 600; }
.hw-status { padding: 2px 8px; border-radius: 6px; font-weight: 600; }
.hw-status.assigned { background: rgba(251,191,36,0.1); color: #fbbf24; }
.hw-status.in_progress { background: rgba(99,102,241,0.1); color: #818cf8; }
.hw-status.submitted { background: rgba(16,185,129,0.1); color: #10b981; }
.hw-status.completed { background: rgba(16,185,129,0.15); color: #34d399; }
.hw-right { flex-shrink: 0; text-align: right; }
.hw-grade { color: #fbbf24; font-weight: 700; font-size: 0.9rem; }
.hw-xp { color: #94a3b8; font-size: 0.8rem; }

.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 768px) { .profile-page { flex-direction: column; } }
</style>
