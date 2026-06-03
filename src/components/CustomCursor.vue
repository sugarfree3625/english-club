<template>
  <div class="cursor-dot" ref="dot"></div>
  <div class="cursor-ring" ref="ring"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const dot = ref(null);
const ring = ref(null);

let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

const onMouseMove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (dot.value) { dot.value.style.left = mouseX + 'px'; dot.value.style.top = mouseY + 'px'; }
};

const animate = () => {
  ringX += (mouseX - ringX) * 0.2;
  ringY += (mouseY - ringY) * 0.2;
  if (ring.value) { ring.value.style.left = ringX + 'px'; ring.value.style.top = ringY + 'px'; }
  requestAnimationFrame(animate);
};

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
  document.body.style.cursor = 'none';
  animate();
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.body.style.cursor = 'auto';
});
</script>

<style scoped>
.cursor-dot {
  position: fixed; width: 8px; height: 8px;
  background: #6366f1; border-radius: 50%;
  pointer-events: none; z-index: 99999;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 15px rgba(99,102,241,0.8);
}

.cursor-ring {
  position: fixed; width: 36px; height: 36px;
  border: 2px solid rgba(99,102,241,0.5);
  border-radius: 50%;
  pointer-events: none; z-index: 99998;
  transform: translate(-50%, -50%);
  transition: width 0.2s, height 0.2s;
}
</style>
