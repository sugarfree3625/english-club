<template>
  <div class="achievements-page">
    <!-- ==================== ГЕРО-БЛОК С ПРОГРЕССОМ ==================== -->
    <div class="hero-card">
      <!-- Слева: цифра -->
      <div class="hero-left">
        <div class="hero-count">
          {{ earned }} <span class="hero-total">/ {{ total }}</span>
        </div>
        <div class="hero-label">достижений получено</div>
      </div>

      <!-- Центр: круговой прогресс-бар -->
      <div class="hero-ring-wrap">
        <svg viewBox="0 0 120 120" class="hero-ring-svg">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#6366f1" />
              <stop offset="100%" stop-color="#2dd4bf" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="52" class="ring-track" />
          <circle cx="60" cy="60" r="52" class="ring-fill"
            :style="{ strokeDashoffset: 326.7 - (326.7 * animatedPercent / 100) }" />
        </svg>
        <div class="ring-text">{{ animatedPercent }}%</div>
      </div>

      <!-- Справа: инфо-бейджи -->
      <div class="hero-right">
        <div class="info-badge earned">
          <CheckCircle :size="18" />
          <div>
            <div class="badge-num">{{ earned }}</div>
            <div class="badge-label">Получено</div>
          </div>
        </div>
        <div class="info-badge locked">
          <Lock :size="18" />
          <div>
            <div class="badge-num">{{ total - earned }}</div>
            <div class="badge-label">Осталось</div>
          </div>
        </div>
        <div class="info-badge rare">
          <Star :size="18" />
          <div>
            <div class="badge-num">{{ rareCount }}</div>
            <div class="badge-label">Редких</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== СЕТКА ДОСТИЖЕНИЙ ==================== -->
    <div class="achievements-grid">
      <div
        v-for="ach in achievements"
        :key="ach.code"
        class="ach-card"
        :class="{ 'ach-earned': ach.earned }"
        @click="selected = ach"
      >
        <!-- Иконка -->
        <div class="ach-icon-area" :class="{ 'ach-icon-locked': !ach.earned }">
          <component :is="getIcon(ach.icon)" :size="48" stroke-width="1.5" />
          <Lock v-if="!ach.earned" :size="16" class="ach-lock-icon" />
        </div>

        <!-- Название -->
        <div class="ach-name" :class="{ 'text-gray-500': !ach.earned }">
          {{ ach.name }}
        </div>

        <!-- Дата получения -->
        <div v-if="ach.earned && ach.earned_at" class="ach-date">
          {{ formatDate(ach.earned_at) }}
        </div>

        <!-- Прогресс-бар (если не получена) -->
        <div v-if="!ach.earned" class="ach-progress-area">
          <div class="ach-progress-track">
            <div
              class="ach-progress-fill"
              :style="{ width: ach.progressPercent + '%' }"
            ></div>
          </div>
          <div class="ach-progress-nums">
            {{ ach.current_value || 0 }}/{{ ach.condition_value }}
          </div>
        </div>

        <!-- Редкость -->
        <div v-if="ach.rarity" class="ach-rarity-badge" :class="ach.rarity">
          {{ rarityIcon(ach.rarity) }}
        </div>
      </div>
    </div>

    <!-- ==================== МОДАЛКА ==================== -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="selected" class="modal-overlay" @click.self="selected = null">
          <div class="modal-card">
            <!-- Иконка -->
            <div class="modal-icon-wrap">
              <component :is="getIcon(selected.icon)" :size="80" stroke-width="1.5" />
            </div>

            <!-- Название и описание -->
            <h2 class="modal-title">{{ selected.name }}</h2>
            <p class="modal-desc">{{ selected.description }}</p>

            <!-- Если получена -->
            <div v-if="selected.earned" class="modal-earned-section">
              <div class="modal-earned-badge">
                <CheckCircle :size="16" />
                <span>Получено</span>
              </div>
              <div v-if="selected.earned_at" class="modal-date">
                {{ formatDate(selected.earned_at) }}
              </div>
              <button class="modal-share-btn">
                <Star :size="16" /> Поделиться
              </button>
            </div>

            <!-- Если не получена -->
            <div v-else class="modal-locked-section">
              <div class="modal-mini-ring">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" class="ring-track" />
                  <circle cx="40" cy="40" r="34" class="ring-fill"
                    :style="{ strokeDashoffset: 213.6 - (213.6 * selected.progressPercent / 100) }" />
                </svg>
                <span class="mini-ring-text">{{ selected.progressPercent }}%</span>
              </div>
              <div class="modal-remaining-text">
                Осталось: {{ selected.condition_value - (selected.current_value || 0) }}
                {{ unitLabel(selected.condition_field) }}
              </div>
              <div class="modal-motivation">Продолжай в том же духе! 🚀</div>
            </div>

            <button class="modal-close-btn" @click="selected = null">Закрыть</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import {
  CheckCircle, Lock, Star,
  MessageCircle, MessagesSquare, Mic, Flame,
  UserPlus, Calendar, Shield, Award, Crown,
  BookOpen, Library, Globe, ScrollText,
  Target, Medal, Clock, CalendarDays, Building, Cake
} from 'lucide-vue-next';

export default {
  name: 'ProfileTabAchievements',
  components: {
    CheckCircle, Lock, Star,
    MessageCircle, MessagesSquare, Mic, Flame,
    UserPlus, Calendar, Shield, Award, Crown,
    BookOpen, Library, Globe, ScrollText,
    Target, Medal, Clock, CalendarDays, Building, Cake
  },
  props: {
    achievements: { type: Array, default: () => [] },
    earned: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percent: { type: Number, default: 0 }
  },
  setup(props) {
    const selected = ref(null);
    const animatedPercent = ref(0);

    const rareCount = computed(() => {
      return props.achievements.filter(
        a => a.earned && (a.rarity === 'gold' || a.rarity === 'platinum')
      ).length;
    });

    onMounted(() => {
      setTimeout(() => {
        animatedPercent.value = props.percent;
      }, 200);
    });

    const iconMap = {
      'message-circle': MessageCircle,
      'messages-square': MessagesSquare,
      'mic': Mic,
      'flame': Flame,
      'user-plus': UserPlus,
      'calendar': Calendar,
      'shield': Shield,
      'star': Star,
      'book-open': BookOpen,
      'library': Library,
      'globe': Globe,
      'scroll': ScrollText,
      'target': Target,
      'medal': Medal,
      'award': Award,
      'crown': Crown,
      'clock': Clock,
      'calendar-days': CalendarDays,
      'building': Building,
      'cake': Cake
    };

    function getIcon(name) {
      return iconMap[name] || Star;
    }

    function formatDate(ts) {
      if (!ts) return '';
      return new Date(ts).toLocaleDateString('ru', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }

    function rarityIcon(r) {
      const map = { platinum: '💎', gold: '🥇', silver: '🥈', bronze: '🥉' };
      return map[r] || '';
    }

    function unitLabel(field) {
      const map = {
        meetings_count: 'встреч',
        messages_count: 'сообщений',
        words_count: 'слов',
        rating_rank: 'позиций',
        account_age_days: 'дней'
      };
      return map[field] || '';
    }

    return {
      selected,
      animatedPercent,
      rareCount,
      getIcon,
      formatDate,
      rarityIcon,
      unitLabel
    };
  }
};
</script>

<style scoped>
/* ==================== БАЗА ==================== */
.achievements-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ==================== ГЕРО-БЛОК ==================== */
.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  padding: 32px 36px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
}

.hero-left {
  display: flex;
  flex-direction: column;
}

.hero-count {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-total {
  font-size: 2rem;
  -webkit-text-fill-color: rgba(255, 255, 255, 0.3);
}

.hero-label {
  margin-top: 4px;
  font-size: 0.9rem;
  color: #94a3b8;
}
/* 3D-эффекты для карточек */
.ach-card {
  transform-style: preserve-3d;
  perspective: 800px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.ach-card:hover {
  transform: translateY(-8px) rotateX(5deg) rotateY(-3deg) scale(1.03);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(99, 102, 241, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.ach-card.ach-earned:hover {
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(16, 185, 129, 0.4),
    0 0 80px rgba(16, 185, 129, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* Глянцевый блик на иконке */
.ach-icon-area {
  position: relative;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.ach-icon-area::after {
  content: '';
  position: absolute;
  top: -10%;
  left: -10%;
  width: 40%;
  height: 40%;
  background: radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

/* 3D для геро-карточки */
.hero-card {
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 1px 0 rgba(255, 255, 255, 0.1) inset;
}

/* Объёмный прогресс-бар */
.hero-ring-wrap {
  filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));
}

.ring-fill {
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
}

/* Инфо-бейджи с объёмом */
.info-badge {
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
/* Круговой прогресс-бар */
.hero-ring-wrap {
  position: relative;
  width: 130px;
  height: 130px;
  flex-shrink: 0;
}

.hero-ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.06);
  stroke-width: 8;
}

.ring-fill {
  fill: none;
  stroke: url(#ringGradient);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 326.7;
  transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: #fff;
}

/* Инфо-бейджи */
.hero-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 160px;
  color: #fff;
}

.info-badge.earned svg { color: #10b981; }
.info-badge.locked svg { color: #94a3b8; }
.info-badge.rare svg { color: #f59e0b; }

.badge-num {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
}

.badge-label {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* ==================== СЕТКА ==================== */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 1024px) {
  .achievements-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .achievements-grid { grid-template-columns: 1fr; }
}

.ach-card {
  position: relative;
  padding: 20px 16px;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ach-card:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.4);
}

/* Полученная */
.ach-card.ach-earned {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
}

.ach-card.ach-earned:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
}

/* Иконка */
.ach-icon-area {
  display: inline-block;
  position: relative;
  color: #6366f1;
  margin-bottom: 8px;
}

.ach-icon-area.ach-icon-locked {
  color: #475569;
  opacity: 0.45;
}

.ach-lock-icon {
  position: absolute;
  bottom: -2px;
  right: -6px;
  color: #94a3b8;
  background: #1a1a2e;
  border-radius: 50%;
  padding: 3px;
}

/* Название */
.ach-name {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  color: #fff;
  margin: 4px 0;
}

/* Дата */
.ach-date {
  font-size: 0.7rem;
  color: #10b981;
  margin-top: 4px;
}

/* Прогресс */
.ach-progress-area {
  margin-top: 8px;
}

.ach-progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.ach-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #2dd4bf);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.ach-progress-nums {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-top: 4px;
}

/* Редкость */
.ach-rarity-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.7rem;
  opacity: 0.7;
}

/* ==================== МОДАЛКА ==================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.modal-card {
  width: 90%;
  max-width: 380px;
  padding: 32px 28px;
  text-align: center;
  background: rgba(18, 18, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  color: #fff;
  animation: modalPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modalPop {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-icon-wrap {
  color: #6366f1;
  margin-bottom: 16px;
  animation: iconBounce 0.6s ease infinite alternate;
}

@keyframes iconBounce {
  from { transform: translateY(0); }
  to { transform: translateY(-6px); }
}

.modal-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.modal-desc {
  font-family: 'Inter', sans-serif;
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.modal-earned-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.modal-earned-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  color: #10b981;
  font-weight: 600;
}

.modal-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.modal-share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-share-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-locked-section {
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

.mini-ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: #fff;
}

.modal-remaining-text {
  font-size: 0.9rem;
  color: #94a3b8;
}

.modal-motivation {
  font-size: 0.85rem;
  color: #f59e0b;
  font-weight: 600;
}

.modal-close-btn {
  margin-top: 20px;
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
