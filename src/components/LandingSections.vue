<template>
  <div class="landing-sections">
    <!-- СЕКЦИЯ 1: О РЕПЕТИТОРЕ -->
    <section class="section" id="about">
      <div class="bg-orb bg-orb-1"></div>
      <div class="bg-orb bg-orb-2"></div>
      <div class="container">
        <div class="about-grid">
          <!-- Левая колонка -->
          <div class="about-left">
            <div class="photo-wrapper">
              <img :src="tutor.photo" :alt="tutor.name" class="tutor-photo" />
            </div>
            <h2 class="tutor-name">{{ tutor.name }}</h2>
            <p class="tutor-spec">{{ tutor.specialization }}</p>
          </div>
          <!-- Правая колонка -->
          <div class="about-right">
            <div 
              v-for="(item, i) in aboutItems" 
              :key="i"
              class="glass-card about-card"
              :style="{ animationDelay: `${i * 0.1}s` }"
              ref="aboutRefs"
            >
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

    <!-- СЕКЦИЯ 2: УСЛУГИ -->
    <section class="section" id="services">
      <div class="bg-orb bg-orb-3"></div>
      <div class="bg-orb bg-orb-4"></div>
      <div class="container">
        <h2 class="section-title">
          <span class="gradient-text">Мои услуги</span>
        </h2>
        <div class="services-grid">
          <div 
            v-for="(service, i) in services" 
            :key="i"
            class="service-card glass-card"
            :class="{ popular: service.popular }"
            :style="{ animationDelay: `${i * 0.15}s` }"
            ref="serviceRefs"
          >
            <div v-if="service.popular" class="popular-badge">Популярный выбор</div>
            <div class="gradient-strip"></div>
            <div class="service-content">
              <h3 class="service-name">{{ service.name }}</h3>
              <div class="service-price">{{ service.price }} <span class="service-period">/ урок</span></div>
              <div class="service-duration">
                <Clock class="w-4 h-4" />
                <span>{{ service.duration }}</span>
              </div>
              <p class="service-desc">{{ service.desc }}</p>
              <button :class="service.popular ? 'btn-gradient' : 'btn-glass'">
                <Sparkles v-if="service.popular" class="w-4 h-4" />
                <ArrowRight v-else class="w-4 h-4" />
                <span>{{ service.btnText }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- СЕКЦИЯ 3: БОНУСЫ -->
    <section class="section" id="bonuses">
      <div class="bg-orb bg-orb-5"></div>
      <div class="container">
        <h3 class="bonuses-title">Бесплатно с каждым пакетом</h3>
        <div class="bonuses-grid">
          <div 
            v-for="(bonus, i) in bonuses" 
            :key="i"
            class="bonus-card glass-card"
            :style="{ animationDelay: `${i * 0.1}s` }"
            ref="bonusRefs"
          >
            <component :is="bonus.icon" class="bonus-icon" />
            <h4 class="bonus-name">{{ bonus.title }}</h4>
            <p class="bonus-desc">{{ bonus.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- СЕКЦИЯ 4: ОТЗЫВЫ (КАРУСЕЛЬ) -->
    <section class="section" id="testimonials">
      <div class="bg-orb bg-orb-6"></div>
      <div class="container">
        <h2 class="section-title">
          <span class="gradient-text">Что говорят ученики</span>
        </h2>
        <div 
          class="carousel"
          @mouseenter="stopAutoPlay"
          @mouseleave="startAutoPlay"
        >
          <!-- Стрелка влево -->
          <button class="carousel-arrow carousel-arrow-left" @click="prevSlide">
            <ChevronLeft class="w-5 h-5" />
          </button>

          <!-- Слайд -->
          <div class="carousel-track">
            <transition :name="slideDirection" mode="out-in">
              <div :key="currentSlide" class="testimonial-card glass-card">
                <Quote class="quote-icon" />
                <div class="testimonial-content">
                  <img :src="testimonials[currentSlide].avatar" class="testimonial-avatar" />
                  <div>
                    <strong class="testimonial-name">{{ testimonials[currentSlide].name }}</strong>
                    <span class="testimonial-role">{{ testimonials[currentSlide].role }}</span>
                    <p class="testimonial-text">"{{ testimonials[currentSlide].text }}"</p>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Стрелка вправо -->
          <button class="carousel-arrow carousel-arrow-right" @click="nextSlide">
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>

        <!-- Точки-индикаторы -->
        <div class="carousel-dots">
          <span 
            v-for="(_, i) in testimonials" 
            :key="i"
            class="dot"
            :class="{ active: i === currentSlide }"
            @click="goToSlide(i)"
          ></span>
        </div>
      </div>
    </section>

    <!-- СЕКЦИЯ 5: КОНТАКТЫ -->
    <section class="section contacts-section" id="contacts">
      <div class="container" style="text-align:center">
        <div class="contact-buttons">
          <a :href="contacts.telegram" target="_blank" class="contact-btn contact-btn-telegram">
            <Send class="w-5 h-5" />
            <span>Написать в Telegram</span>
          </a>
          <a :href="contacts.whatsapp" target="_blank" class="contact-btn contact-btn-whatsapp">
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { 
  Clock, Sparkles, ArrowRight, BookOpen, StickyNote, Users, Award,
  Quote, ChevronLeft, ChevronRight, Send, MessageCircle
} from 'lucide-vue-next';

// Моки данных
const tutor = {
  name: 'Анна Иванова',
  specialization: 'Репетитор английского языка. 10+ лет опыта.',
  photo: 'https://ui-avatars.com/api/?name=Анна+И&size=300&background=6366f1&color=fff&bold=true',
};

const aboutItems = [
  { icon: '🎓', title: 'Образование', text: 'МГЛУ, факультет английского языка. Сертификаты TESOL, CELTA.' },
  { icon: '💼', title: 'Опыт', text: '10+ лет преподавания. 500+ учеников. Работаю со взрослыми и подростками.' },
  { icon: '🗣', title: 'Методика', text: 'Коммуникативный подход. 80% урока — ваша речь. Индивидуальная программа под ваши цели.' },
];

const services = [
  {
    name: 'Индивидуальные занятия',
    price: '1 500 ₽',
    duration: '60 минут',
    desc: 'Регулярные занятия по индивидуальной программе. Разговор, грамматика, аудирование — всё под ваши цели.',
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

const bonuses = [
  { icon: BookOpen, title: '📚 Словарь', desc: 'Личный словарь с тренажёром для запоминания новых слов.' },
  { icon: StickyNote, title: '📝 Заметки', desc: 'Личный блокнот для конспектов с автосохранением на каждом уроке.' },
  { icon: Users, title: '👥 Группы', desc: 'Закрытые разговорные группы для практики с другими учениками.' },
  { icon: Award, title: '🏆 Достижения', desc: 'Система достижений и наград за прогресс в обучении.' },
];

const testimonials = ref([
  {
    name: 'Алексей Петров',
    role: 'Senior Developer, Google',
    text: 'За 4 месяца прошёл путь от "боюсь сказать" до прохождения собеседования в европейскую компанию. Анна учит думать на языке, а не просто переводить.',
    avatar: 'https://ui-avatars.com/api/?name=Алексей+П&background=6366f1&color=fff',
  },
  {
    name: 'Мария Смирнова',
    role: 'Product Manager, Amazon',
    text: 'Готовилась к переезду в США. Анна помогла с разговорным английским и деловой перепиской. Через 3 месяца чувствовала себя уверенно на встречах.',
    avatar: 'https://ui-avatars.com/api/?name=Мария+С&background=2dd4bf&color=fff',
  },
  {
    name: 'Дмитрий Иванов',
    role: 'Студент, IELTS 7.5',
    text: 'Готовился к IELTS с нуля. Анна дала чёткую стратегию, научила таймингу. Результат — 7.5 с первой попытки. Очень благодарен!',
    avatar: 'https://ui-avatars.com/api/?name=Дмитрий+И&background=8b5cf6&color=fff',
  },
]);

const contacts = {
  telegram: 'https://t.me/anna_english',
  whatsapp: 'https://wa.me/79161234567',
};

// Карусель
const currentSlide = ref(0);
const slideDirection = ref('slide-right');
let autoplayTimer = null;

const nextSlide = () => {
  slideDirection.value = 'slide-right';
  currentSlide.value = (currentSlide.value + 1) % testimonials.value.length;
};

const prevSlide = () => {
  slideDirection.value = 'slide-left';
  currentSlide.value = (currentSlide.value - 1 + testimonials.value.length) % testimonials.value.length;
};

const goToSlide = (index) => {
  slideDirection.value = index > currentSlide.value ? 'slide-right' : 'slide-left';
  currentSlide.value = index;
};

const startAutoPlay = () => {
  autoplayTimer = setInterval(nextSlide, 5000);
};

const stopAutoPlay = () => {
  clearInterval(autoplayTimer);
};

onMounted(() => {
  startAutoPlay();
});

onBeforeUnmount(() => {
  clearInterval(autoplayTimer);
});
</script>

<style scoped>
.landing-sections {
  background: #0b1120;
}

.section {
  position: relative;
  padding: 100px 0;
  overflow: hidden;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* Фоновые шары */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.2;
  pointer-events: none;
}

.bg-orb-1 { width: 500px; height: 500px; background: #6366f1; top: -150px; left: -150px; animation: floatOrb1 12s ease-in-out infinite; }
.bg-orb-2 { width: 400px; height: 400px; background: #2dd4bf; bottom: -100px; right: -100px; animation: floatOrb2 12s ease-in-out infinite; }
.bg-orb-3 { width: 400px; height: 400px; background: #2dd4bf; top: -100px; right: -100px; animation: floatOrb2 10s ease-in-out infinite; }
.bg-orb-4 { width: 500px; height: 500px; background: #6366f1; bottom: -150px; left: -150px; animation: floatOrb1 10s ease-in-out infinite; }
.bg-orb-5 { width: 300px; height: 300px; background: #6366f1; top: 50%; left: -100px; animation: floatOrb1 8s ease-in-out infinite; }
.bg-orb-6 { width: 350px; height: 350px; background: #2dd4bf; bottom: -100px; right: -80px; animation: floatOrb2 8s ease-in-out infinite; }

@keyframes floatOrb1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -30px) scale(1.05); }
}

@keyframes floatOrb2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 20px) scale(1.05); }
}

/* Стеклянная карточка */
.glass-card {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.glass-card:hover {
  box-shadow: 0 0 20px rgba(99,102,241,0.2);
}

/* Заголовок секции */
.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 60px;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== СЕКЦИЯ 1: О РЕПЕТИТОРЕ ===== */
.about-grid {
  display: flex;
  gap: 60px;
  align-items: flex-start;
}

.about-left {
  width: 40%;
  text-align: center;
}

.photo-wrapper {
  display: inline-block;
  padding: 4px;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  border-radius: 50%;
  margin-bottom: 20px;
}

.tutor-photo {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.tutor-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.tutor-spec {
  font-family: 'Inter', sans-serif;
  color: #94a3b8;
  margin-top: 6px;
}

.about-right {
  width: 60%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.about-card {
  padding: 20px 24px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.about-card-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.about-card-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.about-card-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.6;
}

/* ===== СЕКЦИЯ 2: УСЛУГИ ===== */
.services-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.service-card {
  display: flex;
  overflow: hidden;
  position: relative;
}

.service-card.popular {
  border-color: rgba(99,102,241,0.3);
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
  z-index: 1;
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

.service-content {
  flex: 1;
  padding: 28px;
}

.service-name {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 12px;
}

.service-price {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
}

.service-period {
  font-size: 0.9rem;
  font-weight: 400;
  color: #94a3b8;
  -webkit-text-fill-color: #94a3b8;
}

.service-duration {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.service-desc {
  font-family: 'Inter', sans-serif;
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.btn-gradient, .btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
}

.btn-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(99,102,241,0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
  50% { box-shadow: 0 4px 30px rgba(99,102,241,0.6); }
}

.btn-glass {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
}

.btn-glass:hover {
  box-shadow: 0 0 20px rgba(99,102,241,0.3);
}

/* ===== СЕКЦИЯ 3: БОНУСЫ ===== */
.bonuses-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 40px;
}

.bonuses-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.bonus-card {
  padding: 28px 20px;
  text-align: center;
}

.bonus-icon {
  width: 40px;
  height: 40px;
  color: #6366f1;
  margin: 0 auto 12px;
}

.bonus-name {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.bonus-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.5;
}

/* ===== СЕКЦИЯ 4: КАРУСЕЛЬ ===== */
.carousel {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 700px;
  margin: 0 auto;
}

.carousel-arrow {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.carousel-arrow:hover {
  background: rgba(99,102,241,0.2);
  box-shadow: 0 0 15px rgba(99,102,241,0.3);
}

.carousel-track {
  flex: 1;
  overflow: hidden;
}

.testimonial-card {
  padding: 32px;
  position: relative;
}

.quote-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  color: #6366f1;
  opacity: 0.3;
}

.testimonial-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.testimonial-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(99,102,241,0.3);
}

.testimonial-name {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: #fff;
}

.testimonial-role {
  display: block;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 12px;
}

.testimonial-text {
  font-family: 'Inter', sans-serif;
  color: #cbd5e1;
  font-style: italic;
  line-height: 1.7;
}

/* Анимации карусели */
.slide-right-enter-active,
.slide-left-enter-active {
  transition: all 0.4s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

/* Точки */
.carousel-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: #6366f1;
  box-shadow: 0 0 8px rgba(99,102,241,0.5);
}

/* ===== СЕКЦИЯ 5: КОНТАКТЫ ===== */
.contacts-section {
  padding-bottom: 60px;
}

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
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
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
  color: #64748b;
}

/* ===== АДАПТИВ ===== */
@media (max-width: 768px) {
  .about-grid {
    flex-direction: column;
    gap: 30px;
  }
  .about-left, .about-right {
    width: 100%;
  }
  .tutor-photo {
    width: 150px;
    height: 150px;
  }
  .services-grid {
    grid-template-columns: 1fr;
  }
  .bonuses-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .carousel {
    gap: 10px;
  }
  .carousel-arrow {
    width: 36px;
    height: 36px;
  }
  .testimonial-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .bonuses-grid {
    grid-template-columns: 1fr;
  }
}
</style>
