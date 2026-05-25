<template>
  <div class="profile-page">
    <!-- Фоновые шары -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>

    <div class="profile-container">
      <!-- Левый сайдбар -->
      <aside class="profile-sidebar glass-card">
        <div class="sidebar-avatar-section">
          <div class="avatar-wrapper" @click="$refs.avatarInput.click()" title="Сменить фото">
            <img 
              :src="user?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.username || 'U')" 
              class="profile-avatar" 
            />
            <div class="avatar-overlay">
              <Camera class="camera-icon" />
            </div>
            <span class="level-badge">{{ user?.level }}</span>
          </div>
          <input type="file" ref="avatarInput" @change="uploadAvatar" accept="image/*" style="display:none" />
          <h3 class="sidebar-username">{{ user?.username }}</h3>
          <div class="sidebar-rating">
            <Trophy class="w-4 h-4" />
            <span>{{ user?.rating }} очков</span>
          </div>
        </div>

        <button class="btn-glass btn-sm w-100" @click="linkTelegram">
          <Send class="w-4 h-4" />
          <span>Привязать Telegram</span>
        </button>

        <nav class="sidebar-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            class="sidebar-btn"
            :class="{ active: currentTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
            <span v-if="tab.key === 'achievements' && newAchievementCount" class="badge-new">
              {{ newAchievementCount }}
            </span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="sidebar-btn" @click="$router.push('/messages')">
            <MessageCircle class="w-4 h-4" />
            <span>Чат</span>
          </button>
          <button class="sidebar-btn" @click="$router.push('/dashboard')">
            <ArrowLeft class="w-4 h-4" />
            <span>Назад</span>
          </button>
        </div>
      </aside>

      <!-- Правая часть: контент вкладок -->
      <main class="profile-main">
        <transition name="fade" mode="out-in">
          <!-- ИНФО -->
          <div v-if="currentTab === 'info'" key="info" class="content-card glass-card">
            <div class="card-header">
              <User class="w-5 h-5" />
              <h3>Информация</h3>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Уровень</span>
                <span class="info-value">{{ user?.level }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Рейтинг</span>
                <span class="info-value gold">{{ user?.rating }}🏆</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">Роль</span>
                <span class="info-value">{{ roleLabel }}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">О себе</span>
                <span class="info-value">{{ user?.bio || 'Не указано' }}</span>
              </div>
            </div>
          </div>

          <!-- ДОСТИЖЕНИЯ -->
          <div v-if="currentTab === 'achievements'" key="achievements" class="content-card glass-card">
            <div class="card-header">
              <Trophy class="w-5 h-5" />
              <h3>Достижения</h3>
            </div>
            <div class="achieve-stats">
              <div class="stat-card glass-card">
                <span class="stat-value gradient-text">{{ earnedCount }}</span>
                <span class="stat-label">Получено</span>
              </div>
              <div class="stat-card glass-card">
                <span class="stat-value gradient-text">{{ totalCount }}</span>
                <span class="stat-label">Всего</span>
              </div>
              <div class="stat-card glass-card">
                <span class="stat-value gradient-text">{{ completionPercent }}%</span>
                <span class="stat-label">Выполнено</span>
              </div>
            </div>
            <div class="achievements-grid">
              <div 
                v-for="ach in allAchievements" 
                :key="ach.code" 
                class="achieve-card glass-card"
                :class="{ earned: ach.earned, locked: !ach.earned }"
                @click="selectedAchievement = ach"
              >
                <div class="achieve-icon-wrap">
                  <span class="achieve-icon">{{ ach.icon }}</span>
                  <Lock v-if="!ach.earned" class="lock-icon" />
                  <CheckCircle v-else class="check-icon" />
                </div>
                <span class="achieve-name">{{ ach.name }}</span>
                <div v-if="!ach.earned" class="progress-bar">
                  <div class="progress-fill" :style="{ width: ach.progressPercent + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- РАСПИСАНИЕ -->
          <div v-if="currentTab === 'myschedule'" key="myschedule" class="content-card glass-card">
            <div class="card-header">
              <Calendar class="w-5 h-5" />
              <h3>Моё расписание</h3>
            </div>
            <button class="btn-glass btn-sm mb-3" @click="exportMyICS">
              <Download class="w-4 h-4" />
              <span>Экспорт в календарь</span>
            </button>
            
            <h4 class="subsection-title">🟢 Предстоящие</h4>
            <div class="schedule-list">
              <div v-for="s in myUpcomingSlots" :key="s.id" class="schedule-item glass-card">
                <div class="schedule-left">
                  <span class="schedule-type">{{ s.lesson_type === 'online' ? '🟢' : '🔵' }}</span>
                  <div>
                    <strong>{{ s.title }}</strong>
                    <small>{{ formatDate(s.start_time) }} · {{ formatTime(s.start_time) }} — {{ formatTime(s.end_time) }}</small>
                  </div>
                </div>
                <div class="schedule-right">
                  <a v-if="s.meeting_link" :href="s.meeting_link" target="_blank" class="btn-glass btn-sm">
                    <Video class="w-4 h-4" />
                    <span>Подключиться</span>
                  </a>
                </div>
              </div>
              <p v-if="!myUpcomingSlots.length" class="empty-text">Нет предстоящих занятий</p>
            </div>

            <h4 class="subsection-title">⚫ Прошедшие</h4>
            <div class="schedule-list">
              <div v-for="s in myPastSlots" :key="s.id" class="schedule-item glass-card past">
                <div class="schedule-left">
                  <span class="schedule-type">{{ s.lesson_type === 'online' ? '🟢' : '🔵' }}</span>
                  <div>
                    <strong>{{ s.title }}</strong>
                    <small>{{ formatDate(s.start_time) }} · {{ formatTime(s.start_time) }}</small>
                  </div>
                </div>
                <span class="status-done">
                  <CheckCircle class="w-4 h-4" />
                </span>
              </div>
              <p v-if="!myPastSlots.length" class="empty-text">Нет прошедших занятий</p>
            </div>
          </div>

          <!-- СЛОВАРЬ -->
          <div v-if="currentTab === 'words'" key="words" class="content-card glass-card">
            <div class="card-header">
              <BookOpen class="w-5 h-5" />
              <h3>Словарь</h3>
            </div>
            <div class="add-word-row">
              <input class="glass-input" v-model="wordEn" placeholder="Слово" />
              <input class="glass-input" v-model="wordRu" placeholder="Перевод" />
              <button class="btn-gradient btn-sm" @click="addWord">
                <Plus class="w-4 h-4" />
              </button>
            </div>
            <div v-for="w in words" :key="w.id" class="word-card glass-card">
              <span><strong>{{ w.en }}</strong> — {{ w.ru }}</span>
              <button class="btn-delete" @click="delWord(w.id)">
                <X class="w-4 h-4" />
              </button>
            </div>
            <p v-if="!words.length" class="empty-text">Словарь пуст</p>
          </div>

          <!-- БЛОКНОТ -->
          <div v-if="currentTab === 'notes'" key="notes" class="content-card glass-card">
            <div class="card-header">
              <StickyNote class="w-5 h-5" />
              <h3>Блокнот</h3>
            </div>
            <textarea 
              class="glass-textarea" 
              v-model="note" 
              rows="8" 
              placeholder="Пишите заметки здесь..."
              @input="saveNote"
            ></textarea>
          </div>

          <!-- ЗАДАНИЯ -->
          <div v-if="currentTab === 'myhomework'" key="myhomework" class="content-card glass-card">
            <div class="card-header">
              <Bell class="w-5 h-5" />
              <h3>Мои задания</h3>
            </div>
            <div v-for="h in myHomework" :key="h.id" class="homework-item glass-card" :class="{ done: h.status === 'completed' }">
              <span class="homework-status">{{ h.status === 'completed' ? '✅' : '📝' }}</span>
              <strong>{{ h.title }}</strong>
            </div>
            <p v-if="!myHomework.length" class="empty-text">Нет заданий</p>
          </div>

          <!-- ИСТОРИЯ -->
          <div v-if="currentTab === 'history'" key="history" class="content-card glass-card">
            <div class="card-header">
              <History class="w-5 h-5" />
              <h3>История встреч</h3>
            </div>
            <div v-for="b in pastBookings" :key="b.bid" class="history-item glass-card">
              <strong>{{ b.title }}</strong>
              <small>{{ formatDate(b.date) }}</small>
            </div>
            <p v-if="!pastBookings.length" class="empty-text">Нет истории</p>
          </div>

          <!-- УЧЕНИКИ (для репетитора) -->
          <div v-if="currentTab === 'students'" key="students" class="content-card glass-card">
            <div class="card-header">
              <Users class="w-5 h-5" />
              <h3>Ученики ({{ allStudents.length }})</h3>
            </div>
            <div v-for="s in allStudents" :key="s.id" class="student-card glass-card" @click="viewStudent(s)">
              <img :src="s.avatar_url || 'https://ui-avatars.com/api/?name='+s.username" class="student-avatar" />
              <div class="student-info">
                <strong>{{ s.username }}</strong>
                <small>{{ s.level }} · {{ s.rating }}🏆</small>
              </div>
              <div class="student-actions">
                <button class="btn-glass btn-sm" @click.stop="bindParent(s)">👨‍👩‍👧</button>
                <button class="btn-glass btn-sm" @click.stop="addHomework(s)">📝</button>
                <button class="btn-glass btn-sm" @click.stop="addFeedback(s)">📊</button>
              </div>
            </div>
            <p v-if="!allStudents.length" class="empty-text">Нет учеников</p>
          </div>
        </transition>
      </main>
    </div>

    <!-- Модалка достижения -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="selectedAchievement" class="modal-overlay" @click.self="selectedAchievement = null">
          <div class="modal-content glass-card">
            <div class="modal-header">
              <h3>{{ selectedAchievement.name }}</h3>
              <button class="btn-icon" @click="selectedAchievement = null">
                <X class="w-5 h-5" />
              </button>
            </div>
            <div class="modal-body">
              <span class="modal-icon">{{ selectedAchievement.icon }}</span>
              <p class="modal-text">{{ selectedAchievement.description }}</p>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Конфетти -->
    <ConfettiExplosion :active="showConfetti" />
  </div>
</template>

<script>
import axios from 'axios';
import ConfettiExplosion from '../components/ConfettiExplosion.vue';
import { 
  User, Trophy, BookOpen, StickyNote, Bell, History, Camera, Send,
  MessageCircle, ArrowLeft, Lock, CheckCircle, Calendar, Download,
  Video, Plus, X, Users
} from 'lucide-vue-next';

export default {
  name: 'ProfilePage',
  components: { ConfettiExplosion, User, Trophy, BookOpen, StickyNote, Bell, History, Camera, Send, MessageCircle, ArrowLeft, Lock, CheckCircle, Calendar, Download, Video, Plus, X, Users },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      currentTab: 'info',
      words: [], wordEn: '', wordRu: '', note: '', allBookings: [], tgLink: null,
      allAchievements: [], selectedAchievement: null, earnedCount: 0, totalCount: 30,
      newAchievementCount: 0, showConfetti: false,
      myHomework: [], myStudents: [], allStudents: [], viewingStudent: null,
      mySlots: [], showBindParent: false, bindStudentId: null,
      parentSearch: '', parentResults: [], showFeedback: false,
      fbStudentId: null, fbRating: 3, fbTopic: '', fbGood: '', fbImprove: '',
      hwStudent: '', hwTitle: '', hwDesc: '', hwDueDate: '',
      tabs: [
        { key: 'info', label: 'Инфо', icon: User },
        { key: 'achievements', label: 'Достижения', icon: Trophy },
        { key: 'myschedule', label: 'Расписание', icon: Calendar },
        { key: 'words', label: 'Словарь', icon: BookOpen },
        { key: 'notes', label: 'Блокнот', icon: StickyNote },
        { key: 'myhomework', label: 'Задания', icon: Bell },
        { key: 'history', label: 'История', icon: History },
        { key: 'students', label: 'Ученики', icon: Users },
      ],
    };
  },
  computed: {
    isStudent() { return !this.user?.role || this.user.role === 'user' || this.user.role === 'student'; },
    isParent() { return this.user?.role === 'parent'; },
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; },
    roleLabel() { if (this.isParent) return 'Родитель'; if (this.isTutor) return 'Репетитор'; return 'Ученик'; },
    pastBookings() { return this.allBookings.filter(b => b.status === 'attended' || new Date(b.date) < new Date()); },
    completionPercent() { return this.totalCount > 0 ? Math.round((this.earnedCount / this.totalCount) * 100) : 0; },
    myUpcomingSlots() { return this.mySlots.filter(s => new Date(s.start_time) >= new Date()); },
    myPastSlots() { return this.mySlots.filter(s => new Date(s.start_time) < new Date()); }
  },
  async mounted() {
    try {
      const [w, n, b] = await Promise.all([axios.get('/api/words'), axios.get('/api/notes'), axios.get('/api/myb')]);
      this.words = w.data; this.note = n.data.note || ''; this.allBookings = b.data;
    } catch(e) {}
    this.loadAchievements();
    if (this.isTutor) this.loadAllStudents();
  },
  methods: {
    switchTab(key) {
      this.currentTab = key;
      if (key === 'achievements') this.loadAchievements();
      if (key === 'myschedule') this.loadMySlots();
      if (key === 'myhomework') this.loadMyHomework();
      if (key === 'students') this.loadAllStudents();
      if (key === 'children') this.loadMyStudents();
    },
    formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' }) : ''; },
    async loadAchievements() { try { const achR = await axios.get('/api/achievements'); this.allAchievements = (achR.data || []).map(a => ({ ...a, progressPercent: a.progress_percent || (a.earned ? 100 : 0) })); this.earnedCount = this.allAchievements.filter(a => a.earned).length; } catch(e) {} },
    async loadMyHomework() { try { const r = await axios.get('/api/homework/my'); this.myHomework = r.data || []; } catch(e) {} },
    async loadMyStudents() { try { const r = await axios.get('/api/parent/students'); this.myStudents = r.data || []; } catch(e) {} },
    async loadAllStudents() { try { const r = await axios.get('/api/users'); this.allStudents = (r.data || []).filter(u => u.role !== 'admin'); } catch(e) {} },
    async loadMySlots() { try { const r = await axios.get('/api/slots'); this.mySlots = r.data || []; } catch(e) {} },
    async viewStudent(s) { try { const r = await axios.get(`/api/parent/student/${s.id}`); this.viewingStudent = r.data; } catch(e) {} },
    bindParent(s) { this.bindStudentId = s.id; this.showBindParent = true; },
    async searchParents() { try { const r = await axios.get(`/api/users?q=${this.parentSearch || ''}`); this.parentResults = r.data || []; } catch(e) {} },
    async doBindParent(pid) { try { await axios.post('/api/parent/bind', { student_id: this.bindStudentId, parent_id: pid }); this.showBindParent = false; this.addToast('Привязан!', 'success'); } catch(e) {} },
    addHomework(s) { this.hwStudent = s.id; this.currentTab = 'homework'; },
    async createHomework() { if (!this.hwStudent || !this.hwTitle) return; try { await axios.post('/api/homework', { student_id: this.hwStudent, title: this.hwTitle, description: this.hwDesc, due_date: this.hwDueDate }); this.hwTitle = ''; this.hwDesc = ''; this.addToast('Создано! 📝', 'success'); } catch(e) {} },
    addFeedback(s) { this.fbStudentId = s.id; this.showFeedback = true; },
    async doAddFeedback() { try { await axios.post('/api/feedback', { student_id: this.fbStudentId, rating: this.fbRating, topic: this.fbTopic, good: this.fbGood, improve: this.fbImprove }); this.showFeedback = false; this.addToast('Отправлено! 📊', 'success'); } catch(e) {} },
    async linkTelegram() { const r = await axios.get('/api/tg-link'); this.tgLink = r.data.link; },
    async addWord() { if (!this.wordEn || !this.wordRu) return; await axios.post('/api/words', { en: this.wordEn, ru: this.wordRu }); this.wordEn = ''; this.wordRu = ''; this.words = (await axios.get('/api/words')).data; },
    async delWord(id) { await axios.delete(`/api/words/${id}`); this.words = (await axios.get('/api/words')).data; },
    async saveNote() { clearTimeout(this._t); this._t = setTimeout(async () => { await axios.put('/api/notes', { note: this.note }); }, 500); },
    async uploadAvatar(e) { const file = e.target.files[0]; if (!file) return; const form = new FormData(); form.append('img', file); try { const r = await axios.post('/api/nimg', form); if (r.data.url) { await axios.put('/api/me', { avatar_url: r.data.url }); this.$emit('update-user', { ...this.user, avatar_url: r.data.url }); this.addToast('Фото обновлено! 📸', 'success'); } } catch(e) {} },
    exportMyICS() { window.open('/api/slots/export', '_blank'); }
  }
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #0b1120;
  position: relative;
  overflow: hidden;
}

.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.2;
  pointer-events: none;
}

.bg-orb-1 {
  width: 600px;
  height: 600px;
  background: #6366f1;
  top: -200px;
  left: -200px;
  animation: floatOrb1 15s ease-in-out infinite;
}

.bg-orb-2 {
  width: 500px;
  height: 500px;
  background: #2dd4bf;
  bottom: -200px;
  right: -200px;
  animation: floatOrb2 15s ease-in-out infinite;
}

@keyframes floatOrb1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -30px) scale(1.05); }
}

@keyframes floatOrb2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 20px) scale(1.05); }
}

.profile-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  gap: 28px;
  position: relative;
  z-index: 1;
}

/* Стеклянная карточка */
.glass-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
}

/* Сайдбар */
.profile-sidebar {
  width: 280px;
  flex-shrink: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-avatar-section {
  text-align: center;
  padding-bottom: 16px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  padding: 3px;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  border-radius: 50%;
  margin-bottom: 12px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #0b1120;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.camera-icon {
  width: 24px;
  height: 24px;
  color: #fff;
}

.level-badge {
  position: absolute;
  bottom: 0;
  right: -4px;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  color: #fff;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
}

.sidebar-username {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
}

.sidebar-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #f59e0b;
  font-weight: 600;
  font-size: 0.9rem;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.sidebar-btn:hover {
  background: rgba(255,255,255,0.05);
  color: #cbd5e1;
}

.sidebar-btn.active {
  background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1));
  color: #fff;
  border: 1px solid rgba(99,102,241,0.3);
}

.badge-new {
  margin-left: auto;
  background: #ef4444;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.sidebar-footer {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 8px;
}

/* Кнопки */
.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 50px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-glass:hover {
  background: rgba(255,255,255,0.1);
  box-shadow: 0 0 15px rgba(99,102,241,0.2);
}

.btn-gradient {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 50px;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  border: none;
}

.btn-sm { padding: 7px 14px; font-size: 0.8rem; }
.w-100 { width: 100%; justify-content: center; }

/* Контент */
.profile-main {
  flex: 1;
  min-width: 0;
}

.content-card {
  padding: 28px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  color: #fff;
}

.card-header h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
}

/* Инфо */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: #cbd5e1;
}

.info-value.gold {
  color: #f59e0b;
}

/* Достижения */
.achieve-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  padding: 16px;
  text-align: center;
}

.stat-value {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2rem;
  font-weight: 800;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 0.8rem;
  color: #94a3b8;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.achieve-card {
  padding: 16px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.achieve-card.earned {
  border-color: rgba(16,185,129,0.3);
  box-shadow: 0 0 10px rgba(16,185,129,0.1);
}

.achieve-card.locked {
  opacity: 0.6;
}

.achieve-card:hover {
  transform: translateY(-4px) scale(1.02);
}

.achieve-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 6px;
}

.achieve-name {
  font-size: 0.75rem;
  color: #cbd5e1;
  font-weight: 500;
}

.progress-bar {
  height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #2dd4bf);
  border-radius: 2px;
}

/* Расписание */
.subsection-title {
  color: #fff;
  margin: 24px 0 12px;
  font-weight: 600;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-item {
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-item.past {
  opacity: 0.5;
}

.schedule-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.schedule-left strong {
  display: block;
  color: #fff;
  font-size: 0.9rem;
}

.schedule-left small {
  color: #94a3b8;
  font-size: 0.8rem;
}

/* Словарь */
.add-word-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.glass-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: all 0.3s;
}

.glass-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 10px rgba(99,102,241,0.2);
}

.glass-input::placeholder {
  color: #64748b;
}

.word-card {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  color: #cbd5e1;
}

.btn-delete {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
}

/* Блокнот */
.glass-textarea {
  width: 100%;
  padding: 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  resize: vertical;
  outline: none;
}

.glass-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 10px rgba(99,102,241,0.2);
}

.glass-textarea::placeholder {
  color: #64748b;
}

/* История */
.history-item {
  padding: 14px 18px;
  margin-bottom: 8px;
}

.history-item strong {
  display: block;
  color: #fff;
}

.history-item small {
  color: #94a3b8;
}

/* Задания */
.homework-item {
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #cbd5e1;
}

.homework-item.done {
  opacity: 0.6;
}

/* Ученики */
.student-card {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  cursor: pointer;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.student-info {
  flex: 1;
}

.student-info strong {
  display: block;
  color: #fff;
  font-size: 0.9rem;
}

.student-info small {
  color: #94a3b8;
}

.student-actions {
  display: flex;
  gap: 6px;
}

/* Пустой текст */
.empty-text {
  text-align: center;
  color: #64748b;
  padding: 30px;
}

/* Модалка */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  max-width: 400px;
  width: 90%;
  padding: 28px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: #fff;
}

.btn-icon {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  text-align: center;
}

.modal-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.modal-text {
  color: #94a3b8;
}

/* Анимации */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: all 0.3s ease;
}

.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Адаптив */
@media (max-width: 768px) {
  .profile-container {
    flex-direction: column;
  }
  .profile-sidebar {
    width: 100%;
  }
}
</style>
