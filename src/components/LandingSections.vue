<template>
  <div class="landing-sections" v-if="loaded">
    <LandingHero :tutor="tutor" />
    <LandingServices :services="services" @cta-click="scrollToContacts" />
    <LandingBonuses />
    <LandingTestimonials :testimonials="testimonials" />
    <LandingFAQ :faqs="faqs" />
    <LandingContacts :contacts="contacts" :tutorName="tutor.name" />
  </div>
  <div v-else class="landing-loading">
    <div class="loading-spinner"></div>
    <p>Загрузка...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';
import LandingHero from './landing/LandingHero.vue';
import LandingServices from './landing/LandingServices.vue';
import LandingBonuses from './landing/LandingBonuses.vue';
import LandingTestimonials from './landing/LandingTestimonials.vue';
import LandingFAQ from './landing/LandingFAQ.vue';
import LandingContacts from './landing/LandingContacts.vue';

const loaded = ref(false);

// Данные по умолчанию
const tutor = ref({
  name: 'Анна Иванова',
  bio: 'Репетитор английского языка. 10+ лет опыта.',
  photo: 'https://ui-avatars.com/api/?name=Анна+И&size=300&background=6366f1&color=fff&bold=true'
});

const contacts = ref({
  telegram: 'https://t.me/anna_english',
  whatsapp: 'https://wa.me/79161234567'
});

const services = ref([]);
const testimonials = ref([]);
const faqs = ref([]);

const scrollToContacts = () => {
  document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' });
};

const loadSiteSettings = async () => {
  try {
    const { data } = await axios.get('/api/site-settings');
    console.log('📡 Данные из API:', data);

    if (data && Object.keys(data).length > 0) {
      // Репетитор
      if (data.tutor_name) tutor.value.name = data.tutor_name;
      if (data.tutor_bio) tutor.value.bio = data.tutor_bio;
      if (data.tutor_photo) tutor.value.photo = data.tutor_photo;

      // Контакты
      if (data.tg) contacts.value.telegram = data.tg;
      if (data.wa) contacts.value.whatsapp = data.wa;

      // Услуги
      if (data.services && Array.isArray(data.services) && data.services.length > 0) {
        services.value = [...data.services];
        console.log('✅ Услуги загружены:', services.value);
      }

      // Отзывы
      if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
        testimonials.value = data.reviews.map(r => ({
          name: r.name || 'Ученик',
          text: r.text || '',
          stars: r.stars || 5,
          role: r.role || 'Ученик',
          avatar: r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name || 'U')}&background=6366f1&color=fff`
        }));
        console.log('✅ Отзывы загружены:', testimonials.value);
      }

      // FAQ
      if (data.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) {
        faqs.value = [...data.faqs];
        console.log('✅ FAQ загружены:', faqs.value);
      }
    }
  } catch (e) {
    console.log('⚠️ API недоступен, используем значения по умолчанию');
  }
};

onMounted(async () => {
  await loadSiteSettings();
  await nextTick();
  loaded.value = true;
});
</script>

<style scoped>
.landing-sections {
  background: #0b1120;
}

.landing-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #0b1120;
  gap: 16px;
}

.landing-loading p {
  color: #94a3b8;
  font-size: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99, 102, 241, 0.15);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
