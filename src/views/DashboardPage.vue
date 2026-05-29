<template>
  <div class="dashboard-wrapper">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="container">
      
      <!-- ПРИВЕТСТВИЕ -->
      <div class="welcome-section">
        <div class="welcome-text">
          <h1>{{ greeting }}, {{ user?.username }}!</h1>
          <p>{{ motivationText }}</p>
        </div>
        <div class="streak-badge" v-if="streak > 0">
          <span class="streak-flame">🔥</span>
          <span class="streak-count">{{ streak }}</span>
          <span class="streak-label">дней</span>
        </div>
      </div>

      <!-- СТАТИСТИКА -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon-wrap messages">
            <i class="fas fa-comments"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.messages }}</div>
            <div class="stat-label">Сообщений</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap meetings">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.meetings }}</div>
            <div class="stat-label">Встреч</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap words">
            <i class="fas fa-book"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.words }}</div>
            <div class="stat-label">Слов</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap achievements">
            <i class="fas fa-trophy"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.achievements }}</div>
            <div class="stat-label">Достижений</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap xp">
            <i class="fas fa-star"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ user?.rating || 0 }}</div>
            <div class="stat-label">Рейтинг</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap level">
            <i class="fas fa-layer-group"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ user?.level || 'A1' }}</div>
            <div class="stat-label">Уровень</div>
          </div>
        </div>
      </div>

      <!-- БЫСТРЫЕ ДЕЙСТВИЯ -->
      <div class="quick-actions">
        <button class="quick-btn" @click="$router.push('/messages')">
          <i class="fas fa-comments"></i> Чат
        </button>
        <button class="quick-btn" @click="$router.push('/calendar')">
          <i class="fas fa-calendar"></i> Встречи
        </button>
        <button class="quick-btn" @click="goToAchievements">
          <i class="fas fa-trophy"></i> Достижения
        </button>
        <button class="quick-btn" @click="goToProfile('words')">
          <i class="fas fa-book"></i> Словарь
        </button>
        <button class="quick-btn" @click="goToProfile('myhomework')">
          <i class="fas fa-tasks"></i> Задания
        </button>
      </div>

      <!-- ОСНОВНАЯ СЕТКА -->
      <div class="dashboard-grid">
        <div class="main-col">
          <!-- Ежедневные задания -->
          <div class="card">
            <h3>🎯 Ежедневные задания</h3>
            <div class="quests-list">
              <div v-for="q in dailyQuests" :key="q.id" class="quest-item" :class="{ completed: q.current >= q.target }">
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
                <i v-if="q.current >= q.target" class="fas fa-check-circle quest-check"></i>
              </div>
            </div>
          </div>

          <!-- Ближайшая ачивка -->
          <div class="card" v-if="nextAchievement">
            <h3>🏆 Ближайшее достижение</h3>
            <div class="next-ach-big">
              <span class="next-ach-icon">{{ getIconEmoji(nextAchievement.icon) }}</span>
              <div class="next-ach-info">
                <div class="next-ach-name">{{ nextAchievement.name }}</div>
                <div class="next-ach-desc">{{ nextAchievement.description }}</div>
                <div class="ach-track-wrap">
                  <div class="ach-track">
                    <div class="ach-fill" :style="{ width: nextAchievement.progressPercent + '%' }"></div>
                  </div>
                  <span class="ach-nums">{{ nextAchievement.current_value || 0 }}/{{ nextAchievement.condition_value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Расписание -->
          <WeeklySchedule :slots="weeklySlots" />
        </div>

        <div class="side-col">
          <!-- Лидерборд -->
          <Leaderboard :currentUserId="user?.id" />

          <!-- Прогресс -->
          <div class="card">
            <h3>📈 Прогресс уровня</h3>
            <div class="level-progress">
              <div class="level-current">{{ user?.level || 'A1' }}</div>
              <div class="level-track-wrap">
                <div class="level-track">
                  <div class="level-fill" :style="{ width: levelPercent + '%' }"></div>
                </div>
                <span class="level-nums">{{ user?.rating || 0 }} XP</span>
              </div>
              <div class="level-next">{{ nextLevel }}</div>
            </div>
          </div>

          <!-- Мини-игра -->
          <MiniGame />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import WeeklySchedule from '../components/dashboard/WeeklySchedule.vue';
import Leaderboard from '../components/dashboard/Leaderboard.vue';
import MiniGame from '../components/dashboard/MiniGame.vue';

export default {
  name: 'DashboardPage',
  components: { WeeklySchedule, Leaderboard, MiniGame },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      streak: 0,
      stats: { messages: 0, meetings: 0, words: 0, achievements: 0 },
      weeklySlots: [],
      allAchievements: [],
      dailyQuests: [
        { id: 1, icon: '💬', title: 'Отправь 5 сообщений', target: 5, current: 0, xp: 10 },
        { id: 2, icon: '📚', title: 'Добавь 3 слова', target: 3, current: 0, xp: 15 },
        { id: 3, icon: '📅', title: 'Запишись на встречу', target: 1, current: 0, xp: 20 }
      ]
    };
  },
  computed: {
    greeting() {
      const h = new Date().getHours();
      if (h < 6) return 'Доброй ночи';
      if (h < 12) return 'Доброе утро';
      if (h < 18) return 'Добрый день';
      return 'Добрый вечер';
    },
    motivationText() {
      if (this.streak > 0) return `Огненный стрик — ${this.streak} дней подряд! Продолжай! 🔥`;
      return 'Начни новый день с активностью! 🚀';
    },
    nextAchievement() {
      return this.allAchievements.find(a => !a.earned) || null;
    },
    levelPercent() {
      const rating = this.user?.rating || 0;
      return Math.min(100, (rating % 100));
    },
    nextLevel() {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const current = this.user?.level || 'A1';
      const idx = levels.indexOf(current);
      return idx >= 0 && idx < levels.length - 1 ? levels[idx + 1] : 'MAX';
    }
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        const [streakRes, achRes, slotsRes, wordsRes] = await Promise.all([
          axios.get('/api/streak'),
          axios.get('/api/achievements'),
          axios.get('/api/slots'),
          axios.get('/api/words')
        ]);

        this.streak = streakRes.data?.streak || 0;
        this.allAchievements = achRes.data || [];
        this.weeklySlots = slotsRes.data || [];

        const earned = this.allAchievements.filter(a => a.earned);
        this.stats.achievements = earned.length;
        this.stats.words = (wordsRes.data || []).length;
        this.stats.messages = this.allAchievements.find(a => a.condition_field === 'messages_count')?.current_value || 0;
        this.stats.meetings = this.allAchievements.find(a => a.condition_field === 'meetings_count')?.current_value || 0;

        this.dailyQuests[0].current = Math.min(this.stats.messages, 5);
        this.dailyQuests[1].current = Math.min(this.stats.words, 3);
        this.dailyQuests[2].current = this.stats.meetings >= 1 ? 1 : 0;
      } catch(e) {}
    },

    getIconEmoji(name) {
      const map = { 'message-circle':'💬','book-open':'📖','library':'📚','calendar':'📅','star':'⭐','trophy':'🏆','crown':'👑' };
      return map[name] || '⭐';
    },

    goToAchievements() { localStorage.setItem('profile_tab', 'achievements'); this.$router.push('/profile'); },
    goToProfile(tab) { localStorage.setItem('profile_tab', tab); this.$router.push('/profile'); }
  }
};
</script>

<style scoped>
.dashboard-wrapper { min-height: 100vh; background: #0b1120; position: relative; overflow: hidden; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.12; pointer-events: none; }
.bg-orb-1 { width: 600px; height: 600px; background: #6366f1; top: -200px; left: -200px; animation: floatOrb 15s ease-in-out infinite; }
.bg-orb-2 { width: 500px; height: 500px; background: #2dd4bf; bottom: -200px; right: -200px; animation: floatOrb 18s ease-in-out infinite reverse; }
@keyframes floatOrb { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(30px,-30px)scale(1.05)} }
.container { max-width: 1100px; margin: 0 auto; padding: 28px 20px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 20px; }

/* ПРИВЕТСТВИЕ */
.welcome-section { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.welcome-text h1 { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; color: #fff; margin: 0; }
.welcome-text p { color: #94a3b8; margin: 4px 0 0; font-size: 0.9rem; }
.streak-badge { display: flex; align-items: center; gap: 6px; padding: 10px 18px; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); border-radius: 16px; }
.streak-flame { font-size: 1.5rem; animation: flamePulse 1s ease-in-out infinite; }
@keyframes flamePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
.streak-count { font-size: 1.5rem; font-weight: 700; color: #fbbf24; font-family: 'Space Grotesk', sans-serif; }
.streak-label { color: #fbbf24; font-size: 0.85rem; }

/* СТАТИСТИКА */
.stats-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 500px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; transition: all 0.2s; }
.stat-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-2px); }
.stat-icon-wrap { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
.stat-icon-wrap.messages { background: rgba(99,102,241,0.15); color: #818cf8; }
.stat-icon-wrap.meetings { background: rgba(16,185,129,0.15); color: #10b981; }
.stat-icon-wrap.words { background: rgba(251,191,36,0.15); color: #fbbf24; }
.stat-icon-wrap.achievements { background: rgba(239,68,68,0.15); color: #ef4444; }
.stat-icon-wrap.xp { background: rgba(99,102,241,0.15); color: #a5b4fc; }
.stat-icon-wrap.level { background: rgba(16,185,129,0.15); color: #34d399; }
.stat-value { font-size: 1.3rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.stat-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; }

/* БЫСТРЫЕ ДЕЙСТВИЯ */
.quick-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.quick-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; color: #fff; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; font-family: inherit; }
.quick-btn:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); transform: translateY(-2px); }
.quick-btn i { color: #818cf8; }

/* СЕТКА */
.dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
@media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
.main-col, .side-col { display: flex; flex-direction: column; gap: 16px; }

/* КАРТОЧКИ */
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 14px; }

/* ЗАДАНИЯ */
.quests-list { display: flex; flex-direction: column; gap: 10px; }
.quest-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: rgba(255,255,255,0.03); border-radius: 14px; transition: all 0.2s; }
.quest-item.completed { background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.2); }
.quest-icon { font-size: 1.2rem; }
.quest-info { flex: 1; }
.quest-title { font-size: 0.85rem; color: #fff; font-weight: 500; }
.quest-progress { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.quest-track { flex: 1; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
.quest-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; transition: width 0.6s; }
.quest-nums { font-size: 0.7rem; color: #94a3b8; min-width: 30px; text-align: right; }
.quest-xp { font-size: 0.75rem; color: #fbbf24; font-weight: 600; }
.quest-check { color: #10b981; font-size: 1.1rem; }

/* БЛИЖАЙШАЯ АЧИВКА */
.next-ach-big { display: flex; align-items: center; gap: 16px; }
.next-ach-icon { font-size: 2.5rem; }
.next-ach-info { flex: 1; }
.next-ach-name { font-size: 0.95rem; font-weight: 600; color: #fff; }
.next-ach-desc { font-size: 0.75rem; color: #94a3b8; margin: 2px 0 8px; }
.ach-track-wrap { display: flex; align-items: center; gap: 8px; }
.ach-track { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.ach-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 3px; transition: width 0.6s; }
.ach-nums { font-size: 0.7rem; color: #94a3b8; }

/* УРОВЕНЬ */
.level-progress { display: flex; align-items: center; gap: 10px; }
.level-current, .level-next { font-weight: 700; color: #fff; font-size: 0.9rem; }
.level-track-wrap { flex: 1; }
.level-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
.level-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 3px; transition: width 0.6s; }
.level-nums { font-size: 0.7rem; color: #94a3b8; }
</style>
