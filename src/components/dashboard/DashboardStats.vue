<template>
  <div class="stats-grid">
    <div class="stat-card" v-for="stat in stats" :key="stat.label">
      <component :is="stat.icon" :size="24" />
      <div class="stat-info">
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { MessageCircle, Calendar, BookOpen, Trophy } from 'lucide-vue-next';

export default {
  name: 'DashboardStats',
  components: { MessageCircle, Calendar, BookOpen, Trophy },
  props: {
    messages: Number,
    meetings: Number,
    words: Number,
    achievements: Number
  },
  computed: {
    stats() {
      return [
        { icon: MessageCircle, value: this.messages || 0, label: 'Сообщений' },
        { icon: Calendar, value: this.meetings || 0, label: 'Встреч' },
        { icon: BookOpen, value: this.words || 0, label: 'Слов' },
        { icon: Trophy, value: this.achievements || 0, label: 'Ачивок' }
      ];
    }
  }
};
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
.stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: #6366f1; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; font-weight: 700; color: #fff; }
.stat-label { font-size: 0.75rem; color: #94a3b8; }
</style>
