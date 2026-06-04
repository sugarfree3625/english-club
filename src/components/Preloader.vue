<template>
  <transition name="preloader-fade">
    <div v-if="visible" class="preloader-overlay">
      <div class="preloader-content">
        <div class="preloader-logo">🗣️</div>
        <div class="preloader-spinner">
          <div class="spinner-ring"></div>
        </div>
        <div class="preloader-text">English Club</div>
        <div class="preloader-sub">Загрузка...</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const visible = ref(true);

onMounted(() => {
  setTimeout(() => { visible.value = false; }, 1500);
});
</script>

<style scoped>
.preloader-overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: #0b1120;
  display: flex; align-items: center; justify-content: center;
}
.preloader-content { text-align: center; }
.preloader-logo { font-size: 5rem; animation: preloaderBounce 1s ease-in-out infinite; }
@keyframes preloaderBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
.preloader-spinner { margin: 20px auto; width: 50px; height: 50px; }
.spinner-ring {
  width: 100%; height: 100%;
  border: 3px solid rgba(99,102,241,0.15);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.preloader-text { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; }
.preloader-sub { color: #94a3b8; font-size: 0.9rem; margin-top: 8px; }
.preloader-fade-leave-active { transition: opacity 0.5s ease; }
.preloader-fade-leave-to { opacity: 0; }
</style>