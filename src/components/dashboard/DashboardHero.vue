<template>
  <div class="hero-card">
    <div class="hero-left">
      <AppAvatar :src="user?.avatar_url" :name="user?.username || 'U'" :size="64" class="hero-avatar" />
      <div>
        <h1 class="hero-greeting">С возвращением, {{ user?.username }}! 👋</h1>
        <p class="hero-subtitle">{{ user?.level }} · {{ user?.rating }}🏆</p>
      </div>
    </div>
    <div class="hero-right">
      <div v-if="streak > 0" class="streak-badge">
        <span class="streak-fire">🔥</span>
        <span>{{ streak }} {{ daysWord(streak) }} подряд</span>
      </div>
      <div v-else class="streak-badge streak-start">
        Начни свою серию сегодня!
      </div>
      <p class="hero-motivation">{{ motivation }}</p>
    </div>
  </div>
</template>

<script>
import AppAvatar from '../AppAvatar.vue';

const MOTIVATIONS = [
  'Ты на верном пути! Продолжай! 🚀',
  'Каждый день практики делает тебя увереннее! 💪',
  'Маленький шаг сегодня — большой прогресс завтра! 🌟',
  'Ты уже лучше, чем вчера! 🔥',
  'Английский ждёт тебя! Давай! 🎯'
];

export default {
  name: 'DashboardHero',
  components: { AppAvatar },
  props: ['user', 'streak'],
  computed: {
    motivation() {
      return MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    }
  },
  methods: {
    daysWord(n) {
      if (n === 1) return 'день';
      if (n < 5) return 'дня';
      return 'дней';
    }
  }
};
</script>

<style scoped>
.hero-card {
  display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
  padding: 28px 32px; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
}
.hero-left { display: flex; align-items: center; gap: 14px; }
.hero-avatar { border: 2px solid rgba(255,255,255,0.2); }
.hero-greeting { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0; }
.hero-subtitle { color: #94a3b8; font-size: 0.9rem; margin-top: 4px; }
.hero-right { text-align: right; }
.streak-badge { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); border-radius: 14px; color: #fbbf24; font-weight: 600; font-size: 0.85rem; }
.streak-badge.streak-start { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: #94a3b8; }
.streak-fire { font-size: 1.3rem; animation: pulse 1s ease infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.hero-motivation { font-size: 0.8rem; color: #64748b; margin-top: 8px; font-style: italic; }
</style>
