<template>
  <div class="achievements-page">
    <!-- Геро-блок -->
    <div class="hero-card">
      <div class="hero-left">
        <div class="hero-count">{{ earned }} <span class="hero-total">/ {{ total }}</span></div>
        <div class="hero-label">достижений получено</div>
      </div>

      <div class="hero-progress-ring">
        <svg viewBox="0 0 120 120" class="progress-svg">
          <circle cx="60" cy="60" r="52" class="progress-track" />
          <circle cx="60" cy="60" r="52" class="progress-fill"
            :style="{ strokeDashoffset: 326 - (326 * animatedPercent / 100) }" />
        </svg>
        <div class="progress-text">{{ animatedPercent }}%</div>
      </div>

      <div class="hero-right">
        <div class="hero-badge earned-badge">
          <CheckCircle :size="20" />
          <div>
            <div class="badge-num">{{ earned }}</div>
            <div class="badge-label">Получено</div>
          </div>
        </div>
        <div class="hero-badge locked-badge">
          <Lock :size="20" />
          <div>
            <div class="badge-num">{{ total - earned }}</div>
            <div class="badge-label">Осталось</div>
          </div>
        </div>
        <div class="hero-badge rare-badge">
          <Star :size="20" />
          <div>
            <div class="badge-num">{{ rareCount }}</div>
            <div class="badge-label">Редких</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Сетка -->
    <div class="achievements-grid">
      <div v-for="a in achievements" :key="a.code"
           class="achievement-card"
           :class="{ earned: a.earned }"
           @click="selected = a">
        <div class="ach-icon-wrap" :class="{ locked: !a.earned }">
          <component :is="getIcon(a.icon)" :size="44" />
        </div>
        <div class="ach-name">{{ a.name }}</div>
        <div class="ach-progress" v-if="!a.earned">
          <div class="ach-progress-bar">
            <div class="ach-progress-fill" :style="{ width: a.progressPercent + '%' }"></div>
          </div>
          <span class="ach-progress-text">{{ a.current_value || 0 }}/{{ a.condition_value }}</span>
        </div>
      </div>
    </div>

    <!-- Модалка -->
    <div v-if="selected" class="modal-overlay" @click.self="selected = null">
      <div class="modal-card">
        <component :is="getIcon(selected.icon)" :size="72" class="modal-icon" />
        <h2>{{ selected.name }}</h2>
        <p>{{ selected.description }}</p>
        <button class="modal-close" @click="selected = null">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
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
  props: ['achievements', 'earned', 'total', 'percent'],
  data() {
    return {
      selected: null,
      animatedPercent: 0
    };
  },
  computed: {
    rareCount() {
      return this.achievements.filter(a => a.earned && (a.rarity === 'gold' || a.rarity === 'platinum')).length;
    }
  },
  mounted() {
    setTimeout(() => { this.animatedPercent = this.percent; }, 200);
  },
  methods: {
    getIcon(name) {
      const icons = {
        'message-circle': MessageCircle, 'messages-square': MessagesSquare, 'mic': Mic, 'flame': Flame,
        'user-plus': UserPlus, 'calendar': Calendar, 'shield': Shield, 'star': Star,
        'book-open': BookOpen, 'library': Library, 'globe': Globe, 'scroll': ScrollText,
        'target': Target, 'medal': Medal, 'award': Award, 'crown': Crown,
        'clock': Clock, 'calendar-days': CalendarDays, 'building': Building, 'cake': Cake
      };
      return icons[name] || Star;
    }
  }
};
</script>

<style scoped>
.achievements-page { display: flex; flex-direction: column; gap: 24px; }

.hero-card {
  background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px;
  display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap;
}

.hero-left { display: flex; flex-direction: column; }
.hero-count { font-family: 'Space Grotesk', sans-serif; font-size: 3.5rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
.hero-total { font-size: 1.8rem; -webkit-text-fill-color: rgba(255,255,255,0.3); }
.hero-label { color: #94a3b8; font-size: 0.85rem; margin-top: 4px; }

.hero-progress-ring { position: relative; width: 110px; height: 110px; }
.progress-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.progress-track { fill: none; stroke: rgba(255,255,255,0.08); stroke-width: 6; }
.progress-fill { fill: none; stroke: #6366f1; stroke-width: 6; stroke-linecap: round; stroke-dasharray: 326; transition: stroke-dashoffset 1.5s ease; }
.progress-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; font-weight: 700; color: #fff; }

.hero-right { display: flex; flex-direction: column; gap: 8px; }
.hero-badge { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: #fff; }
.earned-badge svg { color: #10b981; }
.locked-badge svg { color: #94a3b8; }
.rare-badge svg { color: #f59e0b; }
.badge-num { font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; font-weight: 700; }
.badge-label { font-size: 0.7rem; color: #94a3b8; }

.achievements-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 1024px) { .achievements-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .achievements-grid { grid-template-columns: 1fr; } }

.achievement-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s; }
.achievement-card:hover { border-color: rgba(99,102,241,0.3); }
.achievement-card.earned { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.3); }

.ach-icon-wrap { color: #6366f1; margin-bottom: 6px; }
.ach-icon-wrap.locked { color: #475569; opacity: 0.5; }
.ach-name { font-size: 0.8rem; font-weight: 600; color: #fff; }

.ach-progress { margin-top: 6px; }
.ach-progress-bar { height: 3px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
.ach-progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; }
.ach-progress-text { font-size: 0.65rem; color: #94a3b8; display: block; margin-top: 3px; }

.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.modal-card { background: rgba(20,20,40,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; text-align: center; max-width: 360px; width: 90%; color: #fff; }
.modal-icon { color: #6366f1; margin-bottom: 12px; }
.modal-card h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; margin: 8px 0; }
.modal-card p { color: #94a3b8; margin-bottom: 16px; }
.modal-close { padding: 8px 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.05); color: #fff; cursor: pointer; }
</style>
