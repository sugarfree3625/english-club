<template>
  <div class="container">
    <div class="dash-hero">
      <h2>📅 Добро пожаловать, {{ user?.username }}!</h2>
      <div class="dash-btns">
        <button class="btn btn-o btn-sm" @click="showForm('leaderboard-modal')">🏆 Лидеры</button>
        <button class="btn btn-o btn-sm" @click="showForm('info-modal')">📖 О занятиях</button>
        <button class="btn btn-p btn-sm" @click="showPostForm = true" v-if="user?.role === 'host' || user?.role === 'admin'">📰 Пост</button>
      </div>
    </div>

    <!-- Календарь -->
    <section>
      <h2 class="section-title">Календарь</h2>
      <div id="calendar" ref="calendarEl"></div>
    </section>

    <!-- Встречи -->
    <section style="margin-top:20px">
      <h2 class="section-title">Встречи</h2>
      <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">
        <button class="tab-btn" :class="{ active: tab === 'available' }" @click="tab = 'available'">Доступные</button>
        <button class="tab-btn" :class="{ active: tab === 'my' }" @click="tab = 'my'">Мои записи</button>
        <button class="tab-btn" :class="{ active: tab === 'host' }" @click="tab = 'host'" v-if="user?.role === 'host' || user?.role === 'admin'">Мои встречи</button>
      </div>
      <div v-if="tab === 'available'">
        <div class="session" v-for="s in sessions" :key="s.id">
          <div style="display:flex;justify-content:space-between"><strong>{{ s.title }}</strong><span>{{ s.cnt }}/{{ s.max_participants }}</span></div>
          <small>{{ s.host }} · {{ new Date(s.date).toLocaleString('ru') }} · {{ s.duration }}мин</small>
          <button class="btn btn-p btn-sm mt-2" @click="bookSession(s.id)" :disabled="s.cnt >= s.max_participants">{{ s.cnt >= s.max_participants ? 'Мест нет' : 'Записаться' }}</button>
        </div>
        <p v-if="!sessions.length">Нет встреч</p>
      </div>
      <div v-if="tab === 'my'">
        <div class="session" v-for="b in myBookings" :key="b.bid"><strong>{{ b.title }}</strong><br><small>{{ new Date(b.date).toLocaleString('ru') }} · {{ b.status === 'active' ? 'Записан' : 'Посетил' }}</small></div>
        <p v-if="!myBookings.length">Нет записей</p>
      </div>
      <div v-if="tab === 'host'">
        <div class="session" v-for="s in hostSessions" :key="s.id">
          <strong>{{ s.title }}</strong><br>
          <small>{{ s.ac || 0 }} записаны · {{ s.at || 0 }} посетили</small>
          <div style="display:flex;gap:6px;margin-top:4px">
            <button class="btn btn-o btn-sm" @click="loadParticipants(s.id)">👥</button>
            <button class="btn btn-o btn-sm" @click="editingSessionId = s.id; showSessionForm = true">✏️</button>
            <button class="btn btn-o btn-sm" style="color:#ef4444" @click="deleteSession(s.id)">🗑</button>
          </div>
        </div>
        <p v-if="!hostSessions.length">Нет встреч</p>
      </div>
    </section>

    <!-- ЛЕНТА -->
    <section style="margin-top:20px">
      <h2 class="section-title">📰 Лента</h2>
      <div class="feed">
        <div class="feed-card" v-for="p in posts" :key="p.id">
          <div class="feed-header">
            <img :src="p.aa || 'https://ui-avatars.com/api/?name=' + (p.an || 'U')" class="feed-avatar">
            <div>
              <strong>{{ p.an }}</strong>
              <small>{{ new Date(p.ts).toLocaleString('ru') }}</small>
            </div>
            <div v-if="user?.role === 'host' || user?.role === 'admin'" class="feed-actions">
              <button class="btn btn-o btn-sm" @click="editPost(p)">✏️</button>
              <button class="btn btn-o btn-sm" style="color:#ef4444" @click="deletePost(p.id)">🗑</button>
            </div>
          </div>
          
          <h3 class="feed-title">{{ p.title }}</h3>
          <p class="feed-text">{{ p.content }}</p>
          
          <div v-if="p._items && p._items.length" class="feed-attachments">
            <template v-for="item in p._items" :key="Math.random()">
              <div v-if="item.type === 'image'" class="img-grid">
                <img v-for="(url, i) in item.urls" :key="i" :src="url" class="feed-img" @click="lightbox = url">
              </div>
              <div v-if="item.type === 'audio'" class="audio-list">
                <audio v-for="(url, i) in item.urls" :key="i" :src="url" controls></audio>
              </div>
              <div v-if="item.type === 'video'" class="video-list">
                <video v-for="(url, i) in item.urls" :key="i" :src="url" controls></video>
              </div>
              <div v-if="item.type === 'file'" class="file-list">
                <div v-for="(f, i) in item.files" :key="i" class="file-item">📎 <a :href="f.url" target="_blank">{{ f.name }}</a></div>
              </div>
              <div v-if="item.type === 'link'" class="link-list">
                <a v-for="(url, i) in item.urls" :key="i" :href="url" target="_blank" class="link-item">🔗 {{ url }}</a>
              </div>
            </template>
          </div>
        </div>
        <p v-if="!posts.length" class="text-muted">Нет публикаций</p>
      </div>
    </section>

    <!-- Лайтбокс -->
    <div class="lightbox" v-if="lightbox" @click="lightbox = null">
      <img :src="lightbox" style="max-width:90%;max-height:90%;border-radius:12px">
    </div>

    <SessionForm :show="showSessionForm" :editId="editingSessionId" :dateStr="selectedDateStr"
      @close="showSessionForm = false; editingSessionId = null" @saved="onSaved" />
    <PostForm :show="showPostForm" :editId="editingPostId"
      @close="showPostForm = false; editingPostId = null" @saved="onSaved" />
  </div>
</template>

<script>
import axios from 'axios';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import SessionForm from '../components/SessionForm.vue';
import PostForm from '../components/PostForm.vue';

export default {
  name: 'DashboardPage',
  components: { SessionForm, PostForm },
  props: ['user', 'settings'],
  data() {
    return {
      tab: 'available',
      sessions: [],
      myBookings: [],
      hostSessions: [],
      posts: [],
      calendar: null,
      showSessionForm: false,
      editingSessionId: null,
      selectedDateStr: null,
      showPostForm: false,
      editingPostId: null,
      lightbox: null
    };
  },
  async mounted() {
    await this.loadAll();
    this.initCalendar();
  },
  methods: {
    async loadAll() {
      try {
        const [ses, myb, host, posts] = await Promise.all([
          axios.get('/api/ses'),
          axios.get('/api/myb'),
          axios.get('/api/my-ses'),
          axios.get('/api/posts')
        ]);
        this.sessions = ses.data;
        this.myBookings = myb.data;
        this.hostSessions = host.data;
        this.posts = posts.data.map(p => {
          try { p._items = JSON.parse(p.items || '[]'); } catch(e) { p._items = []; }
          return p;
        });
      } catch(e) {}
    },
    initCalendar() {
      if (this.calendar) this.calendar.destroy();
      this.calendar = new Calendar(this.$refs.calendarEl, {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        locale: ruLocale,
        height: 'auto',
        events: async (info, success) => {
          try {
            const r = await axios.get('/api/cal');
            success([
              ...r.data.s.map(s => ({ title: s.title, start: s.date, color: '#6366f1' })),
              ...r.data.p.map(p => ({ title: '📢 ' + p.title, start: p.date, color: '#f59e0b' }))
            ]);
          } catch(e) { success([]); }
        },
        dateClick: (info) => {
          if (this.user?.role === 'host' || this.user?.role === 'admin') {
            this.selectedDateStr = info.dateStr;
            this.editingSessionId = null;
            this.showSessionForm = true;
          }
        }
      });
      this.calendar.render();
    },
    async bookSession(id) { try { await axios.post(`/api/ses/${id}/book`); this.loadAll(); } catch(e) {} },
    async deleteSession(id) { if (confirm('Удалить?')) { await axios.delete(`/api/ses/${id}`); this.loadAll(); } },
    async deletePost(id) { if (confirm('Удалить?')) { await axios.delete(`/api/posts/${id}`); this.loadAll(); } },
    async loadParticipants(id) { const r = await axios.get(`/api/ses/${id}/part`); alert(r.data.map(p => p.username).join(', ') || 'Нет'); },
    editPost(p) { this.editingPostId = p.id; this.showPostForm = true; },
    onSaved() { this.showSessionForm = false; this.showPostForm = false; this.loadAll(); if (this.calendar) this.calendar.refetchEvents(); }
  }
};
</script>

<style scoped>
.container { max-width: 1280px; margin: 0 auto; padding: 24px 16px; }
.dash-hero { background: linear-gradient(135deg, #eef0ff, #fff5f0); border-radius: 16px; padding: 20px; margin-bottom: 20px; text-align: center; }
.dash-hero h2 { font-weight: 700; font-size: 1.3rem; }
.dash-btns { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
.section-title { font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 8px; }
.tab-btn { padding: 6px 14px; border-radius: 50px; cursor: pointer; border: 2px solid #6366f1; background: transparent; color: #6366f1; font-weight: 600; margin-right: 4px; font-size: 0.8rem; }
.tab-btn.active { background: #6366f1; color: #fff; }
.session { border-left: 4px solid #6366f1; padding: 12px 16px; margin-bottom: 8px; background: #fff; border-radius: 0 10px 10px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }

/* Лента */
.feed { display: flex; flex-direction: column; gap: 20px; max-width: 700px; margin: 0 auto; }
.feed-card { background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
.feed-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.feed-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.feed-actions { margin-left: auto; display: flex; gap: 4px; }
.feed-title { font-weight: 700; font-size: 1.1rem; margin-bottom: 4px; }
.feed-text { color: #475569; font-size: 0.95rem; margin-bottom: 10px; }
.feed-attachments { display: flex; flex-direction: column; gap: 8px; }
.img-grid { display: flex; flex-wrap: wrap; gap: 4px; }
.feed-img { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer; }
.feed-img:hover { opacity: 0.85; }
.audio-list { display: flex; flex-direction: column; gap: 4px; }
.audio-list audio { width: 100%; height: 32px; }
.video-list { display: flex; flex-direction: column; gap: 6px; }
.video-list video { width: 100%; max-height: 250px; border-radius: 8px; }
.file-list { display: flex; flex-wrap: wrap; gap: 6px; }
.file-item { padding: 6px 10px; background: #f1f5f9; border-radius: 6px; font-size: 0.85rem; }
.link-list { display: flex; flex-wrap: wrap; gap: 6px; }
.link-item { color: #6366f1; text-decoration: none; font-size: 0.9rem; word-break: break-all; }
.link-item:hover { text-decoration: underline; }
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 3000; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; }
.btn-p { background: #6366f1; color: #fff; }
.btn-o { border: 2px solid #6366f1; color: #6366f1; background: transparent; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
@media (max-width: 768px) { .feed { max-width: 100%; } }
</style>