<template>
  <div class="profile-page-wrapper">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>

    <div class="container">
      <div class="profile-page">
        <!-- Сайдбар -->
        <div class="profile-sidebar">
          <div class="profile-avatar-section">
            <div class="avatar-wrapper" @click="$refs.avatarInput.click()" title="Сменить фото">
              <img :src="user?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.username || 'U')" class="profile-avatar">
              <span class="level-badge">{{ user?.level }}</span>
              <div class="avatar-overlay"><i class="fas fa-camera"></i></div>
            </div>
            <input type="file" ref="avatarInput" @change="uploadAvatar" accept="image/*" style="display:none">
            <h3>{{ user?.username }}</h3>
            <span class="profile-rating">{{ user?.rating }}🏆</span>
          </div>
          <button class="btn btn-p btn-sm w-100" @click="linkTelegram"><i class="fab fa-telegram"></i> Telegram</button>
          <nav class="sidebar-nav">
            <button class="sidebar-btn" :class="{ active: tab === 'info' }" @click="tab = 'info'"><i class="fas fa-user"></i> Инфо</button>
            <button class="sidebar-btn" :class="{ active: tab === 'achievements' }" @click="tab = 'achievements'; loadAchievements()"><i class="fas fa-trophy"></i> Достижения</button>
            <button class="sidebar-btn" :class="{ active: tab === 'myschedule' }" @click="tab = 'myschedule'; loadMySlots()"><i class="fas fa-calendar-check"></i> Расписание</button>
            <template v-if="isStudent">
              <button class="sidebar-btn" :class="{ active: tab === 'words' }" @click="tab = 'words'"><i class="fas fa-book"></i> Словарь</button>
              <button class="sidebar-btn" :class="{ active: tab === 'notes' }" @click="tab = 'notes'"><i class="fas fa-sticky-note"></i> Блокнот</button>
              <button class="sidebar-btn" :class="{ active: tab === 'myhomework' }" @click="tab = 'myhomework'; loadMyHomework()"><i class="fas fa-tasks"></i> Задания</button>
            </template>
            <template v-if="isParent">
              <button class="sidebar-btn" :class="{ active: tab === 'children' }" @click="tab = 'children'; loadMyStudents()"><i class="fas fa-child"></i> Мои дети</button>
            </template>
            <template v-if="isTutor">
              <button class="sidebar-btn" :class="{ active: tab === 'students' }" @click="tab = 'students'; loadAllStudents()"><i class="fas fa-users"></i> Ученики</button>
              <button class="sidebar-btn" :class="{ active: tab === 'homework' }" @click="tab = 'homework'"><i class="fas fa-tasks"></i> Задания</button>
            </template>
            <button class="sidebar-btn" :class="{ active: tab === 'history' }" @click="tab = 'history'"><i class="fas fa-history"></i> История</button>
          </nav>
          <div class="sidebar-footer">
            <button class="sidebar-btn" @click="$router.push('/messages')"><i class="fas fa-comments"></i> Чат</button>
            <button class="sidebar-btn" @click="$router.push('/dashboard')"><i class="fas fa-arrow-left"></i> Назад</button>
          </div>
        </div>

        <!-- Контент -->
        <div class="profile-main">
          <!-- Инфо -->
          <div v-if="tab === 'info'" class="card fade-in">
            <h3>Информация</h3>
            <div class="info-grid">
              <div class="info-item"><strong>Уровень</strong><span>{{ user?.level }}</span></div>
              <div class="info-item"><strong>Рейтинг</strong><span>{{ user?.rating }}🏆</span></div>
              <div class="info-item full-width"><strong>Роль</strong><span>{{ roleLabel }}</span></div>
              <div class="info-item full-width"><strong>О себе</strong><span>{{ user?.bio || 'Не указано' }}</span></div>
            </div>
          </div>

          <!-- Достижения -->
          <div v-if="tab === 'achievements'" class="card fade-in">
            <h3>Достижения</h3>
            <div class="achieve-stats">
              <div class="achieve-stat"><span class="achieve-stat-value">{{ earnedCount }}</span><span class="achieve-stat-label">Получено</span></div>
              <div class="achieve-stat"><span class="achieve-stat-value">{{ totalCount }}</span><span class="achieve-stat-label">Всего</span></div>
              <div class="achieve-stat"><span class="achieve-stat-value">{{ completionPercent }}%</span><span class="achieve-stat-label">Выполнено</span></div>
            </div>
            <div class="achievements-grid">
              <div v-for="ach in allAchievements" :key="ach.code" class="achieve-badge-card" :class="{ earned: ach.earned, locked: !ach.earned }" @click="selectedAchievement = ach">
                <div class="achieve-icon-wrap"><span class="achieve-icon">{{ ach.icon }}</span><div v-if="!ach.earned" class="achieve-lock">🔒</div><div v-else class="achieve-check">✅</div></div>
                <div class="achieve-name">{{ ach.name }}</div>
                <div class="achieve-progress-mini" v-if="!ach.earned"><div class="achieve-progress-mini-fill" :style="{ width: ach.progressPercent + '%' }"></div></div>
              </div>
            </div>
          </div>

          <!-- Расписание -->
          <div v-if="tab === 'myschedule'" class="card fade-in">
            <h3>📅 Моё расписание</h3>
            <button class="btn btn-o btn-sm mb-3" @click="exportMyICS">📅 Экспорт в календарь</button>
            <h4 style="margin-bottom:12px">🟢 Предстоящие</h4>
            <div class="schedule-list">
              <div class="schedule-list-item" v-for="s in myUpcomingSlots" :key="s.id" :class="getSlotColorClass(s.lesson_type)">
                <div class="schedule-list-left">
                  <span class="schedule-list-type">{{ s.lesson_type === 'online' ? '🟢' : '🔵' }}</span>
                  <div><strong>{{ s.title }}</strong><small>{{ new Date(s.start_time).toLocaleDateString('ru') }} · {{ formatSlotTime(s.start_time) }} — {{ formatSlotTime(s.end_time) }}</small></div>
                </div>
                <div class="schedule-list-right">
                  <span v-if="isParent">{{ s.users?.username || '—' }}</span>
                  <a v-if="s.meeting_link" :href="s.meeting_link" target="_blank" class="btn btn-p btn-sm">📹</a>
                </div>
              </div>
              <p v-if="!myUpcomingSlots.length" class="empty-text">Нет предстоящих занятий</p>
            </div>
            <h4 style="margin:24px 0 12px">⚫ Прошедшие</h4>
            <div class="schedule-list">
              <div class="schedule-list-item past" v-for="s in myPastSlots" :key="s.id">
                <div class="schedule-list-left">
                  <span class="schedule-list-type">{{ s.lesson_type === 'online' ? '🟢' : '🔵' }}</span>
                  <div><strong>{{ s.title }}</strong><small>{{ new Date(s.start_time).toLocaleDateString('ru') }} · {{ formatSlotTime(s.start_time) }}</small></div>
                </div>
                <div class="schedule-list-right">
                  <span v-if="isParent">{{ s.users?.username || '—' }}</span>
                  <span class="schedule-list-status">✅</span>
                </div>
              </div>
              <p v-if="!myPastSlots.length" class="empty-text">Нет прошедших занятий</p>
            </div>
          </div>

          <!-- Словарь -->
          <div v-if="tab === 'words'" class="card fade-in"><h3>Словарь</h3><div class="add-word-row"><input class="input" v-model="wordEn" placeholder="Слово"><input class="input" v-model="wordRu" placeholder="Перевод"><button class="btn btn-p btn-sm" @click="addWord">+</button></div><div class="word-card" v-for="w in words" :key="w.id"><span><strong>{{ w.en }}</strong> — {{ w.ru }}</span><button class="remove-btn" @click="delWord(w.id)">✕</button></div><p v-if="!words.length" class="empty-text">Словарь пуст</p></div>

          <!-- Блокнот -->
          <div v-if="tab === 'notes'" class="card fade-in"><h3>Блокнот</h3><textarea class="input note-area" v-model="note" rows="8" @input="saveNote"></textarea></div>

          <!-- Задания ученика -->
          <div v-if="tab === 'myhomework'" class="card fade-in"><h3>Мои задания</h3><div class="homework-widget" v-for="h in myHomework" :key="h.id" :class="{ done: h.status === 'completed' }"><div class="homework-widget-header"><span class="homework-widget-icon">{{ h.status === 'completed' ? '✅' : '📝' }}</span><strong>{{ h.title }}</strong></div></div><p v-if="!myHomework.length" class="empty-text">Нет заданий</p></div>

          <!-- Дети -->
          <div v-if="tab === 'children'" class="card fade-in"><h3>Мои дети</h3><div class="student-card" v-for="s in myStudents" :key="s.id" @click="viewStudent(s)"><img :src="s.avatar_url || 'https://ui-avatars.com/api/?name='+s.username" class="student-avatar"><div class="student-info"><strong>{{ s.username }}</strong><small>{{ s.level }} · {{ s.rating }}🏆 · 🔥{{ s.streak }} дн.</small></div><i class="fas fa-chevron-right"></i></div><p v-if="!myStudents.length" class="empty-text">Нет детей</p></div>

          <!-- Ученики -->
          <div v-if="tab === 'students'" class="card fade-in"><h3>Ученики ({{ allStudents.length }})</h3><div class="student-card" v-for="s in allStudents" :key="s.id" @click="viewStudent(s)"><img :src="s.avatar_url || 'https://ui-avatars.com/api/?name='+s.username" class="student-avatar"><div class="student-info"><strong>{{ s.username }}</strong><small>{{ s.level }} · {{ s.rating }}🏆</small></div><div class="student-actions"><button class="btn btn-o btn-sm" @click.stop="bindParent(s)">👨‍👩‍👧</button><button class="btn btn-o btn-sm" @click.stop="addHomework(s)">📝</button><button class="btn btn-o btn-sm" @click.stop="addFeedback(s)">📊</button></div></div><p v-if="!allStudents.length" class="empty-text">Нет учеников</p></div>

          <!-- Задания репетитора -->
          <div v-if="tab === 'homework'" class="card fade-in"><h3>Создать задание</h3><select class="input" v-model="hwStudent"><option value="">Выберите ученика</option><option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.username }}</option></select><input class="input" v-model="hwTitle" placeholder="Название"><textarea class="input note-area" v-model="hwDesc" rows="3" placeholder="Описание"></textarea><input class="input" v-model="hwDueDate" type="date"><button class="btn btn-p btn-sm w-100" @click="createHomework">Создать</button></div>

          <!-- История -->
          <div v-if="tab === 'history'" class="card fade-in"><h3>История встреч</h3><div class="session-item" v-for="b in pastBookings" :key="b.bid"><strong>{{ b.title }}</strong><small>{{ new Date(b.date).toLocaleString('ru') }}</small></div><p v-if="!pastBookings.length" class="empty-text">Нет истории</p></div>
        </div>
      </div>

      <!-- Модалки -->
      <div class="modal-overlay" v-if="viewingStudent" @click.self="viewingStudent = null"><div class="modal" style="max-width:500px"><h3>{{ viewingStudent.username }}</h3><div class="info-grid"><div class="info-item"><strong>Уровень</strong><span>{{ viewingStudent.level }}</span></div><div class="info-item"><strong>Рейтинг</strong><span>{{ viewingStudent.rating }}🏆</span></div></div><button class="btn btn-o w-100 mt-2" @click="viewingStudent = null">Закрыть</button></div></div>
      <div class="modal-overlay" v-if="showBindParent" @click.self="showBindParent = false"><div class="modal" style="max-width:400px"><h3>Привязать родителя</h3><input class="input" v-model="parentSearch" @input="searchParents"><div v-for="p in parentResults" :key="p.id" class="student-card" @click="doBindParent(p.id)"><strong>{{ p.username }}</strong></div><button class="btn btn-o w-100 mt-2" @click="showBindParent = false">Закрыть</button></div></div>
      <div class="modal-overlay" v-if="showFeedback" @click.self="showFeedback = false"><div class="modal" style="max-width:400px"><h3>Фидбек</h3><select class="input" v-model="fbRating"><option v-for="n in 5" :key="n" :value="n">{{ '⭐'.repeat(n) }}</option></select><input class="input" v-model="fbTopic" placeholder="Тема"><textarea class="input note-area" v-model="fbGood" rows="2" placeholder="Хорошо"></textarea><textarea class="input note-area" v-model="fbImprove" rows="2" placeholder="Улучшить"></textarea><button class="btn btn-p w-100" @click="doAddFeedback">Отправить</button><button class="btn btn-o w-100 mt-2" @click="showFeedback = false">Закрыть</button></div></div>
      <ConfettiExplosion :active="showConfetti" />
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ConfettiExplosion from '../components/ConfettiExplosion.vue';

export default {
  name: 'ProfilePage',
  components: { ConfettiExplosion },
  props: ['user'],
  inject: ['addToast'],
  data() { return { tab: 'info', words: [], wordEn: '', wordRu: '', note: '', allBookings: [], tgLink: null, allAchievements: [], selectedAchievement: null, earnedCount: 0, totalCount: 30, newAchievementCount: 0, showConfetti: false, myHomework: [], myStudents: [], allStudents: [], viewingStudent: null, mySlots: [], showBindParent: false, bindStudentId: null, parentSearch: '', parentResults: [], showFeedback: false, fbStudentId: null, fbRating: 3, fbTopic: '', fbGood: '', fbImprove: '', hwStudent: '', hwTitle: '', hwDesc: '', hwDueDate: '' }; },
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
  async mounted() { try { const [w, n, b] = await Promise.all([axios.get('/api/words'), axios.get('/api/notes'), axios.get('/api/myb')]); this.words = w.data; this.note = n.data.note || ''; this.allBookings = b.data; } catch(e) {} this.loadAchievements(); },
  methods: {
    formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    formatSlotTime(ts) { return ts ? new Date(ts).toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' }) : ''; },
    getSlotColorClass(type) { return type === 'online' ? 'slot-online' : 'slot-offline'; },
    async loadAchievements() { try { const achR = await axios.get('/api/achievements'); this.allAchievements = (achR.data || []).map(a => ({ ...a, progressPercent: a.progress_percent || (a.earned ? 100 : 0) })); this.earnedCount = this.allAchievements.filter(a => a.earned).length; } catch(e) {} },
    async loadMyHomework() { try { const r = await axios.get('/api/homework/my'); this.myHomework = r.data || []; } catch(e) {} },
    async loadMyStudents() { try { const r = await axios.get('/api/parent/students'); this.myStudents = r.data || []; } catch(e) {} },
    async loadAllStudents() { try { const r = await axios.get('/api/users'); this.allStudents = (r.data || []).filter(u => u.role !== 'admin'); } catch(e) {} },
    async loadMySlots() { try { const r = await axios.get('/api/slots'); this.mySlots = r.data || []; } catch(e) {} },
    async viewStudent(s) { try { const r = await axios.get(`/api/parent/student/${s.id}`); this.viewingStudent = r.data; } catch(e) {} },
    bindParent(s) { this.bindStudentId = s.id; this.showBindParent = true; },
    async searchParents() { try { const r = await axios.get(`/api/users?q=${this.parentSearch || ''}`); this.parentResults = r.data || []; } catch(e) {} },
    async doBindParent(pid) { try { await axios.post('/api/parent/bind', { student_id: this.bindStudentId, parent_id: pid }); this.showBindParent = false; this.addToast('Привязан!', 'success'); } catch(e) {} },
    addHomework(s) { this.hwStudent = s.id; this.tab = 'homework'; },
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
.profile-page-wrapper {
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
  width: 600px; height: 600px; background: #6366f1;
  top: -200px; left: -200px;
  animation: floatOrb1 15s ease-in-out infinite;
}

.bg-orb-2 {
  width: 500px; height: 500px; background: #2dd4bf;
  bottom: -200px; right: -200px;
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

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
  position: relative;
  z-index: 1;
}

.profile-page {
  display: flex;
  gap: 28px;
}

/* Сайдбар */
.profile-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-avatar-section {
  text-align: center;
  padding: 20px 0;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  padding: 3px;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  border-radius: 50%;
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
  opacity: 0;
  color: #fff;
  font-size: 1.5rem;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.level-badge {
  position: absolute;
  bottom: 0;
  right: -4px;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  color: #fff;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
}

.profile-rating {
  color: #f59e0b;
  font-weight: 700;
}

h3 {
  color: #fff;
  font-family: 'Space Grotesk', sans-serif;
}

.sidebar-nav {
  flex: 1;
}

.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-radius: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  color: #94a3b8;
  width: 100%;
  text-align: left;
  transition: all 0.2s;
}

.sidebar-btn:hover, .sidebar-btn.active {
  background: rgba(99,102,241,0.15);
  color: #fff;
}

.sidebar-footer {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 8px;
}

/* Контент */
.profile-main {
  flex: 1;
  min-width: 0;
}

.card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 22px;
  padding: 28px;
  margin-bottom: 18px;
  color: #cbd5e1;
}

.card h3 {
  font-weight: 700;
  margin-bottom: 18px;
  color: #fff;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item strong {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.info-item span {
  font-size: 1rem;
  font-weight: 500;
  color: #e2e8f0;
}

.full-width {
  grid-column: 1 / -1;
}

/* Достижения */
.achieve-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.achieve-stat {
  text-align: center;
  flex: 1;
}

.achieve-stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.achieve-stat-label {
  font-size: 0.8rem;
  color: #94a3b8;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}

.achieve-badge-card {
  background: rgba(255,255,255,0.03);
  border-radius: 20px;
  padding: 20px 14px;
  text-align: center;
  cursor: pointer;
  border: 2px solid rgba(255,255,255,0.06);
  transition: all 0.3s;
}

.achieve-badge-card.earned {
  border-color: rgba(16,185,129,0.5);
}

.achieve-icon {
  font-size: 2.5rem;
  display: block;
}

.achieve-name {
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 4px;
  color: #cbd5e1;
}

.achieve-progress-mini {
  height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  margin-top: 10px;
  overflow: hidden;
}

.achieve-progress-mini-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #2dd4bf);
  border-radius: 2px;
  max-width: 100%;
}

/* Расписание */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
  border-left: 4px solid;
}

.schedule-list-item.slot-online {
  border-color: #10b981;
}

.schedule-list-item.slot-offline {
  border-color: #6366f1;
}

.schedule-list-item.past {
  opacity: 0.5;
}

.schedule-list-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.schedule-list-left strong {
  display: block;
  font-size: 0.9rem;
  color: #fff;
}

.schedule-list-left small {
  color: #94a3b8;
  font-size: 0.75rem;
}

.schedule-list-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Остальное */
.add-word-row { display: flex; gap: 10px; margin-bottom: 18px; }

.input, select, textarea {
  padding: 11px 16px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  font-family: inherit;
  font-size: 0.85rem;
  background: rgba(255,255,255,0.05);
  color: #fff;
  outline: none;
  flex: 1;
  margin-bottom: 8px;
}

.input:focus, textarea:focus, select:focus {
  border-color: #6366f1;
}

.note-area { width: 100%; resize: vertical; }

.word-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  margin-bottom: 6px;
  border-left: 3px solid #6366f1;
  color: #cbd5e1;
}

.remove-btn {
  color: #ef4444;
  background: none;
  border: none;
  cursor: pointer;
}

.session-item {
  padding: 14px 18px;
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  margin-bottom: 8px;
  border-left: 3px solid #6366f1;
}

.session-item strong {
  color: #fff;
}

.session-item small {
  color: #94a3b8;
}

.empty-text {
  text-align: center;
  color: #64748b;
  padding: 30px;
}

.student-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 8px;
  transition: background 0.2s;
}

.student-card:hover {
  background: rgba(99,102,241,0.05);
}

.student-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.student-info { flex: 1; }

.student-info strong {
  display: block;
  font-size: 0.9rem;
  color: #fff;
}

.student-info small {
  color: #94a3b8;
}

.student-actions {
  display: flex;
  gap: 6px;
}

.homework-widget {
  padding: 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  margin-bottom: 8px;
  border-left: 4px solid #f59e0b;
  cursor: pointer;
  color: #cbd5e1;
}

.homework-widget.done {
  border-left-color: #10b981;
  opacity: 0.7;
}

.homework-widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Кнопки */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-p {
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  color: #fff;
}

.btn-o {
  border: 1px solid rgba(255,255,255,0.1);
  color: #cbd5e1;
  background: rgba(255,255,255,0.05);
}

.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.w-100 { width: 100%; justify-content: center; }
.mb-3 { margin-bottom: 16px; }
.mt-2 { margin-top: 12px; }

/* Модалки */
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

.modal {
  background: rgba(30,30,30,0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 28px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  color: #e2e8f0;
}

.modal h3 {
  font-weight: 700;
  margin-bottom: 16px;
  color: #fff;
}

.fade-in { animation: fadeIn 0.35s ease-out; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .profile-page { flex-direction: column; }
  .profile-sidebar { width: 100%; }
}
</style>
