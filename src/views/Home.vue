<template>
  <div id="page-home">
    <!-- Hero секция с анимированным градиентом -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="container hero-content">
        <h1 class="fade-in-up">
          <span class="gradient-text">{{ settings.hero_title || 'Speak English Freely' }}</span>
        </h1>
        <p class="fade-in-up" style="animation-delay:0.2s">{{ settings.hero_subtitle || 'Разговорный клуб для практики языка' }}</p>
        <div class="hero-btns fade-in-up" style="animation-delay:0.4s">
          <button class="btn btn-p btn-pulse" @click="$router.push('/dashboard')">🚀 Начать</button>
          <button class="btn btn-o" @click="scrollToSection('services-section')">📦 Услуги</button>
        </div>
      </div>
    </section>

    <!-- Услуги -->
    <section class="section" id="services-section">
      <div class="container">
        <h2 class="section-title">Мои услуги</h2>
        <div class="grid">
          <div class="glass-card fade-in-up" v-for="(s, i) in services" :key="s.id" :style="{ animationDelay: (i * 0.1) + 's' }">
            <div class="card-icon">{{ s.icon || '📦' }}</div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
            <div class="price">{{ s.price }}</div>
          </div>
        </div>
        <p v-if="!services.length" class="empty-text fade-in">Услуги скоро появятся</p>
      </div>
    </section>

    <!-- Контакты -->
    <section class="section" id="contacts-section">
      <div class="container" style="text-align:center">
        <h2 class="section-title">Связаться</h2>
        <div class="contact-icons fade-in-up">
          <a v-if="settings.vk" :href="settings.vk" target="_blank" class="contact-link">
            <i class="fab fa-vk"></i>
          </a>
          <a v-if="settings.tg" :href="settings.tg" target="_blank" class="contact-link">
            <i class="fab fa-telegram"></i>
          </a>
          <a v-if="settings.wa" :href="settings.wa" target="_blank" class="contact-link">
            <i class="fab fa-whatsapp"></i>
          </a>
        </div>
      </div>
    </section>

    <footer><p>© 2026 {{ settings.club_name || 'English Club' }} — Разговорный клуб</p></footer>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Home',
  props: ['settings'],
  data() { return { services: [] }; },
  async mounted() {
    try { const r = await axios.get('/api/services'); this.services = r.data; } catch(e) {}
  },
  methods: {
    scrollToSection(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }
};
</script>

<style scoped>
/* Hero */
.hero {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, rgba(139,92,246,0.06) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(236,72,153,0.04) 0%, transparent 50%);
  animation: gradientShift 8s ease infinite;
}
@keyframes gradientShift {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.hero-content { position: relative; z-index: 1; }
.hero h1 { font-size: clamp(2rem, 6vw, 4rem); font-weight: 800; margin-bottom: 16px; }
.gradient-text {
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
  background-size: 200% 200%;
  animation: gradientMove 3s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.hero p { font-size: 1.3rem; color: #64748b; margin-bottom: 24px; max-width: 500px; margin-left: auto; margin-right: auto; }
.hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* Анимации */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.fade-in-up { animation: fadeInUp 0.6s ease-out both; }
.fade-in { animation: fadeIn 0.5s ease-out both; }

/* Секции */
.section { padding: 80px 0; }
.section-title {
  font-size: 2.2rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 32px;
  background: linear-gradient(135deg, #1e293b, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.empty-text { text-align: center; color: #94a3b8; padding: 40px; }

/* Сетка услуг */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

/* Стеклянные карточки */
.glass-card {
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 24px;
  padding: 28px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}
.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
}
.card-icon { font-size: 2.5rem; margin-bottom: 12px; }
.glass-card h3 { font-weight: 700; font-size: 1.2rem; margin-bottom: 8px; }
.glass-card p { color: #64748b; font-size: 0.9rem; margin-bottom: 12px; }
.price { font-size: 1.5rem; font-weight: 800; color: #6366f1; }

/* Контакты */
.contact-icons { display: flex; gap: 20px; justify-content: center; margin-top: 20px; }
.contact-link {
  width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 1.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99,102,241,0.3);
}
.contact-link:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(99,102,241,0.5);
}

/* Кнопки */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.3s ease;
}
.btn-p {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 4px 15px rgba(99,102,241,0.3);
}
.btn-p:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(99,102,241,0.5); }
.btn-o {
  border: 2px solid #6366f1;
  color: #6366f1;
  background: transparent;
}
.btn-o:hover { background: #eef0ff; transform: translateY(-2px); }
.btn-pulse { animation: pulse 2s infinite; }
.btn-pulse:hover { animation: none; }
@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
  50% { box-shadow: 0 8px 30px rgba(99,102,241,0.6); }
}

footer { text-align: center; padding: 40px 0; color: #94a3b8; border-top: 1px solid #e2e8f0; font-size: 0.85rem; }

/* Тёмная тема */
body.dark .glass-card { background: rgba(30,41,59,0.8); border-color: rgba(255,255,255,0.05); }
body.dark .glass-card p { color: #94a3b8; }
body.dark .section-title { background: linear-gradient(135deg, #e2e8f0, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
body.dark .hero p { color: #94a3b8; }

@media (max-width: 768px) {
  .hero { min-height: 60vh; }
  .section { padding: 50px 0; }
  .section-title { font-size: 1.6rem; }
}
</style>
