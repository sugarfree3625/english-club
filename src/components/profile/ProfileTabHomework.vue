<template>
  <div class="card fade-in">
    <h3>📋 Создать задание</h3>
    
    <div class="form-group">
      <label class="form-label">Ученик</label>
      <select class="input" v-model="hwStudent">
        <option value="">Выберите ученика</option>
        <option v-for="s in students" :key="s.id" :value="s.id">{{ s.username }}</option>
      </select>
    </div>
    
    <div class="form-group">
      <label class="form-label">Тип задания</label>
      <div class="type-selector">
        <button v-for="t in types" :key="t.value" 
          class="type-btn" :class="{ active: hwType === t.value }"
          @click="hwType = t.value">
          <span class="type-icon">{{ t.icon }}</span>
          <span class="type-label">{{ t.label }}</span>
        </button>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Название</label>
      <input class="input" v-model="hwTitle" placeholder="Например: Прочитать текст и ответить на вопросы">
    </div>
    
    <div class="form-group">
      <label class="form-label">Описание</label>
      <textarea class="input note-area" v-model="hwDesc" rows="3" placeholder="Подробное описание задания..."></textarea>
    </div>
    
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">📅 Дедлайн</label>
        <input class="input" v-model="hwDueDate" type="date">
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label">⭐ Макс. оценка</label>
        <select class="input" v-model="hwMaxGrade">
          <option :value="5">5</option>
          <option :value="10" selected>10</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">🎯 Опыт за выполнение</label>
      <select class="input" v-model="hwExperience">
        <option :value="10">10 XP (лёгкое)</option>
        <option :value="50" selected>50 XP (среднее)</option>
        <option :value="100">100 XP (сложное)</option>
        <option :value="200">200 XP (очень сложное)</option>
      </select>
    </div>
    
    <button class="btn btn-p w-100" @click="createHomework" :disabled="!hwStudent || !hwTitle || loading">
      {{ loading ? '⏳ Создание...' : '✅ Создать задание' }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabHomework',
  props: {
    students: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  emits: ['create-homework'],
  data() {
    return { 
      hwStudent: '', hwTitle: '', hwDesc: '', hwDueDate: '',
      hwType: 'homework', hwMaxGrade: 10, hwExperience: 50
    };
  },
  computed: {
    types() {
      return [
        { value: 'homework', icon: '📝', label: 'Домашка' },
        { value: 'test', icon: '🎯', label: 'Тест' },
        { value: 'essay', icon: '📄', label: 'Эссе' },
        { value: 'audio', icon: '🎤', label: 'Аудио' }
      ];
    }
  },
  methods: {
    createHomework() {
      if (!this.hwStudent || !this.hwTitle) return;
      this.$emit('create-homework', {
        student_id: this.hwStudent,
        title: this.hwTitle,
        description: this.hwDesc,
        due_date: this.hwDueDate,
        type: this.hwType,
        max_grade: this.hwMaxGrade,
        experience: this.hwExperience
      });
      this.hwStudent = ''; this.hwTitle = ''; this.hwDesc = ''; 
      this.hwDueDate = ''; this.hwType = 'homework';
      this.hwMaxGrade = 10; this.hwExperience = 50;
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 20px; color: #fff; font-family: 'Space Grotesk', sans-serif; }

.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; margin-bottom: 6px; }
.form-row { display: flex; gap: 12px; }

.input { padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-family: inherit; font-size: 0.85rem; background: rgba(255,255,255,0.05); color: #fff; outline: none; width: 100%; }
.input:focus { border-color: #6366f1; }
select.input { cursor: pointer; }
.note-area { resize: vertical; min-height: 80px; }

.type-selector { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.type-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.type-btn:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.05); }
.type-btn.active { border-color: #6366f1; background: rgba(99,102,241,0.15); color: #fff; }
.type-icon { font-size: 1.3rem; }
.type-label { font-size: 0.7rem; font-weight: 500; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.w-100 { width: 100%; justify-content: center; }

@media (max-width: 500px) { .type-selector { grid-template-columns: repeat(2, 1fr); } .form-row { flex-direction: column; gap: 0; } }
</style>
