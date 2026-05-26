<template>
  <div v-if="show" class="welcome-overlay" @click.self="close">
    <div class="welcome-card">
      <div class="welcome-icon">🗣️</div>
      <h2>Добро пожаловать в English Club!</h2>
      <p>Разговорный клуб для практики английского языка.</p>
      <div class="welcome-stats">
        <div class="stat-item">📅 {{ stats.meetings }} встреч</div>
        <div class="stat-item">💬 {{ stats.messages }} сообщений</div>
        <div class="stat-item">⭐ {{ stats.rating }} рейтинга</div>
      </div>
      <button class="welcome-btn" @click="close">Начать говорить! 🚀</button>
      <button class="welcome-skip" @click="close">Пропустить</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'WelcomeModal',
  data() {
    return { show: false, stats: { meetings: 0, messages: 0, rating: 0 } };
  },
  async mounted() {
    const dismissed = localStorage.getItem('welcome_dismissed');
    if (!dismissed) {
      await this.loadStats();
      this.show = true;
    }
  },
  methods: {
    close() {
      this.show = false;
      localStorage.setItem('welcome_dismissed', 'true');
    },
    async loadStats() {
      try {
        const [me, streak] = await Promise.all([
          axios.get('/api/me'),
          axios.get('/api/streak')
        ]);
        this.stats.rating = me.data.user?.rating || 0;
        this.stats.streak = streak.data?.streak || 0;
      } catch(e) {}
    }
  }
};
</script>

<style scoped>
.welcome-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.welcome-card {
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: 24px; padding: 40px; text-align: center;
  max-width: 420px; width: 90%; color: #fff;
  box-shadow: 0 20px 60px rgba(99,102,241,0.2);
  animation: welcomeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes welcomeIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.welcome-icon { font-size: 4rem; margin-bottom: 16px; animation: bounce 1s infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.welcome-card h2 { font-size: 1.5rem; margin-bottom: 8px; background: linear-gradient(135deg, #6366f1, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.welcome-card p { color: #94a3b8; margin-bottom: 24px; }
.welcome-stats { display: flex; gap: 16px; justify-content: center; margin-bottom: 24px; }
.stat-item { background: rgba(99,102,241,0.1); padding: 8px 16px; border-radius: 12px; font-size: 0.85rem; }
.welcome-btn { background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; border: none; padding: 12px 32px; border-radius: 50px; font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%; margin-bottom: 8px; transition: transform 0.2s; }
.welcome-btn:hover { transform: scale(1.05); }
.welcome-skip { background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.85rem; }
</style>
