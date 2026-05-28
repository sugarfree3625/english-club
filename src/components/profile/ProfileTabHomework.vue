<template>
  <div class="card fade-in">
    <h3>📋 Создать задание</h3>
    <select class="input" v-model="hwStudent">
      <option value="">Выберите ученика</option>
      <option v-for="s in students" :key="s.id" :value="s.id">{{ s.username }}</option>
    </select>
    <input class="input" v-model="hwTitle" placeholder="Название задания">
    <textarea class="input note-area" v-model="hwDesc" rows="3" placeholder="Описание"></textarea>
    <input class="input" v-model="hwDueDate" type="date">
    <button class="btn btn-p btn-sm w-100" @click="createHomework" :disabled="!hwStudent || !hwTitle || loading">
      {{ loading ? 'Создание...' : 'Создать задание' }}
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
    return { hwStudent: '', hwTitle: '', hwDesc: '', hwDueDate: '' };
  },
  methods: {
    createHomework() {
      if (!this.hwStudent || !this.hwTitle) return;
      this.$emit('create-homework', {
        student_id: this.hwStudent,
        title: this.hwTitle,
        description: this.hwDesc,
        due_date: this.hwDueDate
      });
      this.hwStudent = '';
      this.hwTitle = '';
      this.hwDesc = '';
      this.hwDueDate = '';
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.input { padding: 11px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; font-family: inherit; font-size: 0.85rem; background: rgba(255,255,255,0.05); color: #fff; outline: none; width: 100%; margin-bottom: 8px; }
.input:focus { border-color: #6366f1; }
.note-area { resize: vertical; min-height: 80px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.w-100 { width: 100%; justify-content: center; }
</style>
