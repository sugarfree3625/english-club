<template>
  <div class="landing-sections">
    <!-- СЕКЦИЯ 1: ОБО МНЕ -->
    <section class="section" id="about-section">
      <div class="container">
        <h2 class="section-title">Почему выбирают меня</h2>
        <div class="about-grid">
          <div 
            v-for="(card, i) in aboutCards" 
            :key="i"
            class="about-card neo-card"
            :style="{ animationDelay: `${i * 0.1}s` }"
            ref="aboutRefs"
          >
            <div class="about-icon-wrapper">
              <component :is="card.icon" class="about-icon" />
            </div>
            <h3 class="about-card-title">{{ card.title }}</h3>
            <p class="about-card-text">{{ card.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- СЕКЦИЯ 2: УСЛУГИ -->
    <section class="section section-alt" id="services-section">
      <div class="container">
        <h2 class="section-title">Мои услуги</h2>
        <div class="services-grid">
          <div 
            v-for="(service, i) in services" 
            :key="i"
            class="service-card neo-card"
            :class="{ popular: service.popular }"
            :style="{ animationDelay: `${i * 0.1}s` }"
            ref="serviceRefs"
          >
            <div class="gradient-strip"></div>
            <div v-if="service.popular" class="popular-badge">Популярный выбор</div>
            <div class="service-content">
              <h3 class="service-name">{{ service.name }}</h3>
              <div class="service-price">{{ service.price }}</div>
              <div class="service-duration">
                <Clock class="w-4 h-4" />
                <span>{{ service.duration }}</span>
              </div>
              <p class="service-desc">{{ service.desc }}</p>
              <button class="service-btn" :class="service.popular ? 'btn-gradient' : 'btn-glass'">
                {{ service.btnText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- СЕКЦИЯ 3: ОТЗЫВЫ -->
    <section class="section" id="testimonials-section">
      <div class="container">
        <h2 class="section-title">Что говорят ученики</h2>
        <div class="testimonial-card neo-card" ref="testimonialRef">
          <Quote class="quote-icon" />
          <p class="testimonial-text">{{ testimonial.text }}</p>
          <div class="testimonial-author">
            <strong>{{ testimonial.name }}</strong>
            <span>{{ testimonial.role }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- СЕКЦИЯ 4: КОНТАКТЫ -->
    <section class="section section-alt" id="contacts-section">
      <div class="container" style="text-align:center">
        <h2 class="section-title">Связаться со мной</h2>
        <div class="contact-buttons">
          <a :href="telegramLink" target="_blank" class="contact-btn contact-btn-telegram">
            <Send class="w-5 h-5" />
            <span>Написать в Telegram</span>
          </a>
          <a :href="whatsappLink" target="_blank" class="contact-btn contact-btn-whatsapp">
            <MessageCircle class="w-5 h-5" />
            <span>Написать в WhatsApp</span>
          </a>
        </div>
        <p class="copyright">© 2026 Анна Иванова. Все права защищены.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { GraduationCap, Users, MessageCircle, Clock, Quote, Send } from 'lucide-vue-next';

// Моки данных
const aboutCards = [
  {
    icon: GraduationCap,
    title: '10+ лет опыта',
    text: 'Работаю со взрослыми и подростками. Готовлю к IELTS, собеседованиям и переезду.',
  },
  {
    icon: Users,
    title: '500+ учеников',
    text: 'Мои студенты работают в Google, Amazon, переезжают в США и Европу.',
  },
  {
    icon: MessageCircle,
    title: 'Коммуникативная методика',
    text: '80% урока — это ваша речь. Никакой зубрёжки, только живое общение.',
  },
];

const services = [
  {
    name: 'Пробный урок',
    price: '0 ₽',
    duration: '30 минут',
    desc: 'Познакомимся, определим ваш уровень и цели. Вы получите первые рекомендации.',
    btnText: 'Записаться',
    popular: false,
  },
  {
    name: 'Индивидуальные занятия',
    price: '1 500 ₽',
    duration: '60 минут',
    desc: 'Регулярные занятия по индивидуальной программе. Разговор, грамматика, аудирование.',
    btnText: 'Выбрать пакет',
    popular: true,
  },
  {
    name: 'Подготовка к IELTS',
    price: '2 000 ₽',
    duration: '90 минут',
    desc: 'Интенсивная подготовка ко всем частям экзамена. Стратегии, тайминг, пробные тесты.',
    btnText: 'Узнать больше',
    popular: false,
  },
];

const testimonial = {
  text: 'За 4 месяца прошёл путь от "боюсь сказать" до прохождения собеседования в европейскую компанию. Анна не просто учит языку, она учит думать на нём.',
  name: 'Алексей',
  role: 'Senior Developer',
};

const telegramLink = 'https://t.me/anna_english';
const whatsappLink = 'https://wa.me/79161234567';

// Refs для анимаций
const aboutRefs = ref([]);
const serviceRefs = ref([]);
const testimonialRef = ref(null);

// Intersection Observer для появления при скролле
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.2 }
  );

  aboutRefs.value.forEach((el) => el && observer.observe(el));
  serviceRefs.value.forEach((el) => el && observer.observe(el));
  if (testimonialRef.value) observer.observe(testimonialRef.value);
});
</script>

<style scoped>
.landing-sections {
  background: #f8fafc;
}

.section {
  padding: 80px 0;
}

.section-alt {
  background: linear-gradient(180deg, #f8fafc 0%, rgba(99,102,241,0.02) 100%);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 48px;
  letter-spacing: -1px;
  color: #1e293b;
}

/* Неоморфная карточка */
.neo-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 8px 8px 16px #e2e8f0, -8px -8px 16px #ffffff;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(30px);
}

.neo-card.visible {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.neo-card:hover {
  box-shadow: inset 4px 4px 12px #e2e8f0, inset -4px -4px 12px #ffffff;
}

/* СЕКЦИЯ 1: ОБО МНЕ */
.about-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.about-card {
  padding: 32px 24px;
  text-align: center;
}

.about-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(45,212,191,0.1));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.about-icon {
  width: 32px;
  height: 32px;
  color: #6366f1;
}

.about-card-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #1e293b;
}

.about-card-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.6;
}

/* СЕКЦИЯ 2: УСЛУГИ */
.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.service-card {
  display: flex;
  overflow: hidden;
  position: relative;
  min-height: 300px;
}

.service-card.popular {
  border: 2px solid #6366f1;
}

.gradient-strip {
  width: 4px;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  transition: all 0.3s ease;
}

.service-card:hover .gradient-strip {
  animation: hologramPulse 0.6s ease-in-out;
}

@keyframes hologramPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; box-shadow: 0 0 12px rgba(99,102,241,0.6); }
}

.popular-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}

.service-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.service-name {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #1e293b;
}

.service-price {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.service-duration {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 12px;
}

.service-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.6;
  flex: 1;
  margin-bottom: 16px;
}

.service-btn {
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  text-align: center;
}

.btn-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(99,102,241,0.3);
  animation: pulse 2s infinite;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99,102,241,0.4);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
  50% { box-shadow: 0 4px 30px rgba(99,102,241,0.6); }
}

.btn-glass {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(99,102,241,0.2);
  color: #6366f1;
}

.btn-glass:hover {
  box-shadow: 0 0 20px rgba(99,102,241,0.3);
  transform: scale(1.02);
}

/* СЕКЦИЯ 3: ОТЗЫВЫ */
.testimonial-card {
  max-width: 700px;
  margin: 0 auto;
  padding: 40px;
  position: relative;
  text-align: center;
}

.quote-icon {
  width: 48px;
  height: 48px;
  color: #6366f1;
  opacity: 0.2;
  margin-bottom: 20px;
}

.testimonial-text {
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #334155;
  margin-bottom: 24px;
  font-style: italic;
}

.testimonial-author strong {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  color: #1e293b;
}

.testimonial-author span {
  font-size: 0.85rem;
  color: #64748b;
}

/* СЕКЦИЯ 4: КОНТАКТЫ */
.contact-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.contact-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
  color: #1e293b;
}

.contact-btn-telegram:hover {
  box-shadow: 0 0 20px rgba(0,136,204,0.3);
  border-color: #08c;
}

.contact-btn-whatsapp:hover {
  box-shadow: 0 0 20px rgba(37,211,102,0.3);
  border-color: #25d366;
}

.copyright {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .about-grid,
  .services-grid {
    grid-template-columns: 1fr;
  }
  
  .section-title {
    font-size: 1.6rem;
  }
  
  .testimonial-card {
    padding: 24px;
  }
}
</style>
