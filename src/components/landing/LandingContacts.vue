<template>
  <section class="section contacts-section" id="contacts">
    <div class="container" style="text-align:center">
      <h2 class="section-title"><span class="gradient-text">Свяжитесь со мной</span></h2>
      <div class="contact-buttons">
        <a v-if="contacts.telegram" :href="contacts.telegram" target="_blank" class="contact-btn contact-btn-telegram">
          <Send class="w-5 h-5" /><span>Написать в Telegram</span>
        </a>
        <a v-if="contacts.whatsapp" :href="contacts.whatsapp" target="_blank" class="contact-btn contact-btn-whatsapp">
          <MessageCircle class="w-5 h-5" /><span>Написать в WhatsApp</span>
        </a>
      </div>
      <p class="copyright">© 2026 {{ tutorName }}. Все права защищены.</p>
    </div>

    <!-- Чат-виджет -->
    <div class="chat-widget" :class="{ open: chatOpen }">
      <button class="chat-toggle" @click="chatOpen = !chatOpen">
        <MessageCircle v-if="!chatOpen" class="w-6 h-6" />
        <X v-else class="w-6 h-6" />
      </button>
      <transition name="chat-slide">
        <div v-if="chatOpen" class="chat-panel glass-card">
          <div class="chat-header"><span>💬 Быстрый вопрос</span></div>
          <div class="chat-body">
            <p class="chat-text">Напишите ваш вопрос, и я отвечу в ближайшее время!</p>
            <div class="chat-actions">
              <a v-if="contacts.telegram" :href="contacts.telegram" target="_blank" class="chat-btn chat-btn-tg"><Send class="w-4 h-4" /> Telegram</a>
              <a v-if="contacts.whatsapp" :href="contacts.whatsapp" target="_blank" class="chat-btn chat-btn-wa"><MessageCircle class="w-4 h-4" /> WhatsApp</a>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { Send, MessageCircle, X } from 'lucide-vue-next';

defineProps({
  contacts: { type: Object, default: () => ({ telegram: '', whatsapp: '' }) },
  tutorName: { type: String, default: 'Анна Иванова' }
});

const chatOpen = ref(false);
</script>

<style scoped>
.section { position: relative; padding: 80px 0 60px; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
.section-title { font-family: 'Space Grotesk', sans-serif; font-size: 2.5rem; font-weight: 800; margin-bottom: 40px; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.contact-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 40px; }
.contact-btn { display: flex; align-items: center; gap: 10px; padding: 14px 28px; border-radius: 16px; font-weight: 600; font-size: 1rem; text-decoration: none; transition: all 0.5s; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); color: #fff; }
.contact-btn-telegram:hover { box-shadow: 0 0 20px rgba(0,136,204,0.3); border-color: #08c; }
.contact-btn-whatsapp:hover { box-shadow: 0 0 20px rgba(37,211,102,0.3); border-color: #25d366; }
.copyright { font-size: 0.85rem; color: #64748b; }
.glass-card { background: rgba(15,15,30,0.97); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; }
.chat-widget { position: fixed; bottom: 24px; right: 24px; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.chat-toggle { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #2dd4bf); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(99,102,241,0.4); transition: all 0.3s; }
.chat-toggle:hover { transform: scale(1.1); }
.chat-panel { width: 300px; padding: 20px; }
.chat-header { font-weight: 700; color: #fff; margin-bottom: 12px; }
.chat-text { font-size: 0.85rem; color: #94a3b8; margin-bottom: 16px; }
.chat-actions { display: flex; flex-direction: column; gap: 8px; }
.chat-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px; font-weight: 600; font-size: 0.85rem; text-decoration: none; color: #fff; }
.chat-btn-tg { background: rgba(0,136,204,0.2); border: 1px solid rgba(0,136,204,0.3); }
.chat-btn-wa { background: rgba(37,211,102,0.2); border: 1px solid rgba(37,211,102,0.3); }
.chat-slide-enter-active, .chat-slide-leave-active { transition: all 0.3s ease; }
.chat-slide-enter-from, .chat-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }
</style>
