<template>
  <div class="admin-panel" v-if="user?.role === 'admin'">
    <button class="admin-btn" @click="show = true">⚙️</button>
    <div v-if="show" class="modal-overlay" @click.self="show = false">
      <div class="modal" style="max-width:700px">
        <h3>Админ-панель</h3>
        <div style="display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap">
          <button class="tab-btn" :class="{ active: tab === 'hero' }" @click="tab = 'hero'">Hero</button>
          <button class="tab-btn" :class="{ active: tab === 'services' }" @click="tab = 'services'">Услуги</button>
          <button class="tab-btn" :class="{ active: tab === 'contacts' }" @click="tab = 'contacts'">Контакты</button>
          <button class="tab-btn" :class="{ active: tab === 'users' }" @click="tab = 'users'">Польз.</button>
        </div>
        <div v-if="tab === 'hero'">
          <label>Заголовок</label><input class="input" v-model="form.hero_title">
          <label>Подзаголовок</label><input class="input" v-model="form.hero_subtitle">
          <label>О занятиях</label><textarea class="input" v-model="form.info_text" rows="3"></textarea>
        </div>
        <div v-if="tab === 'services'">
          <div v-for="s in services" :key="s.id" style="display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #e2e8f0;font-size:0.85rem">
            <span><strong>{{ s.title }}</strong> · {{ s.price }}</span>
            <div>
              <button class="btn btn-o btn-sm" @click="editService(s)">✏️</button>
              <button class="btn btn-o btn-sm" style="color:#ef4444" @click="delService(s.id)">🗑</button>
            </div>
          </div>
          <button class="btn btn-p btn-sm mt-3" @click="addService">+ Добавить</button>
          <div v-if="editId" class="card mt-3">
            <input class="input" v-model="svc.title" placeholder="Название">
            <input class="input" v-model="svc.desc" placeholder="Описание">
            <input class="input" v-model="svc.price" placeholder="Цена">
            <button class="btn btn-p btn-sm" @click="saveService">Сохранить</button>
          </div>
        </div>
        <div v-if="tab === 'contacts'">
          <label>VK</label><input class="input" v-model="form.vk">
          <label>Telegram</label><input class="input" v-model="form.tg">
          <label>WhatsApp</label><input class="input" v-model="form.wa">
          <label>Email</label><input class="input" v-model="form.email">
          <label>YouTube</label><input class="input" v-model="form.yt">
        </div>
        <div v-if="tab === 'users'">
          <div v-for="u in users" :key="u.id" style="display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #e2e8f0;font-size:0.85rem">
            <span>{{ u.username }} · {{ u.rating }} · {{ u.role }}</span>
            <select @change="changeRole(u.id, $event.target.value)" :value="u.role" style="padding:2px 6px;border-radius:4px">
              <option value="user">Участник</option>
              <option value="host">Хост</option>
              <option value="admin">Админ</option>
            </select>
          </div>
        </div>
        <button class="btn btn-p w-100 mt-3" @click="saveSettings">Сохранить всё</button>
        <button class="btn btn-o w-100 mt-2" @click="show = false">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['user', 'settings'],
  data() {
    return {
      show: false,
      tab: 'hero',
      form: {},
      services: [],
      users: [],
      editId: null,
      svc: {}
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
      try { await axios.put('/api/settings', this.form); this.$emit('update-settings', this.form); alert('Сохранено!'); } catch(e) {}
    },
    addService() { this.editId = 'new'; this.svc = { title: '', desc: '', price: '' }; },
    editService(s) { this.editId = s.id; this.svc = { ...s }; },
    async saveService() {
      try {
        if (this.editId === 'new') await axios.post('/api/services', this.svc);
        else await axios.put('/api/services/' + this.editId, this.svc);
        this.editId = null;
        this.loadServices();
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
    tab(v) { if (v === 'users') this.loadUsers(); }
  }
};
</script>

<style scoped>
.admin-panel { position: fixed; bottom: 16px; right: 16px; z-index: 1500; }
.admin-btn { width: 48px; height: 48px; border-radius: 50%; background: #6366f1; color: #fff; font-size: 1.2rem; border: none; cursor: pointer; box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.modal { background: #fff; border-radius: 16px; padding: 24px; width: 100%; max-height: 80vh; overflow-y: auto; }
.tab-btn { padding: 6px 12px; border-radius: 50px; cursor: pointer; border: 2px solid #6366f1; background: transparent; color: #6366f1; font-weight: 600; font-size: 0.8rem; margin-right: 4px; }
.tab-btn.active { background: #6366f1; color: #fff; }
.input { width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 0.85rem; margin-bottom: 10px; }
.card { background: #f8fafc; border-radius: 10px; padding: 14px; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; }
.btn-p { background: #6366f1; color: #fff; }
.btn-o { border: 2px solid #6366f1; color: #6366f1; background: transparent; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
.w-100 { width: 100%; }
</style>