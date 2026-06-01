<template>
  <section class="section" id="testimonials" v-if="testimonials.length">
    <div class="bg-orb bg-orb-6"></div>
    <div class="container">
      <h2 class="section-title"><span class="gradient-text">Что говорят ученики</span></h2>
      <div class="carousel" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
        <button class="carousel-arrow" @click="prevSlide"><ChevronLeft class="w-5 h-5" /></button>
        <div class="carousel-track">
          <transition :name="slideDirection" mode="out-in">
            <div :key="currentSlide" class="testimonial-card glass-card">
              <Quote class="quote-icon" />
              <div class="testimonial-content">
                <img :src="testimonials[currentSlide].avatar || getAvatar(testimonials[currentSlide].name)" class="testimonial-avatar" />
                <div>
                  <strong class="testimonial-name">{{ testimonials[currentSlide].name }}</strong>
                  <span class="testimonial-role">{{ testimonials[currentSlide].role }}</span>
                  <p class="testimonial-text">"{{ testimonials[currentSlide].text }}"</p>
                  <div class="testimonial-stars" v-if="testimonials[currentSlide].stars">
                    <span v-for="s in testimonials[currentSlide].stars" :key="s">⭐</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
        <button class="carousel-arrow" @click="nextSlide"><ChevronRight class="w-5 h-5" /></button>
      </div>
      <div class="carousel-dots" v-if="testimonials.length > 1">
        <span v-for="(_, i) in testimonials" :key="i" class="dot" :class="{ active: i === currentSlide }" @click="goToSlide(i)"></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps({
  testimonials: { type: Array, default: () => [] }
});

const currentSlide = ref(0);
const slideDirection = ref('slide-right');
let timer = null;

const nextSlide = () => { slideDirection.value = 'slide-right'; currentSlide.value = (currentSlide.value + 1) % props.testimonials.length; };
const prevSlide = () => { slideDirection.value = 'slide-left'; currentSlide.value = (currentSlide.value - 1 + props.testimonials.length) % props.testimonials.length; };
const goToSlide = (i) => { slideDirection.value = i > currentSlide.value ? 'slide-right' : 'slide-left'; currentSlide.value = i; };
const startAutoPlay = () => { if (props.testimonials.length > 1) timer = setInterval(nextSlide, 5000); };
const stopAutoPlay = () => clearInterval(timer);
const getAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=6366f1&color=fff`;

onMounted(() => startAutoPlay());
onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
.section { position: relative; padding: 80px 0; overflow: hidden; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }
.bg-orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; pointer-events: none; }
.bg-orb-6 { width: 350px; height: 350px; background: #2dd4bf; bottom: -100px; right: -80px; }
.glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; }
.section-title { font-family: 'Space Grotesk', sans-serif; font-size: 2.5rem; font-weight: 800; text-align: center; margin-bottom: 60px; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.carousel { display: flex; align-items: center; gap: 20px; max-width: 700px; margin: 0 auto; }
.carousel-arrow { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s; }
.carousel-arrow:hover { background: rgba(99,102,241,0.2); box-shadow: 0 0 15px rgba(99,102,241,0.3); }
.carousel-track { flex: 1; overflow: hidden; }
.testimonial-card { padding: 32px; position: relative; }
.quote-icon { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; color: #6366f1; opacity: 0.3; }
.testimonial-content { display: flex; gap: 20px; align-items: flex-start; }
.testimonial-avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid rgba(99,102,241,0.3); }
.testimonial-name { display: block; font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #fff; }
.testimonial-role { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; }
.testimonial-text { color: #cbd5e1; font-style: italic; line-height: 1.7; }
.testimonial-stars { margin-top: 6px; font-size: 0.9rem; }
.carousel-dots { display: flex; gap: 8px; justify-content: center; margin-top: 24px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.2); cursor: pointer; transition: all 0.3s; }
.dot.active { background: #6366f1; box-shadow: 0 0 8px rgba(99,102,241,0.5); }
.slide-right-enter-active, .slide-left-enter-active { transition: all 0.4s ease; }
.slide-right-enter-from { opacity: 0; transform: translateX(40px); }
.slide-right-leave-to { opacity: 0; transform: translateX(-40px); }
.slide-left-enter-from { opacity: 0; transform: translateX(-40px); }
.slide-left-leave-to { opacity: 0; transform: translateX(40px); }
@media (max-width: 768px) { .carousel { gap: 10px; } .carousel-arrow { width: 36px; height: 36px; } .testimonial-content { flex-direction: column; align-items: center; text-align: center; } }
</style>
