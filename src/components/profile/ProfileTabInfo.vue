<template>
  <div class="info-tab">
    <!-- Приветствие и статус -->
    <div class="welcome-card fade-in">
      <div class="welcome-content">
        <h2>👋 Привет, {{ user?.username }}!</h2>
        <p class="welcome-subtitle">{{ welcomeMessage }}</p>
      </div>
      <div class="status-badge" :class="statusClass">
        <span class="status-dot"></span> {{ statusText }}
      </div>
    </div>

    <!-- Мини-статистика -->
    <div class="stats-row fade-in">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-value">{{ stats.words }}</div>
        <div class="stat-label">Слов в словаре</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ stats.meetings }}</div>
        <div class="stat-label">Встреч</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-value">{{ stats.messages }}</div>
        <div class="stat-label">Сообщений</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-value">{{ stats.streak }}</div>
        <div class="stat-label">Дней стрика</div>
      </div>
    </div>

    <!-- Основная информация + Прогресс -->
    <div class="info-grid fade-in">
      <!-- Левая колонка -->
      <div class="card">
        <h3>📋 Основное</h3>
        <div class="info-list">
          <div class="info-row">
            <span class="info-label">Уровень</span>
            <span class="info-value level-badge">{{ user?.level }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Рейтинг</span>
            <span class="info-value rating-value">{{ user?.rating }} 🏆</span>
          </div>
          <div class="info-row">
            <span class="info-label">Роль</span>
            <span class="info-value role-badge" :class="roleClass">{{ roleLabel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">О себе</span>
            <span class="info-value bio-text">{{ user?.bio || 'Не указано' }}</span>
          </div>
        </div>
      </div>

      <!-- Правая колонка -->
      <div class="card">
        <h3>📈 Прогресс</h3>
        <div class="progress-section">
          <div class="progress-item">
            <div class="progress-header">
              <span>До следующего уровня</span>
              <span>{{ progressToNextLevel }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressToNextLevel + '%' }"></div>
            </div>
          </div>
          <div class="progress-item">
            <div class="progress-header">
              <span>Достижений получено</span>
              <span>{{ stats.achievements }}/{{ stats.totalAchievements }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill achievement-fill" :style="{ width: achievementPercent + '%' }"></div>
            </div>
          </div>
          <div class="next-achievement" v-if="nextAchievement">
            <span class="next-achievement-icon">🎯</span>
            <span>{{ nextAchievement }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Ближайшая встреча -->
    <div class="card fade-in" v-if="nextMeeting">
      <h3>📅 Ближайшая встреча</h3>
      <div class="meeting-preview">
        <div class="meeting-date">
          <span class="meeting-day">{{ meetingDay }}</span>
          <span class="meeting-month">{{ meetingMonth }}</span>
        </div>
        <div class="meeting-info">
          <div class="meeting-title">{{ nextMeeting.title }}</div>
          <div class="meeting-time">{{ meetingTime }}</div>
        </div>
        <button class="btn btn-p btn-sm" @click="$router.push('/calendar')">Перейти</button>
      </div>
    </div>
    <div class="card fade-in empty-meeting" v-else>
      <h3>📅 Ближайшая встреча</h3>
      <p class="empty-text">Нет запланированных встреч</p>
      <button class="btn btn-p btn-sm" @click="$router.push('/calendar')">Записаться</button>
    </div>

    <!-- Быстрые действия -->
    <div class="card fade-in">
      <h3>⚡ Быстрые действия</h3>
      <div class="quick-actions">
        <button class="action-btn" @click="$emit('switch-tab', 'words')">
          <span class="action-icon">📚</span>
          <span>Словарь</span>
        </button>
        <button class="action-btn" @click="$emit('switch-tab', 'myschedule')">
          <span class="action-icon">📅</span>
          <span>Расписание</span>
        </button>
        <button class="action-btn" @click="$router.push('/messages')">
          <span class="action-icon">💬</span>
          <span>Сообщения</span>
        </button>
        <button class="action-btn" @click="$emit('switch-tab', 'achievements')">
          <span class="action-icon">🏆</span>
          <span>Достижения</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ProfileTabInfo',
  props: ['user'],
  emits: ['switch-tab'],
  data() {
    return {
      stats: {
        words: 0,
        meetings: 0,
        messages: 0,
        streak: 0,
        achievements: 0,
        totalAchievements: 30
      },
      nextMeeting: null,
      nextAchievement: null
    };
  },
  computed: {
    roleLabel() {
      const role = this.user?.role;
      if (role === 'parent') return 'Родитель';
      if (role === 'admin' || role === 'host') return 'Репетитор';
      return 'Ученик';
    },
    roleClass() {
      if (this.user?.role === 'parent') return 'role-parent';
      if (this.user?.role === 'admin' || this.user?.role === 'host') return 'role-tutor';
      return 'role-student';
    },
    welcomeMessage() {
      const hour = new Date().getHours();
      if (hour < 6) return 'Ночная сова! 🌙';
      if (hour < 12) return 'Доброе утро! ☀️';
      if (hour < 18) return 'Хорошего дня! 🌤️';
      return 'Добрый вечер! 🌆';
    },
    statusText() {
      if (this.stats.streak > 0) return `Активен (стрик ${this.stats.streak} дн.)`;
      return 'Онлайн';
    },
    statusClass() {
      return this.stats.streak > 0 ? 'status-active' : 'status-online';
    },
    progressToNextLevel() {
      const rating = this.user?.rating || 0;
      return Math.min(100, Math.round((rating % 100)));
    },
    achievementPercent() {
      return this.stats.totalAchievements > 0 
        ? Math.round((this.stats.achievements / this.stats.totalAchievements) * 100) 
        : 0;
    },
    meetingDay() {
      return this.nextMeeting ? new Date(this.nextMeeting.date).getDate() : '';
    },
    meetingMonth() {
      if (!this.nextMeeting) return '';
      return new Date(this.nextMeeting.date).toLocaleString('ru', { month: 'short' });
    },
    meetingTime() {
      return this.nextMeeting ? new Date(this.nextMeeting.date).toLocaleString('ru', { hour: '2-digit', minute: '2-digit' }) : '';
    }
  },
  async mounted() {
    await this.loadStats();
    await this.loadNextMeeting();
  },
  methods: {
    async loadStats() {
      try {
        const [wordsRes, achievementsRes, streakRes] = await Promise.all([
          axios.get('/api/words'),
          axios.get('/api/achievements'),
          axios.get('/api/streak')
        ]);
        
        this.stats.words = (wordsRes.data || []).length;
        this.stats.achievements = (achievementsRes.data || []).filter(a => a.earned).length;
        this.stats.totalAchievements = (achievementsRes.data || []).length || 30;
        this.stats.streak = streakRes.data?.streak || 0;
        
        // Ищем следующее достижение
        const next = (achievementsRes.data || []).find(a => !a.earned && a.progressPercent > 0 && a.progressPercent < 100);
        if (next) {
          this.nextAchievement = `${next.name} (${next.progressPercent}%)`;
        }
      } catch(e) {
        console.error('Ошибка загрузки статистики:', e);
      }
    },
    
    async loadNextMeeting() {
      try {
        const { data } = await axios.get('/api/slots');
        const upcoming = (data || []).filter(s => new Date(s.start_time) >= new Date());
        upcoming.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        if (upcoming.length > 0) {
          this.nextMeeting = {
            title: upcoming[0].title || 'Встреча',
            date: upcoming[0].start_time
          };
          this.stats.meetings = (data || []).length;
        }
      } catch(e) {}
    },
    
    switchTab(tab) {
      this.$emit('switch-tab', tab);
    }
  }
};
</script>

<style scoped>
.info-tab { display: flex; flex-direction: column; gap: 18px; }

/* Приветствие */
.welcome-card { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; }
.welcome-card h2 { color: #fff; font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; margin: 0 0 6px; }
.welcome-subtitle { color: #94a3b8; margin: 0; font-size: 0.9rem; }
.status-badge { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
.status-badge.status-online { background: rgba(16,185,129,0.15); color: #10b981; }
.status-badge.status-active { background: rgba(251,191,36,0.15); color: #fbbf24; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-online .status-dot { background: #10b981; box-shadow: 0 0 8px #10b981; }
.status-active .status-dot { background: #fbbf24; box-shadow: 0 0 8px #fbbf24; }

/* Мини-статистика */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 20px; text-align: center; transition: all 0.3s; }
.stat-card:hover { border-color: rgba(99,102,241,0.4); transform: translateY(-2px); }
.stat-icon { font-size: 1.6rem; margin-bottom: 8px; }
.stat-value { font-size: 1.6rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.stat-label { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; text-transform: uppercase; }

/* Карточки */
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin: 0 0 18px; color: #fff; font-family: 'Space Grotesk', sans-serif; font-size: 1rem; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
@media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } }

/* Инфо-список */
.info-list { display: flex; flex-direction: column; gap: 12px; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.03); border-radius: 12px; }
.info-label { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
.info-value { font-size: 0.9rem; color: #e2e8f0; font-weight: 600; }
.bio-text { color: #94a3b8; font-style: italic; font-weight: 400; max-width: 200px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Бейджи */
.level-badge { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; padding: 3px 12px; border-radius: 12px; font-size: 0.8rem; }
.rating-value { color: #fbbf24; }
.role-badge { padding: 3px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.role-student { background: rgba(99,102,241,0.15); color: #818cf8; }
.role-parent { background: rgba(251,191,36,0.15); color: #fbbf24; }
.role-tutor { background: rgba(16,185,129,0.15); color: #10b981; }

/* Прогресс */
.progress-section { display: flex; flex-direction: column; gap: 16px; }
.progress-item { }
.progress-header { display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; margin-bottom: 6px; }
.progress-bar { height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 4px; transition: width 0.6s ease; }
.achievement-fill { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.next-achievement { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(251,191,36,0.08); border-radius: 12px; font-size: 0.8rem; color: #fbbf24; }

/* Ближайшая встреча */
.meeting-preview { display: flex; align-items: center; gap: 16px; }
.meeting-date { display: flex; flex-direction: column; align-items: center; background: rgba(99,102,241,0.15); border-radius: 14px; padding: 10px 16px; min-width: 60px; }
.meeting-day { font-size: 1.4rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.meeting-month { font-size: 0.75rem; color: #818cf8; text-transform: uppercase; }
.meeting-info { flex: 1; }
.meeting-title { color: #fff; font-weight: 600; font-size: 0.95rem; }
.meeting-time { color: #94a3b8; font-size: 0.8rem; }
.empty-meeting { text-align: center; }

/* Быстрые действия */
.quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 768px) { .quick-actions { grid-template-columns: repeat(2, 1fr); } }
.action-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; color: #cbd5e1; cursor: pointer; font-family: inherit; font-size: 0.8rem; font-weight: 500; transition: all 0.2s; }
.action-btn:hover { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); color: #fff; transform: translateY(-1px); }
.action-icon { font-size: 1.4rem; }

.empty-text { text-align: center; color: #64748b; padding: 16px; font-size: 0.85rem; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }

.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
