<template>
  <div class="achievements-page">
    <!-- ГЕРО-БЛОК -->
    <div class="hero-card">
      <div class="hero-left">
        <div class="hero-count">{{ earned }} <span class="hero-total">/ {{ total }}</span></div>
        <div class="hero-label">достижений получено</div>
      </div>

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

      <div class="hero-right">
        <div class="info-badge earned">
          <i class="fas fa-check-circle"></i>
          <div><div class="badge-num">{{ earned }}</div><div class="badge-label">Получено</div></div>
        </div>
        <div class="info-badge locked">
          <i class="fas fa-lock"></i>
          <div><div class="badge-num">{{ total - earned }}</div><div class="badge-label">Осталось</div></div>
        </div>
        <div class="info-badge rare">
          <i class="fas fa-gem"></i>
          <div><div class="badge-num">{{ rareCount }}</div><div class="badge-label">Редких</div></div>
        </div>
      </div>
    </div>

    <!-- ФИЛЬТРЫ -->
    <div class="filters-row">
      <button v-for="cat in categories" :key="cat.key" 
        class="filter-btn" :class="{ active: activeCategory === cat.key }"
        @click="activeCategory = cat.key">
        <span class="filter-icon">{{ cat.icon }}</span>
        <span class="filter-label">{{ cat.label }}</span>
        <span class="filter-count">{{ cat.count }}</span>
      </button>
    </div>

    <!-- СЕТКА ДОСТИЖЕНИЙ -->
    <div class="achievements-grid" v-if="filteredAchievements.length">
      <div v-for="ach in filteredAchievements" :key="ach.code"
           class="ach-card" :class="[ach.rarity || 'bronze', { 'ach-earned': ach.earned }]"
           @click="selected = ach">
        
        <!-- Иконка -->
        <div class="ach-icon-wrap" :class="{ locked: !ach.earned }">
          <div class="ach-icon-bg" :class="ach.rarity || 'bronze'"></div>
          <span class="ach-icon-emoji">{{ getIconEmoji(ach.icon) }}</span>
          <i v-if="!ach.earned" class="fas fa-lock ach-lock"></i>
          <i v-if="ach.earned" class="fas fa-check-circle ach-check"></i>
        </div>

        <!-- Название и описание -->
        <div class="ach-info">
          <div class="ach-name" :class="{ 'text-muted': !ach.earned }">{{ ach.name }}</div>
          <div class="ach-desc" v-if="ach.description">{{ ach.description }}</div>
        </div>

        <!-- Прогресс -->
        <div v-if="!ach.earned" class="ach-progress">
          <div class="progress-track">
            <div class="progress-fill" :class="ach.rarity || 'bronze'"
              :style="{ width: ach.progressPercent + '%' }"></div>
          </div>
          <div class="progress-text">{{ ach.current_value || 0 }}/{{ ach.condition_value }}</div>
        </div>

        <!-- Дата получения -->
        <div v-if="ach.earned && ach.earned_at" class="ach-earned-date">
          <i class="fas fa-calendar-check"></i> {{ formatDate(ach.earned_at) }}
        </div>

        <!-- Бейдж редкости -->
        <div class="rarity-badge" :class="ach.rarity || 'bronze'">
          {{ rarityLabel(ach.rarity) }}
        </div>
      </div>
    </div>

    <!-- ПУСТО -->
    <div v-else class="empty-section">
      <div class="empty-icon">🔍</div>
      <p class="empty-text">Нет достижений в этой категории</p>
    </div>

    <!-- МОДАЛКА -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="selected" class="modal-overlay" @click.self="selected = null">
          <div class="modal-card" :class="selected.rarity || 'bronze'">
            
            <!-- Иконка -->
            <div class="modal-icon-wrap">
              <div class="modal-icon-glow" :class="selected.rarity || 'bronze'"></div>
              <span class="modal-icon-emoji">{{ getIconEmoji(selected.icon) }}</span>
            </div>

            <!-- Редкость -->
            <div class="modal-rarity" :class="selected.rarity || 'bronze'">
              {{ rarityLabel(selected.rarity) }}
            </div>

            <!-- Название -->
            <h2 class="modal-title">{{ selected.name }}</h2>
            <p class="modal-desc">{{ selected.description }}</p>

            <!-- Получено -->
            <div v-if="selected.earned" class="modal-earned">
              <div class="earned-badge">
                <i class="fas fa-check-circle"></i> Получено
              </div>
              <div v-if="selected.earned_at" class="earned-date">
                {{ formatDate(selected.earned_at) }}
              </div>
            </div>

            <!-- Не получено -->
            <div v-else class="modal-locked">
              <div class="modal-ring-wrap">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" class="ring-track" />
                  <circle cx="40" cy="40" r="34" class="ring-fill"
                    :style="{ strokeDashoffset: 213.6 - (213.6 * selected.progressPercent / 100) }" />
                </svg>
                <span class="modal-ring-text">{{ selected.progressPercent }}%</span>
              </div>
              <p class="remaining-text">
                Осталось: {{ selected.condition_value - (selected.current_value || 0) }} 
                {{ unitLabel(selected.condition_field) }}
              </p>
              <p class="motivation-text">Продолжай в том же духе! 🚀</p>
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

export default {
  name: 'ProfileTabAchievements',
  props: { achievements: Array, earned: Number, total: Number, percent: Number },
  setup(props) {
    const selected = ref(null);
    const animatedPercent = ref(0);
    const activeCategory = ref('all');

    const categories = computed(() => {
      const list = props.achievements || [];
      return [
        { key: 'all', icon: '🏆', label: 'Все', count: list.length },
        { key: 'words_count', icon: '📚', label: 'Слова', count: list.filter(a => a.condition_field === 'words_count').length },
        { key: 'meetings_count', icon: '📅', label: 'Встречи', count: list.filter(a => a.condition_field === 'meetings_count').length },
        { key: 'messages_count', icon: '💬', label: 'Сообщения', count: list.filter(a => a.condition_field === 'messages_count').length },
        { key: 'rating_rank', icon: '⭐', label: 'Рейтинг', count: list.filter(a => a.condition_field === 'rating_rank').length },
        { key: 'account_age_days', icon: '🗓', label: 'Возраст', count: list.filter(a => a.condition_field === 'account_age_days').length }
      ];
    });

    const filteredAchievements = computed(() => {
      if (activeCategory.value === 'all') return props.achievements || [];
      return (props.achievements || []).filter(a => a.condition_field === activeCategory.value);
    });

    const rareCount = computed(() => 
      (props.achievements || []).filter(a => a.earned && (a.rarity === 'gold' || a.rarity === 'platinum')).length
    );

    onMounted(() => { 
      setTimeout(() => { animatedPercent.value = props.percent; }, 200); 
    });

    function getIconEmoji(name) {
      const map = { 'message-circle':'💬','messages-square':'💭','mic':'🎤','flame':'🔥','user-plus':'👥',
        'calendar':'📅','shield':'🛡','star':'⭐','book-open':'📖','library':'📚','globe':'🌍',
        'scroll':'📜','target':'🎯','medal':'🏅','award':'🏆','crown':'👑','clock':'🕐',
        'calendar-days':'📆','building':'🏛','cake':'🎂','users':'👨‍👩‍👧' };
      return map[name] || '⭐';
    }

    function formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('ru', { day:'numeric', month:'short', year:'numeric' }) : ''; }
    
    function rarityLabel(r) { 
      const labels = { platinum:'💎 Платина', gold:'🥇 Золото', silver:'🥈 Серебро', bronze:'🥉 Бронза' };
      return labels[r] || '🥉 Бронза';
    }

    function unitLabel(f) { 
      const units = { meetings_count:'встреч', messages_count:'сообщений', words_count:'слов', rating_rank:'позиций', account_age_days:'дней' };
      return units[f] || '';
    }

    return { selected, animatedPercent, activeCategory, categories, filteredAchievements, rareCount, getIconEmoji, formatDate, rarityLabel, unitLabel };
  }
};
</script>

<style scoped>
.achievements-page { display: flex; flex-direction: column; gap: 20px; }

/* ГЕРОЙ */
.hero-card { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; padding: 28px 32px; background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08); }
.hero-left { display: flex; flex-direction: column; }
.hero-count { font-family: 'Space Grotesk', sans-serif; font-size: 3.5rem; font-weight: 800; line-height: 1; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-total { font-size: 1.8rem; -webkit-text-fill-color: rgba(255,255,255,0.3); }
.hero-label { font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }
.hero-ring-wrap { position: relative; width: 130px; height: 130px; flex-shrink: 0; filter: drop-shadow(0 0 20px rgba(99,102,241,0.4)); }
.hero-ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 8; }
.ring-fill { fill: none; stroke: url(#ringGradient); stroke-width: 8; stroke-linecap: round; stroke-dasharray: 326.7; transition: stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1); }
.ring-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; }
.hero-right { display: flex; flex-direction: column; gap: 8px; }
.info-badge { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); min-width: 150px; color: #fff; }
.info-badge i { font-size: 1.1rem; }
.info-badge.earned i { color: #10b981; }
.info-badge.locked i { color: #94a3b8; }
.info-badge.rare i { color: #f59e0b; }
.badge-num { font-family: 'Space Grotesk', sans-serif; font-size: 1rem; font-weight: 700; }
.badge-label { font-size: 0.7rem; color: #94a3b8; }

/* ФИЛЬТРЫ */
.filters-row { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.2s; font-family: inherit; }
.filter-btn:hover { border-color: rgba(99,102,241,0.3); color: #fff; }
.filter-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1)); border-color: rgba(99,102,241,0.5); color: #fff; box-shadow: 0 0 15px rgba(99,102,241,0.2); }
.filter-icon { font-size: 0.9rem; }
.filter-count { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; background: rgba(255,255,255,0.08); }

/* СЕТКА */
.achievements-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
@media (max-width: 640px) { .achievements-grid { grid-template-columns: 1fr; } }

/* КАРТОЧКА */
.ach-card { position: relative; padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; cursor: pointer; transition: all 0.3s cubic-bezier(0.175,0.885,0.32,1.275); display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
.ach-card:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(0,0,0,0.4); }
.ach-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; transition: all 0.3s; }
.ach-card.bronze::before { background: linear-gradient(90deg, #cd7f32, #e8a850); }
.ach-card.silver::before { background: linear-gradient(90deg, #a0a0a0, #d0d0d0); }
.ach-card.gold::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.ach-card.platinum::before { background: linear-gradient(90deg, #6366f1, #2dd4bf); }
.ach-card.ach-earned { border-color: rgba(16,185,129,0.3); box-shadow: 0 0 20px rgba(16,185,129,0.1); }
.ach-card.ach-earned.bronze { border-color: rgba(205,127,50,0.3); }
.ach-card.ach-earned.silver { border-color: rgba(160,160,160,0.3); }
.ach-card.ach-earned.gold { border-color: rgba(251,191,36,0.3); box-shadow: 0 0 25px rgba(251,191,36,0.15); }
.ach-card.ach-earned.platinum { border-color: rgba(99,102,241,0.3); box-shadow: 0 0 30px rgba(99,102,241,0.2); }

.ach-icon-wrap { position: relative; display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; margin: 0 auto; }
.ach-icon-bg { position: absolute; inset: 0; border-radius: 50%; opacity: 0.15; }
.ach-icon-bg.bronze { background: #cd7f32; }
.ach-icon-bg.silver { background: #a0a0a0; }
.ach-icon-bg.gold { background: #f59e0b; }
.ach-icon-bg.platinum { background: linear-gradient(135deg, #6366f1, #2dd4bf); }
.ach-icon-emoji { font-size: 1.6rem; z-index: 1; }
.ach-icon-wrap.locked { opacity: 0.4; filter: grayscale(1); }
.ach-lock { position: absolute; bottom: -2px; right: -4px; color: #94a3b8; background: #1a1a2e; border-radius: 50%; padding: 4px; font-size: 0.6rem; }
.ach-check { position: absolute; top: -4px; right: -6px; color: #10b981; font-size: 0.9rem; }

.ach-info { text-align: center; }
.ach-name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 0.9rem; color: #fff; }
.ach-name.text-muted { color: #64748b; }
.ach-desc { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.ach-progress { }
.progress-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
.progress-fill.bronze { background: linear-gradient(90deg, #cd7f32, #e8a850); }
.progress-fill.silver { background: linear-gradient(90deg, #a0a0a0, #d0d0d0); }
.progress-fill.gold { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.progress-fill.platinum { background: linear-gradient(90deg, #6366f1, #2dd4bf); }
.progress-text { text-align: center; font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }

.ach-earned-date { text-align: center; font-size: 0.7rem; color: #10b981; }
.rarity-badge { position: absolute; top: 10px; right: 10px; padding: 3px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 700; }
.rarity-badge.bronze { background: rgba(205,127,50,0.15); color: #e8a850; }
.rarity-badge.silver { background: rgba(160,160,160,0.15); color: #d0d0d0; }
.rarity-badge.gold { background: rgba(245,158,11,0.15); color: #fbbf24; }
.rarity-badge.platinum { background: rgba(99,102,241,0.15); color: #818cf8; }

/* ПУСТО */
.empty-section { text-align: center; padding: 60px 24px; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-text { color: #64748b; }

/* МОДАЛКА */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: rgba(15,15,30,0.98); border-radius: 24px; padding: 36px 28px; max-width: 420px; width: 100%; text-align: center; color: #fff; animation: modalPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275); position: relative; overflow: hidden; }
.modal-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
.modal-card.bronze::before { background: linear-gradient(90deg, #cd7f32, #e8a850); }
.modal-card.silver::before { background: linear-gradient(90deg, #a0a0a0, #d0d0d0); }
.modal-card.gold::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.modal-card.platinum::before { background: linear-gradient(90deg, #6366f1, #2dd4bf); }
@keyframes modalPop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.modal-icon-wrap { position: relative; display: flex; align-items: center; justify-content: center; width: 90px; height: 90px; margin: 0 auto 16px; }
.modal-icon-glow { position: absolute; inset: -10px; border-radius: 50%; opacity: 0.2; filter: blur(20px); }
.modal-icon-glow.bronze { background: #cd7f32; }
.modal-icon-glow.silver { background: #a0a0a0; }
.modal-icon-glow.gold { background: #f59e0b; }
.modal-icon-glow.platinum { background: linear-gradient(135deg, #6366f1, #2dd4bf); }
.modal-icon-emoji { font-size: 2.5rem; z-index: 1; animation: iconFloat 2s ease-in-out infinite; }
@keyframes iconFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

.modal-rarity { display: inline-block; padding: 4px 14px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; margin-bottom: 12px; }
.modal-rarity.bronze { background: rgba(205,127,50,0.15); color: #e8a850; }
.modal-rarity.silver { background: rgba(160,160,160,0.15); color: #d0d0d0; }
.modal-rarity.gold { background: rgba(245,158,11,0.15); color: #fbbf24; }
.modal-rarity.platinum { background: rgba(99,102,241,0.15); color: #818cf8; }

.modal-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; margin: 0 0 8px; }
.modal-desc { color: #94a3b8; font-size: 0.9rem; margin: 0 0 20px; line-height: 1.5; }

.modal-earned { }
.earned-badge { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; color: #10b981; font-weight: 600; font-size: 0.85rem; }
.earned-date { color: #94a3b8; font-size: 0.8rem; margin-top: 8px; }

.modal-locked { }
.modal-ring-wrap { position: relative; width: 80px; height: 80px; margin: 0 auto; }
.modal-ring-wrap svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.modal-ring-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 0.9rem; }
.remaining-text { color: #94a3b8; font-size: 0.9rem; margin: 12px 0 4px; }
.motivation-text { color: #f59e0b; font-size: 0.85rem; font-weight: 600; }

.modal-close-btn { width: 100%; padding: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; cursor: pointer; font-size: 0.85rem; margin-top: 20px; font-family: inherit; }
.modal-close-btn:hover { background: rgba(255,255,255,0.1); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
