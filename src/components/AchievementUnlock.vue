<template>
  <transition name="overlay-fade">
    <div v-if="visible" class="unlock-overlay" @click.self="close">
      <!-- Конфетти -->
      <div class="confetti-container">
        <div v-for="i in 50" :key="i" class="confetti-particle"
          :style="{
            left: randomPos() + '%',
            animationDelay: Math.random() * 0.5 + 's',
            animationDuration: 1.5 + Math.random() * 2 + 's',
            backgroundColor: randomColor()
          }">
        </div>
      </div>

      <!-- Карточка -->
      <div class="unlock-card">
        <div class="unlock-icon-wrapper">
          <span class="unlock-icon">{{ achievement?.icon || '🏆' }}</span>
        </div>
        <div class="unlock-title">🎉 Новое достижение!</div>
        <h2 class="unlock-name">{{ achievement?.name || 'Достижение' }}</h2>
        <p class="unlock-desc">{{ achievement?.description || '' }}</p>
        <div class="unlock-rarity" v-if="achievement?.rarity">
          {{ rarityLabel(achievement.rarity) }}
        </div>
        <button class="unlock-btn" @click="close">Круто! 🚀</button>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  name: 'AchievementUnlock',
  props: {
    achievement: Object
  },
  emits: ['close'],
  setup(props, { emit }) {
    const visible = ref(true);
    let timer = null;

    function close() {
      visible.value = false;
      setTimeout(() => emit('close'), 300);
    }

    function randomPos() {
      return Math.floor(Math.random() * 100);
    }

    function randomColor() {
      const colors = ['#fbbf24', '#a78bfa', '#2dd4bf', '#f472b6', '#6366f1', '#10b981', '#f59e0b'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function rarityLabel(r) {
      const labels = {
        bronze: '🥉 БРОНЗОВЫЙ ТРОФЕЙ',
        silver: '🥈 СЕРЕБРЯНЫЙ ТРОФЕЙ',
        gold: '🥇 ЗОЛОТОЙ ТРОФЕЙ',
        platinum: '💎 ПЛАТИНОВЫЙ ТРОФЕЙ'
      };
      return labels[r] || '';
    }

    onMounted(() => {
      timer = setTimeout(close, 5000);
    });

    onUnmounted(() => {
      clearTimeout(timer);
    });

    return { visible, close, randomPos, randomColor, rarityLabel };
  }
};
</script>

<style scoped>
/* Оверлей */
.unlock-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  overflow: hidden;
}

.overlay-fade-enter-active { animation: overlayIn 0.3s ease; }
.overlay-fade-leave-active { animation: overlayOut 0.3s ease; }
@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }

/* Конфетти */
.confetti-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-particle {
  position: absolute;
  top: -20px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confettiFall linear forwards;
}

@keyframes confettiFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

/* Карточка */
.unlock-card {
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 2px solid rgba(251, 191, 36, 0.5);
  border-radius: 28px;
  padding: 40px 32px;
  text-align: center;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 0 60px rgba(251, 191, 36, 0.2), 0 20px 60px rgba(0,0,0,0.5);
  animation: cardPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 10;
}

@keyframes cardPop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.unlock-icon-wrapper {
  margin-bottom: 16px;
}

.unlock-icon {
  font-size: 6rem;
  display: block;
  animation: iconBounce 0.6s ease infinite alternate;
  filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.5));
}

@keyframes iconBounce {
  from { transform: translateY(0) scale(1); }
  to { transform: translateY(-8px) scale(1.05); }
}

.unlock-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.unlock-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
  margin: 8px 0;
}

.unlock-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 12px;
}

.unlock-rarity {
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #fbbf24;
}

.unlock-btn {
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  color: #fff;
  border: none;
  padding: 12px 32px;
  border-radius: 50px;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  animation: btnPulse 2s ease infinite;
  transition: transform 0.2s;
}

.unlock-btn:hover {
  transform: scale(1.08);
}

@keyframes btnPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
  50% { box-shadow: 0 0 0 15px rgba(99,102,241,0); }
}
</style>
