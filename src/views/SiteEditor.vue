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

      <!-- Контакты -->
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.contacts = !sections.contacts">
          <h3>📞 Контакты</h3>
          <i :class="sections.contacts ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </div>
        <div v-show="sections.contacts" class="cm-card-body">
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

      <!-- Бренд -->
      <div class="cm-card">
        <div class="cm-card-header" @click="sections.brand = !sections.brand">
          <h3>🎨 Бренд</h3>
          <i :class="sections.brand ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </div>
        <div v-show="sections.brand" class="cm-card-body">
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
    </div>

    <!-- НАСТРОЙКИ -->
    <div v-if="tab === 'settings'" class="se-panel">
      <div class="cm-card">
        <div class="cm-card-header">
          <h3>⚙️ Общие настройки</h3>
        </div>
        <div class="cm-card-body">
          <p style="color:#94a3b8;text-align:center;padding:20px">
            Настройки сохраняются автоматически при изменении любого поля на вкладке "Контент"
          </p>
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
      saving: false,
      saved: false,
      sections: {
        home: true,
        contacts: false,
        brand: false
      },
      tabs: [
        { id: 'content', icon: '📝', label: 'Контент' },
        { id: 'settings', icon: '⚙️', label: 'Настройки' }
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
        primary_color: '#6366f1'
      }
    };
  },
  watch: {
    form: {
      deep: true,
      handler() {
        this.autoSave();
      }
    }
  },
  async mounted() {
    await this.loadSettings();
  },
  methods: {
    async loadSettings() {
      try {
        const { data } = await axios.get('/api/settings');
        if (data) {
          Object.keys(this.form).forEach(k => {
            if (data[k] !== undefined) this.form[k] = data[k];
          });
        }
      } catch(e) {
        // Настройки ещё нет — используем данные из localStorage
        const saved = localStorage.getItem('site_settings');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            Object.keys(this.form).forEach(k => {
              if (parsed[k] !== undefined) this.form[k] = parsed[k];
            });
          } catch(e) {}
        }
      }
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
        // Пробуем сохранить на сервер
        await axios.put('/api/settings', this.form);
      } catch(e) {
        // Если сервер не отвечает — сохраняем в localStorage
        localStorage.setItem('site_settings', JSON.stringify(this.form));
      }
      
      if (!silent) {
        this.saving = false;
        this.saved = true;
        setTimeout(() => { this.saved = false; }, 2000);
      } else {
        this.saved = true;
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
  max-width: 1000px;
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

.color-picker-row {
  display: flex;
  gap: 12px;
  align-items: center;
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
}
</style>
