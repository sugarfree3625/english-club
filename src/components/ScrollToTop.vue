<template>
  <button class="scroll-top-btn" @click="scrollToTop" v-show="visible" title="Наверх">⬆️</button>
</template>

<script>
export default {
  data() { return { visible: false }; },
  mounted() { window.addEventListener('scroll', this.onScroll); },
  beforeUnmount() { window.removeEventListener('scroll', this.onScroll); },
  methods: {
    onScroll() { this.visible = window.scrollY > 300; },
    scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }
};
</script>

<style scoped>
.scroll-top-btn {
  position: fixed; 
  bottom: 30px; 
  right: 30px; 
  z-index: 9997;
  width: 50px; 
  height: 50px; 
  border-radius: 50%; 
  background: var(--p);
  color: #fff; 
  border: none; 
  cursor: pointer; 
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.scroll-top-btn:hover { 
  transform: scale(1.1); 
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

/* МОБИЛЬНЫЕ СТИЛИ */
@media (max-width: 768px) {
  .scroll-top-btn {
    bottom: 16px !important;
    right: 16px !important;
    width: 44px !important;
    height: 44px !important;
    font-size: 1.2rem !important;
    z-index: 9997 !important;
  }
}
</style>