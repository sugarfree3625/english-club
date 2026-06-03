<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="visible" class="unlock-overlay" @click.self="close">
        <!-- Конфетти -->
        <div class="confetti-container">
          <div v-for="i in 80" :key="i" class="confetti-piece"
            :style="{ left: rand(5,95)+'%', top: rand(-15,-2)+'%', width: rand(6,14)+'px', height: rand(6,14)+'px', backgroundColor: randColor(), animationDelay: rand(0,1.5)+'s', animationDuration: rand(2.5,5)+'s', borderRadius: Math.random()>0.5?'50%':'3px', transform: 'rotate('+rand(0,360)+'deg)' }"></div>
        </div>

        <!-- Частицы золота -->
        <div class="gold-particles">
          <span v-for="i in 20" :key="'g'+i" class="gold-particle"
            :style="{ left: rand(20,80)+'%', top: rand(30,70)+'%', animationDelay: rand(0,1)+'s', animationDuration: rand(2,4)+'s' }">✨</span>
        </div>

        <!-- Карточка -->
        <div class="unlock-card" :class="'rarity-' + (achievement?.rarity || 'common')">
          <!-- Сияние -->
          <div class="card-shine"></div>
          
          <!-- Иконка -->
          <div class="unlock-icon-wrap">
            <div class="icon-ring"></div>
            <component :is="iconComponent" :size="80" stroke-width="1.5" class="unlock-icon-svg" />
            <div class="icon-glow"></div>
          </div>

          <!-- Бейдж редкости -->
          <div class="rarity-badge" v-if="achievement?.rarity">
            {{ rarityLabels[achievement.rarity] || 'Обычная' }}
          </div>

          <!-- Название -->
          <div class="unlock-badge">🎉 Новое достижение!</div>
          <h2 class="unlock-name">{{ achievement?.name || 'Достижение' }}</h2>
          <p class="unlock-desc">{{ achievement?.description || '' }}</p>

          <!-- XP -->
          <div class="unlock-xp" v-if="achievement?.xp">
            <span class="xp-icon">⭐</span>
            <span class="xp-value">+{{ achievement.xp }} XP</span>
          </div>

          <!-- Прогресс -->
          <div class="unlock-progress" v-if="achievement?.progressPercent !== undefined && !achievement?.earned">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: achievement.progressPercent + '%' }"></div>
            </div>
            <span class="progress-text">{{ achievement.current_value || 0 }}/{{ achievement.condition_value }}</span>
          </div>

          <!-- Кнопки -->
          <div class="unlock-actions">
            <button class="unlock-btn" @click="close">Круто! 🚀</button>
            <button class="unlock-btn share-btn" @click="shareAchievement">📤 Поделиться</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Star, MessageCircle, MessagesSquare, Mic, Flame, UserPlus, Calendar, Shield, Award, Crown, BookOpen, Library, Globe, ScrollText, Target, Medal, Clock, CalendarDays, Building, Cake } from 'lucide-vue-next';
import { playSuccess } from '../composables/useSound';

const COLORS = ['#fbbf24','#a78bfa','#2dd4bf','#f472b6','#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#34d399'];

export default {
  name: 'AchievementUnlock',
  components: { Star, MessageCircle, MessagesSquare, Mic, Flame, UserPlus, Calendar, Shield, Award, Crown, BookOpen, Library, Globe, ScrollText, Target, Medal, Clock, CalendarDays, Building, Cake },
  props: { achievement: Object },
  emits: ['close'],
  setup(props, { emit }) {
    const visible = ref(true);
    let timer = null;
    
    const iconMap = { 'message-circle': MessageCircle, 'messages-square': MessagesSquare, mic: Mic, flame: Flame, 'user-plus': UserPlus, calendar: Calendar, shield: Shield, star: Star, 'book-open': BookOpen, library: Library, globe: Globe, scroll: ScrollText, target: Target, medal: Medal, award: Award, crown: Crown, clock: Clock, 'calendar-days': CalendarDays, building: Building, cake: Cake };
    const iconComponent = computed(() => iconMap[props.achievement?.icon] || Star);

    const rarityLabels = { common: '⚪ Обычная', rare: '🔵 Редкая', epic: '🟣 Эпическая', legendary: '🟡 Легендарная' };
    
    function close() { 
      visible.value = false; 
      setTimeout(() => emit('close'), 350); 
    }

    function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
    function randColor() { return COLORS[Math.floor(Math.random()*COLORS.length)]; }

    function shareAchievement() {
      const text = `🏆 Я получил достижение "${props.achievement?.name}" в English Club!`;
      if (navigator.share) {
        navigator.share({ title: 'Моё достижение', text, url: window.location.origin });
      } else {
        navigator.clipboard?.writeText(text + ' ' + window.location.origin);
      }
    }

    onMounted(() => { 
      timer = setTimeout(close, 6000);
      playSuccess();
    });

    onUnmounted(() => { clearTimeout(timer); });

    return { visible, iconComponent, rarityLabels, close, rand, randColor, shareAchievement };
  }
};
</script>

<style scoped>
.unlock-overlay { 
  position: fixed; inset: 0; z-index: 10000; 
  display: flex; align-items: center; justify-content: center; 
  background: rgba(0,0,0,0.8); 
  backdrop-filter: blur(8px); 
  -webkit-backdrop-filter: blur(8px); 
  overflow: hidden; 
}

/* КОНФЕТТИ */
.confetti-container { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.confetti-piece { 
  position: absolute; 
  animation: confettiFall linear forwards; 
  filter: drop-shadow(0 0 6px currentColor); 
  box-shadow: 0 0 8px currentColor; 
}
@keyframes confettiFall { 
  0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; } 
  80% { opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg) scale(0.3); opacity: 0; } 
}

/* ЗОЛОТЫЕ ЧАСТИЦЫ */
.gold-particles { position: absolute; inset: 0; pointer-events: none; }
.gold-particle { 
  position: absolute; font-size: 1.5rem; 
  animation: goldFloat ease-in-out infinite; 
}
@keyframes goldFloat { 
  0%, 100% { transform: translateY(0) scale(0); opacity: 0; } 
  50% { transform: translateY(-30px) scale(1.5); opacity: 1; } 
}

/* КАРТОЧКА */
.unlock-card { 
  position: relative; z-index: 10; 
  width: 90%; max-width: 420px; 
  padding: 40px 32px; text-align: center; 
  background: rgba(15,15,35,0.97); 
  backdrop-filter: blur(30px); 
  -webkit-backdrop-filter: blur(30px); 
  border: 2px solid rgba(251,191,36,0.5); 
  border-radius: 32px; 
  box-shadow: 0 0 100px rgba(251,191,36,0.3), 0 0 150px rgba(251,191,36,0.1), 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1); 
  animation: cardSpring 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  overflow: hidden;
}

/* РЕДКОСТЬ */
.unlock-card.rarity-common { border-color: rgba(148,163,184,0.5); box-shadow: 0 0 60px rgba(148,163,184,0.2), 0 30px 60px rgba(0,0,0,0.6); }
.unlock-card.rarity-rare { border-color: rgba(59,130,246,0.5); box-shadow: 0 0 80px rgba(59,130,246,0.3), 0 30px 60px rgba(0,0,0,0.6); }
.unlock-card.rarity-epic { border-color: rgba(168,85,247,0.5); box-shadow: 0 0 100px rgba(168,85,247,0.3), 0 30px 60px rgba(0,0,0,0.6); }
.unlock-card.rarity-legendary { 
  border-color: rgba(251,191,36,0.7); 
  box-shadow: 0 0 120px rgba(251,191,36,0.4), 0 0 200px rgba(251,191,36,0.15), 0 30px 60px rgba(0,0,0,0.6); 
  animation: cardSpring 0.6s ease, legendaryShine 2s infinite; 
}

@keyframes cardSpring { 0% { transform: scale(0.5) rotate(-5deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
@keyframes legendaryShine { 0%, 100% { box-shadow: 0 0 120px rgba(251,191,36,0.4), 0 30px 60px rgba(0,0,0,0.6); } 50% { box-shadow: 0 0 180px rgba(251,191,36,0.7), 0 30px 60px rgba(0,0,0,0.6); } }

/* СИЯНИЕ */
.card-shine {
  position: absolute; top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  animation: shineRotate 4s linear infinite;
  pointer-events: none;
}
@keyframes shineRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* ИКОНКА */
.unlock-icon-wrap { 
  display: inline-block; margin-bottom: 16px; position: relative;
  filter: drop-shadow(0 0 30px rgba(251,191,36,0.8)) drop-shadow(0 10px 20px rgba(0,0,0,0.5)); 
  animation: iconBounceIn 0.6s ease infinite alternate; 
}
.icon-ring {
  position: absolute; inset: -12px;
  border: 2px solid rgba(251,191,36,0.3);
  border-radius: 50%;
  animation: ringPulse 2s infinite;
}
@keyframes ringPulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }
.unlock-icon-svg { color: #fbbf24; }
.icon-glow {
  position: absolute; inset: -20px;
  background: radial-gradient(circle, rgba(251,191,36,0.4), transparent);
  border-radius: 50%;
  animation: glowPulse 2s infinite;
}
@keyframes glowPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
@keyframes iconBounceIn { from { transform: translateY(0) scale(1); } to { transform: translateY(-8px) scale(1.05); } }

/* БЕЙДЖ РЕДКОСТИ */
.rarity-badge {
  display: inline-block; padding: 4px 14px; border-radius: 10px;
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  margin-bottom: 12px; letter-spacing: 1px;
  background: rgba(148,163,184,0.15); color: #94a3b8;
}
.rarity-rare .rarity-badge { background: rgba(59,130,246,0.15); color: #3b82f6; }
.rarity-epic .rarity-badge { background: rgba(168,85,247,0.15); color: #a855f7; }
.rarity-legendary .rarity-badge { background: rgba(251,191,36,0.15); color: #fbbf24; }

/* ТЕКСТ */
.unlock-badge { 
  font-family: 'Space Grotesk', sans-serif; 
  font-size: 0.85rem; font-weight: 700; 
  color: #fbbf24; text-transform: uppercase; 
  letter-spacing: 1.5px; margin-bottom: 8px; 
}
.unlock-name { 
  font-family: 'Space Grotesk', sans-serif; 
  font-size: 1.6rem; font-weight: 800; 
  color: #fff; margin: 8px 0; 
}
.unlock-desc { 
  font-family: 'Inter', sans-serif; 
  font-size: 0.9rem; color: #94a3b8; 
  margin-bottom: 16px; line-height: 1.5; 
}

/* XP */
.unlock-xp {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 16px; border-radius: 20px;
  background: rgba(251,191,36,0.1);
  border: 1px solid rgba(251,191,36,0.25);
  margin-bottom: 16px;
}
.xp-icon { font-size: 1rem; }
.xp-value { 
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem; font-weight: 800;
  color: #fbbf24;
}

/* ПРОГРЕСС */
.unlock-progress {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px; padding: 0 8px;
}
.progress-bar {
  flex: 1; height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px; overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #2dd4bf);
  border-radius: 3px; transition: width 1s ease;
}
.progress-text { font-size: 0.7rem; color: #64748b; }

/* КНОПКИ */
.unlock-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.unlock-btn { 
  padding: 12px 28px; 
  font-family: 'Inter', sans-serif; 
  font-size: 0.95rem; font-weight: 700; 
  color: #fff; 
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%); 
  border: none; border-radius: 50px; 
  cursor: pointer; 
  box-shadow: 0 8px 25px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2); 
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  animation: btnPulse 2s ease-in-out infinite; 
}
.unlock-btn:hover { 
  transform: translateY(-3px) scale(1.05); 
  box-shadow: 0 12px 35px rgba(99,102,241,0.6), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3); 
}
.unlock-btn:active { transform: translateY(1px) scale(0.98); }

.share-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: none;
  animation: none;
}
.share-btn:hover {
  background: rgba(255,255,255,0.1);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

@keyframes btnPulse { 
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); } 
  50% { box-shadow: 0 0 0 16px rgba(99,102,241,0); } 
}

/* АНИМАЦИИ */
.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 0.35s ease; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .unlock-card { padding: 28px 20px; }
  .unlock-name { font-size: 1.3rem; }
  .unlock-actions { flex-direction: column; }
}
</style>
