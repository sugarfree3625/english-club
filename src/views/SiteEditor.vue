
<template>
  <div class="site-editor" v-if="user?.role === 'admin'">
    <div class="se-header">
      <h2>🎨 Управление сайтом</h2>
      <div style="display:flex;gap:8px">
        <button class="btn btn-p btn-sm" @click="saveAll">💾 Сохранить всё</button>
        <button class="btn btn-o btn-sm" @click="$router.push('/')">👁 Смотреть сайт</button>
        <button class="btn btn-o btn-sm" @click="$router.push('/dashboard')">← Дашборд</button>
      </div>
    </div>
    <div class="se-tabs">
      <button class="se-tab" :class="{ active: tab === 'content' }" @click="tab = 'content'">📝 Контент</button>
      <button class="se-tab" :class="{ active: tab === 'settings' }" @click="tab = 'settings'">⚙️ Настройки</button>
    </div>
    <div v-if="tab === 'content'" class="se-panel">
      <div class="cm-card">
        <h3>🏠 Главная страница</h3>
        <label>Заголовок</label><input class="input" v-model="form.hero_title">
        <label>Подзаголовок</label><input class="input" v-model="form.hero_subtitle">
        <label>Фото репетитора (URL)</label><input class="input" v-model="form.tutor_photo">
        <label>Имя</label><input class="input" v-model="form.tutor_name">
        <label>О себе</label><textarea class="input note-area" v-model="form.tutor_bio" rows="2"></textarea>
      </div>
      <div class="cm-card">
        <h3>📦 Услуги</h3>
        <div class="service-item" v-for="(s, i) in services" :key="s.id">
          <div class="service-fields">
            <input class="input" v-model="s.title" placeholder="Название">
            <input class="input" v-model="s.desc" placeholder="Описание">
            <div style="display:flex;gap:8px">
              <input class="input" v-model="s.price" placeholder="Цена" style="flex:1">
              <input class="input" v-model="s.icon" placeholder="Иконка" style="max-width:80px">
            </div>
          </div>
          <button class="btn btn-o btn-sm" style="color:#ef4444" @click="services.splice(i, 1)">🗑</button>
        </div>
        <button class="btn btn-p btn-sm w-100" @click="services.push({id:Date.now(),title:'',desc:'',price:'',icon:'📦'})">+ Добавить</button>
      </div>
      <div class="cm-card">
        <h3>⭐ Отзывы</h3>
        <div class="service-item" v-for="(r, i) in reviews" :key="i">
          <div class="service-fields">
            <input class="input" v-model="r.name" placeholder="Имя">
            <input class="input" v-model="r.text" placeholder="Текст">
            <div style="display:flex;gap:8px">
              <input class="input" v-model="r.stars" type="number" min="1" max="5" style="max-width:80px">
              <input class="input" v-model="r.role" placeholder="Роль" style="max-width:120px">
            </div>
          </div>
          <button class="btn btn-o btn-sm" style="color:#ef4444" @click="reviews.splice(i,1)">🗑</button>
        </div>
        <button class="btn btn-p btn-sm w-100" @click="reviews.push({name:'',text:'',stars:5,role:'Ученик'})">+ Добавить</button>
      </div>
      <div class="cm-card">
        <h3>❓ Частые вопросы</h3>
        <div class="service-item" v-for="(f, i) in faqs" :key="i">
          <div class="service-fields">
            <input class="input" v-model="f.q" placeholder="Вопрос">
            <textarea class="input note-area" v-model="f.a" rows="2" placeholder="Ответ"></textarea>
          </div>
          <button class="btn btn-o btn-sm" style="color:#ef4444" @click="faqs.splice(i,1)">🗑</button>
        </div>
        <button class="btn btn-p btn-sm w-100" @click="faqs.push({q:'',a:''})">+ Добавить</button>
      </div>
    </div>
    <div v-if="tab === 'settings'" class="se-panel">
      <div class="cm-card">
        <h3>📞 Контакты</h3>
        <label>Telegram</label><input class="input" v-model="form.tg">
        <label>WhatsApp</label><input class="input" v-model="form.wa">
        <label>VK</label><input class="input" v-model="form.vk">
        <label>Email</label><input class="input" v-model="form.email">
      </div>
      <div class="cm-card">
        <h3>🎨 Бренд</h3>
        <label>Название клуба</label><input class="input" v-model="form.club_name">
        <label>Основной цвет</label><input class="input" v-model="form.primary_color" type="color">
      </div>
    </div>
  </div>
  <div v-else class="container" style="text-align:center;padding:40px">
    <p>Доступ только для администратора</p>
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
      form: { hero_title:'', hero_subtitle:'', tutor_photo:'', tutor_name:'', tutor_bio:'', tg:'', wa:'', vk:'', email:'', club_name:'', primary_color:'#6366f1' },
      services: [],
      reviews: [],
      faqs: []
    };
  },
  async mounted() {
    await this.loadAll();
  },
  methods: {
    async loadAll() {
      try {
        const [s, r] = await Promise.all([axios.get('/api/services'), axios.get('/api/settings')]);
        this.services = s.data || [];
        const st = r.data || {};
        Object.keys(this.form).forEach(k => { if (st[k]) this.form[k] = st[k]; });
        this.reviews = JSON.parse(st.reviews || '[]');
        this.faqs = JSON.parse(st.faqs || '[]');
      } catch(e) {}
    },
    async saveAll() {
      try {
        await axios.put('/api/settings', { ...this.form, reviews: JSON.stringify(this.reviews), faqs: JSON.stringify(this.faqs) });
        alert('✅ Всё сохранено!');
      } catch(e) { alert('Ошибка сохранения'); }
    }
  }
};
</script>
