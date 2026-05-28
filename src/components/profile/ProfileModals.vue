<template>
  <!-- Просмотр ученика -->
  <div class="modal-overlay" v-if="viewingStudent" @click.self="$emit('close-view')">
    <div class="modal" style="max-width:500px">
      <h3>{{ viewingStudent.username }}</h3>
      <div class="info-grid">
        <div class="info-item"><strong>Уровень</strong><span>{{ viewingStudent.level }}</span></div>
        <div class="info-item"><strong>Рейтинг</strong><span>{{ viewingStudent.rating }}🏆</span></div>
      </div>
      <button class="btn btn-o w-100 mt-2" @click="$emit('close-view')">Закрыть</button>
    </div>
  </div>

  <!-- Привязать родителя -->
  <div class="modal-overlay" v-if="showBindParent" @click.self="$emit('close-bind')">
    <div class="modal" style="max-width:400px">
      <h3>Привязать родителя</h3>
      <input class="input" v-model="search" @input="$emit('search-parents', search)" placeholder="Поиск родителя...">
      <div v-for="p in parentResults" :key="p.id" class="student-card" @click="$emit('bind-parent', p.id)">
        <strong>{{ p.username }}</strong>
      </div>
      <p v-if="search && !parentResults.length" class="empty-text">Никого не найдено</p>
      <button class="btn btn-o w-100 mt-2" @click="$emit('close-bind')">Закрыть</button>
    </div>
  </div>

  <!-- Фидбек -->
  <div class="modal-overlay" v-if="showFeedback" @click.self="$emit('close-feedback')">
    <div class="modal" style="max-width:400px">
      <h3>Фидбек</h3>
      <select class="input" v-model="rating">
        <option v-for="n in 5" :key="n" :value="n">{{ '⭐'.repeat(n) }}</option>
      </select>
      <input class="input" v-model="topic" placeholder="Тема">
      <textarea class="input note-area" v-model="good" rows="2" placeholder="Хорошо"></textarea>
      <textarea class="input note-area" v-model="improve" rows="2" placeholder="Улучшить"></textarea>
      <button class="btn btn-p w-100" @click="submitFeedback">Отправить</button>
      <button class="btn btn-o w-100 mt-2" @click="$emit('close-feedback')">Закрыть</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileModals',
  props: {
    viewingStudent: Object,
    showBindParent: Boolean,
    parentResults: { type: Array, default: () => [] },
    showFeedback: Boolean
  },
  emits: ['close-view', 'close-bind', 'search-parents', 'bind-parent', 'close-feedback', 'submit-feedback'],
  data() {
    return { search: '', rating: 3, topic: '', good: '', improve: '' };
  },
  methods: {
    submitFeedback() {
      this.$emit('submit-feedback', {
        rating: this.rating,
        topic: this.topic,
        good: this.good,
        improve: this.improve
      });
      this.topic = '';
      this.good = '';
      this.improve = '';
      this.rating = 3;
    }
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; z-index: 5000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.modal { background: rgba(30,30,30,0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 28px; max-width: 90vw; max-height: 80vh; overflow-y: auto; color: #e2e8f0; }
.modal h3 { font-weight: 700; margin-bottom: 16px; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px; }
.info-item { display: flex; flex-direction: column; gap: 6px; }
.info-item strong { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }
.info-item span { font-size: 1rem; font-weight: 500; color: #e2e8f0; }
.input, select, textarea { padding: 11px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; font-family: inherit; font-size: 0.85rem; background: rgba(255,255,255,0.05); color: #fff; outline: none; width: 100%; margin-bottom: 8px; }
.input:focus, textarea:focus, select:focus { border-color: #6366f1; }
.note-area { resize: vertical; min-height: 60px; }
.student-card { padding: 12px 16px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s; }
.student-card:hover { background: rgba(99,102,241,0.2); }
.empty-text { text-align: center; color: #64748b; padding: 16px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.w-100 { width: 100%; justify-content: center; }
.mt-2 { margin-top: 12px; }
</style>
