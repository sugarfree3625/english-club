<template>
  <teleport to="body">
    <transition-group name="xp-float">
      <div v-for="xp in floatingXP" :key="xp.id" class="xp-floating" :style="{ left: xp.x + 'px', top: xp.y + 'px' }">
        +{{ xp.amount }} XP ⚡
      </div>
    </transition-group>
    <!-- Уведомление о повышении уровня -->
    <transition name="level-pop">
      <div v-if="levelUp" class="level-up-notify" @click="levelUp = null">
        <div class="level-up-icon">🎉</div>
        <div class="level-up-text">
          Уровень повышен!
          <strong>{{ levelUp.prev_level }} → {{ levelUp.level }}</strong>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const floatingXP = ref([]);
const levelUp = ref(null);
let id = 0;

const showXP = (amount, x, y) => {
  const xpId = ++id;
  floatingXP.value.push({ id: xpId, amount, x, y });
  setTimeout(() => {
    floatingXP.value = floatingXP.value.filter(f => f.id !== xpId);
  }, 1500);
};

const onXPGain = (e) => {
  const { xp_added } = e.detail;
  showXP(xp_added, window.innerWidth / 2, window.innerHeight / 2);
};

const onLevelUp = (e) => {
  levelUp.value = e.detail;
  showXP(e.detail.xp_added || 100, window.innerWidth / 2, window.innerHeight / 2);
  setTimeout(() => { levelUp.value = null; }, 4000);
};

onMounted(() => {
  window.addEventListener('xp-gain', onXPGain);
  window.addEventListener('level-up', onLevelUp);
});

onBeforeUnmount(() => {
  window.removeEventListener('xp-gain', onXPGain);
  window.removeEventListener('level-up', onLevelUp);
});

defineExpose({ showXP });
</script>

<style scoped>
.xp-floating {
  position: fixed; z-index: 9999;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.3rem; font-weight: 800;
  color: #fbbf24;
  pointer-events: none;
  text-shadow: 0 0 15px rgba(251,191,36,0.6);
  animation: xpFloatUp 1.5s ease-out forwards;
  transform: translate(-50%, -50%);
}
@keyframes xpFloatUp {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
  100% { transform: translate(-50%, -150%) scale(1.5); opacity: 0; }
}

.level-up-notify {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 10000; cursor: pointer;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  color: #fff; padding: 16px 28px; border-radius: 20px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 10px 40px rgba(99,102,241,0.5);
  animation: levelBounce 0.5s ease;
}
.level-up-icon { font-size: 2rem; animation: iconPulse 1s infinite; }
.level-up-text { font-size: 0.95rem; font-weight: 600; }
.level-up-text strong { display: block; font-size: 1.1rem; }
@keyframes levelBounce {
  0% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
  60% { transform: translateX(-50%) translateY(10px); }
  100% { transform: translateX(-50%) translateY(0); opacity: 1; }
}
@keyframes iconPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
.level-pop-enter-active { animation: levelBounce 0.5s ease; }
.level-pop-leave-active { animation: fadeOut 0.3s ease; }
@keyframes fadeOut { to { opacity: 0; transform: translateX(-50%) translateY(-20px); } }
</style>
