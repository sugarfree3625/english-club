<template>
  <div class="site-editor" v-if="user?.role === 'admin'">
    <!-- Шапка -->
    <div class="se-header">
      <div class="se-header-left">
        <h2>🎨 Управление сайтом</h2>
        <span class="se-status" :class="{ saving, saved: !saving && saved }">
          {{ saving ? '💾 Сохраняю...' : saved ? '✅ Сохранено' : '⚡ Готов к работе' }}
        </span>
      </div>
      <div class="se-header-right">
        <button class="btn btn-p btn-sm" @click="saveAll" :disabled="saving">
          <i class="fas fa-save"></i> Сохранить всё
        </button>
        <button class="btn btn-o btn-sm" @click="window.open('/', '_blank')">
          <i class="fas fa-external-link-alt"></i> Смотреть сайт
        </button>
        <button class="btn btn-o btn-sm" @click="$router.push('/dashboard')">
          <i class="fas fa-arrow-left"></i> Дашборд
        </button>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="se-tabs">
      <button 
        v-for="t in tabs" 
        :key="t.id" 
        class="se-tab" 
        :class="{ active: tab === t.id }" 
        @click="tab = t.id"
      >
        <span>{{ t.icon }}</span>
        <span>{{ t.label }}</span>
        <span v-if="t.count !== undefined && t.id === 'services'" class="tab-count">{{ form.services.length }}</span>
        <span v-if="t.count !== undefined && t.id === 'reviews'" class="tab-count">{{ form.reviews.length }}</span>
        <span v-if="t.count !== undefined && t.id === 'faq'" class="tab-count">{{ form.faqs.length }}</span>
      </button>
    </div>

    <!-- ==================== ГЛАВНАЯ (HERO) ==================== -->
    <div v-if="tab === 'hero'" class="se-panel">
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.hero = !sections.hero">
          <h3>🏠 Главный экран (Hero)</h3>
          <i :class="sections.hero ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </div>
        <div v-show="sections.hero" class="cm-card-body">
          <div class="field-group">
            <label>Заголовок</label>
            <input class="input" v-model="form.hero_title" placeholder="Анна Петрова" @input="markChanged">
          </div>
          <div class="field-group">
            <label>Подзаголовок</label>
            <textarea class="input note-area" v-model="form.hero_subtitle" rows="2" placeholder="Разговорный клуб нового поколения..." @input="markChanged"></textarea>
          </div>
          <div class="field-group">
            <label>Фото репетитора</label>
            <div 
              class="photo-upload drop-zone"
              :class="{ 'drop-active': dragOver }"
              @dragover.prevent="dragOver = true"
              @dragleave="dragOver = false"
              @drop.prevent="onDropPhoto"
            >
              <img v-if="form.tutor_photo" :src="form.tutor_photo" class="photo-preview">
              <div v-else class="photo-placeholder">
                <span v-if="dragOver">📥 Отпустите файл</span>
                <span v-else>📷</span>
              </div>
              <div class="photo-actions">
                <input class="input" v-model="form.tutor_photo" placeholder="URL фото" @input="markChanged">
                <button class="btn btn-o btn-sm" @click="$refs.photoInput.click()">
                  <i class="fas fa-upload"></i> Загрузить с компьютера
                </button>
                <input type="file" ref="photoInput" @change="uploadPhoto" hidden accept="image/*">
              </div>
            </div>
          </div>
          <div class="field-group">
            <label>Имя репетитора</label>
            <input class="input" v-model="form.tutor_name" placeholder="Анна Иванова" @input="markChanged">
          </div>
          <div class="field-group">
            <label>О себе</label>
            <textarea class="input note-area" v-model="form.tutor_bio" rows="3" placeholder="Расскажите о себе..." @input="markChanged"></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== УСЛУГИ ==================== -->
    <div v-if="tab === 'services'" class="se-panel">
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.services = !sections.services">
          <h3>📦 Услуги</h3>
          <div class="cm-card-header-right">
            <span class="tab-count">{{ form.services.length }}</span>
            <i :class="sections.services ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </div>
        </div>
        <div v-show="sections.services" class="cm-card-body">
          <draggable v-model="form.services" handle=".drag-handle" @end="markChanged">
            <div class="service-item" v-for="(s, i) in form.services" :key="i">
              <div class="drag-handle" title="Перетащить">⋮⋮</div>
              <div class="service-fields">
                <input class="input" v-model="s.title" placeholder="Название услуги" @input="markChanged">
                <input class="input" v-model="s.desc" placeholder="Описание" @input="markChanged">
                <div class="row-fields">
                  <input class="input" v-model="s.price" placeholder="Цена (например: 1 500 ₽)" @input="markChanged">
                  <input class="input" v-model="s.duration" placeholder="Длительность (например: 60 минут)" @input="markChanged">
                  <input class="input" v-model="s.icon" placeholder="Иконка" style="max-width:80px" @input="markChanged">
                </div>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="s.popular" @change="markChanged">
                  <span>Популярный выбор</span>
                </label>
              </div>
              <button class="btn btn-o btn-sm" style="color:#ef4444" @click="form.services.splice(i, 1); markChanged()">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </draggable>
          <button class="btn btn-p btn-sm w-100" @click="addService">
            <i class="fas fa-plus"></i> Добавить услугу
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== ОТЗЫВЫ ==================== -->
    <div v-if="tab === 'reviews'" class="se-panel">
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.reviews = !sections.reviews">
          <h3>⭐ Отзывы</h3>
          <div class="cm-card-header-right">
            <span class="tab-count">{{ form.reviews.length }}</span>
            <i :class="sections.reviews ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </div>
        </div>
        <div v-show="sections.reviews" class="cm-card-body">
          <div class="service-item" v-for="(r, i) in form.reviews" :key="i">
            <div class="service-fields">
              <input class="input" v-model="r.name" placeholder="Имя ученика" @input="markChanged">
              <textarea class="input note-area" v-model="r.text" rows="2" placeholder="Текст отзыва" @input="markChanged"></textarea>
              <div class="row-fields">
                <select class="input" v-model.number="r.stars" @change="markChanged">
                  <option v-for="s in 5" :key="s" :value="s">{{ '⭐'.repeat(s) }}</option>
                </select>
                <input class="input" v-model="r.role" placeholder="Роль (например: Senior Developer)" @input="markChanged">
                <input class="input" v-model="r.avatar" placeholder="URL аватара" @input="markChanged" style="max-width:200px">
              </div>
            </div>
            <button class="btn btn-o btn-sm" style="color:#ef4444" @click="form.reviews.splice(i, 1); markChanged()">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <button class="btn btn-p btn-sm w-100" @click="addReview">
            <i class="fas fa-plus"></i> Добавить отзыв
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== FAQ ==================== -->
    <div v-if="tab === 'faq'" class="se-panel">
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.faq = !sections.faq">
          <h3>❓ Частые вопросы</h3>
          <div class="cm-card-header-right">
            <span class="tab-count">{{ form.faqs.length }}</span>
            <i :class="sections.faq ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </div>
        </div>
        <div v-show="sections.faq" class="cm-card-body">
          <div class="service-item" v-for="(f, i) in form.faqs" :key="i">
            <div class="service-fields">
              <input class="input" v-model="f.q" placeholder="Вопрос" @input="markChanged">
              <textarea class="input note-area" v-model="f.a" rows="2" placeholder="Ответ" @input="markChanged"></textarea>
            </div>
            <button class="btn btn-o btn-sm" style="color:#ef4444" @click="form.faqs.splice(i, 1); markChanged()">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <button class="btn btn-p btn-sm w-100" @click="addFaq">
            <i class="fas fa-plus"></i> Добавить вопрос
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== КОНТАКТЫ ==================== -->
    <div v-if="tab === 'contacts'" class="se-panel">
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.contacts = !sections.contacts">
          <h3>📞 Контакты</h3>
          <i :class="sections.contacts ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </div>
        <div v-show="sections.contacts" class="cm-card-body">
          <div class="field-group">
            <label><i class="fab fa-telegram"></i> Telegram</label>
            <input class="input" v-model="form.tg" placeholder="https://t.me/username" @input="markChanged">
          </div>
          <div class="field-group">
            <label><i class="fab fa-whatsapp"></i> WhatsApp</label>
            <input class="input" v-model="form.wa" placeholder="https://wa.me/79161234567" @input="markChanged">
          </div>
          <div class="field-group">
            <label><i class="fab fa-vk"></i> VK</label>
            <input class="input" v-model="form.vk" placeholder="https://vk.com/username" @input="markChanged">
          </div>
          <div class="field-group">
            <label><i class="fas fa-envelope"></i> Email</label>
            <input class="input" v-model="form.email" placeholder="anna@english-club.ru" @input="markChanged">
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== БРЕНД + СТАТИСТИКА ==================== -->
    <div v-if="tab === 'brand'" class="se-panel">
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.brand = !sections.brand">
          <h3>🎨 Бренд</h3>
          <i :class="sections.brand ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </div>
        <div v-show="sections.brand" class="cm-card-body">
          <div class="field-group">
            <label>Название клуба</label>
            <input class="input" v-model="form.club_name" placeholder="English Club" @input="markChanged">
          </div>
          <div class="field-group">
            <label>Основной цвет</label>
            <div class="color-picker-row">
              <input class="input" v-model="form.primary_color" type="color" style="width:60px;height:40px;padding:2px" @input="markChanged">
              <input class="input" v-model="form.primary_color" placeholder="#6366f1" @input="markChanged">
            </div>
          </div>
        </div>
      </div>

      <!-- СТАТИСТИКА -->
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.stats = !sections.stats">
          <h3>📊 Статистика сайта</h3>
          <i :class="sections.stats ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </div>
        <div v-show="sections.stats" class="cm-card-body">
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-icon">👥</span>
              <span class="stat-value">{{ stats.users }}</span>
              <span class="stat-label">Пользователей</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">📅</span>
              <span class="stat-value">{{ stats.sessions }}</span>
              <span class="stat-label">Занятий</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">💬</span>
              <span class="stat-value">{{ stats.messages }}</span>
              <span class="stat-label">Сообщений</span>
            </div>
            <div class="stat-card">
              <span class="stat-icon">👁️</span>
              <span class="stat-value">{{ stats.views }}</span>
              <span class="stat-label">Просмотров</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="container" style="text-align:center;padding:80px 20px">
    <div class="empty-icon">🔒</div>
    <p style="color:#94a3b8;margin-top:16px">Доступ только для администратора</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SiteEditor',
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      tab: 'hero',
      saving: false,
      saved: false,
      changed: false,
      dragOver: false,
      sections: {
        hero: true,
        services: true,
        reviews: false,
        faq: false,
        contacts: true,
        brand: true,
        stats: true
      },
      tabs: [
        { id: 'hero', icon: '🏠', label: 'Главная' },
        { id: 'services', icon: '📦', label: 'Услуги' },
        { id: 'reviews', icon: '⭐', label: 'Отзывы' },
        { id: 'faq', icon: '❓', label: 'FAQ' },
        { id: 'contacts', icon: '📞', label: 'Контакты' },
        { id: 'brand', icon: '🎨', label: 'Бренд' }
      ],
      form: {
        hero_title: '',
        hero_subtitle: '',
        tutor_photo: '',
        tutor_name: '',
        tutor_bio: '',
        tg: '',
        wa: '',
        vk: '',
        email: '',
        club_name: 'English Club',
        primary_color: '#6366f1',
        services: [],
        reviews: [],
        faqs: []
      },
      stats: {
        users: 0,
        sessions: 0,
        messages: 0,
        views: 0
      }
    };
  },
  watch: {
    form: {
      deep: true,
      handler() {
        if (this.changed) {
          this.autoSave();
        }
      }
    }
  },
  async mounted() {
    await this.loadSettings();
    await this.loadStats();
    this.incrementViews();
  },
  methods: {
    async loadSettings() {
      try {
        const { data } = await axios.get('/api/site-settings');
        if (data && Object.keys(data).length > 0) {
          Object.keys(this.form).forEach(k => {
            if (data[k] !== undefined) {
              if (typeof data[k] === 'string') {
                this.form[k] = data[k];
              } else if (Array.isArray(data[k])) {
                this.form[k] = [...data[k]];
              }
            }
          });
        }
      } catch(e) {
        console.error('Ошибка загрузки:', e);
      }
    },

    async loadStats() {
      try {
        const [users, sessions, messages] = await Promise.all([
          axios.get('/api/users/count').catch(() => ({ data: { count: 0 } })),
          axios.get('/api/slots/count').catch(() => ({ data: { count: 0 } })),
          axios.get('/api/messages/count').catch(() => ({ data: { count: 0 } }))
        ]);
        this.stats.users = users.data?.count || 0;
        this.stats.sessions = sessions.data?.count || 0;
        this.stats.messages = messages.data?.count || 0;
        this.stats.views = parseInt(localStorage.getItem('site_views') || '0');
      } catch(e) {}
    },

    incrementViews() {
      let views = parseInt(localStorage.getItem('site_views') || '0');
      const today = localStorage.getItem('view_date');
      const now = new Date().toDateString();
      if (today !== now) {
        views++;
        localStorage.setItem('site_views', views);
        localStorage.setItem('view_date', now);
        this.stats.views = views;
      }
    },

    markChanged() {
      this.changed = true;
    },

    autoSave() {
      this.saved = false;
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        this.saveAll(true);
      }, 2000);
    },

    async saveAll(silent = false) {
      if (!silent) this.saving = true;
      
      try {
        const payload = { ...this.form };
        payload.services = this.form.services.map(s => ({
          title: s.title,
          desc: s.desc,
          price: s.price,
          duration: s.duration,
          icon: s.icon || '📦',
          popular: s.popular || false
        }));
        
        await axios.put('/api/site-settings', payload);
        
        this.changed = false;
        if (!silent) {
          this.saving = false;
          this.saved = true;
          this.addToast?.('✅ Настройки сохранены! Сайт обновлён!', 'success');
          setTimeout(() => { this.saved = false; }, 3000);
        } else {
          this.saved = true;
        }
      } catch(e) {
        if (!silent) {
          this.saving = false;
          this.addToast?.('❌ Ошибка сохранения', 'error');
        }
      }
    },

    onDropPhoto(e) {
      this.dragOver = false;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.uploadPhotoFile(file);
      }
    },

    uploadPhoto(e) {
      const file = e.target.files[0];
      if (file) this.uploadPhotoFile(file);
    },

    async uploadPhotoFile(file) {
      if (file.size > 5 * 1024 * 1024) {
        this.addToast?.('Файл больше 5MB', 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('img', file);
      
      try {
        const { data } = await axios.post('/api/nimg', formData);
        if (data.url) {
          this.form.tutor_photo = data.url;
          this.markChanged();
          this.addToast?.('📸 Фото загружено!', 'success');
        }
      } catch(e) {
        this.addToast?.('Ошибка загрузки фото', 'error');
      }
    },

    addService() {
      this.form.services.push({
        title: '',
        desc: '',
        price: '',
        duration: '60 минут',
        icon: '📦',
        popular: false
      });
      this.markChanged();
    },

    addReview() {
      this.form.reviews.push({
        name: '',
        text: '',
        stars: 5,
        role: 'Ученик',
        avatar: ''
      });
      this.markChanged();
    },

    addFaq() {
      this.form.faqs.push({ q: '', a: '' });
      this.markChanged();
    }
  },
  beforeUnmount() {
    clearTimeout(this._saveTimer);
  }
};
</script>

<style scoped>
.site-editor {
  min-height: 100vh;
  background: #0b1120;
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  color: #e2e8f0;
}

.se-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.se-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.se-header h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.se-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  color: #94a3b8;
}

.se-status.saving {
  color: #fbbf24;
  animation: pulse 1s infinite;
}

.se-status.saved {
  color: #10b981;
}

.se-header-right {
  display: flex;
  gap: 8px;
}

.se-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  padding: 4px;
  overflow-x: auto;
}

.se-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 10px;
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
}

.se-tab:hover {
  color: #fff;
  background: rgba(255,255,255,0.04);
}

.se-tab.active {
  background: rgba(99,102,241,0.15);
  color: #fff;
}

.cm-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  margin-bottom: 16px;
  overflow: hidden;
}

.cm-card-header {
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.cm-card-header:hover {
  background: rgba(255,255,255,0.02);
}

.cm-card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.cm-card-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cm-card-body {
  padding: 24px;
}

.tab-count {
  padding: 2px 10px;
  background: rgba(99,102,241,0.2);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #818cf8;
}

.field-group {
  margin-bottom: 18px;
}

.field-group label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.drop-zone {
  border: 2px dashed rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s;
}

.drop-zone.drop-active {
  border-color: #6366f1;
  background: rgba(99,102,241,0.05);
}

.photo-upload {
  display: flex;
  gap: 16px;
  align-items: center;
}

.photo-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(99,102,241,0.3);
  flex-shrink: 0;
}

.photo-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  border: 3px dashed rgba(255,255,255,0.1);
}

.photo-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: rgba(255,255,255,0.02);
  border-radius: 14px;
  margin-bottom: 10px;
  align-items: flex-start;
}

.drag-handle {
  cursor: grab;
  color: #64748b;
  font-size: 1.2rem;
  padding: 4px;
  margin-top: 6px;
}

.drag-handle:active {
  cursor: grabbing;
}

.service-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row-fields {
  display: flex;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #cbd5e1;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #6366f1;
}

.color-picker-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  text-align: center;
  padding: 24px 16px;
  background: rgba(255,255,255,0.02);
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.05);
}

.stat-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 8px;
}

.stat-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: block;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 4px;
  display: block;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-p {
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  color: #fff;
}

.btn-p:hover:not(:disabled) {
  box-shadow: 0 4px 15px rgba(99,102,241,0.3);
  transform: translateY(-1px);
}

.btn-o {
  border: 1px solid rgba(255,255,255,0.1);
  color: #cbd5e1;
  background: rgba(255,255,255,0.03);
}

.btn-o:hover {
  background: rgba(99,102,241,0.1);
  border-color: rgba(99,102,241,0.3);
}

.btn-sm {
  padding: 7px 16px;
  font-size: 0.8rem;
}

.w-100 {
  width: 100%;
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  color: #fff;
  font-size: 0.85rem;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #6366f1;
}

.note-area {
  resize: vertical;
  min-height: 60px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 768px) {
  .se-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .se-header-right {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .row-fields {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .photo-upload {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
