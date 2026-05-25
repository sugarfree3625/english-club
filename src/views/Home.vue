<template>
  <div id="page-home">
    <!-- 3D Hero -->
    <HeroSection />
    
    <!-- Премиальные секции -->
    <LandingSections />
  </div>
</template>

<script>
import HeroSection from '../components/HeroSection.vue';
import LandingSections from '../components/LandingSections.vue';

export default {
  name: 'Home',
  components: { HeroSection, LandingSections },
  props: ['settings']
};
</script>

<style scoped>
#page-home {
  background: #f8fafc;
}
</style>
