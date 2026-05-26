<template>
  <div class="welcome-overlay" @click.self="$emit('close')">
    <div class="welcome-card">
      <!-- Аватарка -->
      <div class="welcome-avatar-wrapper">
        <img 
          v-if="user?.avatar_url" 
          :src="user.avatar_url" 
          class="welcome-avatar"
          @error="$event.target.style.display='none'"
        >
        <div class="welcome-icon" v-else>🗣️</div>
      </div>
      <h2>{{ isNew ? 'Добро пожаловать в English Club!' : 'С возвращением, ' + user?.username + '!' }}</h2>
      <p>{{ isNew ? 'Разговорный клуб для практики английского языка.' : 'Продолжай практиковать английский!' }}</p>
      <div class="welcome-stats" v-if="!isNew">
        <div class="stat-item">⭐ {{ user?.rating || 0 }} рейтинга</div>
        <div class="stat-item">📊 {{ user?.level || 'B1' }}</div>
      </div>
      <button class="welcome-btn" @click="$emit('close')">{{ isNew ? 'Начать! 🚀' : 'Продолжить 🚀' }}</button>
      <button class="welcome-skip" @click="$emit('close')">Пропустить</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WelcomeModal',
  props: ['user', 'isNew'],
  emits: ['close']
};
</script>

<style scoped>
.welcome-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.welcome-card { background: var(--surface); border: 1px solid var(--b); border-radius: 24px; padding: 36px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: welcomeIn 0.5s ease; }
@keyframes welcomeIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.welcome-avatar-wrapper { margin-bottom: 16px; }
.welcome-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--p); animation: bounce 1s infinite; }
.welcome-icon { font-size: 4rem; animation: bounce 1s infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.welcome-card h2 { font-size: 1.4rem; margin-bottom: 8px; color: var(--t); }
.welcome-card p { color: var(--t2); margin-bottom: 20px; }
.welcome-stats { display: flex; gap: 12px; justify-content: center; margin-bottom: 20px; }
.stat-item { background: var(--bg); padding: 8px 16px; border-radius: 12px; font-size: 0.85rem; color: var(--t); }
.welcome-btn { background: linear-gradient(135deg, var(--p), var(--p2)); color: #fff; border: none; padding: 12px 0; border-radius: 50px; font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%; margin-bottom: 8px; transition: transform 0.2s; }
.welcome-btn:hover { transform: scale(1.05); }
.welcome-skip { background: none; border: none; color: var(--t2); cursor: pointer; font-size: 0.85rem; }
</style>
