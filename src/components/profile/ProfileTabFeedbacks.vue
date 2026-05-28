<template>
  <div class="card fade-in">
    <h3>📊 Фидбеки моих детей</h3>
    <div v-if="feedbacks.length" class="feedback-list">
      <div v-for="f in feedbacks" :key="f.id" class="feedback-card">
        <div class="feedback-header">
          <AppAvatar :src="f.student_avatar" :name="f.student_name" :size="40" />
          <div>
            <strong>{{ f.student_name }}</strong>
            <small>{{ formatDate(f.created_at) }}</small>
          </div>
          <div class="feedback-rating">
            <span v-for="i in 5" :key="i">{{ i <= f.rating ? '⭐' : '☆' }}</span>
          </div>
        </div>
        <div class="feedback-body">
          <div v-if="f.topic"><strong>Тема:</strong> {{ f.topic }}</div>
          <div v-if="f.good">👍 <strong>Хорошо:</strong> {{ f.good }}</div>
          <div v-if="f.improve">📝 <strong>Улучшить:</strong> {{ f.improve }}</div>
        </div>
      </div>
    </div>
    <p v-else class="empty-text">Нет фидбеков</p>
  </div>
</template>

<script>
import AppAvatar from '../AppAvatar.vue';

export default {
  name: 'ProfileTabFeedbacks',
  components: { AppAvatar },
  props: {
    feedbacks: { type: Array, default: () => [] }
  },
  methods: {
    formatDate(ts) {
      return ts ? new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.feedback-list { display: flex; flex-direction: column; gap: 12px; }
.feedback-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px; }
.feedback-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.feedback-header strong { color: #fff; font-size: 0.9rem; }
.feedback-header small { color: #94a3b8; font-size: 0.75rem; }
.feedback-rating { margin-left: auto; font-size: 0.85rem; }
.feedback-body { display: flex; flex-direction: column; gap: 6px; }
.feedback-body div { font-size: 0.85rem; color: #cbd5e1; }
.feedback-body strong { color: #94a3b8; }
.empty-text { text-align: center; color: #64748b; padding: 30px; }
</style>
