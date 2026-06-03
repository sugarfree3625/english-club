<template>
  <div class="particles-container">
    <div v-for="p in particles" :key="p.id" class="particle" :style="p.style"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const particles = ref([]);

onMounted(() => {
  for (let i = 0; i < 50; i++) {
    particles.value.push({
      id: i,
      style: {
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        width: 2 + Math.random() * 4 + 'px',
        height: 2 + Math.random() * 4 + 'px',
        animationDuration: 3 + Math.random() * 7 + 's',
        animationDelay: Math.random() * 5 + 's',
        opacity: 0.3 + Math.random() * 0.5,
        background: Math.random() > 0.5 ? '#6366f1' : '#2dd4bf'
      }
    });
  }
});
</script>

<style scoped>
.particles-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  border-radius: 50%;
  animation: floatUp linear infinite;
}

@keyframes floatUp {
  0% { transform: translateY(100vh) scale(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100px) scale(1); opacity: 0; }
}
</style>
