<template>
  <div class="site-editor" v-if="user?.role === 'admin'">
    <!-- Шапка -->
    <div class="se-header">
      <div class="se-header-left">
        <h2>🎨 Управление сайтом</h2>
        <span class="se-status" :class="{ saving }">
          {{ saving ? '💾 Сохраняю...' : saved ? '✅ Сохранено' : '' }}
        </span>
      </div>
      <div class="se-header-right">
        <button class="btn btn-p btn-sm" @click="saveAll">
          <i class="fas fa-save"></i> Сохранить всё
        </button>
        <button class="btn btn-o btn-sm" @click="previewMode = !previewMode">
          <i :class="previewMode ? 'fas fa-edit' : 'fas fa-eye'"></i>
          {{ previewMode ? 'Редактор' : 'Предпросмотр' }}
        </button>
        <button class="btn btn-o btn-sm" @click="window.open('/', '_blank')">
          <i class="fas fa-external-link-alt"></i> Сайт
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
        <span v-if="t.count" class="tab-count">{{ t.count }}</span>
      </button>
    </div>

    <!-- КОНТЕНТ -->
    <div v-if="tab === 'content'" class="se-panel">
      <!-- Главная страница -->
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.home = !sections.home">
          <h3>🏠 Главная страница</h3>
          <i :class="sections.home ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </div>
        <div v-show="sections.home" class="cm-card-body">
          <div class="field-group">
            <label>Заголовок Hero</label>
            <input class="input" v-model="form.hero_title" placeholder="Анна Петрова">
          </div>
          <div class="field-group">
            <label>Подзаголовок</label>
            <input class="input" v-model="form.hero_subtitle" placeholder="Разговорный клуб нового поколения...">
          </div>
          <div class="field-group">
            <label>Фото репетитора</label>
            <div class="photo-upload">
              <img v-if="form.tutor_photo" :src="form.tutor_photo" class="photo-preview">
              <div v-else class="photo-placeholder">📷</div>
              <div class="photo-actions">
                <input class="input" v-model="form.tutor_photo" placeholder="URL фото">
                <button class="btn btn-o btn-sm" @click="$refs.photoInput.click()">
                  <i class="fas fa-upload"></i> Загрузить
                </button>
                <input type="file" ref="photoInput" @change="uploadPhoto" hidden accept="image/*">
              </div>
            </div>
          </div>
          <div class="field-group">
            <label>Имя</label>
            <input class="input" v-model="form.tutor_name" placeholder="Анна Иванова">
          </div>
          <div class="field-group">
            <label>О себе</label>
            <textarea class="input note-area" v-model="form.tutor_bio" rows="3" placeholder="Расскажите о себе..."></textarea>
          </div>
        </div>
      </div>

      <!-- Услуги -->
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.services = !sections.services">
          <h3>📦 Услуги</h3>
          <div class="cm-card-header-right">
            <span class="tab-count">{{ services.length }}</span>
            <i :class="sections.services ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </div>
        </div>
        <div v-show="sections.services" class="cm-card-body">
          <draggable v-model="services" handle=".drag-handle" @end="onDragEnd">
            <div class="service-item" v-for="(s, i) in services" :key="s.id">
              <div class="drag-handle" title="Перетащить">⋮⋮</div>
              <div class="service-fields">
                <input class="input" v-model="s.title" placeholder="Название услуги">
                <input class="input" v-model="s.desc" placeholder="Описание">
                <div class="row-fields">
                  <input class="input" v-model="s.price" placeholder="Цена (например: 1 500 ₽)">
                  <input class="input" v-model="s.duration" placeholder="Длительность (например: 60 минут)">
                  <input class="input" v-model="s.icon" placeholder="Иконка" style="max-width:80px">
                </div>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="s.popular">
                  <span>Популярный выбор</span>
                </label>
              </div>
              <button class="btn btn-o btn-sm" style="color:#ef4444" @click="services.splice(i, 1)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </draggable>
          <button class="btn btn-p btn-sm w-100" @click="addService">
            <i class="fas fa-plus"></i> Добавить услугу
          </button>
        </div>
      </div>

      <!-- Отзывы -->
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.reviews = !sections.reviews">
          <h3>⭐ Отзывы</h3>
          <div class="cm-card-header-right">
            <span class="tab-count">{{ reviews.length }}</span>
            <i :class="sections.reviews ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </div>
        </div>
        <div v-show="sections.reviews" class="cm-card-body">
          <div class="service-item" v-for="(r, i) in reviews" :key="i">
            <div class="service-fields">
              <input class="input" v-model="r.name" placeholder="Имя ученика">
              <textarea class="input note-area" v-model="r.text" rows="2" placeholder="Текст отзыва"></textarea>
              <div class="row-fields">
                <select class="input" v-model.number="r.stars">
                  <option v-for="s in 5" :key="s" :value="s">{{ '⭐'.repeat(s) }}</option>
                </select>
                <input class="input" v-model="r.role" placeholder="Роль (например: Senior Developer)">
              </div>
            </div>
            <button class="btn btn-o btn-sm" style="color:#ef4444" @click="reviews.splice(i, 1)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <button class="btn btn-p btn-sm w-100" @click="addReview">
            <i class="fas fa-plus"></i> Добавить отзыв
          </button>
        </div>
      </div>

      <!-- FAQ -->
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.faqs = !sections.faqs">
          <h3>❓ Частые вопросы</h3>
          <div class="cm-card-header-right">
            <span class="tab-count">{{ faqs.length }}</span>
            <i :class="sections.faqs ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </div>
        </div>
        <div v-show="sections.faqs" class="cm-card-body">
          <div class="service-item" v-for="(f, i) in faqs" :key="i">
            <div class="service-fields">
              <input class="input" v-model="f.q" placeholder="Вопрос">
              <textarea class="input note-area" v-model="f.a" rows="2" placeholder="Ответ"></textarea>
            </div>
            <button class="btn btn-o btn-sm" style="color:#ef4444" @click="faqs.splice(i, 1)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <button class="btn btn-p btn-sm w-100" @click="addFaq">
            <i class="fas fa-plus"></i> Добавить вопрос
          </button>
        </div>
      </div>
    </div>

    <!-- НАСТРОЙКИ -->
    <div v-if="tab === 'settings'" class="se-panel">
      <div class="cm-card">
        <div class="cm-card-header">
          <h3>📞 Контакты</h3>
        </div>
        <div class="cm-card-body">
          <div class="field-group">
            <label><i class="fab fa-telegram"></i> Telegram</label>
            <input class="input" v-model="form.tg" placeholder="https://t.me/username">
          </div>
          <div class="field-group">
            <label><i class="fab fa-whatsapp"></i> WhatsApp</label>
            <input class="input" v-model="form.wa" placeholder="https://wa.me/79161234567">
          </div>
          <div class="field-group">
            <label><i class="fab fa-vk"></i> VK</label>
            <input class="input" v-model="form.vk" placeholder="https://vk.com/username">
          </div>
          <div class="field-group">
            <label><i class="fas fa-envelope"></i> Email</label>
            <input class="input" v-model="form.email" placeholder="anna@english-club.ru">
          </div>
        </div>
      </div>

      <div class="cm-card">
        <div class="cm-card-header">
          <h3>🎨 Бренд</h3>
        </div>
        <div class="cm-card-body">
          <div class="field-group">
            <label>Название клуба</label>
            <input class="input" v-model="form.club_name" placeholder="English Club">
          </div>
          <div class="field-group">
            <label>Основной цвет</label>
            <div class="color-picker-row">
              <input class="input" v-model="form.primary_color" type="color" style="width:60px;height:40px;padding:2px">
              <input class="input" v-model="form.primary_color" placeholder="#6366f1">
            </div>
          </div>
        </div>
      </div>

      <div class="cm-card">
        <div class="cm-card-header">
          <h3>🔍 SEO</h3>
        </div>
        <div class="cm-card-body">
          <div class="field-group">
            <label>Заголовок страницы (title)</label>
            <input class="input" v-model="form.seo_title" placeholder="English Club — Разговорный клуб">
          </div>
          <div class="field-group">
            <label>Описание (description)</label>
            <textarea class="input note-area" v-model="form.seo_desc" rows="2" placeholder="Краткое описание сайта..."></textarea>
          </div>
          <div class="field-group">
            <label>Ключевые слова</label>
            <input class="input" v-model="form.seo_keywords" placeholder="английский, разговорный клуб, репетитор">
          </div>
        </div>
      </div>
    </div>

    <!-- СТАТИСТИКА -->
    <div v-if="tab === 'stats'" class="se-panel">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">👥</span>
          <span class="stat-value">{{ stats.users }}</span>
          <span class="stat-label">Пользователей</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📅</span>
          <span class="stat-value">{{ stats.slots }}</span>
          <span class="stat-label">Занятий</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">💬</span>
          <span class="stat-value">{{ stats.messages }}</span>
          <span class="stat-label">Сообщений</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📝</span>
          <span class="stat-value">{{ stats.homework }}</span>
          <span class="stat-label">Домашек</span>
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
  data() {
    return {
      tab: 'content',
      previewMode: false,
      saving: false,
      saved: false,
      sections: {
        home: true,
        services: true,
        reviews: false,
        faqs: false
      },
      tabs: [
        { id: 'content', icon: '📝', label: 'Контент' },
        { id: 'settings', icon: '⚙️', label: 'Настройки' },
        { id: 'stats', icon: '📊', label: 'Статистика' }
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
        club_name: '',
        primary_color: '#6366f1',
        seo_title: '',
        seo_desc: '',
        seo_keywords: ''
      },
      services: [],
      reviews: [],
      faqs: [],
      stats: {
        users: 0,
        slots: 0,
        messages: 0,
        homework: 0
      }
    };
  },
  watch: {
    form: {
      deep: true,
      handler() {
        this.autoSave();
      }
    },
    services: {
      deep: true,
      handler() {
        this.autoSave();
      }
    },
    reviews: {
      deep: true,
      handler() {
        this.autoSave();
      }
    },
    faqs: {
      deep: true,
      handler() {
        this.autoSave();
      }
    }
  },
  async mounted() {
    await this.loadAll();
    await this.loadStats();
  },
  methods: {
    async loadAll() {
      try {
        const [s, r] = await Promise.all([
          axios.get('/api/services'),
          axios.get('/api/settings')
        ]);
        this.services = (s.data || []).map(s => ({
          ...s,
          popular: s.popular || false,
          duration: s.duration || '60 минут'
        }));
        const st = r.data || {};
        Object.keys(this.form).forEach(k => {
          if (st[k] !== undefined) this.form[k] = st[k];
        });
        this.reviews = JSON.parse(st.reviews || '[]');
        this.faqs = JSON.parse(st.faqs || '[]');
      } catch(e) {
        console.error('Ошибка загрузки:', e);
      }
    },

    async loadStats() {
      try {
        const [users, slots, messages, homework] = await Promise.all([
          axios.get('/api/users/count'),
          axios.get('/api/slots/count'),
          axios.get('/api/messages/count'),
          axios.get('/api/homework/count')
        ]);
        this.stats = {
          users: users.data?.count || 0,
          slots: slots.data?.count || 0,
          messages: messages.data?.count || 0,
          homework: homework.data?.count || 0
        };
      } catch(e) {
        // Статистика недоступна — не страшно
      }
    },

    autoSave() {
      this.saved = false;
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        this.saveAll(true);
      }, 3000);
    },

    async saveAll(silent = false) {
      if (!silent) this.saving = true;
      try {
        await axios.put('/api/settings', {
          ...this.form,
          reviews: JSON.stringify(this.reviews),
          faqs: JSON.stringify(this.faqs)
        });
        await axios.put('/api/services', { services: this.services });
        
        if (!silent) {
          this.saving = false;
          this.saved = true;
          setTimeout(() => { this.saved = false; }, 2000);
        } else {
          this.saved = true;
        }
      } catch(e) {
        if (!silent) {
          this.saving = false;
          alert('Ошибка сохранения');
        }
      }
    },

    async uploadPhoto(e) {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('img', file);
      try {
        const { data } = await axios.post('/api/nimg', formData);
        if (data.url) {
          this.form.tutor_photo = data.url;
        }
      } catch(e) {
        alert('Ошибка загрузки фото');
      }
    },

    addService() {
      this.services.push({
        id: Date.now(),
        title: '',
        desc: '',
        price: '',
        duration: '60 минут',
        icon: '📦',
        popular: false
      });
    },

    addReview() {
      this.reviews.push({
        name: '',
        text: '',
        stars: 5,
        role: 'Ученик'
      });
    },

    addFaq() {
      this.faqs.push({ q: '', a: '' });
    },

    onDragEnd() {
      // Успешное перетаскивание
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
  max-width: 1200px;
  margin: 0 auto;
  color: #e2e8f0;
}

/* ШАПКА */
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

.se-header-right {
  display: flex;
  gap: 8px;
}

/* ВКЛАДКИ */
.se-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  padding: 4px;
}

.se-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 10px;
  transition: all 0.2s;
  font-family: inherit;
}

.se-tab:hover {
  color: #fff;
  background: rgba(255,255,255,0.04);
}

.se-tab.active {
  background: rgba(99,102,241,0.15);
  color: #fff;
}

.tab-count {
  padding: 1px 8px;
  background: rgba(99,102,241,0.2);
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
}

/* КАРТОЧКИ */
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
  padding: 0 24px 24px;
}

.field-group {
  margin-bottom: 16px;
}

.field-group label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 6px;
}

/* ФОТО */
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
}

.photo-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border: 3px dashed rgba(255,255,255,0.1);
}

.photo-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* УСЛУГИ / ОТЗЫВЫ / FAQ */
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
  margin-top: 4px;
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

/* СТАТИСТИКА */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-icon {
  font-size: 2rem;
}

.stat-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
}

/* КНОПКИ */
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

.btn-p {
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  color: #fff;
}

.btn-p:hover {
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

/* ПОЛЯ ВВОДА */
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

.color-picker-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* АНИМАЦИИ */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* АДАПТИВ */
@media (max-width: 768px) {
  .se-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .se-header-right {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .row-fields {
    flex-direction: column;
  }
  
  .se-tab {
    padding: 8px 14px;
    font-size: 0.8rem;
  }
}
</style>
