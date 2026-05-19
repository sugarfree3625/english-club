<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal" style="max-width:500px">
      <h3>{{ editId ? '✏️ Редактировать встречу' : 'Новая встреча' }}</h3>
      <input class="input" v-model="form.title" placeholder="Название">
      <textarea class="input" v-model="form.desc" placeholder="Описание" rows="2"></textarea>
      <input class="input" type="datetime-local" v-model="form.date">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <input class="input" type="number" v-model="form.dur" placeholder="Длительность (мин)">
        <input class="input" type="number" v-model="form.max" placeholder="Мест">
      </div>
      <select class="input" v-model="form.type">
        <option value="google">Google Meet</option>
        <option value="zoom">Zoom</option>
      </select>
      <input class="input" v-if="form.type === 'zoom'" v-model="form.zlink" placeholder="Ссылка Zoom">
      <button class="btn btn-p w-100 mt-3" @click="submit">Сохранить</button>
      <button class="btn btn-o w-100 mt-2" @click="$emit('close')">Отмена</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['show', 'editId', 'dateStr'],
  emits: ['close', 'saved'],
  data() {
    return {
      form: { title: '', desc: '', date: '', dur: 60, max: 10, type: 'google', zlink: '' }
    };
  },
  watch: {
    show(val) {
      if (val) {
        if (this.editId) {
          this.loadSession();
        } else {
          this.form = {
            title: '',
            desc: '',
            date: this.dateStr ? this.dateStr + 'T19:00' : '',
            dur: 60,
            max: 10,
            type: 'google',
            zlink: ''
          };
        }
      }
    }
  },
  methods: {
    async loadSession() {
      try {
        const r = await axios.get('/api/ses');
        const s = r.data.find(s => s.id === this.editId);
        if (s) {
          this.form = {
            title: s.title || '',
            desc: s.description || '',
            date: s.date ? s.date.replace(' ', 'T').substring(0, 16) : '',
            dur: s.duration || 60,
            max: s.max_participants || 10,
            type: s.meeting_type || 'google',
            zlink: s.meeting_link || ''
          };
        }
      } catch(e) {}
    },
    async submit() {
      if (!this.form.title || !this.form.date) return alert('Заполните название и дату');
      try {
        const url = this.editId ? `/api/ses/${this.editId}` : '/api/ses';
        const method = this.editId ? 'put' : 'post';
        await axios[method](url, {
          title: this.form.title,
          desc: this.form.desc,
          date: this.form.date,
          dur: this.form.dur,
          max: this.form.max,
          type: this.form.type,
          zlink: this.form.zlink
        });
        this.$emit('saved');
        this.$emit('close');
      } catch(e) { alert('Ошибка сохранения'); }
    }
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.modal { background: #fff; border-radius: 16px; padding: 24px; width: 100%; max-height: 80vh; overflow-y: auto; }
.input { width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 0.9rem; margin-bottom: 10px; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; }
.btn-p { background: #6366f1; color: #fff; }
.btn-o { border: 2px solid #6366f1; color: #6366f1; background: transparent; }
.w-100 { width: 100%; }
</style>