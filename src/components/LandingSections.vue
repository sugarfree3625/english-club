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
      // Принудительно обновляем ВЕСЬ объект tutor
      tutor.value = {
        name: data.tutor_name || 'Анна Иванова',
        bio: data.tutor_bio || 'Репетитор английского языка. 10+ лет опыта.',
        photo: data.tutor_photo || 'https://ui-avatars.com/api/?name=Анна+И&size=300&background=6366f1&color=fff&bold=true'
      };

      // Принудительно обновляем contacts
      contacts.value = {
        telegram: data.tg || 'https://t.me/anna_english',
        whatsapp: data.wa || 'https://wa.me/79161234567'
      };

      // Услуги
      if (data.services?.length) {
        services.value = [...data.services];
      }

      // Отзывы
      if (data.reviews?.length) {
        testimonials.value = data.reviews.map(r => ({
          name: r.name || 'Ученик',
          text: r.text || '',
          stars: r.stars || 5,
          role: r.role || 'Ученик',
          avatar: r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name || 'U')}&background=6366f1&color=fff`
        }));
      }

      // FAQ
      if (data.faqs?.length) {
        faqs.value = [...data.faqs];
      }

      console.log('✅ Загружено:', {
        photo: tutor.value.photo,
        services: services.value.length,
        reviews: testimonials.value.length,
        faqs: faqs.value.length
      });
    }
  } catch (e) {
    console.log('⚠️ API недоступен');
  }
};

onMounted(async () => {
  await loadSiteSettings();
  await nextTick();
  loaded.value = true;
});
</script>

<style scoped>
.landing-sections { background: #0b1120; }

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
