<template>
  <div class="progress-dashboard">
    <!-- Заголовок -->
    <div class="page-header">
      <h2>📊 Прогресс</h2>
      <div class="header-line"></div>
    </div>

    <!-- Мини-статистика -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-value">{{ stats.completedHW }}/{{ stats.totalHW }}</div>
        <div class="stat-label">Заданий выполнено</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">{{ stats.avgGrade }}</div>
        <div class="stat-label">Средняя оценка</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">{{ stats.totalXP }}</div>
        <div class="stat-label">XP заработано</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-value">{{ stats.streak }}</div>
        <div class="stat-label">Дней стрика</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-value">{{ stats.wordsCount }}</div>
        <div class="stat-label">Слов выучено</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-value">{{ stats.msgsCount }}</div>
        <div class="stat-label">Сообщений</div>
      </div>
    </div>

    <!-- Кольцо прогресса -->
    <div class="section">
      <h3>🎯 Выполнение заданий</h3>
      <div class="ring-container">
        <div class="ring-wrapper">
          <svg viewBox="0 0 140 140" class="ring-svg">
            <defs>
              <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#6366f1" />
                <stop offset="100%" stop-color="#2dd4bf" />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r="60" class="ring-track" />
            <circle cx="70" cy="70" r="60" class="ring-fill"
              :style="{ strokeDashoffset: 377 - (377 * percent / 100) }" />
          </svg>
          <div class="ring-text">
            <span class="ring-percent">{{ percent }}%</span>
            <span class="ring-label">выполнено</span>
          </div>
        </div>
        <div class="ring-legend">
          <div class="legend-item">
            <span class="legend-dot completed"></span>
            <span>Выполнено: {{ stats.completedHW }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot overdue"></span>
            <span>Просрочено: {{ stats.overdueHW }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot remaining"></span>
            <span>Осталось: {{ stats.totalHW - stats.completedHW }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- График по неделям -->
    <div class="section">
      <h3>📈 Активность по неделям</h3>
      <div class="bar-chart">
        <div v-for="(week, i) in stats.weeklyData" :key="i" class="bar-column">
          <div class="bar-value">{{ week.completed }}</div>
          <div class="bar-wrapper">
            <div 
              class="bar-fill" 
              :style="{ height: getBarHeight(week.completed) + '%' }"
              :title="week.completed + ' заданий'"
            ></div>
          </div>
          <div class="bar-label">{{ week.week }}</div>
        </div>
      </div>
    </div>

    <!-- Доп. информация -->
    <div class="section">
      <h3>🏆 Достижения</h3>
      <div class="achievements-mini">
        <div class="ach-row">
          <span>📋 Все задания</span>
          <div class="mini-progress-bar">
            <div class="mini-progress-fill" :style="{ width: percent + '%' }"></div>
          </div>
          <span class="ach-percent">{{ percent }}%</span>
        </div>
        <div class="ach-row">
          <span>⭐ Средняя оценка</span>
          <div class="mini-progress-bar">
            <div class="mini-progress-fill grade" :style="{ width: (stats.avgGrade / 10 * 100) + '%' }"></div>
          </div>
          <span class="ach-percent">{{ stats.avgGrade }}/10</span>
        </div>
        <div class="ach-row">
          <span>🔥 Стрик</span>
          <div class="mini-progress-bar">
            <div class="mini-progress-fill streak" :style="{ width: Math.min(100, stats.streak * 3.3) + '%' }"></div>
          </div>
          <span class="ach-percent">{{ stats.streak }} дн.</span>
        </div>
      </div>
    </div>

    <!-- Пусто -->
    <div v-if="!stats.totalHW" class="section empty-section">
      <div class="empty-icon">📭</div>
      <p class="empty-text">Пока нет данных для отображения</p>
      <p class="empty-hint">Начните выполнять задания, и статистика появится здесь!</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ProgressDashboard',
  data() {
    return {
      stats: {
        totalHW: 0,
        completedHW: 0,
        overdueHW: 0,
        avgGrade: 0,
        totalXP: 0,
        wordsCount: 0,
        msgsCount: 0,
        streak: 0,
        weeklyData: []
      }
    };
  },
  computed: {
    percent() {
      return this.stats.totalHW > 0 
        ? Math.round((this.stats.completedHW / this.stats.totalHW) * 100) 
        : 0;
    }
  },
  async mounted() {
    await this.loadStats();
  },
  methods: {
    async loadStats() {
      try {
        const { data } = await axios.get('/api/stats');
        if (data) this.stats = { ...this.stats, ...data };
      } catch(e) {
        console.error('Ошибка загрузки статистики:', e);
      }
    },
    getBarHeight(val) {
      const max = Math.max(...(this.stats.weeklyData || []).map(w => w.completed), 1);
      return Math.round((val / max) * 100);
    }
  }
};
</script>

<style scoped>
.progress-dashboard { display: flex; flex-direction: column; gap: 20px; color: #e2e8f0; }

.page-header { margin-bottom: 4px; }
.page-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; }
.header-line { height: 3px; width: 60px; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; margin-top: 8px; }

/* Статистика */
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; text-align: center; transition: all 0.2s; }
.stat-card:hover { border-color: rgba(99,102,241,0.3); }
.stat-icon { font-size: 1.4rem; margin-bottom: 4px; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.stat-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }

/* Секция */
.section { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; }
.section h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1rem; font-weight: 700; color: #fff; margin: 0 0 16px; }
.empty-section { text-align: center; padding: 48px 24px; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-text { color: #94a3b8; font-size: 1rem; margin: 0; }
.empty-hint { color: #64748b; font-size: 0.8rem; margin-top: 4px; }

/* Кольцо прогресса */
.ring-container { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; justify-content: center; }
.ring-wrapper { position: relative; width: 150px; height: 150px; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 10; }
.ring-fill { fill: none; stroke: url(#progressGrad); stroke-width: 10; stroke-linecap: round; stroke-dasharray: 377; transition: stroke-dashoffset 1.2s ease; filter: drop-shadow(0 0 8px rgba(99,102,241,0.5)); }
.ring-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring-percent { font-size: 2rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.ring-label { font-size: 0.7rem; color: #94a3b8; }
.ring-legend { display: flex; flex-direction: column; gap: 8px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #94a3b8; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.legend-dot.completed { background: linear-gradient(135deg, #6366f1, #2dd4bf); }
.legend-dot.overdue { background: #ef4444; }
.legend-dot.remaining { background: rgba(255,255,255,0.15); }

/* График */
.bar-chart { display: flex; align-items: flex-end; gap: 12px; height: 160px; padding: 0 4px; }
.bar-column { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
.bar-value { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
.bar-wrapper { flex: 1; width: 100%; max-width: 40px; background: rgba(255,255,255,0.04); border-radius: 8px 8px 0 0; position: relative; display: flex; align-items: flex-end; }
.bar-fill { width: 100%; background: linear-gradient(180deg, #6366f1, #2dd4bf); border-radius: 8px 8px 0 0; min-height: 4px; transition: height 0.8s ease; }
.bar-label { font-size: 0.65rem; color: #64748b; }

/* Мини-достижения */
.achievements-mini { display: flex; flex-direction: column; gap: 12px; }
.ach-row { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #cbd5e1; }
.ach-row span:first-child { min-width: 140px; }
.mini-progress-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.mini-progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 3px; transition: width 0.8s ease; }
.mini-progress-fill.grade { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.mini-progress-fill.streak { background: linear-gradient(90deg, #ef4444, #f59e0b); }
.ach-percent { font-weight: 600; color: #fff; font-size: 0.8rem; min-width: 50px; text-align: right; }
</style>
