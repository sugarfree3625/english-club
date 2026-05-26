<template>
  <div class="card fade-in">
    <h3>🏆 Достижения</h3>
    <div class="achieve-stats">
      <div class="achieve-stat"><span class="achieve-stat-value">{{ earned }}</span><span class="achieve-stat-label">Получено</span></div>
      <div class="achieve-stat"><span class="achieve-stat-value">{{ total }}</span><span class="achieve-stat-label">Всего</span></div>
      <div class="achieve-stat"><span class="achieve-stat-value">{{ percent }}%</span><span class="achieve-stat-label">Выполнено</span></div>
    </div>
    <div class="achievements-grid">
      <div v-for="a in achievements" :key="a.code" class="achieve-badge-card" :class="{ earned: a.earned }">
        <div class="achieve-rarity" :class="a.rarity">{{ rarityLabel(a.rarity) }}</div>
        <span class="achieve-icon">{{ a.icon }}</span>
        <div class="achieve-name">{{ a.name }}</div>
        <div class="achieve-progress-mini" v-if="!a.earned">
          <div class="achieve-progress-mini-fill" :style="{ width: a.progressPercent + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabAchievements',
  props: ['achievements', 'earned', 'total', 'percent'],
  methods: {
    rarityLabel(r) {
      return { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' }[r] || '';
    }
  }
};
</script>

<style scoped>
.achieve-rarity { font-size: 0.7rem; margin-bottom: 4px; }
.achieve-rarity.bronze { color: #cd7f32; }
.achieve-rarity.silver { color: #c0c0c0; }
.achieve-rarity.gold { color: #ffd700; }
.achieve-rarity.platinum { color: #e5e4e2; }
</style>
