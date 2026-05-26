<template>
  <div class="card achievements-card fade-in">
    <h3>🏆 Трофеи</h3>
    <div class="trophy-stats">
      <div class="trophy-stat">
        <span class="trophy-icon">💎</span>
        <span class="trophy-count">{{ platinumCount }}</span>
        <span class="trophy-label">Платина</span>
      </div>
      <div class="trophy-stat">
        <span class="trophy-icon">🥇</span>
        <span class="trophy-count">{{ goldCount }}</span>
        <span class="trophy-label">Золото</span>
      </div>
      <div class="trophy-stat">
        <span class="trophy-icon">🥈</span>
        <span class="trophy-count">{{ silverCount }}</span>
        <span class="trophy-label">Серебро</span>
      </div>
      <div class="trophy-stat">
        <span class="trophy-icon">🥉</span>
        <span class="trophy-count">{{ bronzeCount }}</span>
        <span class="trophy-label">Бронза</span>
      </div>
    </div>
    <div class="trophy-grid">
      <div v-for="a in achievements" :key="a.code" 
           class="trophy-card" 
           :class="{ earned: a.earned, locked: !a.earned }">
        <div class="trophy-img">
          <span class="trophy-emoji">{{ a.icon }}</span>
          <div v-if="!a.earned" class="trophy-lock">🔒</div>
        </div>
        <div class="trophy-name">{{ a.name }}</div>
        <div class="trophy-points" v-if="a.points">+{{ a.points }} XP</div>
        <div class="trophy-progress" v-if="!a.earned">
          <div class="trophy-progress-fill" :style="{ width: a.progressPercent + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabAchievements',
  props: ['achievements', 'earned', 'total', 'percent'],
  computed: {
    platinumCount() {
      return this.achievements.filter(a => a.earned && a.rarity === 'platinum').length;
    },
    goldCount() {
      return this.achievements.filter(a => a.earned && a.rarity === 'gold').length;
    },
    silverCount() {
      return this.achievements.filter(a => a.earned && a.rarity === 'silver').length;
    },
    bronzeCount() {
      return this.achievements.filter(a => a.earned && a.rarity === 'bronze').length;
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; margin-bottom: 18px; color: #cbd5e1; padding: 24px; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; }
.trophy-stats { display: flex; gap: 8px; margin-bottom: 20px; }
.trophy-stat { flex: 1; text-align: center; background: rgba(255,255,255,0.03); padding: 10px 6px; border-radius: 12px; }
.trophy-icon { font-size: 1.3rem; display: block; }
.trophy-count { font-size: 1.1rem; font-weight: 800; color: #fff; }
.trophy-label { font-size: 0.65rem; color: #94a3b8; }
.trophy-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
.trophy-card { background: rgba(255,255,255,0.03); border: 2px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 14px; text-align: center; }
.trophy-card.earned { border-color: rgba(16,185,129,0.4); }
.trophy-card.locked { opacity: 0.5; }
.trophy-img { position: relative; display: inline-block; }
.trophy-emoji { font-size: 2rem; display: block; }
.trophy-lock { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1rem; }
.trophy-name { font-size: 0.75rem; font-weight: 600; color: #fff; margin-top: 6px; }
.trophy-points { font-size: 0.65rem; color: #f59e0b; margin-top: 4px; }
.trophy-progress { height: 3px; background: rgba(255,255,255,0.05); border-radius: 2px; margin-top: 6px; }
.trophy-progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; }
.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
