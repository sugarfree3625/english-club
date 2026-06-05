<template>
  <div class="analytics-page">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="container">
      <h1 class="page-title"><span class="gradient-text">📊 Аналитика</span></h1>
      
      <!-- КАРТОЧКИ -->
      <div class="stats-row">
        <div class="stat-card glass-card" v-for="s in stats" :key="s.label">
          <span class="stat-icon">{{ s.icon }}</span>
          <span class="stat-value">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
          <span class="stat-change" :class="s.change > 0 ? 'up' : 'down'">
            {{ s.change > 0 ? '+' : '' }}{{ s.change }}%
          </span>
        </div>
      </div>

      <!-- ГРАФИКИ -->
      <div class="charts-grid">
        <div class="chart-card glass-card">
          <h3>📈 Активность по дням</h3>
          <div class="bar-chart">
            <div v-for="(d, i) in dailyData" :key="i" class="bar-col">
              <div class="bar" :style="{ height: d.value + '%' }"></div>
              <span class="bar-label">{{ d.label }}</span>
            </div>
          </div>
        </div>
        
        <div class="chart-card glass-card">
          <h3>🎯 Выполнение заданий</h3>
          <div class="donut-wrap">
            <svg viewBox="0 0 120 120" class="donut">
              <circle cx="60" cy="60" r="50" class="donut-track" />
              <circle cx="60" cy="60" r="50" class="donut-fill" :style="{ strokeDashoffset: 314 - (314 * homeworkRate / 100) }" />
            </svg>
            <span class="donut-text">{{ homeworkRate }}%</span>
          </div>
        </div>
      </div>

      <!-- ТАБЛИЦА -->
      <div class="table-card glass-card">
        <h3>📋 Последние действия</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Действие</th><th>Результат</th><th>XP</th></tr></thead>
            <tbody>
              <tr v-for="a in activities" :key="a.id">
                <td>{{ a.date }}</td>
                <td>{{ a.action }}</td>
                <td>{{ a.result }}</td>
                <td class="xp-cell">+{{ a.xp }} XP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const stats = ref([
  { icon: '📅', value: '24', label: 'Занятий', change: 12 },
  { icon: '📝', value: '18', label: 'Домашек', change: 8 },
  { icon: '📚', value: '156', label: 'Слов', change: 24 },
  { icon: '💬', value: '89', label: 'Сообщений', change: -3 },
]);

const dailyData = [
  { label: 'Пн', value: 80 }, { label: 'Вт', value: 60 }, { label: 'Ср', value: 90 },
  { label: 'Чт', value: 45 }, { label: 'Пт', value: 70 }, { label: 'Сб', value: 30 }, { label: 'Вс', value: 20 },
];

const homeworkRate = ref(78);

const activities = ref([
  { id: 1, date: '05.06', action: 'Добавлено слово', result: '✅', xp: 10 },
  { id: 2, date: '05.06', action: 'Отправлена домашка', result: '📤', xp: 30 },
  { id: 3, date: '04.06', action: 'Посещено занятие', result: '✅', xp: 50 },
  { id: 4, date: '04.06', action: 'Сообщение в чате', result: '💬', xp: 5 },
  { id: 5, date: '03.06', action: 'Получено достижение', result: '🏆', xp: 100 },
]);
</script>

<style scoped>
.analytics-page { min-height: 100vh; background: #0b1120; position: relative; overflow: hidden; padding: 40px 20px; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.1; pointer-events: none; }
.bg-orb-1 { width: 600px; height: 600px; background: #6366f1; top: -200px; left: -200px; }
.bg-orb-2 { width: 500px; height: 500px; background: #2dd4bf; bottom: -200px; right: -200px; }
.container { max-width: 1000px; margin: 0 auto; position: relative; z-index: 1; }
.page-title { text-align: center; font-family: 'Space Grotesk', sans-serif; font-size: 2rem; margin-bottom: 30px; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.glass-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; }

/* СТАТИСТИКА */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
@media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { text-align: center; padding: 20px; position: relative; }
.stat-icon { font-size: 1.5rem; display: block; margin-bottom: 8px; }
.stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 1.8rem; font-weight: 700; color: #fff; display: block; }
.stat-label { font-size: 0.75rem; color: #94a3b8; display: block; margin-top: 2px; }
.stat-change { font-size: 0.7rem; font-weight: 600; position: absolute; top: 16px; right: 16px; }
.stat-change.up { color: #10b981; }
.stat-change.down { color: #ef4444; }

/* ГРАФИКИ */
.charts-grid { display: grid; grid-template-columns: 1fr 300px; gap: 14px; margin-bottom: 24px; }
@media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }
.chart-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 0.95rem; color: #fff; margin: 0 0 16px; }
.bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 180px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }
.bar { width: 100%; background: linear-gradient(180deg, #6366f1, #2dd4bf); border-radius: 6px 6px 0 0; min-height: 4px; transition: height 0.6s; }
.bar-label { font-size: 0.7rem; color: #64748b; }
.donut-wrap { position: relative; width: 120px; height: 120px; margin: 20px auto; }
.donut { width: 100%; height: 100%; transform: rotate(-90deg); }
.donut-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 8; }
.donut-fill { fill: none; stroke: url(#donutGrad); stroke-width: 8; stroke-linecap: round; stroke-dasharray: 314; transition: stroke-dashoffset 1s ease; }
.donut-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; }

/* ТАБЛИЦА */
.table-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 0.95rem; color: #fff; margin: 0 0 16px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 14px; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); }
td { padding: 10px 14px; font-size: 0.85rem; color: #cbd5e1; border-bottom: 1px solid rgba(255,255,255,0.03); }
.xp-cell { color: #fbbf24; font-weight: 600; }
</style>
