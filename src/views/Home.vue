<template>
  <div id="page-home">
    <HeroSection />
    <LandingSections />
    
    <!-- 🔥 ВИДЖЕТЫ (только на главной) -->
    <OnlineWidget />
    <AIAssistant />
  </div>
</template>

<script>
import HeroSection from '../components/HeroSection.vue';
import LandingSections from '../components/LandingSections.vue';
import OnlineWidget from '../components/OnlineWidget.vue';
import AIAssistant from '../components/AIAssistant.vue';

export default {
  name: 'Home',
  components: { HeroSection, LandingSections, OnlineWidget, AIAssistant },
  props: ['settings']
};
</script>

<style scoped>
#page-home {
  background: #0b1120;
}
</style>