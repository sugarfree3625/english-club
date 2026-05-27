<template>
  <div class="card">
    <h3>🎯 Ежедневные задания</h3>
    <div class="quests-list">
      <div v-for="q in quests" :key="q.id" class="quest-item" :class="{ done: q.current >= q.target }">
        <span class="quest-icon">{{ q.icon }}</span>
        <div class="quest-info">
          <div class="quest-title">{{ q.title }}</div>
          <div class="quest-progress">
            <div class="quest-track">
              <div class="quest-fill" :style="{ width: (q.current / q.target * 100) + '%' }"></div>
            </div>
            <span class="quest-nums">{{ q.current }}/{{ q.target }}</span>
          </div>
        </div>
        <span class="quest-xp">+{{ q.xp }} XP</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DailyQuests',
  props: ['quests']
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 14px; }
.quests-list { display: flex; flex-direction: column; gap: 10px; }
.quest-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 14px; }
.quest-item.done { background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.3); }
.quest-icon { font-size: 1.5rem; }
.quest-info { flex: 1; }
.quest-title { font-size: 0.85rem; font-weight: 600; color: #fff; margin-bottom: 4px; }
.quest-progress { display: flex; align-items: center; gap: 8px; }
.quest-track { flex: 1; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
.quest-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; transition: width 0.5s ease; }
.quest-nums { font-size: 0.7rem; color: #94a3b8; }
.quest-xp { font-size: 0.75rem; font-weight: 700; color: #f59e0b; }
</style>
