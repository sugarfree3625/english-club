<template>
  <div id="page-home">
    <section class="hero">
      <div class="container">
        <h1><span>{{ settings.hero_title || 'Speak English Freely' }}</span></h1>
        <p>{{ settings.hero_subtitle || 'Разговорный клуб для практики языка' }}</p>
      </div>
    </section>

    <section class="section" id="services-section">
      <div class="container">
        <h2 class="section-title">Мои услуги</h2>
        <div class="grid">
          <div class="card" v-for="s in services" :key="s.id">
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
            <div class="price">{{ s.price }}</div>
          </div>
          <p v-if="!services.length">Услуги скоро появятся</p>
        </div>
      </div>
    </section>

    <section class="section" id="contacts-section">
      <div class="container" style="text-align:center">
        <h2 class="section-title">Связаться</h2>
        <div class="contact-icons">
          <a :href="settings.vk || '#'" target="_blank"><i class="fab fa-vk"></i></a>
          <a :href="settings.tg || '#'" target="_blank"><i class="fab fa-telegram"></i></a>
          <a :href="settings.wa || '#'" target="_blank"><i class="fab fa-whatsapp"></i></a>
        </div>
      </div>
    </section>

    <footer><p>© 2024 {{ settings.club_name || 'English Club' }}</p></footer>
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
  }
};
</script>

<style scoped>
.hero { min-height: 70vh; display: flex; align-items: center; text-align: center; }
.hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; margin-bottom: 12px; }
.hero h1 span { color: #6366f1; }
.hero p { font-size: 1.2rem; color: #64748b; }
.section { padding: 60px 0; }
.section-title { font-size: 2rem; font-weight: 700; text-align: center; margin-bottom: 8px; }
.container { max-width: 1280px; margin: 0 auto; padding: 24px 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.card { background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
.card h3 { font-weight: 700; margin-bottom: 4px; }
.card p { font-size: 0.85rem; color: #64748b; }
.price { font-size: 1.3rem; font-weight: 800; color: #6366f1; margin-top: 6px; }
.contact-icons { display: flex; gap: 16px; justify-content: center; margin-top: 16px; }
.contact-icons a { font-size: 2rem; color: #6366f1; transition: transform 0.3s; }
footer { text-align: center; padding: 30px 0; color: #64748b; border-top: 1px solid #e2e8f0; font-size: 0.85rem; }
</style>