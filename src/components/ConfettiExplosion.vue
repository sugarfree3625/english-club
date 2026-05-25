<template>
  <div class="confetti-container" v-if="active">
    <div v-for="i in 50" :key="i" class="confetti" :style="{ left: Math.random() * 100 + '%', animationDelay: Math.random() * 2 + 's', backgroundColor: colors[Math.floor(Math.random() * colors.length)] }"></div>
  </div>
</template>

<script>
export default {
  props: { active: Boolean },
  data() { return { colors: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f', '#ff8800', '#88ff00'] }; }
};
</script>

<style scoped>
.confetti-container { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
.confetti { position: absolute; top: -10px; width: 10px; height: 10px; animation: confettiFall 3s linear forwards; }
@keyframes confettiFall { to { top: 100vh; opacity: 0; transform: rotate(720deg); } }
</style>
