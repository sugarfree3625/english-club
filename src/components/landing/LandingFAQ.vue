<template>
  <section class="section" id="faq" v-if="faqs.length">
    <div class="container">
      <h2 class="section-title"><span class="gradient-text">Частые вопросы</span></h2>
      <div class="faq-list">
        <div v-for="(f, i) in faqs" :key="i" class="faq-item glass-card" @click="toggle(i)">
          <div class="faq-header">
            <h4>{{ f.q }}</h4>
            <span class="faq-arrow" :class="{ open: open[i] }">▾</span>
          </div>
          <transition name="faq-slide">
            <p v-show="open[i]" class="faq-answer">{{ f.a }}</p>
          </transition>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive } from 'vue';

defineProps({ faqs: { type: Array, default: () => [] } });
const open = reactive({});
const toggle = (i) => { open[i] = !open[i]; };
</script>

<style scoped>
.section { position: relative; padding: 80px 0; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
.glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; }
.section-title { font-family: 'Space Grotesk', sans-serif; font-size: 2.5rem; font-weight: 800; text-align: center; margin-bottom: 60px; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.faq-list { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
.faq-item { padding: 18px 24px; cursor: pointer; }
.faq-header { display: flex; justify-content: space-between; align-items: center; }
.faq-header h4 { margin: 0; color: #fff; font-size: 0.95rem; font-weight: 600; }
.faq-arrow { color: #94a3b8; transition: transform 0.3s; font-size: 1.2rem; }
.faq-arrow.open { transform: rotate(180deg); color: #6366f1; }
.faq-answer { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.faq-slide-enter-active, .faq-slide-leave-active { transition: all 0.3s ease; }
.faq-slide-enter-from, .faq-slide-leave-to { opacity: 0; max-height: 0; }
</style>
