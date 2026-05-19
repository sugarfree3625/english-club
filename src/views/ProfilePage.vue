<template>
  <div class="container">
    <div class="profile-page">
      <div class="profile-sidebar">
        <div style="text-align:center;padding:10px 0">
          <img :src="user?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.username || 'U')" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:3px solid #6366f1">
          <h3>{{ user?.username }}</h3>
          <span style="color:#f59e0b;font-weight:700">{{ user?.rating }}🏆</span>
        </div>
        <button class="btn btn-p btn-sm mt-2" @click="linkTelegram">🔗 Привязать Telegram</button>
        <div v-if="tgLink" style="margin-top:8px;padding:8px;background:#f0fdf4;border-radius:8px;text-align:center">
          <a :href="tgLink" target="_blank" style="color:#6366f1;font-weight:600">Открыть бота</a>
        </div>
        <button class="sidebar-btn" :class="{ active: tab === 'info' }" @click="tab = 'info'">Инфо</button>
        <button class="sidebar-btn" :class="{ active: tab === 'words' }" @click="tab = 'words'">Словарь</button>
        <button class="sidebar-btn" :class="{ active: tab === 'notes' }" @click="tab = 'notes'">Блокнот</button>
        <button class="sidebar-btn" :class="{ active: tab === 'reminders' }" @click="tab = 'reminders'">Напоминания</button>
        <button class="sidebar-btn" :class="{ active: tab === 'history' }" @click="tab = 'history'">История</button>
        <button class="sidebar-btn" @click="$router.push('/dashboard')">← Назад</button>
      </div>
      <div class="profile-main">
        <div v-if="tab === 'info'" class="card">
          <h3>📋 Информация</h3>
          <p><strong>Уровень:</strong> {{ user?.level }}</p>
          <p><strong>Рейтинг:</strong> {{ user?.rating }}🏆</p>
          <p><strong>О себе:</strong> {{ user?.bio || 'Не указано' }}</p>
        </div>
        <div v-if="tab === 'words'" class="card">
          <h3>📝 Мой словарь</h3>
          <div style="display:flex;gap:6px;margin-bottom:10px">
            <input class="input" v-model="wordEn" placeholder="Слово">
            <input class="input" v-model="wordRu" placeholder="Перевод">
            <button class="btn btn-p btn-sm" @click="addWord">+</button>
          </div>
          <div class="word-card" v-for="w in words" :key="w.id">
            <span><strong>{{ w.en }}</strong> — {{ w.ru }}</span>
            <button class="btn btn-o btn-sm" style="color:#ef4444;padding:2px 8px" @click="delWord(w.id)">✕</button>
          </div>
          <p v-if="!words.length">Словарь пуст</p>
        </div>
        <div v-if="tab === 'notes'" class="card">
          <h3>📝 Блокнот</h3>
          <textarea class="input" v-model="note" rows="6" @input="saveNote"></textarea>
        </div>
        <div v-if="tab === 'reminders'" class="card">
          <h3>🔔 Напоминания</h3>
          <div class="session" v-for="b in upcomingBookings" :key="b.bid">
            <strong>📅 {{ b.title }}</strong><br>{{ new Date(b.date).toLocaleString('ru') }}
          </div>
          <p v-if="!upcomingBookings.length">Нет предстоящих встреч</p>
        </div>
        <div v-if="tab === 'history'" class="card">
          <h3>📖 История</h3>
          <div class="session" v-for="b in pastBookings" :key="b.bid">
            <strong>{{ b.title }}</strong><br><small>{{ new Date(b.date).toLocaleString('ru') }} · {{ b.status === 'attended' ? 'Посетил' : 'Пропущено' }}</small>
          </div>
          <p v-if="!pastBookings.length">Нет истории</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ProfilePage',
  props: ['user'],
  data() { 
    return { 
      tab: 'info', 
      words: [], 
      wordEn: '', 
      wordRu: '', 
      note: '', 
      allBookings: [],
      tgLink: null
    }; 
  },
  async mounted() {
    try {
      const [w, n, b] = await Promise.all([
        axios.get('/api/words'), 
        axios.get('/api/notes'), 
        axios.get('/api/myb')
      ]);
      this.words = w.data; 
      this.note = n.data.note || ''; 
      this.allBookings = b.data;
    } catch(e) {}
  },
  computed: {
    upcomingBookings() { 
      return this.allBookings.filter(b => b.status === 'active' && new Date(b.date) > new Date()); 
    },
    pastBookings() { 
      return this.allBookings.filter(b => b.status === 'attended' || new Date(b.date) < new Date()); 
    }
  },
  methods: {
    async linkTelegram() {
      const r = await axios.get('/api/tg-link');
      this.tgLink = r.data.link;
    },
    async addWord() { 
      if (!this.wordEn || !this.wordRu) return; 
      await axios.post('/api/words', { en: this.wordEn, ru: this.wordRu }); 
      this.wordEn = ''; 
      this.wordRu = ''; 
      const r = await axios.get('/api/words'); 
      this.words = r.data; 
    },
    async delWord(id) { 
      await axios.delete(`/api/words/${id}`); 
      const r = await axios.get('/api/words'); 
      this.words = r.data; 
    },
    async saveNote() { 
      clearTimeout(this._t); 
      this._t = setTimeout(async () => { 
        await axios.put('/api/notes', { note: this.note }); 
      }, 500); 
    }
  }
};
</script>

<style scoped>
.container { max-width: 1280px; margin: 0 auto; padding: 24px 16px; }
.profile-page { display: flex; gap: 16px; }
.profile-sidebar { width: 220px; flex-shrink: 0; background: #fff; border-radius: 16px; padding: 14px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 2px; }
.sidebar-btn { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; border: none; background: transparent; cursor: pointer; font-weight: 500; font-size: 0.8rem; color: #64748b; width: 100%; text-align: left; }
.sidebar-btn:hover, .sidebar-btn.active { background: #eef0ff; color: #6366f1; }
.profile-main { flex: 1; min-width: 0; }
.card { background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 12px; }
.input { width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 0.85rem; }
.word-card { background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 4px; border-left: 3px solid #6366f1; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
.session { border-left: 4px solid #6366f1; padding: 10px 14px; margin-bottom: 6px; background: #f8fafc; border-radius: 0 8px 8px 0; font-size: 0.85rem; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; }
.btn-p { background: #6366f1; color: #fff; }
.btn-o { border: 2px solid #6366f1; color: #6366f1; background: transparent; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
@media (max-width: 768px) { .profile-page { flex-direction: column; } .profile-sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; } }
</style>