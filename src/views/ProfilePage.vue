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
              <AppAvatar :src="user?.avatar_url" :name="user?.username || 'U'" :size="80" class="profile-avatar" />
              <span class="level-badge">{{ user?.level }}</span>
              <div class="avatar-overlay"><i class="fas fa-camera"></i></div>
            </div>
            <input type="file" ref="avatarInput" @change="uploadAvatar" accept="image/*" style="display:none">
            <h3>{{ user?.username }}</h3>
            <span class="profile-rating">{{ user?.rating }}🏆</span>
          </div>
          <button class="btn btn-p btn-sm w-100" @click="linkTelegram"><i class="fab fa-telegram"></i> Telegram</button>
          <button class="btn btn-o btn-sm w-100" @click="exportPDF">
            📊 Экспорт прогресса
          </button>
          <nav class="sidebar-nav">
            <button v-for="btn in sidebarButtons" :key="btn.tab" class="sidebar-btn" :class="{ active: tab === btn.tab }" @click="switchTab(btn)">
              <i :class="btn.icon"></i> {{ btn.label }}
            </button>
          </nav>
          <div class="sidebar-footer">
            <button class="sidebar-btn" @click="$router.push('/messages')"><i class="fas fa-comments"></i> Чат</button>
            <button class="sidebar-btn" @click="$router.push('/dashboard')"><i class="fas fa-arrow-left"></i> Назад</button>
          </div>
        </div>

        <!-- Контент -->
        <div class="profile-main">
          <ProfileTabInfo v-if="tab === 'info'" :user="user" />
          <ProfileTabAchievements v-if="tab === 'achievements'" :achievements="allAchievements" :earned="earnedCount" :total="totalCount" :percent="completionPercent" />
          <ProfileTabSchedule v-if="tab === 'myschedule'" :upcoming="myUpcomingSlots" :past="myPastSlots" :showStudent="isParent" @export="exportMyICS" />

          <div v-if="tab === 'words'" class="card fade-in"><h3>Словарь</h3><div class="add-word-row"><input class="input" v-model="wordEn" placeholder="Слово"><input class="input" v-model="wordRu" placeholder="Перевод"><button class="btn btn-p btn-sm" @click="addWord">+</button></div><div class="word-card" v-for="w in words" :key="w.id"><span><strong>{{ w.en }}</strong> — {{ w.ru }}</span><button class="remove-btn" @click="delWord(w.id)">✕</button></div><p v-if="!words.length" class="empty-text">Словарь пуст</p></div>

          <div v-if="tab === 'notes'" class="card fade-in"><h3>Блокнот</h3><textarea class="input note-area" v-model="note" rows="8" @input="saveNote"></textarea></div>

          <div v-if="tab === 'myhomework'" class="card fade-in"><h3>Мои задания</h3><div class="homework-widget" v-for="h in myHomework" :key="h.id" :class="{ done: h.status === 'completed' }"><div class="homework-widget-header"><span>{{ h.status === 'completed' ? '✅' : '📝' }}</span><strong>{{ h.title }}</strong></div></div><p v-if="!myHomework.length" class="empty-text">Нет заданий</p></div>

          <ProfileTabStudents v-if="tab === 'children'" :students="myStudents" title="Мои дети" @view="viewStudent" />
          <ProfileTabStudents v-if="tab === 'students'" :students="allStudents" title="Ученики" :showActions="true" @view="viewStudent" @bind="bindParent" @homework="addHomework" @feedback="addFeedback" />

          <div v-if="tab === 'homework'" class="card fade-in"><h3>Создать задание</h3><select class="input" v-model="hwStudent"><option value="">Выберите ученика</option><option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.username }}</option></select><input class="input" v-model="hwTitle" placeholder="Название"><textarea class="input note-area" v-model="hwDesc" rows="3" placeholder="Описание"></textarea><input class="input" v-model="hwDueDate" type="date"><button class="btn btn-p btn-sm w-100" @click="createHomework">Создать</button></div>

          <div v-if="tab === 'history'" class="card fade-in"><h3>История встреч</h3><div class="session-item" v-for="b in pastBookings" :key="b.bid"><strong>{{ b.title }}</strong><small>{{ new Date(b.date).toLocaleString('ru') }}</small></div><p v-if="!pastBookings.length" class="empty-text">Нет истории</p></div>
        </div>
      </div>

      <!-- Модалки -->
      <div class="modal-overlay" v-if="viewingStudent" @click.self="viewingStudent = null"><div class="modal" style="max-width:500px"><h3>{{ viewingStudent.username }}</h3><div class="info-grid"><div class="info-item"><strong>Уровень</strong><span>{{ viewingStudent.level }}</span></div><div class="info-item"><strong>Рейтинг</strong><span>{{ viewingStudent.rating }}🏆</span></div></div><button class="btn btn-o w-100 mt-2" @click="viewingStudent = null">Закрыть</button></div></div>
      <div class="modal-overlay" v-if="showBindParent" @click.self="showBindParent = false"><div class="modal" style="max-width:400px"><h3>Привязать родителя</h3><input class="input" v-model="parentSearch" @input="searchParents"><div v-for="p in parentResults" :key="p.id" class="student-card" @click="doBindParent(p.id)"><strong>{{ p.username }}</strong></div><button class="btn btn-o w-100 mt-2" @click="showBindParent = false">Закрыть</button></div></div>
      <div class="modal-overlay" v-if="showFeedback" @click.self="showFeedback = false"><div class="modal" style="max-width:400px"><h3>Фидбек</h3><select class="input" v-model="fbRating"><option v-for="n in 5" :key="n" :value="n">{{ '⭐'.repeat(n) }}</option></select><input class="input" v-model="fbTopic" placeholder="Тема"><textarea class="input note-area" v-model="fbGood" rows="2" placeholder="Хорошо"></textarea><textarea class="input note-area" v-model="fbImprove" rows="2" placeholder="Улучшить"></textarea><button class="btn btn-p w-100" @click="doAddFeedback">Отправить</button><button class="btn btn-o w-100 mt-2" @click="showFeedback = false">Закрыть</button></div></div>
      <ConfettiExplosion :active="showConfetti" />
      <AchievementUnlock v-if="newAchievement" :achievement="newAchievement" />
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import AppAvatar from '../components/AppAvatar.vue';
import ConfettiExplosion from '../components/ConfettiExplosion.vue';
import ProfileTabInfo from '../components/profile/ProfileTabInfo.vue';
import ProfileTabAchievements from '../components/profile/ProfileTabAchievements.vue';
import ProfileTabSchedule from '../components/profile/ProfileTabSchedule.vue';
import ProfileTabStudents from '../components/profile/ProfileTabStudents.vue';
import AchievementUnlock from '../components/AchievementUnlock.vue';
import { exportProgressPDF } from '../composables/useExportPDF.js';

export default {
  name: 'ProfilePage',
  components: { AppAvatar, ConfettiExplosion, ProfileTabInfo, ProfileTabAchievements, ProfileTabSchedule, ProfileTabStudents, AchievementUnlock },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      tab: 'info', words: [], wordEn: '', wordRu: '', note: '', allBookings: [],
      allAchievements: [], earnedCount: 0, totalCount: 30, showConfetti: false,
      myHomework: [], myStudents: [], allStudents: [], viewingStudent: null,
      mySlots: [], showBindParent: false, bindStudentId: null, parentSearch: '', parentResults: [],
      showFeedback: false, fbStudentId: null, fbRating: 3, fbTopic: '', fbGood: '', fbImprove: '',
      hwStudent: '', hwTitle: '', hwDesc: '', hwDueDate: '',
      newAchievement: null,
      prevEarnedCodes: []
    };
  },
  computed: {
    isStudent() { return !this.user?.role || this.user.role === 'user' || this.user.role === 'student'; },
    isParent() { return this.user?.role === 'parent'; },
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; },
    pastBookings() { return this.allBookings.filter(b => b.status === 'attended' || new Date(b.date) < new Date()); },
    completionPercent() { return this.totalCount > 0 ? Math.round((this.earnedCount / this.totalCount) * 100) : 0; },
    myUpcomingSlots() { return this.mySlots.filter(s => new Date(s.start_time) >= new Date()); },
    myPastSlots() { return this.mySlots.filter(s => new Date(s.start_time) < new Date()); },
    sidebarButtons() {
      const btns = [
        { tab: 'info', icon: 'fas fa-user', label: 'Инфо', show: true },
        { tab: 'achievements', icon: 'fas fa-trophy', label: 'Достижения', show: true, load: 'loadAchievements' },
        { tab: 'myschedule', icon: 'fas fa-calendar-check', label: 'Расписание', show: true, load: 'loadMySlots' },
        { tab: 'words', icon: 'fas fa-book', label: 'Словарь', show: this.isStudent },
        { tab: 'notes', icon: 'fas fa-sticky-note', label: 'Блокнот', show: this.isStudent },
        { tab: 'myhomework', icon: 'fas fa-tasks', label: 'Задания', show: this.isStudent, load: 'loadMyHomework' },
        { tab: 'children', icon: 'fas fa-child', label: 'Мои дети', show: this.isParent, load: 'loadMyStudents' },
        { tab: 'students', icon: 'fas fa-users', label: 'Ученики', show: this.isTutor, load: 'loadAllStudents' },
        { tab: 'homework', icon: 'fas fa-tasks', label: 'Задания', show: this.isTutor },
        { tab: 'history', icon: 'fas fa-history', label: 'История', show: true }
      ];
      return btns.filter(b => b.show);
    }
  },
  async mounted() {
    try { const [w, n, b] = await Promise.all([axios.get('/api/words'), axios.get('/api/notes'), axios.get('/api/myb')]); this.words = w.data; this.note = n.data.note || ''; this.allBookings = b.data; } catch(e) {}
    this.loadAchievements();
  },
  methods: {
    switchTab(btn) { this.tab = btn.tab; if (btn.load) this[btn.load](); },
    async loadAchievements() { 
      try { 
        const r = await axios.get('/api/achievements'); 
        const newData = (r.data || []).map(a => ({ ...a, progressPercent: a.progressPercent || a.progress_percent || (a.earned ? 100 : 0) }));
        const newlyUnlocked = newData.filter(a => {
          const old = this.allAchievements.find(o => o.code === a.code);
          return old && !old.earned && a.earned;
        });
        this.allAchievements = newData;
        this.earnedCount = this.allAchievements.filter(a => a.earned).length;
        if (newlyUnlocked.length > 0 && !this._shownAchievements) {
          this._shownAchievements = true;
          this.newAchievement = newlyUnlocked[0];
          this.showConfetti = true;
        }
      } catch(e) {} 
    },
    async exportPDF() {
      try {
        const achRes = await axios.get('/api/achievements');
        const stats = {
          messages: this.allAchievements.find(a => a.condition_field === 'messages_count')?.current_value || 0,
          meetings: this.allAchievements.find(a => a.condition_field === 'meetings_count')?.current_value || 0,
          words: this.allAchievements.find(a => a.condition_field === 'words_count')?.current_value || 0,
          achievements: this.allAchievements.filter(a => a.earned).length
        };
        exportProgressPDF(this.user, stats, achRes.data || []);
      } catch(e) {
        this.addToast('Ошибка экспорта', 'error');
      }
    },
    async loadMyHomework() { try { this.myHomework = (await axios.get('/api/homework/my')).data || []; } catch(e) {} },
    async loadMyStudents() { try { this.myStudents = (await axios.get('/api/parent/students')).data || []; } catch(e) {} },
    async loadAllStudents() { try { this.allStudents = ((await axios.get('/api/users')).data || []).filter(u => u.role !== 'admin'); } catch(e) {} },
    async loadMySlots() { try { this.mySlots = (await axios.get('/api/slots')).data || []; } catch(e) {} },
    async viewStudent(s) { try { this.viewingStudent = (await axios.get(`/api/parent/student/${s.id}`)).data; } catch(e) {} },
    bindParent(s) { this.bindStudentId = s.id; this.showBindParent = true; },
    async searchParents() { try { this.parentResults = (await axios.get(`/api/users?q=${this.parentSearch || ''}`)).data || []; } catch(e) {} },
    async doBindParent(pid) { try { await axios.post('/api/parent/bind', { student_id: this.bindStudentId, parent_id: pid }); this.showBindParent = false; this.parentSearch = ''; this.addToast('Привязан!', 'success'); } catch(e) {} },
    addHomework(s) { this.hwStudent = s.id; this.tab = 'homework'; },
    async createHomework() { if (!this.hwStudent || !this.hwTitle) return; try { await axios.post('/api/homework', { student_id: this.hwStudent, title: this.hwTitle, description: this.hwDesc, due_date: this.hwDueDate }); this.hwTitle = ''; this.hwDesc = ''; this.addToast('Создано! 📝', 'success'); } catch(e) {} },
    addFeedback(s) { this.fbStudentId = s.id; this.showFeedback = true; },
    async doAddFeedback() { try { await axios.post('/api/feedback', { student_id: this.fbStudentId, rating: this.fbRating, topic: this.fbTopic, good: this.fbGood, improve: this.fbImprove }); this.showFeedback = false; this.addToast('Отправлено! 📊', 'success'); } catch(e) {} },
    async linkTelegram() { const r = await axios.get('/api/tg-link'); this.tgLink = r.data.link; },
    async addWord() { if (!this.wordEn || !this.wordRu) return; await axios.post('/api/words', { en: this.wordEn, ru: this.wordRu }); this.wordEn = ''; this.wordRu = ''; this.words = (await axios.get('/api/words')).data; },
    async delWord(id) { await axios.delete(`/api/words/${id}`); this.words = (await axios.get('/api/words')).data; },
    async saveNote() { clearTimeout(this._t); this._t = setTimeout(async () => { await axios.put('/api/notes', { note: this.note }); }, 500); },
    async uploadAvatar(e) { const file = e.target.files[0]; if (!file) return; const form = new FormData(); form.append('img', file); try { const r = await axios.post('/api/nimg', form); if (r.data.url) { await axios.put('/api/me', { avatar_url: r.data.url }); this.user.avatar_url = r.data.url; this.$emit('update-user', { ...this.user, avatar_url: r.data.url }); this.addToast('Фото обновлено! 📸', 'success'); } } catch(e) { this.addToast('Ошибка загрузки фото', 'error'); } },
    exportMyICS() { window.open('/api/slots/export', '_blank'); }
  }
};
</script>

<style scoped>
.profile-page-wrapper { min-height: 100vh; background: #0b1120; position: relative; overflow: hidden; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.2; pointer-events: none; }
.bg-orb-1 { width: 600px; height: 600px; background: #6366f1; top: -200px; left: -200px; animation: floatOrb1 15s ease-in-out infinite; }
.bg-orb-2 { width: 500px; height: 500px; background: #2dd4bf; bottom: -200px; right: -200px; animation: floatOrb2 15s ease-in-out infinite; }
@keyframes floatOrb1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -30px) scale(1.05); } }
@keyframes floatOrb2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-30px, 20px) scale(1.05); } }
.container { max-width: 1280px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; }
.profile-page { display: flex; gap: 28px; }
.profile-sidebar { width: 260px; flex-shrink: 0; background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 6px; }
.profile-avatar-section { text-align: center; padding: 20px 0; }
.avatar-wrapper { position: relative; display: inline-block; cursor: pointer; padding: 3px; background: linear-gradient(135deg, #6366f1, #2dd4bf); border-radius: 50%; }
.profile-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #0b1120; }
.avatar-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; color: #fff; font-size: 1.5rem; border-radius: 50%; background: rgba(0,0,0,0.5); transition: opacity 0.3s; }
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.level-badge { position: absolute; bottom: 0; right: -4px; background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; }
.profile-rating { color: #f59e0b; font-weight: 700; }
h3 { color: #fff; font-family: 'Space Grotesk', sans-serif; }
.sidebar-nav { flex: 1; }
.sidebar-btn { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-radius: 14px; border: none; background: transparent; cursor: pointer; font-weight: 500; font-size: 0.85rem; color: #94a3b8; width: 100%; text-align: left; transition: all 0.2s; }
.sidebar-btn:hover, .sidebar-btn.active { background: rgba(99,102,241,0.15); color: #fff; }
.sidebar-footer { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; }
.profile-main { flex: 1; min-width: 0; }
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.info-item { display: flex; flex-direction: column; gap: 6px; }
.info-item strong { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }
.info-item span { font-size: 1rem; font-weight: 500; color: #e2e8f0; }
.full-width { grid-column: 1 / -1; }
.achieve-stats { display: flex; gap: 20px; margin-bottom: 20px; }
.achieve-stat { text-align: center; flex: 1; }
.achieve-stat-value { display: block; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.achieve-stat-label { font-size: 0.8rem; color: #94a3b8; }
.achievements-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; }
.achieve-badge-card { background: rgba(255,255,255,0.03); border-radius: 20px; padding: 20px 14px; text-align: center; cursor: pointer; border: 2px solid rgba(255,255,255,0.06); transition: all 0.3s; }
.achieve-badge-card.earned { border-color: rgba(16,185,129,0.5); }
.achieve-icon { font-size: 2.5rem; display: block; }
.achieve-name { font-size: 0.75rem; font-weight: 600; margin-top: 4px; color: #cbd5e1; }
.achieve-progress-mini { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 10px; overflow: hidden; }
.achieve-progress-mini-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; max-width: 100%; }
.schedule-list { display: flex; flex-direction: column; gap: 10px; }
.schedule-list-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 14px; background: rgba(255,255,255,0.03); border-left: 4px solid; }
.schedule-list-item.slot-online { border-color: #10b981; }
.schedule-list-item.slot-offline { border-color: #6366f1; }
.schedule-list-item.past { opacity: 0.5; }
.schedule-list-left { display: flex; gap: 10px; align-items: center; }
.schedule-list-left strong { display: block; font-size: 0.9rem; color: #fff; }
.schedule-list-left small { color: #94a3b8; font-size: 0.75rem; }
.schedule-list-right { display: flex; gap: 8px; align-items: center; }
.add-word-row { display: flex; gap: 10px; margin-bottom: 18px; }
.input, select, textarea { padding: 11px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; font-family: inherit; font-size: 0.85rem; background: rgba(255,255,255,0.05); color: #fff; outline: none; flex: 1; margin-bottom: 8px; }
.input:focus, textarea:focus, select:focus { border-color: #6366f1; }
.note-area { width: 100%; resize: vertical; }
.word-card { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 6px; border-left: 3px solid #6366f1; color: #cbd5e1; }
.remove-btn { color: #ef4444; background: none; border: none; cursor: pointer; }
.session-item { padding: 14px 18px; background: rgba(255,255,255,0.03); border-radius: 14px; margin-bottom: 8px; border-left: 3px solid #6366f1; }
.session-item strong { color: #fff; }
.session-item small { color: #94a3b8; }
.empty-text { text-align: center; color: #64748b; padding: 30px; }
.student-card { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; cursor: pointer; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px; transition: background 0.2s; }
.student-card:hover { background: rgba(99,102,241,0.05); }
.student-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.student-info { flex: 1; }
.student-info strong { display: block; font-size: 0.9rem; color: #fff; }
.student-info small { color: #94a3b8; }
.student-actions { display: flex; gap: 6px; }
.homework-widget { padding: 14px; background: rgba(255,255,255,0.03); border-radius: 14px; margin-bottom: 8px; border-left: 4px solid #f59e0b; cursor: pointer; color: #cbd5e1; }
.homework-widget.done { border-left-color: #10b981; opacity: 0.7; }
.homework-widget-header { display: flex; align-items: center; gap: 8px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.w-100 { width: 100%; justify-content: center; }
.mb-3 { margin-bottom: 16px; }
.mt-2 { margin-top: 12px; }
.modal-overlay { position: fixed; inset: 0; z-index: 5000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.modal { background: rgba(30,30,30,0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 28px; max-width: 90vw; max-height: 80vh; overflow-y: auto; color: #e2e8f0; }
.modal h3 { font-weight: 700; margin-bottom: 16px; color: #fff; }
.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 768px) { .profile-page { flex-direction: column; } .profile-sidebar { width: 100%; } }
</style>
