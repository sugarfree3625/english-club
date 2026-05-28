<template>
  <div class="card fade-in">
    <h3>📝 Блокнот</h3>
    <textarea
      class="input note-area"
      :value="note"
      rows="8"
      @input="$emit('update-note', $event.target.value)"
      placeholder="Пишите заметки здесь..."
    ></textarea>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabNotes',
  props: {
    note: { type: String, default: '' }
  },
  emits: ['update-note']
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.input { padding: 11px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; font-family: inherit; font-size: 0.85rem; background: rgba(255,255,255,0.05); color: #fff; outline: none; }
.input:focus { border-color: #6366f1; }
.note-area { width: 100%; resize: vertical; min-height: 120px; }
</style>
