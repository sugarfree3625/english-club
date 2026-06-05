<template>
  <div class="teacher-landing">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    
    <div class="container">
      <!-- HERO -->
      <div class="hero">
        <div class="hero-badge">👨‍🏫 Для преподавателей</div>
        <h1 class="hero-title">
          <span class="gradient-text">Зарабатывайте больше</span><br>
          с English Club
        </h1>
        <p class="hero-subtitle">
          Присоединяйтесь к платформе и получайте учеников. Мы берём на себя маркетинг, расписание и оплату.
        </p>
        <div class="hero-actions">
          <button class="btn btn-p btn-lg">Стать преподавателем</button>
          <button class="btn btn-o btn-lg">Узнать больше</button>
        </div>
      </div>

      <!-- ЦИФРЫ -->
      <div class="stats-row">
        <div class="stat-card glass-card">
          <span class="stat-value">500+</span>
          <span class="stat-label">активных учеников</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-value">85%</span>
          <span class="stat-label">удержание учеников</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-value">от 80 000 ₽</span>
          <span class="stat-label">доход в месяц</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-value">0 ₽</span>
          <span class="stat-label">комиссия первые 3 мес</span>
        </div>
      </div>

      <!-- ПРЕИМУЩЕСТВА -->
      <h2 class="section-title"><span class="gradient-text">Почему мы?</span></h2>
      <div class="benefits-grid">
        <div class="benefit-card glass-card" v-for="b in benefits" :key="b.icon">
          <span class="benefit-icon">{{ b.icon }}</span>
          <h3>{{ b.title }}</h3>
          <p>{{ b.text }}</p>
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-section glass-card">
        <h2>Готовы начать?</h2>
        <p>Оставьте заявку и мы свяжемся с вами в течение 24 часов</p>
        <button class="btn btn-p btn-lg">Отправить заявку</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const benefits = [
  { icon: '📅', title: 'Гибкий график', text: 'Вы сами выбираете когда и сколько работать. Никаких жёстких рамок.' },
  { icon: '💰', title: 'Стабильный доход', text: 'Мы обеспечиваем поток учеников. Ваша задача — качественно преподавать.' },
  { icon: '🎓', title: 'Методическая поддержка', text: 'Готовые материалы, планы уроков и доступ к профессиональному сообществу.' },
  { icon: '📱', title: 'Удобная платформа', text: 'Видеозвонки, чат, домашки, словарь — всё в одном месте.' },
  { icon: '📊', title: 'Аналитика', text: 'Отслеживайте прогресс учеников и свои показатели в реальном времени.' },
  { icon: '🚀', title: 'Карьерный рост', text: 'Повышайте рейтинг, получайте больше учеников и зарабатывайте больше.' },
];
</script>

<style scoped>
.teacher-landing { min-height: 100vh; background: #0b1120; position: relative; overflow: hidden; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.1; pointer-events: none; }
.bg-orb-1 { width: 700px; height: 700px; background: #6366f1; top: -200px; left: -200px; }
.bg-orb-2 { width: 500px; height: 500px; background: #2dd4bf; bottom: -200px; right: -200px; }
.container { max-width: 1100px; margin: 0 auto; padding: 60px 24px; position: relative; z-index: 1; }

/* HERO */
.hero { text-align: center; margin-bottom: 60px; }
.hero-badge { display: inline-block; padding: 6px 16px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 20px; color: #818cf8; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; }
.hero-title { font-family: 'Space Grotesk', sans-serif; font-size: 3rem; font-weight: 800; color: #fff; margin: 0 0 16px; line-height: 1.2; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { color: #94a3b8; font-size: 1.1rem; max-width: 600px; margin: 0 auto 30px; line-height: 1.6; }
.hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* СТАТИСТИКА */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 80px; }
@media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { padding: 24px; text-align: center; }
.glass-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; transition: all 0.3s; }
.glass-card:hover { box-shadow: 0 0 30px rgba(99,102,241,0.2); transform: translateY(-2px); }
.stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: block; }
.stat-label { color: #94a3b8; font-size: 0.85rem; margin-top: 4px; }

/* ПРЕИМУЩЕСТВА */
.section-title { text-align: center; font-family: 'Space Grotesk', sans-serif; font-size: 2.5rem; font-weight: 800; margin-bottom: 50px; }
.benefits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 80px; }
@media (max-width: 768px) { .benefits-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .benefits-grid { grid-template-columns: 1fr; } }
.benefit-card { padding: 28px; text-align: center; }
.benefit-icon { font-size: 2.5rem; display: block; margin-bottom: 16px; }
.benefit-card h3 { color: #fff; font-size: 1.1rem; margin-bottom: 8px; font-family: 'Space Grotesk', sans-serif; }
.benefit-card p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }

/* CTA */
.cta-section { text-align: center; padding: 50px; }
.cta-section h2 { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; color: #fff; margin-bottom: 12px; }
.cta-section p { color: #94a3b8; font-size: 1rem; margin-bottom: 24px; }

/* КНОПКИ */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; text-decoration: none; }
.btn:hover { transform: translateY(-2px); }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 2px solid rgba(255,255,255,0.1); color: #cbd5e1; background: transparent; }
.btn-o:hover { border-color: rgba(99,102,241,0.5); }
.btn-lg { padding: 14px 32px; font-size: 1rem; }
</style>
