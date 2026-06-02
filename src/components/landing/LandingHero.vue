<template>
  <section class="section" id="about">
    <div class="bg-orb bg-orb-1" ref="orb1"></div>
    <div class="bg-orb bg-orb-2" ref="orb2"></div>
    <div class="container">
      <div class="about-grid">
        <div class="about-left">
          <div class="photo-wrapper">
            <img :src="tutor.photo" :alt="tutor.name" class="tutor-photo" />
          </div>
          <h2 class="tutor-name">{{ tutor.name }}</h2>
          <p class="tutor-spec">{{ tutor.bio }}</p>
          
          <!-- Счётчики -->
          <div class="counters-row">
            <div v-for="c in counters" :key="c.label" class="counter-item">
              <span class="counter-value">{{ animatedCounters[c.label] || 0 }}{{ c.suffix }}</span>
              <span class="counter-label">{{ c.label }}</span>
            </div>
          </div>
        </div>
        
        <div class="about-right">
          <div v-for="(item, i) in aboutItems" :key="i" class="glass-card about-card animate-on-scroll">
            <span class="about-card-icon">{{ item.icon }}</span>
            <div>
              <h4 class="about-card-title">{{ item.title }}</h4>
              <p class="about-card-text">{{ item.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';

const props = defineProps({
  tutor: { type: Object, default: () => ({ name: '', photo: '', bio: '' }) }
});

const orb1 = ref(null);
const orb2 = ref(null);

const counters = [
  { label: 'учеников', value: 100, suffix: '+' },
  { label: 'лет опыта', value: 5, suffix: '+' },
  { label: 'уроков', value: 1500, suffix: '+' },
  { label: 'довольных', value: 97, suffix: '%' },
];

const animatedCounters = reactive({});
const countersAnimated = ref(false);

const aboutItems = [
  { icon: '🎓', title: 'Образование', text: 'МГЛУ, факультет английского языка. Сертификаты TESOL, CELTA.' },
  { icon: '💼', title: 'Опыт', text: '10+ лет преподавания. 500+ учеников. Работаю со взрослыми и подростками.' },
  { icon: '🗣', title: 'Методика', text: 'Коммуникативный подход. 80% урока — ваша речь. Индивидуальная программа.' },
];

// Анимация счётчиков
const animateCounters = () => {
  counters.forEach(c => {
    const duration = 2000;
    const end = c.value;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      animatedCounters[c.label] = Math.floor(end * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else animatedCounters[c.label] = end;
    };
    tick();
  });
};

// Intersection Observer для счётчиков
let observer = null;
const setupObserver = () => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (!countersAnimated.value) {
          countersAnimated.value = true;
          animateCounters();
        }
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
};

// Параллакс
const handleParallax = () => {
  const scrolled = window.pageYOffset;
  if (orb1.value) orb1.value.style.transform = `translateY(${scrolled * 0.03}px)`;
  if (orb2.value) orb2.value.style.transform = `translateY(${scrolled * -0.04}px)`;
};

onMounted(() => {
  nextTick(() => setupObserver());
  window.addEventListener('scroll', handleParallax, { passive: true });
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
  window.removeEventListener('scroll', handleParallax);
});
</script>

<style scoped>
.section { position: relative; padding: 100px 0; overflow: hidden; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }

.bg-orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; pointer-events: none; transition: transform 0.1s linear; }
.bg-orb-1 { width: 500px; height: 500px; background: #6366f1; top: -150px; left: -150px; }
.bg-orb-2 { width: 400px; height: 400px; background: #2dd4bf; bottom: -100px; right: -100px; }

.glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; transition: all 0.3s ease; }
.glass-card:hover { box-shadow: 0 0 20px rgba(99,102,241,0.2); }

.about-grid { display: flex; gap: 60px; align-items: flex-start; }
.about-left { width: 40%; text-align: center; }
.photo-wrapper { display: inline-block; padding: 4px; background: linear-gradient(135deg, #6366f1, #2dd4bf); border-radius: 50%; margin-bottom: 20px; }
.tutor-photo { width: 200px; height: 200px; border-radius: 50%; object-fit: cover; display: block; }
.tutor-name { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; }
.tutor-spec { font-family: 'Inter', sans-serif; color: #94a3b8; margin-top: 6px; }
.about-right { width: 60%; display: flex; flex-direction: column; gap: 16px; }
.about-card { padding: 20px 24px; display: flex; gap: 16px; align-items: flex-start; }
.about-card-icon { font-size: 1.5rem; flex-shrink: 0; }
.about-card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #fff; margin-bottom: 4px; }
.about-card-text { font-family: 'Inter', sans-serif; font-size: 0.9rem; color: #94a3b8; line-height: 1.6; }

.counters-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 24px; }
.counter-item { text-align: center; padding: 16px 12px; background: rgba(255,255,255,0.05); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); }
.counter-value { display: block; font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.counter-label { display: block; font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }

.animate-on-scroll { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
.animate-on-scroll.visible { opacity: 1; transform: translateY(0); }

@media (max-width: 768px) { .about-grid { flex-direction: column; gap: 30px; } .about-left, .about-right { width: 100%; } .tutor-photo { width: 150px; height: 150px; } }
</style>
