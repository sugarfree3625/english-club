<template>
  <div class="card">
    <div class="card-header">
      <Calendar :size="22" />
      <h3>Ближайший урок</h3>
    </div>
    <div v-if="lesson" class="lesson-info">
      <div class="lesson-date">{{ formatDate(lesson.start_time) }} в {{ formatTime(lesson.start_time) }}</div>
      <div class="lesson-title">{{ lesson.title }}</div>
      <a v-if="lesson.meeting_link" :href="lesson.meeting_link" target="_blank" class="lesson-join-btn">
        Подключиться 📹
      </a>
    </div>
    <div v-else class="lesson-empty">
      <Calendar :size="40" class="empty-icon" />
      <p>Уроков в ближайший час нет</p>
      <button class="btn btn-p btn-sm" @click="$router.push('/calendar')">Записаться</button>
    </div>
  </div>
</template>

<script>
import { Calendar } from 'lucide-vue-next';

export default {
  name: 'UpcomingLesson',
  components: { Calendar },
  props: ['lesson'],
  methods: {
    formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'long', weekday: 'short' }) : ''; },
    formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ''; }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; color: #6366f1; }
.card-header h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.1rem; color: #fff; margin: 0; }
.lesson-info { display: flex; flex-direction: column; gap: 8px; }
.lesson-date { font-size: 0.85rem; color: #94a3b8; }
.lesson-title { font-size: 1rem; font-weight: 600; color: #fff; }
.lesson-join-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 0.9rem; margin-top: 4px; }
.lesson-empty { text-align: center; padding: 20px 0; color: #94a3b8; }
.lesson-empty p { margin: 8px 0 12px; }
.empty-icon { opacity: 0.3; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
</style>
