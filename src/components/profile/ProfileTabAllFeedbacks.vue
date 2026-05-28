<template>
  <div class="all-feedbacks">
    <div class="page-header">
      <h2>⭐ Все фидбеки</h2>
      <div class="header-line"></div>
    </div>

    <!-- Статистика -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-value">{{ feedbacks.length }}</div>
        <div class="stat-label">Всего фидбеков</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-value">{{ uniqueStudents }}</div>
        <div class="stat-label">Учеников</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">{{ avgRating }}</div>
        <div class="stat-label">Средняя оценка</div>
      </div>
    </div>

    <!-- Список фидбеков -->
    <div class="section" v-if="feedbacks.length">
      <div class="feedback-list">
        <div v-for="fb in feedbacks" :key="fb.id" class="feedback-card">
          <div class="feedback-header">
            <AppAvatar :src="fb.student_avatar" :name="fb.student_name" :size="44" />
            <div class="feedback-user">
              <strong>{{ fb.student_name }}</strong>
              <small>от {{ fb.teacher_name }}</small>
            </div>
            <div class="feedback-rating">
              <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= fb.rating }">⭐</span>
            </div>
            <span class="feedback-date">{{ formatDate(fb.created_at) }}</span>
          </div>
          <div class="feedback-body">
            <div v-if="fb.topic" class="feedback-topic">
              <span class="label">📌 Тема:</span> {{ fb.topic }}
            </div>
            <div v-if="fb.good" class="feedback-good">
              <span class="label">👍 Хорошо:</span> {{ fb.good }}
            </div>
            <div v-if="fb.improve" class="feedback-improve">
              <span class="label">📝 Улучшить:</span> {{ fb.improve }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="section empty-section">
      <div class="empty-icon">📭</div>
      <p class="empty-text">Пока нет ни одного фидбека</p>
      <p class="empty-hint">Создайте первый фидбек для ученика во вкладке "Ученики"</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import AppAvatar from '../AppAvatar.vue';

export default {
  name: 'ProfileTabAllFeedbacks',
  components: { AppAvatar },
  props: ['isAdmin'],
  data() {
    return {
      feedbacks: []
    };
  },
  computed: {
    uniqueStudents() {
      return [...new Set(this.feedbacks.map(f => f.student_id))].length;
    },
    avgRating() {
      if (!this.feedbacks.length) return '0.0';
      const sum = this.feedbacks.reduce((acc, f) => acc + f.rating, 0);
      return (sum / this.feedbacks.length).toFixed(1);
    }
  },
  async mounted() {
    await this.loadFeedbacks();
  },
  methods: {
    async loadFeedbacks() {
      try {
        const { data } = await axios.get('/api/feedback/all');
        this.feedbacks = data || [];
      } catch(e) {
        console.error('Ошибка загрузки фидбеков:', e);
      }
    },
    formatDate(ts) {
      return ts ? new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    }
  }
};
</script>

<style scoped>
.all-feedbacks { display: flex; flex-direction: column; gap: 20px; color: #e2e8f0; }

.page-header { margin-bottom: 4px; }
.page-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; }
.header-line { height: 3px; width: 60px; background: linear-gradient(90deg, #fbbf24, #f59e0b); border-radius: 2px; margin-top: 8px; }

.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 768px) { .stats-row { grid-template-columns: 1fr; } }
.stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; text-align: center; }
.stat-card:hover { border-color: rgba(251,191,36,0.3); }
.stat-icon { font-size: 1.4rem; margin-bottom: 4px; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #fbbf24; font-family: 'Space Grotesk', sans-serif; }
.stat-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; }

.section { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; }
.empty-section { text-align: center; padding: 48px 24px; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-text { color: #94a3b8; font-size: 1rem; margin: 0 0 8px; }
.empty-hint { color: #64748b; font-size: 0.8rem; margin: 0; }

.feedback-list { display: flex; flex-direction: column; gap: 12px; }
.feedback-card { 
  background: rgba(255,255,255,0.03); 
  border: 1px solid rgba(255,255,255,0.06); 
  border-radius: 16px; 
  padding: 20px; 
  transition: all 0.2s; 
  overflow: hidden; 
  max-width: 100%; 
}
.feedback-card:hover { border-color: rgba(251,191,36,0.2); box-shadow: 0 0 20px rgba(251,191,36,0.05); }

.feedback-header { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin-bottom: 12px; 
  flex-wrap: wrap; 
  max-width: 100%; 
}
.feedback-user { 
  flex: 1; 
  min-width: 0; 
}
.feedback-user strong { 
  color: #fff; 
  font-size: 0.9rem; 
  display: block; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}
.feedback-user small { color: #94a3b8; font-size: 0.7rem; }

.feedback-rating { display: flex; gap: 2px; flex-shrink: 0; }
.star { font-size: 0.9rem; opacity: 0.3; }
.star.filled { opacity: 1; }
.feedback-date { 
  margin-left: auto; 
  color: #64748b; 
  font-size: 0.75rem; 
  flex-shrink: 0; 
}

.feedback-body { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  padding-left: 56px; 
  max-width: 100%; 
  overflow: hidden; 
}

.feedback-topic, .feedback-good, .feedback-improve { 
  font-size: 0.85rem; 
  color: #cbd5e1; 
  word-break: break-word; 
  overflow-wrap: break-word; 
  max-width: 100%; 
  line-height: 1.5; 
}

.label { font-weight: 600; color: #94a3b8; flex-shrink: 0; }
.feedback-good { color: #10b981; }
.feedback-improve { color: #f59e0b; }

@media (max-width: 500px) {
  .feedback-body { padding-left: 0; }
  .feedback-header { gap: 8px; }
}
</style>
