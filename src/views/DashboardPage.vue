<template>
  <div class="container">
    <div class="dash-hero fade-in-up">
      <h2>👋 Добро пожаловать, {{ user?.username }}!</h2>
      <p class="hero-sub">{{ user?.level }} · {{ user?.rating }}🏆 <span v-if="streak > 0" class="streak-badge">🔥 {{ streak }} дн.</span></p>
      <div class="dash-btns">
        <button class="btn btn-o btn-sm interactive-btn" @click="showTop = true">🏆 Топ</button>
        <button class="btn btn-o btn-sm interactive-btn" @click="showSearch = true">🔍 Поиск</button>
        <button class="btn btn-o btn-sm interactive-btn" @click="$router.push('/groups')">👥 Группы</button>
        <button class="btn btn-o btn-sm interactive-btn" @click="exportICS">📅 Экспорт</button>
        <button class="btn btn-p btn-sm btn-pulse interactive-btn" @click="showSlotForm = true" v-if="isTutor">➕ Занятие</button>
        <button class="btn btn-p btn-sm btn-pulse interactive-btn" @click="showPostForm = true" v-if="isTutor">📰 Пост</button>
      </div>
      <div v-if="streak > 0" class="streak-info"><span class="streak-fire">🔥</span> Ты посещаешь клуб <strong>{{ streak }} {{ streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней' }}</strong> подряд!</div>
    </div>
    <section>
      <div class="schedule-header">
        <h2 class="section-title">📅 Расписание</h2>
        <div class="schedule-nav">
          <button class="btn btn-o btn-sm interactive-btn" @click="prevWeek">←</button>
          <span class="schedule-week-label">{{ weekLabel }}</span>
          <button class="btn btn-o btn-sm interactive-btn" @click="nextWeek">→</button>
          <button class="btn btn-o btn-sm interactive-btn" @click="currentWeek = 0; loadSlots()">Сегодня</button>
        </div>
      </div>
      <div class="schedule-grid-wrapper">
        <div class="schedule-grid">
          <div class="schedule-cell schedule-header-cell">Время</div>
          <div class="schedule-cell schedule-header-cell" v-for="day in weekDays" :key="day.date" :class="{ today: day.isToday }">
            <div class="day-name">{{ day.name }}</div>
            <div class="day-date">{{ day.dateStr }}</div>
          </div>
          <template v-for="hour in hours" :key="hour">
            <div class="schedule-cell schedule-time-cell">{{ hour }}:00</div>
            <div class="schedule-cell schedule-slot-cell" 
              v-for="day in weekDays" :key="day.date + hour"
              :class="{ today: day.isToday, past: isPast(day.date, hour) }"
              @click="openSlot(day.date, hour)"
            >
              <div v-if="getSlot(day.date, hour)" class="slot-card" :class="getSlotColor(getSlot(day.date, hour).lesson_type)" @click.stop="openSlotDetail(getSlot(day.date, hour))">
                <div class="slot-time">{{ formatHour(getSlot(day.date, hour).start_time) }}</div>
                <div class="slot-title">{{ getSlot(day.date, hour).title }}</div>
                <div class="slot-student">{{ getSlot(day.date, hour).users?.username || '—' }}</div>
              </div>
              <div v-else class="slot-empty">+</div>
            </div>
          </template>
        </div>
      </div>
    </section>
    <section style="margin-top:24px" v-if="pastSlots.length">
      <h2 class="section-title">📋 История занятий</h2>
      <div class="history-list">
        <div class="history-item" v-for="s in pastSlots.slice(0, 5)" :key="s.id" :class="getSlotColor(s.lesson_type)">
          <div class="history-left">
            <span class="history-type">{{ s.lesson_type === 'online' ? '🟢' : '🔵' }}</span>
            <div><strong>{{ s.title }}</strong><small>{{ new Date(s.start_time).toLocaleDateString('ru') }} · {{ formatHour(s.start_time) }}</small></div>
          </div>
          <span class="history-student">{{ s.users?.username || '—' }}</span>
        </div>
      </div>
    </section>
    <section style="margin-top:24px">
      <h2 class="section-title">📰 Лента</h2>
      <div v-if="loadingPosts" style="text-align:center;padding:40px;color:var(--t2)">⏳ Загрузка...</div>
      <div v-else class="feed">
        <div class="feed-card tilt-card fade-in-up" v-for="(p, idx) in posts" :key="p.id" :class="{ pinned: p.pinned }" :style="{ animationDelay: `${idx * 0.06}s` }">
          <div v-if="p.pinned" class="pinned-badge">📌 Закреплено</div>
          <div class="feed-header">
            <img :src="p.aa || 'https://ui-avatars.com/api/?name=' + (p.an || 'U')" class="feed-avatar">
            <div><strong>{{ p.an }}</strong><small>{{ new Date(p.ts).toLocaleString('ru') }}</small></div>
            <div v-if="isTutor" class="feed-actions">
              <button v-if="user?.role === 'admin'" class="btn btn-o btn-sm interactive-btn" @click="togglePin(p)">{{ p.pinned ? '📌' : '📍' }}</button>
              <button class="btn btn-o btn-sm interactive-btn" @click="editPost(p)">✏️</button>
              <button class="btn btn-o btn-sm interactive-btn" style="color:#ef4444" @click="deletePost(p.id)">🗑</button>
            </div>
          </div>
          <h3 class="feed-title">{{ p.title }}</h3>
          <div class="feed-text" v-html="p.content"></div>
          <div class="post-actions">
            <button class="btn btn-o btn-sm interactive-btn" @click="likePost(p)">❤️ {{ p.likes_count || 0 }}</button>
            <button class="btn btn-o btn-sm interactive-btn" @click="showComments(p)">💬 {{ p.comments_count || 0 }}</button>
            <div class="quick-reactions">
              <button class="quick-reaction-btn" @click="quickReact(p, '👍')">👍</button>
              <button class="quick-reaction-btn" @click="quickReact(p, '❤️')">❤️</button>
              <button class="quick-reaction-btn" @click="quickReact(p, '😂')">😂</button>
              <button class="quick-reaction-btn" @click="quickReact(p, '😮')">😮</button>
              <button class="quick-reaction-btn" @click="quickReact(p, '🔥')">🔥</button>
            </div>
          </div>
          <div v-if="commentPost?.id === p.id" class="comments-section">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <img :src="c.users?.avatar_url || 'https://ui-avatars.com/api/?name='+(c.users?.username||'U')" class="comment-avatar">
              <div><strong>{{ c.users?.username }}</strong><small>{{ c.message }}</small></div>
            </div>
            <div class="comment-input"><input class="input" v-model="commentText" placeholder="Комментарий..." @keydown.enter="addComment"><button class="btn btn-p btn-sm" @click="addComment">➤</button></div>
          </div>
        </div>
        <div v-if="hasMorePosts" class="load-more-wrapper"><button class="btn btn-o load-more-btn" @click="loadMorePosts">📜 Показать ещё</button></div>
        <p v-if="!posts.length" class="empty-text">Нет публикаций</p>
      </div>
    </section>
    <div class="modal-overlay" v-if="showSlotForm" @click.self="showSlotForm = false"><div class="modal" style="max-width:500px"><h3>{{ editingSlot ? '✏️ Редактировать' : '➕ Новое занятие' }}</h3>
      <label>Ученик</label><select class="input" v-model="slotForm.student_id"><option value="">Выберите</option><option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.username }}</option></select>
      <label>Тип</label><div class="type-btns"><button class="type-btn" :class="{ active: slotForm.lesson_type === 'online' }" @click="slotForm.lesson_type = 'online'">🟢 Онлайн</button><button class="type-btn" :class="{ active: slotForm.lesson_type === 'offline' }" @click="slotForm.lesson_type = 'offline'">🔵 Очно</button></div>
      <label>Название</label><input class="input" v-model="slotForm.title">
      <div style="display:flex;gap:8px"><div style="flex:1"><label>Дата</label><input class="input" type="date" v-model="slotForm.date"></div><div style="flex:1"><label>Время</label><input class="input" type="time" v-model="slotForm.time"></div></div>
      <label>Длительность (мин)</label><input class="input" type="number" v-model="slotForm.duration" placeholder="60">
      <label>Заметки</label><textarea class="input note-area" v-model="slotForm.notes" rows="2"></textarea>
      <div class="modal-actions"><button class="btn btn-p btn-sm" @click="saveSlot">{{ editingSlot ? '💾' : 'Создать' }}</button><button v-if="editingSlot" class="btn btn-o btn-sm" style="color:#ef4444" @click="deleteSlot(editingSlot.id)">🗑</button><button class="btn btn-o btn-sm" @click="showSlotForm = false">Отмена</button></div>
    </div></div>
    <div class="modal-overlay" v-if="viewingSlot" @click.self="viewingSlot = null"><div class="modal" style="max-width:400px"><h3>{{ viewingSlot.title }}</h3><p><strong>Ученик:</strong> {{ viewingSlot.users?.username || '—' }}</p><p><strong>Тип:</strong> {{ viewingSlot.lesson_type === 'online' ? '🟢 Онлайн' : '🔵 Очно' }}</p><p><strong>Время:</strong> {{ new Date(viewingSlot.start_time).toLocaleString('ru') }}</p><p v-if="viewingSlot.notes"><strong>Заметки:</strong> {{ viewingSlot.notes }}</p><a v-if="viewingSlot.meeting_link" :href="viewingSlot.meeting_link" target="_blank" class="btn btn-p btn-sm w-100 mt-2">📹 Подключиться</a><button class="btn btn-o w-100 mt-2" @click="viewingSlot = null">Закрыть</button></div></div>
    <div class="modal-overlay" v-if="showTop" @click.self="showTop = false"><div class="modal"><h3>🏆 Топ</h3><div v-for="(u,i) in topUsers" :key="u.id" class="top-item"><span class="top-rank">{{ i+1 }}</span><div><strong>{{ u.username }}</strong><small>{{ u.rating }}🏆 · {{ u.level }}</small></div></div><button class="btn btn-o w-100 mt-2" @click="showTop=false">Закрыть</button></div></div>
    <div class="modal-overlay" v-if="showSearch" @click.self="showSearch = false"><div class="modal" style="max-width:500px"><h3>🔍 Поиск</h3><input class="input" v-model="searchQuery" @input="searchSite"><div v-if="searchResults.posts?.length"><h4>Посты</h4><div v-for="p in searchResults.posts" :key="p.id" class="search-item" @click="showSearch=false">{{ p.title }}</div></div><button class="btn btn-o w-100 mt-2" @click="showSearch=false">Закрыть</button></div></div>
    <PostForm :show="showPostForm" :editId="editingPostId" @close="showPostForm = false; editingPostId = null" @saved="loadPosts" />
  </div>
</template>

<script>
import axios from 'axios';
import PostForm from '../components/PostForm.vue';

export default {
  name: 'DashboardPage',
  components: { PostForm },
  props: ['user', 'settings'],
  inject: ['addToast'],
  data() {
    return {
      streak: 0, allStudents: [], slots: [], posts: [], loadingPosts: true, hasMorePosts: false, postsPage: 0,
      showTop: false, topUsers: [], showSearch: false, searchQuery: '', searchResults: { posts: [], sessions: [] },
      currentWeek: 0, hours: Array.from({ length: 14 }, (_, i) => i + 8),
      showSlotForm: false, editingSlot: null, slotForm: { student_id: '', lesson_type: 'online', title: '', date: '', time: '', duration: 60, notes: '' },
      viewingSlot: null,
      showPostForm: false, editingPostId: null,
      commentPost: null, comments: [], commentText: ''
    };
  },
  computed: {
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; },
    weekDays() {
      const today = new Date(); const monday = new Date(today);
      monday.setDate(today.getDate() - (today.getDay() || 7) + 1 + this.currentWeek * 7);
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return { date: d.toISOString().split('T')[0], name: ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'][i], dateStr: d.toLocaleDateString('ru',{day:'numeric',month:'short'}), isToday: d.toDateString() === today.toDateString() }; });
    },
    weekLabel() { return `${this.weekDays[0].dateStr} — ${this.weekDays[6].dateStr}`; },
    pastSlots() { return this.slots.filter(s => new Date(s.start_time) < new Date()); }
  },
  async mounted() {
    await Promise.all([this.loadSlots(), this.loadPosts(), this.loadTop(), this.loadStreak(), this.loadStudents()]);
  },
  methods: {
    async loadSlots() { try { const r = await axios.get('/api/slots'); this.slots = r.data || []; } catch(e) {} },
    async loadPosts() { this.loadingPosts = true; try { const r = await axios.get('/api/posts?page=0'); this.posts = r.data || []; this.hasMorePosts = r.data?.length === 20; this.postsPage = 0; } catch(e) {} finally { this.loadingPosts = false; } },
    async loadMorePosts() { try { const r = await axios.get(`/api/posts?page=${this.postsPage + 1}`); if (r.data?.length) { this.posts = [...this.posts, ...r.data]; this.postsPage++; this.hasMorePosts = r.data.length === 20; } else this.hasMorePosts = false; } catch(e) {} },
    async loadStudents() { try { const r = await axios.get('/api/users'); this.allStudents = (r.data || []).filter(u => u.role !== 'admin'); } catch(e) {} },
    async loadTop() { try { const r = await axios.get('/api/top'); this.topUsers = r.data || []; } catch(e) {} },
    async loadStreak() { try { const r = await axios.get('/api/streak'); this.streak = r.data?.streak || 0; } catch(e) {} },
    getSlot(date, hour) { return this.slots.find(s => { const sd = new Date(s.start_time); return sd.toISOString().split('T')[0] === date && sd.getHours() === hour; }); },
    getSlotColor(t) { return t === 'online' ? 'slot-online' : 'slot-offline'; },
    isPast(date, hour) { return new Date(`${date}T${String(hour).padStart(2,'0')}:00:00`) < new Date(); },
    formatHour(ts) { return ts ? new Date(ts).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}) : ''; },
    prevWeek() { this.currentWeek--; this.loadSlots(); },
    nextWeek() { this.currentWeek++; this.loadSlots(); },
    openSlot(date, hour) { if (!this.isTutor) return; this.editingSlot = null; this.slotForm = { student_id: '', lesson_type: 'online', title: '', date, time: `${String(hour).padStart(2,'0')}:00`, duration: 60, notes: '' }; this.showSlotForm = true; },
    openSlotDetail(s) { this.viewingSlot = s; },
    async saveSlot() { try { const st = `${this.slotForm.date}T${this.slotForm.time}:00`; const et = new Date(new Date(st).getTime() + (this.slotForm.duration||60)*60000).toISOString(); if (this.editingSlot) await axios.put(`/api/slots/${this.editingSlot.id}`, {...this.slotForm, start_time: st, end_time: et}); else await axios.post('/api/slots', {...this.slotForm, start_time: st, end_time: et}); this.showSlotForm = false; this.addToast('Сохранено! 🎉','success'); this.loadSlots(); } catch(e) { this.addToast('Ошибка','error'); } },
    async deleteSlot(id) { if (confirm('Удалить?')) { await axios.delete(`/api/slots/${id}`); this.loadSlots(); } },
    exportICS() { window.open('/api/slots/export', '_blank'); },
    async searchSite() { if (this.searchQuery.length < 2) return; try { const r = await axios.get(`/api/search?q=${this.searchQuery}`); this.searchResults = r.data; } catch(e) {} },
    async likePost(p) { try { const r = await axios.post(`/api/posts/${p.id}/like`); p.likes_count = r.data.count; } catch(e) {} },
    quickReact(p, e) { this.addToast(`${e}`, 'info', 1000); },
    async togglePin(p) { try { await axios.post(`/api/posts/${p.id}/${p.pinned?'unpin':'pin'}`); this.loadPosts(); } catch(e) {} },
    async deletePost(id) { if (confirm('Удалить пост?')) { await axios.delete(`/api/posts/${id}`); this.loadPosts(); } },
    editPost(p) { this.editingPostId = p.id; this.showPostForm = true; },
    async showComments(p) { if (this.commentPost?.id === p.id) { this.commentPost = null; return; } this.commentPost = p; try { const r = await axios.get(`/api/posts/${p.id}/comments`); this.comments = r.data || []; p.comments_count = this.comments.length; } catch(e) {} },
    async addComment() { if (!this.commentText.trim()) return; await axios.post(`/api/posts/${this.commentPost.id}/comments`,{msg:this.commentText}); this.commentText=''; this.showComments(this.commentPost); }
  }
};
</script>
