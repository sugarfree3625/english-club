<template>
  <div class="container" v-if="user?.role === 'admin' || user?.role === 'host'">
    <h2 class="section-title">⚙️ Админ-панель</h2>
    
    <div class="admin-tabs">
      <button class="tab-btn" :class="{ active: tab === 'hero' }" @click="tab = 'hero'">🏠 Hero</button>
      <button class="tab-btn" :class="{ active: tab === 'services' }" @click="tab = 'services'">📦 Услуги</button>
      <button class="tab-btn" :class="{ active: tab === 'contacts' }" @click="tab = 'contacts'">📞 Контакты</button>
      <button class="tab-btn" :class="{ active: tab === 'users' }" @click="tab = 'users'">👥 Польз.</button>
      <button class="tab-btn" :class="{ active: tab === 'design' }" @click="tab = 'design'">🎨 Дизайн</button>
    </div>
    
    <!-- Hero -->
    <div v-if="tab === 'hero'" class="card fade-in-up">
      <h3>🏠 Главный экран</h3>
      <label>Заголовок</label><input class="input" v-model="form.hero_title">
      <label>Подзаголовок</label><input class="input" v-model="form.hero_subtitle">
      <label>О занятиях</label><textarea class="input" v-model="form.info_text" rows="4"></textarea>
    </div>
    
    <!-- Услуги -->
    <div v-if="tab === 'services'" class="card fade-in-up">
      <h3>📦 Услуги</h3>
      <div v-for="s in services" :key="s.id" class="service-row">
        <span><strong>{{ s.title }}</strong> · {{ s.price }}₽</span>
        <div>
          <button class="btn btn-o btn-sm" @click="editService(s)">✏️</button>
          <button class="btn btn-o btn-sm" style="color:#ef4444" @click="delService(s.id)">🗑</button>
        </div>
      </div>
      <button class="btn btn-p btn-sm mt-3" @click="addService">+ Добавить услугу</button>
      <div v-if="editId" class="service-form mt-3">
        <input class="input" v-model="svc.title" placeholder="Название">
        <input class="input" v-model="svc.desc" placeholder="Описание">
        <input class="input" v-model="svc.price" placeholder="Цена">
        <button class="btn btn-p btn-sm" @click="saveService">Сохранить</button>
      </div>
    </div>
    
    <!-- Контакты -->
    <div v-if="tab === 'contacts'" class="card fade-in-up">
      <h3>📞 Контакты</h3>
      <div class="contact-grid">
        <div><label>VK</label><input class="input" v-model="form.vk"></div>
        <div><label>Telegram</label><input class="input" v-model="form.tg"></div>
        <div><label>WhatsApp</label><input class="input" v-model="form.wa"></div>
        <div><label>Email</label><input class="input" v-model="form.email"></div>
        <div><label>YouTube</label><input class="input" v-model="form.yt"></div>
      </div>
    </div>
    
    <!-- Пользователи -->
    <div v-if="tab === 'users'" class="card fade-in-up">
      <h3>👥 Пользователи</h3>
      <div v-for="u in users" :key="u.id" class="user-row">
        <div>
          <strong>{{ u.username }}</strong>
          <small>{{ u.rating }}🏆 · {{ u.level }}</small>
        </div>
        <select @change="changeRole(u.id, $event.target.value)" :value="u.role" class="role-select">
          <option value="user">Участник</option>
          <option value="host">Хост</option>
          <option value="admin">Админ</option>
        </select>
      </div>
    </div>
    
    <!-- Дизайн (GrapesJS) -->
    <div v-if="tab === 'design'" class="card fade-in-up">
      <h3>🎨 Конструктор страниц</h3>
      <p style="color:var(--text-secondary);margin-bottom:12px">Визуальный редактор для изменения дизайна сайта</p>
      <div ref="gjsEditor" class="gjs-editor"></div>
    </div>
    
    <button class="btn btn-p w-100 mt-3" @click="saveSettings">💾 Сохранить все настройки</button>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['user', 'settings'],
  data() {
    return {
      tab: 'hero',
      form: {},
      services: [],
      users: [],
      editId: null,
      svc: { title: '', desc: '', price: '' },
      editor: null
    };
  },
  mounted() {
    this.form = { ...this.settings };
    this.loadServices();
  },
  methods: {
    async loadServices() {
      try { const r = await axios.get('/api/services'); this.services = r.data; } catch(e) {}
    },
    async saveSettings() {
      try {
        await axios.put('/api/settings', this.form);
        this.$emit('update-settings', this.form);
      } catch(e) {}
    },
    addService() { this.editId = 'new'; this.svc = { title: '', desc: '', price: '' }; },
    editService(s) { this.editId = s.id; this.svc = { ...s }; },
    async saveService() {
      try {
        if (this.editId === 'new') await axios.post('/api/services', this.svc);
        else await axios.put('/api/services/' + this.editId, this.svc);
        this.editId = null; this.loadServices();
      } catch(e) {}
    },
    async delService(id) {
      try { await axios.delete('/api/services/' + id); this.loadServices(); } catch(e) {}
    },
    async loadUsers() {
      try { const r = await axios.get('/api/admin/users'); this.users = r.data; } catch(e) {}
    },
    async changeRole(uid, role) {
      try { await axios.post('/api/admin/prom', { uid, role }); } catch(e) {}
    }
  },
  watch: {
    tab(v) { if (v === 'users') this.loadUsers(); if (v === 'design') this.$nextTick(() => this.initEditor()); }
  }
};
</script>

<style scoped>
.container { max-width: 1280px; margin: 0 auto; padding: 32px 24px; }
.section-title { font-size: 2rem; font-weight: 800; text-align: center; margin-bottom: 24px; }
.admin-tabs { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 24px; }
.tab-btn { padding: 10px 20px; border-radius: 50px; cursor: pointer; border: 2px solid #6366f1; background: transparent; color: #6366f1; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; }
.tab-btn.active, .tab-btn:hover { background: #6366f1; color: #fff; }
.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 16px; }
.input { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; font-family: inherit; font-size: 0.9rem; margin-bottom: 10px; }
.service-row, .user-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
.service-form { background: #f8fafc; padding: 14px; border-radius: 12px; }
.contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.role-select { padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: inherit; }
.gjs-editor { border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden; min-height: 400px; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: #6366f1; color: #fff; }
.btn-o { border: 2px solid #6366f1; color: #6366f1; background: transparent; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
.w-100 { width: 100%; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.fade-in-up { animation: fadeInUp 0.4s ease-out; }
</style>
