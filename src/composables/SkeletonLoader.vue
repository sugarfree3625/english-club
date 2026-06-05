<template>
  <div class="skeleton" :style="{ width: width, height: height }">
    <div class="skeleton-shine"></div>
  </div>
</template>

<script setup>
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '16px' }
});
</script>

<style scoped>
.skeleton {
  background: rgba(255,255,255,0.04);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
.skeleton-shine {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  animation: shine 1.5s infinite;
}
@keyframes shine { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
</style>
