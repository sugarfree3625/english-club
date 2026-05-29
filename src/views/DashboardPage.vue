<template>
  <div class="dashboard-wrapper">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>
    <div class="container">
      
      <!-- ПРИВЕТСТВИЕ -->
      <div class="welcome-section">
        <div class="welcome-left">
          <div class="welcome-avatar">
            <img :src="user?.avatar_url || 'https://ui-avatars.com/api/?name='+user?.username" :alt="user?.username" />
            <div class="welcome-level">{{ user?.level || 'A1' }}</div>
          </div>
          <div class="welcome-text">
            <h1>{{ greeting }}, <span class="gradient-text">{{ user?.username }}</span>!</h1>
            <p>{{ motivationText }}</p>
          </div>
        </div>
        <div class="welcome-right">
          <div class="streak-badge" v-if="streak > 0">
            <span class="streak-flame">🔥</span>
            <span class="streak-count">{{ streak }}</span>
            <span class="streak-label">дней стрика</span>
          </div>
          <div class="daily-bonus" @click="claimDailyBonus" v-if="!dailyClaimed">
            <span class="bonus-icon">🎁</span>
            <span class="bonus-text">Ежедневный бонус</span>
            <span class="bonus-xp">+10 XP</span>
          </div>
          <div class="daily-bonus claimed" v-else>
            <span class="bonus-icon">✅</span>
            <span class="bonus-text">Бонус получен</span>
          </div>
        </div>
      </div>

      <!-- СТАТИСТИКА -->
      <div class="stats-row">
        <div v-for="stat in statsCards" :key="stat.label" class="stat-card" :class="stat.color">
          <div class="stat-icon-wrap">
            <i :class="stat.icon"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" ref="statValues">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
          <div class="stat-spark"></div>
        </div>
      </div>

      <!-- БЫСТРЫЕ ДЕЙСТВИЯ + ТАЙМЕР -->
      <div class="actions-row">
        <div class="quick-actions">
          <button v-for="action in quickActions" :key="action.label" class="quick-btn" @click="action.handler">
            <span class="quick-icon">{{ action.emoji }}</span>
            <span>{{ action.label }}</span>
          </button>
        </div>
        <div class="next-meeting" v-if="nextMeeting">
          <span class="meeting-icon">📅</span>
          <div class="meeting-info">
            <span class="meeting-title">{{ nextMeeting.title }}</span>
            <span class="meeting-time">через {{ meetingCountdown }}</span>
          </div>
        </div>
      </div>

      <!-- ОСНОВНАЯ СЕТКА -->
      <div class="dashboard-grid">
        <div class="main-col">
          <!-- ГРАФИК АКТИВНОСТИ -->
          <div class="card">
            <h3>📊 Активность за неделю</h3>
            <div class="activity-chart">
              <div v-for="(day, i) in weeklyActivity" :key="i" class="chart-bar-col">
                <div class="chart-bar-wrap">
                  <div class="chart-bar" :style="{ height: getBarHeight(day.count) + '%' }">
                    <span class="chart-tooltip">{{ day.count }}</span>
                  </div>
                </div>
                <span class="chart-day">{{ day.label }}</span>
              </div>
            </div>
          </div>

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
                      <div class="quest-fill" :class="{ completed: q.current >= q.target }" :style="{ width: (q.current / q.target * 100) + '%' }"></div>
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
          <div class="card achievement-card" v-if="nextAchievement">
            <h3>🏆 Ближайшее достижение</h3>
            <div class="next-ach-big">
              <span class="next-ach-icon">{{ getIconEmoji(nextAchievement.icon) }}</span>
              <div class="next-ach-info">
                <div class="next-ach-name">{{ nextAchievement.name }}</div>
                <div class="next-ach-desc">{{ nextAchievement.description }}</div>
                <div class="ach-track-wrap">
                  <div class="ach-track">
                    <div class="ach-fill" :class="nextAchievement.rarity || 'bronze'" :style="{ width: nextAchievement.progressPercent + '%' }"></div>
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

          <!-- Прогресс уровня с кольцом -->
          <div class="card">
            <h3>📈 Прогресс уровня</h3>
            <div class="level-ring-wrap">
              <svg viewBox="0 0 120 120" class="level-ring-svg">
                <defs>
                  <linearGradient id="levelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#6366f1" />
                    <stop offset="100%" stop-color="#2dd4bf" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="50" class="level-ring-track" />
                <circle cx="60" cy="60" r="50" class="level-ring-fill" :style="{ strokeDashoffset: 314 - (314 * levelPercent / 100) }" />
              </svg>
              <div class="level-ring-text">
                <span class="level-ring-value">{{ user?.level || 'A1' }}</span>
                <span class="level-ring-xp">{{ user?.rating || 0 }} XP</span>
              </div>
            </div>
            <div class="level-labels">
              <span>{{ user?.level || 'A1' }}</span>
              <span class="level-arrow">→</span>
              <span>{{ nextLevel }}</span>
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
      weeklyActivity: [
        { label: 'Пн', count: 0 }, { label: 'Вт', count: 0 }, { label: 'Ср', count: 0 },
        { label: 'Чт', count: 0 }, { label: 'Пт', count: 0 }, { label: 'Сб', count: 0 }, { label: 'Вс', count: 0 }
      ],
      dailyQuests: [
        { id: 1, icon: '💬', title: 'Отправь 5 сообщений', target: 5, current: 0, xp: 10 },
        { id: 2, icon: '📚', title: 'Добавь 3 слова', target: 3, current: 0, xp: 15 },
        { id: 3, icon: '📅', title: 'Запишись на встречу', target: 1, current: 0, xp: 20 }
      ],
      nextMeeting: null,
      meetingCountdown: '',
      meetingTimer: null,
      dailyClaimed: false
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
    statsCards() {
      return [
        { icon: 'fas fa-comments', value: this.stats.messages, label: 'Сообщений', color: 'messages' },
        { icon: 'fas fa-calendar-check', value: this.stats.meetings, label: 'Встреч', color: 'meetings' },
        { icon: 'fas fa-book', value: this.stats.words, label: 'Слов', color: 'words' },
        { icon: 'fas fa-trophy', value: this.stats.achievements, label: 'Достижений', color: 'achievements' },
        { icon: 'fas fa-star', value: this.user?.rating || 0, label: 'Рейтинг', color: 'xp' },
        { icon: 'fas fa-layer-group', value: this.user?.level || 'A1', label: 'Уровень', color: 'level' }
      ];
    },
    quickActions() {
      return [
        { emoji: '💬', label: 'Чат', handler: () => this.$router.push('/messages') },
        { emoji: '📅', label: 'Встречи', handler: () => this.$router.push('/calendar') },
        { emoji: '🏆', label: 'Достижения', handler: this.goToAchievements },
        { emoji: '📚', label: 'Словарь', handler: () => this.goToProfile('words') },
        { emoji: '📝', label: 'Задания', handler: () => this.goToProfile('myhomework') }
      ];
    },
    nextAchievement() { return this.allAchievements.find(a => !a.earned) || null; },
    levelPercent() { return Math.min(100, (this.user?.rating || 0) % 100); },
    nextLevel() {
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const current = this.user?.level || 'A1';
      const idx = levels.indexOf(current);
      return idx >= 0 && idx < levels.length - 1 ? levels[idx + 1] : 'MAX';
    }
  },
  async mounted() {
    await this.loadData();
    this.checkDailyBonus();
    this.startMeetingTimer();
  },
  beforeUnmount() { clearInterval(this.meetingTimer); },
  methods: {
    async loadData() {
      try {
        const [streakRes, achRes, slotsRes, wordsRes] = await Promise.all([
          axios.get('/api/streak'), axios.get('/api/achievements'),
          axios.get('/api/slots'), axios.get('/api/words')
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
        
        const upcoming = this.weeklySlots.filter(s => new Date(s.start_time) >= new Date());
        upcoming.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        if (upcoming.length > 0) this.nextMeeting = upcoming[0];
      } catch(e) {}
    },

    startMeetingTimer() {
      this.updateCountdown();
      this.meetingTimer = setInterval(() => this.updateCountdown(), 60000);
    },
    updateCountdown() {
      if (!this.nextMeeting) return;
      const diff = new Date(this.nextMeeting.start_time) - new Date();
      if (diff <= 0) { this.meetingCountdown = 'сейчас'; return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      this.meetingCountdown = h > 0 ? `${h}ч ${m}м` : `${m} мин`;
    },

    getBarHeight(count) {
      const max = Math.max(...this.weeklyActivity.map(d => d.count), 1);
      return Math.round((count / max) * 100);
    },

    checkDailyBonus() {
      const today = new Date().toDateString();
      const lastClaim = localStorage.getItem('daily_bonus_date');
      this.dailyClaimed = lastClaim === today;
    },
    claimDailyBonus() {
      const today = new Date().toDateString();
      localStorage.setItem('daily_bonus_date', today);
      this.dailyClaimed = true;
      this.addToast('🎁 Ежедневный бонус получен! +10 XP', 'success');
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
.bg-orb { position: fixed; border-radius: 50%; filter: blur(130px); opacity: 0.1; pointer-events: none; }
.bg-orb-1 { width: 700px; height: 700px; background: #6366f1; top: -250px; left: -250px; animation: floatOrb 15s ease-in-out infinite; }
.bg-orb-2 { width: 500px; height: 500px; background: #2dd4bf; bottom: -200px; right: -200px; animation: floatOrb 18s ease-in-out infinite reverse; }
.bg-orb-3 { width: 400px; height: 400px; background: #f59e0b; top: 50%; left: 50%; animation: floatOrb 20s ease-in-out infinite; }
@keyframes floatOrb { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(40px,-40px)scale(1.08)} }
.container { max-width: 1140px; margin: 0 auto; padding: 28px 20px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 20px; }

/* ПРИВЕТСТВИЕ */
.welcome-section { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.welcome-left { display: flex; align-items: center; gap: 16px; }
.welcome-avatar { position: relative; width: 64px; height: 64px; }
.welcome-avatar img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(99,102,241,0.5); }
.welcome-level { position: absolute; bottom: -4px; right: -6px; background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 0.65rem; font-weight: 700; }
.welcome-text h1 { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; color: #fff; margin: 0; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.welcome-text p { color: #94a3b8; margin: 4px 0 0; font-size: 0.9rem; }
.welcome-right { display: flex; flex-direction: column; gap: 8px; }
.streak-badge { display: flex; align-items: center; gap: 6px; padding: 10px 18px; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); border-radius: 16px; }
.streak-flame { font-size: 1.5rem; animation: flamePulse 1s ease-in-out infinite; }
@keyframes flamePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
.streak-count { font-size: 1.5rem; font-weight: 700; color: #fbbf24; font-family: 'Space Grotesk', sans-serif; }
.streak-label { color: #fbbf24; font-size: 0.8rem; }
.daily-bonus { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 14px; cursor: pointer; transition: all 0.2s; }
.daily-bonus:hover { background: rgba(16,185,129,0.2); transform: translateY(-2px); }
.daily-bonus.claimed { opacity: 0.6; cursor: default; }
.daily-bonus.claimed:hover { transform: none; }
.bonus-icon { font-size: 1.2rem; }
.bonus-text { color: #10b981; font-weight: 600; font-size: 0.8rem; }
.bonus-xp { color: #34d399; font-size: 0.75rem; font-weight: 700; }

/* СТАТИСТИКА */
.stats-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
@media (max-width: 900px) { .stats-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 500px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { position: relative; display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; transition: all 0.25s; overflow: hidden; }
.stat-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
.stat-spark { position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; border-radius: 50%; opacity: 0; transition: all 0.4s; }
.stat-card:hover .stat-spark { opacity: 0.08; background: #6366f1; }
.stat-icon-wrap { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.stat-card.messages .stat-icon-wrap { background: rgba(99,102,241,0.15); color: #818cf8; }
.stat-card.meetings .stat-icon-wrap { background: rgba(16,185,129,0.15); color: #10b981; }
.stat-card.words .stat-icon-wrap { background: rgba(251,191,36,0.15); color: #fbbf24; }
.stat-card.achievements .stat-icon-wrap { background: rgba(239,68,68,0.15); color: #ef4444; }
.stat-card.xp .stat-icon-wrap { background: rgba(99,102,241,0.15); color: #a5b4fc; }
.stat-card.level .stat-icon-wrap { background: rgba(16,185,129,0.15); color: #34d399; }
.stat-value { font-size: 1.4rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.stat-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; }

/* ДЕЙСТВИЯ + ТАЙМЕР */
.actions-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.quick-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.quick-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #cbd5e1; cursor: pointer; font-weight: 600; font-size: 0.82rem; transition: all 0.2s; font-family: inherit; }
.quick-btn:hover { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); color: #fff; transform: translateY(-2px); }
.quick-icon { font-size: 1.1rem; }
.next-meeting { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 14px; margin-left: auto; }
.meeting-icon { font-size: 1.3rem; }
.meeting-title { display: block; color: #fff; font-size: 0.8rem; font-weight: 600; }
.meeting-time { color: #10b981; font-size: 0.75rem; }

/* СЕТКА */
.dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
@media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
.main-col, .side-col { display: flex; flex-direction: column; gap: 16px; }

.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 14px; }

/* ГРАФИК */
.activity-chart { display: flex; align-items: flex-end; gap: 8px; height: 130px; padding: 0 4px; }
.chart-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }
.chart-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.chart-bar { width: 100%; background: linear-gradient(180deg, #6366f1, #2dd4bf); border-radius: 6px 6px 0 0; min-height: 4px; position: relative; transition: height 0.6s ease; cursor: pointer; }
.chart-bar:hover { filter: brightness(1.3); }
.chart-tooltip { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; opacity: 0; transition: opacity 0.2s; }
.chart-bar:hover .chart-tooltip { opacity: 1; }
.chart-day { font-size: 0.65rem; color: #64748b; }

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
.quest-fill.completed { background: #10b981; }
.quest-nums { font-size: 0.7rem; color: #94a3b8; min-width: 30px; text-align: right; }
.quest-xp { font-size: 0.75rem; color: #fbbf24; font-weight: 600; }
.quest-check { color: #10b981; font-size: 1.1rem; }

/* АЧИВКА */
.next-ach-big { display: flex; align-items: center; gap: 16px; }
.next-ach-icon { font-size: 2.5rem; }
.next-ach-name { font-size: 0.95rem; font-weight: 600; color: #fff; }
.next-ach-desc { font-size: 0.75rem; color: #94a3b8; margin: 2px 0 8px; }
.ach-track-wrap { display: flex; align-items: center; gap: 8px; }
.ach-track { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.ach-fill { height: 100%; border-radius: 3px; transition: width 0.6s; }
.ach-fill.bronze { background: linear-gradient(90deg, #cd7f32, #e8a850); }
.ach-fill.silver { background: linear-gradient(90deg, #a0a0a0, #d0d0d0); }
.ach-fill.gold { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.ach-fill.platinum { background: linear-gradient(90deg, #6366f1, #2dd4bf); }
.ach-nums { font-size: 0.7rem; color: #94a3b8; }

/* УРОВЕНЬ */
.level-ring-wrap { position: relative; width: 130px; height: 130px; margin: 0 auto; }
.level-ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.level-ring-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 8; }
.level-ring-fill { fill: none; stroke: url(#levelGrad); stroke-width: 8; stroke-linecap: round; stroke-dasharray: 314; transition: stroke-dashoffset 1.2s ease; filter: drop-shadow(0 0 6px rgba(99,102,241,0.5)); }
.level-ring-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.level-ring-value { font-size: 1.6rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.level-ring-xp { font-size: 0.7rem; color: #94a3b8; }
.level-labels { display: flex; justify-content: space-between; margin-top: 12px; font-size: 0.8rem; color: #94a3b8; font-weight: 600; }
.level-arrow { color: #6366f1; }
</style>
