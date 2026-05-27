<template>
  <div class="card">
    <h3 class="card-title">🎯 Моя цель</h3>
    <p class="goal-text">Свободный разговор</p>
    <div class="goal-ring">
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#2dd4bf" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" class="goal-track" />
        <circle cx="50" cy="50" r="40" class="goal-fill"
          :style="{ strokeDashoffset: 251 - (251 * percent / 100) }" />
      </svg>
      <span class="goal-percent">{{ percent }}%</span>
    </div>
    <p class="goal-motivation">Осталось {{ remaining }} уроков до цели 🚀</p>
  </div>
</template>

<script>
export default {
  name: 'GoalProgress',
  props: ['percent', 'remaining']
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; text-align: center; color: #e2e8f0; }
.card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 8px; }
.goal-text { font-size: 0.9rem; color: #94a3b8; margin-bottom: 12px; }
.goal-ring { position: relative; width: 100px; height: 100px; margin: 0 auto 12px; }
.goal-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.goal-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 6; }
.goal-fill { fill: none; stroke: url(#goalGrad); stroke-width: 6; stroke-linecap: round; stroke-dasharray: 251; transition: stroke-dashoffset 1.5s ease; }
.goal-percent { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; font-weight: 700; color: #fff; }
.goal-motivation { font-size: 0.8rem; color: #94a3b8; }
</style>
