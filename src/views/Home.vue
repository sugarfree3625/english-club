<template>
  <div id="page-home">
    <HeroSection />
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
  background: #0b1120;
}
</style>
