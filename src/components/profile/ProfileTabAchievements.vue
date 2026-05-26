<template>
  <div class="achievements-page">
    <!-- Геро-блок с прогрессом -->
    <div class="hero-card">
      <div class="hero-left">
        <div class="hero-count">{{ earned }} <span class="hero-total">/ {{ total }}</span></div>
        <div class="hero-label">достижений получено</div>
      </div>

      <div class="hero-progress-ring">
        <svg viewBox="0 0 120 120" class="progress-svg">
          <circle cx="60" cy="60" r="52" class="progress-track" />
          <circle cx="60" cy="60" r="52" class="progress-fill"
            :style="{ strokeDashoffset: dashOffset }" />
        </svg>
        <div class="progress-text">{{ percent }}%</div>
      </div>

      <div class="hero-right">
        <div class="hero-badge earned-badge">
          <CheckCircle class="badge-icon" />
          <div>
            <div class="badge-num">{{ earned }}</div>
            <div class="badge-label">Получено</div>
          </div>
        </div>
        <div class="hero-badge locked-badge">
          <Lock class="badge-icon" />
          <div>
            <div class="badge-num">{{ total - earned }}</div>
            <div class="badge-label">Осталось</div>
          </div>
        </div>
        <div class="hero-badge rare-badge">
          <Star class="badge-icon" />
          <div>
            <div class="badge-num">{{ rareCount }}</div>
            <div class="badge-label">Редких</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Сетка достижений -->
    <div class="achievements-grid">
      <div v-for="a in achievements" :key="a.code"
           class="achievement-card"
           :class="{ earned: a.earned, locked: !a.earned }"
           @click="selected = a">
        <div class="ach-icon-wrap" :class="{ 'grayscale': !a.earned }">
          <span class="ach-icon">{{ a.icon }}</span>
          <Lock v-if="!a.earned" class="ach-lock" />
        </div>
        <div class="ach-name" :class="{ 'text-gray-500': !a.earned }">{{ a.name }}</div>
        <div class="ach-date" v-if="a.earned && a.earned_at">
          {{ formatDate(a.earned_at) }}
        </div>
        <div class="ach-mini-progress" v-if="!a.earned">
          <div class="ach-mini-track">
            <div class="ach-mini-fill" :style="{ width: a.progressPercent + '%' }"></div>
          </div>
          <div class="ach-mini-text">{{ a.current_value || 0 }}/{{ a.condition_value }}</div>
        </div>
        <div class="ach-rarity-badge" :class="a.rarity" v-if="a.rarity">
          {{ rarityLabel(a.rarity) }}
        </div>
      </div>
    </div>

    <!-- Модальное окно -->
    <div v-if="selected" class="modal-overlay" @click.self="selected = null">
      <div class="modal-card">
        <div class="modal-icon" :class="{ grayscale: !selected.earned }">
          <span>{{ selected.icon }}</span>
        </div>
        <h2 class="modal-name">{{ selected.name }}</h2>
        <p class="modal-desc">{{ selected.description }}</p>

        <div v-if="selected.earned" class="modal-earned-badge">
          <CheckCircle /> ✅ Получено
          <div class="modal-date" v-if="selected.earned_at">
            {{ formatDate(selected.earned_at) }}
          </div>
        </div>

        <div v-else class="modal-locked-info">
          <div class="modal-mini-ring">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" class="progress-track" />
              <circle cx="40" cy="40" r="34" class="progress-fill"
                :style="{ strokeDashoffset: 214 - (214 * selected.progressPercent / 100) }" />
            </svg>
            <span>{{ selected.progressPercent }}%</span>
          </div>
          <div class="modal-remaining">
            Осталось: {{ selected.condition_value - (selected.current_value || 0) }} {{ unitLabel(selected.condition_field) }}
          </div>
          <div class="modal-motivation">Продолжай в том же духе! 🚀</div>
        </div>

        <button class="modal-close" @click="selected = null">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { CheckCircle, Lock, Star } from 'lucide-vue-next';

export default {
  name: 'ProfileTabAchievements',
  components: { CheckCircle, Lock, Star },
  props: ['achievements', 'earned', 'total', 'percent'],
  setup(props) {
    const selected = ref(null);
    const animatedPercent = ref(0);
    const circumference = 2 * Math.PI * 52; // ~326

    const dashOffset = computed(() => {
      return circumference - (circumference * animatedPercent.value / 100);
    });

    const rareCount = computed(() => {
      return props.achievements.filter(a => a.earned && (a.rarity === 'gold' || a.rarity === 'platinum')).length;
    });

    onMounted(() => {
      setTimeout(() => { animatedPercent.value = props.percent; }, 100);
    });

    function formatDate(ts) {
      return ts ? new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    }

    function rarityLabel(r) {
      return { platinum: '💎', gold: '🥇', silver: '🥈', bronze: '🥉' }[r] || '';
    }

    function unitLabel(field) {
      return { meetings_count: 'встреч', messages_count: 'сообщений', words_count: 'слов', likes_count: 'лайков', account_age_days: 'дней', rating_rank: 'позиций' }[field] || '';
    }

    return { selected, animatedPercent, dashOffset, rareCount, formatDate, rarityLabel, unitLabel, circumference };
  }
};
</script>

<style scoped>
.achievements-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Геро-блок */
.hero-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.hero-left {
  display: flex;
  flex-direction: column;
}

.hero-count {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.hero-total {
  font-size: 2rem;
  -webkit-text-fill-color: rgba(255,255,255,0.3);
}

.hero-label {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 4px;
}

/* Круговой прогресс-бар */
.hero-progress-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-track {
  fill: none;
  stroke: rgba(255,255,255,0.08);
  stroke-width: 8;
}

.progress-fill {
  fill: none;
  stroke: url(#gradient);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 326;
  stroke-dashoffset: v-bind(dashOffset);
  transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

/* Бейджи */
.hero-right {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  min-width: 160px;
}

.badge-icon {
  font-size: 1.3rem;
}

.earned-badge .badge-icon { color: #10b981; }
.locked-badge .badge-icon { color: #94a3b8; }
.rare-badge .badge-icon { color: #f59e0b; }

.badge-num {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
}

.badge-label {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Сетка */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 1024px) { .achievements-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .achievements-grid { grid-template-columns: 1fr; } }

.achievement-card {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.achievement-card.earned {
  background: rgba(16,185,129,0.06);
  border-color: rgba(16,185,129,0.4);
  box-shadow: 0 0 20px rgba(16,185,129,0.15);
}

.achievement-card.earned:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 30px rgba(16,185,129,0.25);
}

.achievement-card.locked:hover {
  transform: translateY(-2px);
  border-color: rgba(99,102,241,0.3);
}

.ach-icon-wrap {
  position: relative;
  display: inline-block;
  font-size: 3.5rem;
  margin-bottom: 8px;
}

.ach-icon-wrap.grayscale {
  filter: grayscale(1);
  opacity: 0.4;
}

.ach-lock {
  position: absolute;
  bottom: -2px;
  right: -6px;
  font-size: 1rem;
  color: #94a3b8;
  background: #1a1a2e;
  border-radius: 50%;
  padding: 4px;
}

.ach-name {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  color: #fff;
  margin-bottom: 4px;
}

.ach-date {
  font-size: 0.7rem;
  color: #10b981;
  margin-top: 4px;
}

.ach-mini-progress {
  margin-top: 8px;
}

.ach-mini-track {
  height: 3px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
}

.ach-mini-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #2dd4bf);
  border-radius: 2px;
}

.ach-mini-text {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-top: 4px;
}

.ach-rarity-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 0.7rem;
}

/* Модалка */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-card {
  background: rgba(20,20,40,0.95);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 36px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: bounceIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes bounceIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-icon {
  font-size: 5rem;
  margin-bottom: 16px;
}

.modal-icon.grayscale { filter: grayscale(1); opacity: 0.5; }

.modal-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.modal-desc {
  font-family: 'Inter', sans-serif;
  color: #94a3b8;
  margin-bottom: 20px;
}

.modal-earned-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.3);
  border-radius: 12px;
  color: #10b981;
  font-weight: 600;
}

.modal-date {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-left: 8px;
}

.modal-locked-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.modal-mini-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.modal-mini-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.modal-mini-ring span {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
}

.modal-remaining {
  font-size: 0.9rem;
  color: #94a3b8;
}

.modal-motivation {
  font-size: 0.85rem;
  color: #f59e0b;
  font-weight: 600;
}

.modal-close {
  margin-top: 20px;
  padding: 10px 24px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  color: #fff;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
}

.modal-close:hover { background: rgba(255,255,255,0.1); }
</style>
