<template>
  <div class="landing-sections">
    <LandingHero :tutor="tutor" />
    <LandingServices :services="services" @cta-click="scrollToContacts" />
    <LandingBonuses />
    <LandingTestimonials :testimonials="testimonials" />
    <LandingFAQ :faqs="faqs" />
    <LandingContacts :contacts="contacts" :tutorName="tutor.name" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import LandingHero from './landing/LandingHero.vue';
import LandingServices from './landing/LandingServices.vue';
import LandingBonuses from './landing/LandingBonuses.vue';
import LandingTestimonials from './landing/LandingTestimonials.vue';
import LandingFAQ from './landing/LandingFAQ.vue';
import LandingContacts from './landing/LandingContacts.vue';

const tutor = reactive({ name: 'Анна Иванова', bio: 'Репетитор английского языка. 10+ лет опыта.', photo: 'https://ui-avatars.com/api/?name=Анна+И&size=300&background=6366f1&color=fff&bold=true' });
const contacts = reactive({ telegram: 'https://t.me/anna_english', whatsapp: 'https://wa.me/79161234567' });
const services = ref([]);
const testimonials = ref([]);
const faqs = ref([]);

const scrollToContacts = () => {
  document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' });
};

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/site-settings');
    if (data) {
      if (data.tutor_name) tutor.name = data.tutor_name;
      if (data.tutor_photo) tutor.photo = data.tutor_photo;
      if (data.tutor_bio) tutor.bio = data.tutor_bio;
      if (data.tg) contacts.telegram = data.tg;
      if (data.wa) contacts.whatsapp = data.wa;
      if (data.services?.length) services.value = data.services;
      if (data.reviews?.length) testimonials.value = data.reviews;
      if (data.faqs?.length) faqs.value = data.faqs;
    }
  } catch(e) {}
});
</script>

<style scoped>
.landing-sections { background: #0b1120; }
</style>
