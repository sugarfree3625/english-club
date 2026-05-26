<template>
  <div v-if="show" class="unlock-overlay" @click="show = false">
    <div class="unlock-card">
      <div class="unlock-rarity" :class="achievement?.rarity">{{ rarityText }}</div>
      <span class="unlock-icon">{{ achievement?.icon }}</span>
      <h2>{{ achievement?.name }}</h2>
      <p>{{ achievement?.description }}</p>
      <div class="unlock-points">+{{ achievement?.points || 10 }} XP</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AchievementUnlock',
  props: ['achievement'],
  data() { return { show: true }; },
  computed: {
    rarityText() {
      const labels = { bronze: '🥉 БРОНЗОВЫЙ ТРОФЕЙ', silver: '🥈 СЕРЕБРЯНЫЙ ТРОФЕЙ', gold: '🥇 ЗОЛОТОЙ ТРОФЕЙ', platinum: '💎 ПЛАТИНОВЫЙ ТРОФЕЙ' };
      return labels[this.achievement?.rarity] || '🏆 ТРОФЕЙ';
    }
  },
  mounted() { setTimeout(() => { this.show = false; }, 4000); }
};
</script>

<style scoped>
.unlock-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.85); }
.unlock-card { background: linear-gradient(145deg, #1a1a2e, #16213e); border: 2px solid rgba(99,102,241,0.5); border-radius: 24px; padding: 36px 28px; text-align: center; max-width: 340px; width: 90%; animation: pop 0.5s ease; }
@keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.unlock-rarity { font-size: 0.8rem; font-weight: 700; margin-bottom: 8px; }
.unlock-rarity.bronze { color: #cd7f32; }
.unlock-rarity.silver { color: #c0c0c0; }
.unlock-rarity.gold { color: #ffd700; }
.unlock-rarity.platinum { color: #e5e4e2; }
.unlock-icon { font-size: 4rem; display: block; margin: 10px 0; }
.unlock-card h2 { color: #fff; font-size: 1.3rem; margin: 6px 0; }
.unlock-card p { color: #94a3b8; font-size: 0.85rem; }
.unlock-points { color: #f59e0b; font-weight: 700; margin-top: 6px; font-size: 1.1rem; }
</style>
