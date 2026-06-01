<template>
  <section class="section" id="services" v-if="services.length">
    <div class="bg-orb bg-orb-3"></div>
    <div class="bg-orb bg-orb-4"></div>
    <div class="container">
      <h2 class="section-title"><span class="gradient-text">Мои услуги</span></h2>
      <div class="services-grid">
        <div v-for="(service, i) in services" :key="i" class="service-card glass-card animate-on-scroll" :class="{ popular: service.popular }">
          <div v-if="service.popular" class="popular-badge">Популярный выбор</div>
          <div class="gradient-strip"></div>
          <div class="service-content">
            <h3 class="service-name">{{ service.title || service.name }}</h3>
            <div class="service-price">{{ service.price }} <span class="service-period">/ урок</span></div>
            <div class="service-duration" v-if="service.duration"><Clock class="w-4 h-4" /><span>{{ service.duration }}</span></div>
            <p class="service-desc">{{ service.desc }}</p>
            <button :class="service.popular ? 'btn-gradient' : 'btn-glass'" @click="$emit('cta-click')">
              <Sparkles v-if="service.popular" class="w-4 h-4" />
              <ArrowRight v-else class="w-4 h-4" />
              <span>{{ service.popular ? 'Выбрать пакет' : 'Узнать больше' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Clock, Sparkles, ArrowRight } from 'lucide-vue-next';

defineProps({
  services: { type: Array, default: () => [] }
});

defineEmits(['cta-click']);
</script>

<style scoped>
.section { position: relative; padding: 100px 0; overflow: hidden; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }
.bg-orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; pointer-events: none; }
.bg-orb-3 { width: 400px; height: 400px; background: #2dd4bf; top: -100px; right: -100px; }
.bg-orb-4 { width: 500px; height: 500px; background: #6366f1; bottom: -150px; left: -150px; }
.glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; transition: all 0.3s ease; }
.glass-card:hover { box-shadow: 0 0 20px rgba(99,102,241,0.2); }
.section-title { font-family: 'Space Grotesk', sans-serif; font-size: 2.5rem; font-weight: 800; text-align: center; margin-bottom: 60px; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }
.service-card { display: flex; overflow: hidden; position: relative; }
.service-card.popular { border-color: rgba(99,102,241,0.3); }
.popular-badge { position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; z-index: 1; }
.gradient-strip { width: 4px; background: linear-gradient(135deg, #6366f1, #2dd4bf); }
.service-content { flex: 1; padding: 28px; }
.service-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.2rem; color: #fff; margin-bottom: 12px; }
.service-price { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
.service-period { font-size: 0.9rem; color: #94a3b8; -webkit-text-fill-color: #94a3b8; }
.service-duration { display: flex; align-items: center; gap: 6px; color: #94a3b8; font-size: 0.9rem; margin-bottom: 12px; }
.service-desc { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px; }
.btn-gradient, .btn-glass { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.3s; }
.btn-gradient { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
.btn-glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); color: #fff; }
.btn-glass:hover { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
.animate-on-scroll { opacity: 0; transform: translateY(30px); transition: all 0.8s ease; }
.animate-on-scroll.visible { opacity: 1; transform: translateY(0); }
@media (max-width: 768px) { .services-grid { grid-template-columns: 1fr; } }
</style>
