<template>
  <div class="online-widget">
    <div class="online-dot"></div>
    <span>{{ count }} онлайн</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const count = ref(Math.floor(Math.random() * 10) + 1);

let timer;
onMounted(() => {
  timer = setInterval(() => {
    count.value = Math.floor(Math.random() * 15) + 1;
  }, 10000);
});

onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
.online-widget {
  position: fixed; bottom: 100px; left: 24px;
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  background: rgba(15,15,30,0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(16,185,129,0.3);
  border-radius: 20px;
  color: #10b981; font-size: 0.8rem;
  font-weight: 600; z-index: 100;
}

.online-dot {
  width: 8px; height: 8px;
  background: #10b981; border-radius: 50%;
  animation: onlinePulse 2s infinite;
}

@keyframes onlinePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
  50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
}
</style>
