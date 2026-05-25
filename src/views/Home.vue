<template>
  <div id="page-home">
    <section class="hero-new">
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="hero-content-new">
        <div class="hero-layout">
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="gradient-text-animated">{{ settings.hero_title || 'Speak English Freely' }}</span>
            </h1>
            <p class="hero-subtitle">{{ settings.hero_subtitle || 'Разговорный клуб нового поколения' }}</p>
            <div class="hero-actions">
              <button class="glass-btn" @click="scrollToSection('about-section')"><span class="glass-btn-icon">👩‍🏫</span> Познакомиться</button>
              <button class="glass-btn-secondary" @click="scrollToSection('services-section')">Услуги</button>
            </div>
            <div class="hero-stats">
              <div class="hero-stat" v-for="stat in stats" :key="stat.label">
                <span class="hero-stat-value">{{ stat.value }}+</span>
                <span class="hero-stat-label">{{ stat.label }}</span>
              </div>
            </div>
          </div>
          <div class="hero-photo-wrapper">
            <div class="hero-photo-ring"></div>
            <img :src="tutorPhoto" class="hero-photo" alt="Репетитор">
            <div class="hero-photo-badge">⭐ 10+ лет опыта</div>
          </div>
        </div>
      </div>
      <div class="scroll-indicator-new" @click="scrollToSection('about-section')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>
      </div>
    </section>
    <section class="section" id="about-section">
      <div class="container">
        <div class="about-layout">
          <div class="about-photo-col">
            <img :src="tutorPhoto" class="about-photo" alt="Репетитор">
            <div class="about-experience">
              <span class="about-years">10+</span>
              <span class="about-years-label">лет преподавания</span>
            </div>
          </div>
          <div class="about-text-col">
            <h2 class="section-title" style="text-align:left">Привет! Я Анна — ваш преподаватель</h2>
            <p class="about-intro">Сертифицированный преподаватель английского (TESOL, CELTA). Помогла 500+ ученикам заговорить на английском свободно. Жила и работала в Лондоне 5 лет.</p>
            <div class="about-features">
              <div class="about-feature"><span>🎓</span><div><strong>TESOL/CELTA</strong><small>Международные сертификаты</small></div></div>
              <div class="about-feature"><span>🇬🇧</span><div><strong>5 лет в Лондоне</strong><small>Опыт жизни в языковой среде</small></div></div>
              <div class="about-feature"><span>👩‍🎓</span><div><strong>500+ учеников</strong><small>От A1 до C2</small></div></div>
              <div class="about-feature"><span>💡</span><div><strong>Авторская методика</strong><small>Быстрый прогресс без скуки</small></div></div>
            </div>
            <button class="glass-btn" @click="scrollToSection('services-section')"><span class="glass-btn-icon">🚀</span> Записаться на пробный урок</button>
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt" id="certs-section">
      <div class="container">
        <h2 class="section-title">Мои сертификаты</h2>
        <div class="certs-grid">
          <div class="cert-card fade-in-up" v-for="(cert, i) in certificates" :key="i" :style="{ animationDelay: `${i * 0.1}s` }">
            <div class="cert-icon">{{ cert.icon }}</div>
            <h4>{{ cert.title }}</h4>
            <p>{{ cert.from }}</p>
          </div>
        </div>
      </div>
    </section>
    <section class="section" id="how-section">
      <div class="container">
        <h2 class="section-title">Как это работает</h2>
        <div class="steps-grid">
          <div class="step-card fade-in-up" v-for="(step, i) in steps" :key="i" :style="{ animationDelay: `${i * 0.15}s` }">
            <div class="step-number">{{ i + 1 }}</div>
            <div class="step-icon">{{ step.icon }}</div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt" id="services-section">
      <div class="container">
        <h2 class="section-title">Услуги и цены</h2>
        <div class="grid">
          <div class="glass-card fade-in-up" v-for="(s, i) in services" :key="s.id" :style="{ animationDelay: `${i * 0.1}s` }">
            <div class="card-icon-wrapper"><span class="card-icon">{{ s.icon || '📦' }}</span></div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
            <div class="price">{{ s.price }}</div>
          </div>
        </div>
        <p v-if="!services.length" class="empty-text fade-in">Услуги скоро появятся</p>
      </div>
    </section>
    <section class="cta-section">
      <div class="container" style="text-align:center">
        <h2>Готовы начать говорить?</h2>
        <p>Запишитесь на бесплатный пробный урок уже сегодня!</p>
        <button class="glass-btn" @click="scrollToSection('contacts-section')"><span class="glass-btn-icon">💬</span> Связаться</button>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="section-title">Что говорят ученики</h2>
        <div class="reviews-grid">
          <div class="review-card fade-in-up" v-for="(r, i) in reviews" :key="i" :style="{ animationDelay: `${i * 0.12}s` }">
            <div class="review-stars">{{ '⭐'.repeat(r.stars) }}</div>
            <p class="review-text">"{{ r.text }}"</p>
            <div class="review-author">
              <img :src="r.avatar" class="review-avatar">
              <div><strong>{{ r.name }}</strong><small>{{ r.role }}</small></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="section section-alt" id="faq-section">
      <div class="container" style="max-width:800px">
        <h2 class="section-title">Частые вопросы</h2>
        <div class="faq-list">
          <div class="faq-item" v-for="(faq, i) in faqs" :key="i" @click="faq.open = !faq.open">
            <div class="faq-header"><span>{{ faq.q }}</span><span class="faq-arrow" :class="{ open: faq.open }">▾</span></div>
            <div class="faq-body" v-show="faq.open"><p>{{ faq.a }}</p></div>
          </div>
        </div>
      </div>
    </section>
    <section class="section" id="contacts-section">
      <div class="container" style="text-align:center">
        <h2 class="section-title">Связаться со мной</h2>
        <p style="color:var(--t2);margin-bottom:30px">Есть вопросы? Я на связи!</p>
        <div class="contact-icons fade-in-up">
          <a v-if="settings.tg" :href="settings.tg" target="_blank" class="contact-link"><i class="fab fa-telegram"></i></a>
          <a v-if="settings.wa" :href="settings.wa" target="_blank" class="contact-link"><i class="fab fa-whatsapp"></i></a>
          <a v-if="settings.vk" :href="settings.vk" target="_blank" class="contact-link"><i class="fab fa-vk"></i></a>
        </div>
      </div>
    </section>
    <footer class="footer-new">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col"><h4>{{ settings.club_name || 'English Club' }}</h4><p>Разговорный клуб нового поколения. Практикуй английский с удовольствием.</p></div>
          <div class="footer-col"><h4>Навигация</h4><a @click="scrollToSection('about-section')">Обо мне</a><a @click="scrollToSection('how-section')">Как это работает</a><a @click="scrollToSection('services-section')">Услуги</a><a @click="scrollToSection('faq-section')">Частые вопросы</a></div>
          <div class="footer-col"><h4>Контакты</h4><a :href="settings.tg" target="_blank">Telegram</a><a :href="settings.wa" target="_blank">WhatsApp</a><a href="mailto:hello@english-club.ru">hello@english-club.ru</a></div>
        </div>
        <div class="footer-bottom"><p>© 2026 {{ settings.club_name || 'English Club' }}. Все права защищены.</p></div>
      </div>
    </footer>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'Home',
  props: ['settings'],
  data() { 
    return { 
      services: [],
      tutorPhoto: 'https://ui-avatars.com/api/?name=Анна+П&size=400&background=6366f1&color=fff&bold=true',
      stats: [
        { value: '500', label: 'Учеников' },
        { value: '50', label: 'Встреч/мес' },
        { value: '98', label: '% довольны' }
      ],
      certificates: [
        { icon: '🎓', title: 'TESOL Certificate', from: 'Arizona State University' },
        { icon: '📜', title: 'CELTA Certificate', from: 'Cambridge University' },
        { icon: '🏆', title: 'IELTS Examiner', from: 'British Council' },
        { icon: '🌟', title: 'TEFL Advanced', from: 'International TEFL Academy' }
      ],
      steps: [
        { icon: '📝', title: 'Регистрируешься', text: 'Создай аккаунт за 1 минуту' },
        { icon: '📅', title: 'Выбираешь встречу', text: 'Удобное время и тема' },
        { icon: '🚀', title: 'Начинаешь говорить', text: 'Живое общение с носителями' }
      ],
      reviews: [
        { stars: 5, text: 'Отличный клуб! За 2 месяца поднял уровень с A1 до B1.', name: 'Иван П.', role: 'Ученик', avatar: 'https://ui-avatars.com/api/?name=Иван+П&background=6366f1&color=fff' },
        { stars: 5, text: 'Дочь ходит с удовольствием! Анна даёт обратную связь после каждого урока.', name: 'Анна С.', role: 'Родитель', avatar: 'https://ui-avatars.com/api/?name=Анна+С&background=2dd4bf&color=fff' },
        { stars: 5, text: 'Лучший преподаватель! Индивидуальный подход и крутая атмосфера.', name: 'Мария К.', role: 'Ученик', avatar: 'https://ui-avatars.com/api/?name=Мария+К&background=8b5cf6&color=fff' }
      ],
      faqs: [
        { q: 'Как проходят встречи?', a: 'Встречи проходят в формате видеозвонков через Jitsi Meet. Вы подключаетесь по ссылке в назначенное время и общаетесь с преподавателем и другими учениками.', open: false },
        { q: 'Сколько это стоит?', a: 'Цены зависят от выбранного тарифа. Есть бесплатные пробные встречи. Актуальные цены смотрите в разделе "Услуги".', open: false },
        { q: 'Кто ведёт занятия?', a: 'Занятия веду лично я — Анна, сертифицированный преподаватель TESOL/CELTA с 10+ летним опытом.', open: false },
        { q: 'Нужен ли микрофон и камера?', a: 'Желательно иметь микрофон для общения. Камера приветствуется, но не обязательна — главное ваше участие!', open: false },
        { q: 'Можно ли учиться с нуля?', a: 'Да! У нас есть группы для начинающих (уровень A1). Вы быстро освоите базовые фразы и начнёте говорить.', open: false }
      ]
    }; 
  },
  async mounted() { try { const r = await axios.get('/api/services'); this.services = r.data; } catch(e) {} },
  methods: { scrollToSection(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); } }
};
</script>
