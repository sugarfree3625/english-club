<template>
  <div class="card">
    <h3 class="card-title">🏆 Челлендж недели</h3>
    <p class="challenge-desc">{{ challenge.description }}</p>
    <div class="challenge-progress">
      <div class="challenge-track">
        <div class="challenge-fill" :style="{ width: (progress / challenge.target * 100) + '%' }"></div>
      </div>
      <span class="challenge-nums">{{ progress }}/{{ challenge.target }}</span>
    </div>
    <button v-if="progress < challenge.target" class="challenge-do-btn">
      Выполнить
    </button>
    <div v-else class="challenge-done">
      ✅ Выполнено! +{{ challenge.xp }} XP
    </div>
  </div>
</template>

<script>
const CHALLENGES = [
  { description: 'Запиши голосовое сообщение на 1 минуту о своих выходных!', target: 1, xp: 50 },
  { description: 'Добавь 10 новых слов в словарь!', target: 10, xp: 30 },
  { description: 'Напиши 20 сообщений в чате!', target: 20, xp: 40 },
  { description: 'Посети 3 встречи на этой неделе!', target: 3, xp: 60 }
];

export default {
  name: 'WeeklyChallenge',
  props: ['progress'],
  computed: {
    challenge() {
      const week = Math.floor(new Date().getTime() / (7 * 86400000));
      return CHALLENGES[week % CHALLENGES.length];
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 12px; }
.challenge-desc { font-size: 0.9rem; color: #94a3b8; margin-bottom: 12px; }
.challenge-progress { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.challenge-track { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.challenge-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 3px; transition: width 0.5s ease; }
.challenge-nums { font-size: 0.8rem; color: #94a3b8; }
.challenge-do-btn { width: 100%; padding: 10px; background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
.challenge-done { text-align: center; padding: 10px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; color: #10b981; font-weight: 600; }
</style>
