<template>
  <div class="card fade-in">
    <h3>📚 Словарь</h3>
    <div class="add-word-row">
      <input class="input" v-model="wordEn" placeholder="Слово на английском" @keyup.enter="addWord" :disabled="loading">
      <input class="input" v-model="wordRu" placeholder="Перевод" @keyup.enter="addWord" :disabled="loading">
      <button class="btn btn-p btn-sm" @click="addWord" :disabled="!wordEn || !wordRu || loading">
        {{ loading ? '...' : '+' }}
      </button>
    </div>
    <div v-if="loading && !words.length" class="empty-text">Загрузка...</div>
    <template v-else>
      <TransitionGroup name="word-list" tag="div">
        <div class="word-card" v-for="w in words" :key="w.id">
          <span><strong>{{ w.en }}</strong> — {{ w.ru }}</span>
          <button class="remove-btn" @click="$emit('delete-word', w.id)" title="Удалить">✕</button>
        </div>
      </TransitionGroup>
      <p v-if="!words.length && !loading" class="empty-text">Словарь пуст. Добавьте первое слово!</p>
    </template>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabWords',
  props: {
    words: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  emits: ['add-word', 'delete-word'],
  data() {
    return { wordEn: '', wordRu: '' };
  },
  methods: {
    addWord() {
      if (!this.wordEn.trim() || !this.wordRu.trim()) return;
      this.$emit('add-word', { en: this.wordEn.trim(), ru: this.wordRu.trim() });
      this.wordEn = '';
      this.wordRu = '';
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.add-word-row { display: flex; gap: 10px; margin-bottom: 18px; }
.input { padding: 11px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; font-family: inherit; font-size: 0.85rem; background: rgba(255,255,255,0.05); color: #fff; outline: none; flex: 1; }
.input:focus { border-color: #6366f1; }
.input:disabled { opacity: 0.5; }
.word-card { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 6px; border-left: 3px solid #6366f1; color: #cbd5e1; }
.remove-btn { color: #ef4444; background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px 8px; border-radius: 6px; transition: all 0.2s; }
.remove-btn:hover { background: rgba(239,68,68,0.15); }
.empty-text { text-align: center; color: #64748b; padding: 30px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }

.word-list-enter-active, .word-list-leave-active { transition: all 0.3s ease; }
.word-list-enter-from { opacity: 0; transform: translateX(-20px); }
.word-list-leave-to { opacity: 0; transform: translateX(20px); }
</style>
