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
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; }
.achieve-stats { display: flex; gap: 20px; margin-bottom: 20px; }
.achieve-stat { text-align: center; flex: 1; }
.achieve-stat-value { display: block; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.achieve-stat-label { font-size: 0.8rem; color: #94a3b8; }
.achievements-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; }
.achieve-badge-card { background: rgba(255,255,255,0.03); border-radius: 20px; padding: 20px 14px; text-align: center; cursor: pointer; border: 2px solid rgba(255,255,255,0.06); transition: all 0.3s; }
.achieve-badge-card.earned { border-color: rgba(16,185,129,0.5); }
.achieve-icon { font-size: 2.5rem; display: block; }
.achieve-name { font-size: 0.75rem; font-weight: 600; margin-top: 4px; color: #cbd5e1; }
.achieve-progress-mini { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 10px; overflow: hidden; }
.achieve-progress-mini-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; max-width: 100%; }
.achieve-rarity { font-size: 0.7rem; margin-bottom: 4px; }
.achieve-rarity.bronze { color: #cd7f32; }
.achieve-rarity.silver { color: #c0c0c0; }
.achieve-rarity.gold { color: #ffd700; }
.achieve-rarity.platinum { color: #e5e4e2; }
.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
