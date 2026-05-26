<template>
  <div class="trophies-container fade-in">
    <!-- Прогресс-бар -->
    <div class="trophy-header">
      <div class="trophy-level">
        <span class="trophy-level-icon">🏆</span>
        <div>
          <div class="trophy-level-title">Уровень трофеев</div>
          <div class="trophy-level-count">{{ earned }} / {{ total }}</div>
        </div>
      </div>
      <div class="trophy-percent">{{ percent }}%</div>
    </div>
    <div class="trophy-progress-bar">
      <div class="trophy-progress-fill" :style="{ width: percent + '%' }"></div>
    </div>

    <!-- Счётчики по редкости -->
    <div class="rarity-counts">
      <div class="rarity-item platinum">
        <span class="rarity-icon">💎</span>
        <span class="rarity-num">{{ counts.platinum }}</span>
      </div>
      <div class="rarity-item gold">
        <span class="rarity-icon">🥇</span>
        <span class="rarity-num">{{ counts.gold }}</span>
      </div>
      <div class="rarity-item silver">
        <span class="rarity-icon">🥈</span>
        <span class="rarity-num">{{ counts.silver }}</span>
      </div>
      <div class="rarity-item bronze">
        <span class="rarity-icon">🥉</span>
        <span class="rarity-num">{{ counts.bronze }}</span>
      </div>
    </div>

    <!-- Список трофеев -->
    <div class="trophy-list">
      <div v-for="a in achievements" :key="a.code" 
           class="trophy-row" 
           :class="{ unlocked: a.earned, locked: !a.earned }">
        <div class="trophy-row-icon" :class="a.rarity">
          <span>{{ a.icon }}</span>
        </div>
        <div class="trophy-row-info">
          <div class="trophy-row-name">{{ a.name }}</div>
          <div class="trophy-row-desc">{{ a.description }}</div>
          <div class="trophy-row-progress" v-if="!a.earned">
            <div class="trophy-row-progress-fill" :style="{ width: a.progressPercent + '%' }"></div>
          </div>
        </div>
        <div class="trophy-row-rarity" :class="a.rarity">
          {{ rarityLabel(a.rarity) }}
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
    counts() {
      const c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
      this.achievements.forEach(a => {
        if (a.earned && a.rarity) c[a.rarity] = (c[a.rarity] || 0) + 1;
      });
      return c;
    }
  },
  methods: {
    rarityLabel(r) {
      return { platinum: 'Платина', gold: 'Золото', silver: 'Серебро', bronze: 'Бронза' }[r] || '';
    }
  }
};
</script>

<style scoped>
.trophies-container {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 24px;
  color: #e2e8f0;
}

.trophy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.trophy-level {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trophy-level-icon {
  font-size: 2rem;
}

.trophy-level-title {
  font-size: 0.85rem;
  color: #94a3b8;
}

.trophy-level-count {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
}

.trophy-percent {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.trophy-progress-bar {
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  margin-bottom: 24px;
  overflow: hidden;
}

.trophy-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #2dd4bf);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.rarity-counts {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.rarity-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
}

.rarity-icon {
  font-size: 1.2rem;
}

.rarity-num {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.rarity-item.platinum { border-color: rgba(229,228,226,0.3); }
.rarity-item.gold { border-color: rgba(255,215,0,0.3); }
.rarity-item.silver { border-color: rgba(192,192,192,0.3); }
.rarity-item.bronze { border-color: rgba(205,127,50,0.3); }

.trophy-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 500px;
  overflow-y: auto;
}

.trophy-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  transition: all 0.2s;
}

.trophy-row:hover {
  background: rgba(255,255,255,0.04);
}

.trophy-row.locked {
  opacity: 0.45;
}

.trophy-row-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  flex-shrink: 0;
  background: rgba(255,255,255,0.04);
}

.trophy-row-icon.platinum { background: rgba(229,228,226,0.1); }
.trophy-row-icon.gold { background: rgba(255,215,0,0.1); }
.trophy-row-icon.silver { background: rgba(192,192,192,0.1); }
.trophy-row-icon.bronze { background: rgba(205,127,50,0.1); }

.trophy-row-info {
  flex: 1;
  min-width: 0;
}

.trophy-row-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}

.trophy-row-desc {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 6px;
}

.trophy-row-progress {
  height: 3px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  overflow: hidden;
}

.trophy-row-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #2dd4bf);
  border-radius: 2px;
}

.trophy-row-rarity {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  flex-shrink: 0;
}

.trophy-row-rarity.platinum { color: #e5e4e2; background: rgba(229,228,226,0.1); }
.trophy-row-rarity.gold { color: #ffd700; background: rgba(255,215,0,0.1); }
.trophy-row-rarity.silver { color: #c0c0c0; background: rgba(192,192,192,0.1); }
.trophy-row-rarity.bronze { color: #cd7f32; background: rgba(205,127,50,0.1); }

.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
