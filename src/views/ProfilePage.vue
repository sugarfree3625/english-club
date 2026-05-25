<template>
  <div class="container">
    <div class="profile-page">
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
      <div class="profile-main">
        <div v-if="tab === 'info'" class="card fade-in">
          <h3>Информация</h3>
          <div class="info-grid">
            <div class="info-item"><strong>Уровень</strong><span>{{ user?.level }}</span></div>
            <div class="info-item"><strong>Рейтинг</strong><span>{{ user?.rating }}🏆</span></div>
            <div class="info-item full-width"><strong>Роль</strong><span>{{ roleLabel }}</span></div>
            <div class="info-item full-width"><strong>О себе</strong><span>{{ user?.bio || 'Не указано' }}</span></div>
          </div>
        </div>
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
        <div v-if="tab === 'words'" class="card fade-in"><h3>Словарь</h3><div class="add-word-row"><input class="input" v-model="wordEn" placeholder="Слово"><input class="input" v-model="wordRu" placeholder="Перевод"><button class="btn btn-p btn-sm" @click="addWord">+</button></div><div class="word-card" v-for="w in words" :key="w.id"><span><strong>{{ w.en }}</strong> — {{ w.ru }}</span><button class="remove-btn" @click="delWord(w.id)">✕</button></div><p v-if="!words.length" class="empty-text">Словарь пуст</p></div>
        <div v-if="tab === 'notes'" class="card fade-in"><h3>Блокнот</h3><textarea class="input note-area" v-model="note" rows="8" @input="saveNote"></textarea></div>
        <div v-if="tab === 'myhomework'" class="card fade-in"><h3>Мои задания</h3><div class="homework-widget" v-for="h in myHomework" :key="h.id" :class="{ done: h.status === 'completed' }"><div class="homework-widget-header"><span class="homework-widget-icon">{{ h.status === 'completed' ? '✅' : '📝' }}</span><strong>{{ h.title }}</strong></div></div><p v-if="!myHomework.length" class="empty-text">Нет заданий</p></div>
        <div v-if="tab === 'children'" class="card fade-in"><h3>Мои дети</h3><div class="student-card" v-for="s in myStudents" :key="s.id" @click="viewStudent(s)"><img :src="s.avatar_url || 'https://ui-avatars.com/api/?name='+s.username" class="student-avatar"><div class="student-info"><strong>{{ s.username }}</strong><small>{{ s.level }} · {{ s.rating }}🏆 · 🔥{{ s.streak }} дн.</small></div><i class="fas fa-chevron-right"></i></div><p v-if="!myStudents.length" class="empty-text">Нет детей</p></div>
        <div v-if="tab === 'students'" class="card fade-in"><h3>Ученики ({{ allStudents.length }})</h3><div class="student-card" v-for="s in allStudents" :key="s.id" @click="viewStudent(s)"><img :src="s.avatar_url || 'https://ui-avatars.com/api/?name='+s.username" class="student-avatar"><div class="student-info"><strong>{{ s.username }}</strong><small>{{ s.level }} · {{ s.rating }}🏆</small></div><div class="student-actions"><button class="btn btn-o btn-sm" @click.stop="bindParent(s)">👨‍👩‍👧</button><button class="btn btn-o btn-sm" @click.stop="addHomework(s)">📝</button><button class="btn btn-o btn-sm" @click.stop="addFeedback(s)">📊</button></div></div><p v-if="!allStudents.length" class="empty-text">Нет учеников</p></div>
        <div v-if="tab === 'homework'" class="card fade-in"><h3>Создать задание</h3><select class="input" v-model="hwStudent"><option value="">Выберите ученика</option><option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.username }}</option></select><input class="input" v-model="hwTitle" placeholder="Название"><textarea class="input note-area" v-model="hwDesc" rows="3" placeholder="Описание"></textarea><input class="input" v-model="hwDueDate" type="date"><button class="btn btn-p btn-sm w-100" @click="createHomework">Создать</button></div>
        <div v-if="tab === 'history'" class="card fade-in"><h3>История встреч</h3><div class="session-item" v-for="b in pastBookings" :key="b.bid"><strong>{{ b.title }}</strong><small>{{ new Date(b.date).toLocaleString('ru') }}</small></div><p v-if="!pastBookings.length" class="empty-text">Нет истории</p></div>
      </div>
    </div>
    <div class="modal-overlay" v-if="viewingStudent" @click.self="viewingStudent = null"><div class="modal" style="max-width:500px"><h3>{{ viewingStudent.username }}</h3><div class="info-grid"><div class="info-item"><strong>Уровень</strong><span>{{ viewingStudent.level }}</span></div><div class="info-item"><strong>Рейтинг</strong><span>{{ viewingStudent.rating }}🏆</span></div></div><button class="btn btn-o w-100 mt-2" @click="viewingStudent = null">Закрыть</button></div></div>
    <div class="modal-overlay" v-if="showBindParent" @click.self="showBindParent = false"><div class="modal" style="max-width:400px"><h3>Привязать родителя</h3><input class="input" v-model="parentSearch" @input="searchParents"><div v-for="p in parentResults" :key="p.id" class="student-card" @click="doBindParent(p.id)"><strong>{{ p.username }}</strong></div><button class="btn btn-o w-100 mt-2" @click="showBindParent = false">Закрыть</button></div></div>
    <div class="modal-overlay" v-if="showFeedback" @click.self="showFeedback = false"><div class="modal" style="max-width:400px"><h3>Фидбек</h3><select class="input" v-model="fbRating"><option v-for="n in 5" :key="n" :value="n">{{ '⭐'.repeat(n) }}</option></select><input class="input" v-model="fbTopic" placeholder="Тема"><textarea class="input note-area" v-model="fbGood" rows="2" placeholder="Хорошо"></textarea><textarea class="input note-area" v-model="fbImprove" rows="2" placeholder="Улучшить"></textarea><button class="btn btn-p w-100" @click="doAddFeedback">Отправить</button><button class="btn btn-o w-100 mt-2" @click="showFeedback = false">Закрыть</button></div></div>
    <ConfettiExplosion :active="showConfetti" />
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
