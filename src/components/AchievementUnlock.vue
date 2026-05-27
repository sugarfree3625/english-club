<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="visible" class="unlock-overlay" @click.self="close">
        <div class="confetti-container">
          <div v-for="i in 60" :key="i" class="confetti-piece"
            :style="{ left: rand(5,95)+'%', top: rand(-10,-2)+'%', width: rand(6,12)+'px', height: rand(6,12)+'px', backgroundColor: randColor(), animationDelay: rand(0,0.8)+'s', animationDuration: rand(2,4)+'s', borderRadius: Math.random()>0.5?'50%':'3px', transform: 'rotate('+rand(0,360)+'deg)' }"></div>
        </div>

        <div class="unlock-card">
          <div class="unlock-icon-wrap">
            <component :is="iconComponent" :size="80" stroke-width="1.5" class="unlock-icon-svg" />
          </div>
          <div class="unlock-badge">🎉 Новое достижение!</div>
          <h2 class="unlock-name">{{ achievement?.name || 'Достижение' }}</h2>
          <p class="unlock-desc">{{ achievement?.description || '' }}</p>
          <button class="unlock-btn" @click="close">Круто! 🚀</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Star, MessageCircle, MessagesSquare, Mic, Flame, UserPlus, Calendar, Shield, Award, Crown, BookOpen, Library, Globe, ScrollText, Target, Medal, Clock, CalendarDays, Building, Cake } from 'lucide-vue-next';

const COLORS = ['#fbbf24','#a78bfa','#2dd4bf','#f472b6','#6366f1','#10b981','#f59e0b'];

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
    
    function close() { visible.value = false; setTimeout(() => emit('close'), 350); }
    function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
    function randColor() { return COLORS[Math.floor(Math.random()*COLORS.length)]; }

    onMounted(() => { timer = setTimeout(close, 5000); });
    onUnmounted(() => { clearTimeout(timer); });

    return { visible, iconComponent, close, rand, randColor };
  }
};
</script>

<style scoped>
.unlock-overlay { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); overflow: hidden; }
.confetti-container { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.confetti-piece { position: absolute; animation: confettiFall linear forwards; filter: drop-shadow(0 0 4px rgba(255,255,255,0.5)); box-shadow: 0 0 6px currentColor; }
@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(105vh) rotate(720deg); opacity: 0; } }

.unlock-card { position: relative; z-index: 10; width: 90%; max-width: 380px; padding: 36px 28px; text-align: center; background: rgba(15,15,35,0.95); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 2px solid rgba(251,191,36,0.5); border-radius: 28px; box-shadow: 0 0 80px rgba(251,191,36,0.3), 0 0 120px rgba(251,191,36,0.15), 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1); transform-style: preserve-3d; perspective: 1000px; animation: cardSpring 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes cardSpring { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

.unlock-icon-wrap { display: inline-block; margin-bottom: 16px; filter: drop-shadow(0 0 30px rgba(251,191,36,0.8)) drop-shadow(0 0 60px rgba(251,191,36,0.4)) drop-shadow(0 10px 20px rgba(0,0,0,0.5)); animation: iconBounceIn 0.6s ease infinite alternate; }
.unlock-icon-wrap::after { content: ''; position: absolute; top: 5%; left: 10%; width: 35%; height: 35%; background: radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
.unlock-icon-svg { color: #fbbf24; }
@keyframes iconBounceIn { from { transform: translateY(0) scale(1); } to { transform: translateY(-6px) scale(1.05); } }

.unlock-badge { font-family: 'Space Grotesk', sans-serif; font-size: 0.85rem; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
.unlock-name { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; margin: 8px 0; }
.unlock-desc { font-family: 'Inter', sans-serif; font-size: 0.9rem; color: #94a3b8; margin-bottom: 20px; line-height: 1.5; }

.unlock-btn { padding: 12px 32px; font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 700; color: #fff; background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%); border: none; border-radius: 50px; cursor: pointer; box-shadow: 0 8px 25px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2); transform-style: preserve-3d; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); animation: btnPulse 2s ease-in-out infinite; }
.unlock-btn:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 12px 35px rgba(99,102,241,0.6), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3); }
.unlock-btn:active { transform: translateY(1px) scale(0.98); }
@keyframes btnPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); } 50% { box-shadow: 0 0 0 16px rgba(99,102,241,0); } }

.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 0.3s ease; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }
</style>
