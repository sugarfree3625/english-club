<template>
  <div class="site-editor" v-if="user?.role === 'admin'">
    <div class="se-header">
      <div class="se-header-left">
        <h2>🎨 Управление сайтом</h2>
        <span class="se-status" :class="{ saving, saved: !saving && saved }">
          {{ saving ? '💾 Сохраняю...' : saved ? '✅ Сохранено' : '⚡ Готов к работе' }}
        </span>
      </div>
      <div class="se-header-right">
        <button class="btn btn-p btn-sm" @click="saveAll" :disabled="saving">💾 Сохранить всё</button>
        <button class="btn btn-o btn-sm" @click="window.open('/', '_blank')">👁 Смотреть сайт</button>
        <button class="btn btn-o btn-sm" @click="$router.push('/dashboard')">← Дашборд</button>
      </div>
    </div>

    <div class="se-tabs">
      <button v-for="t in tabs" :key="t.id" class="se-tab" :class="{ active: tab === t.id }" @click="tab = t.id">
        <span>{{ t.icon }}</span>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <AdminHero v-if="tab === 'hero'" :form="form" @change="markChanged" @upload-photo="uploadPhotoFile" />
    <AdminServices v-if="tab === 'services'" :services="form.services" @change="markChanged" />
    <AdminReviews v-if="tab === 'reviews'" :reviews="form.reviews" @change="markChanged" />
    <AdminFAQ v-if="tab === 'faq'" :faqs="form.faqs" @change="markChanged" />
    <AdminContacts v-if="tab === 'contacts'" :form="form" @change="markChanged" />
    <AdminBrand v-if="tab === 'brand'" :form="form" :stats="stats" @change="markChanged" />
  </div>
  <div v-else class="container" style="text-align:center;padding:80px 20px">🔒 Доступ только для администратора</div>
</template>

<script>
import axios from 'axios';
import AdminHero from './admin/AdminHero.vue';
import AdminServices from './admin/AdminServices.vue';
import AdminReviews from './admin/AdminReviews.vue';
import AdminFAQ from './admin/AdminFAQ.vue';
import AdminContacts from './admin/AdminContacts.vue';
import AdminBrand from './admin/AdminBrand.vue';

export default {
  name: 'SiteEditor',
  components: { AdminHero, AdminServices, AdminReviews, AdminFAQ, AdminContacts, AdminBrand },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      tab: 'hero', saving: false, saved: false, changed: false,
      tabs: [
        { id: 'hero', icon: '🏠', label: 'Главная' },
        { id: 'services', icon: '📦', label: 'Услуги' },
        { id: 'reviews', icon: '⭐', label: 'Отзывы' },
        { id: 'faq', icon: '❓', label: 'FAQ' },
        { id: 'contacts', icon: '📞', label: 'Контакты' },
        { id: 'brand', icon: '🎨', label: 'Бренд' }
      ],
      form: { hero_title:'', hero_subtitle:'', tutor_photo:'', tutor_name:'', tutor_bio:'', tg:'', wa:'', vk:'', email:'', club_name:'English Club', primary_color:'#6366f1', services:[], reviews:[], faqs:[] },
      stats: { users: '-', sessions: '-', messages: '-', views: 0 }
    };
  },
  watch: { form: { deep: true, handler() { if (this.changed) this.autoSave(); } } },
  async mounted() { await this.loadSettings(); this.incrementViews(); },
  methods: {
    async loadSettings() {
      try {
        const { data } = await axios.get('/api/site-settings');
        if (data) Object.keys(this.form).forEach(k => { if (data[k] !== undefined) this.form[k] = typeof data[k] === 'string' ? data[k] : [...data[k]]; });
      } catch(e) {}
    },
    incrementViews() {
      let views = parseInt(localStorage.getItem('site_views') || '0');
      const today = new Date().toDateString();
      if (localStorage.getItem('view_date') !== today) { views++; localStorage.setItem('site_views', views); localStorage.setItem('view_date', today); }
      this.stats.views = views;
    },
    markChanged() { this.changed = true; },
    autoSave() { this.saved = false; clearTimeout(this._saveTimer); this._saveTimer = setTimeout(() => this.saveAll(true), 2000); },
    async saveAll(silent=false) {
      if (!silent) this.saving = true;
      try {
        await axios.put('/api/site-settings', this.form);
        this.changed = false;
        if (!silent) { this.saving = false; this.saved = true; this.addToast?.('✅ Сохранено!', 'success'); setTimeout(() => this.saved = false, 3000); }
        else this.saved = true;
      } catch(e) { if (!silent) { this.saving = false; this.addToast?.('❌ Ошибка', 'error'); } }
    },
    async uploadPhotoFile(file) {
      if (file.size > 5*1024*1024) return this.addToast?.('Файл > 5MB', 'error');
      const fd = new FormData(); fd.append('img', file);
      try { const { data } = await axios.post('/api/nimg', fd); if (data.url) { this.form.tutor_photo = data.url; this.markChanged(); this.addToast?.('📸 Загружено!', 'success'); } } catch(e) {}
    }
  },
  beforeUnmount() { clearTimeout(this._saveTimer); }
};
</script>

<style scoped>
.site-editor { min-height: 100vh; background: #0b1120; padding: 24px; max-width: 1100px; margin: 0 auto; color: #e2e8f0; }
.se-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.se-header-left { display: flex; align-items: center; gap: 16px; }
.se-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
.se-status { font-size: 0.8rem; font-weight: 600; padding: 4px 12px; border-radius: 8px; background: rgba(255,255,255,0.04); color: #94a3b8; }
.se-status.saving { color: #fbbf24; animation: pulse 1s infinite; }
.se-status.saved { color: #10b981; }
.se-header-right { display: flex; gap: 8px; }
.se-tabs { display: flex; gap: 4px; margin-bottom: 20px; background: rgba(255,255,255,0.03); border-radius: 14px; padding: 4px; overflow-x: auto; }
.se-tab { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: transparent; color: #94a3b8; cursor: pointer; font-weight: 600; font-size: 0.85rem; border-radius: 10px; transition: all 0.2s; font-family: inherit; white-space: nowrap; }
.se-tab:hover { color: #fff; background: rgba(255,255,255,0.04); }
.se-tab.active { background: rgba(99,102,241,0.15); color: #fff; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.03); }
.btn-o:hover { background: rgba(99,102,241,0.1); }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
