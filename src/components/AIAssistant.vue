<template>
  <div class="ai-assistant" :class="{ open: isOpen }">
    <button class="ai-toggle" @click="isOpen = !isOpen">
      <span v-if="!isOpen">🤖</span>
      <span v-else>✕</span>
      <span v-if="hasNew" class="ai-badge">1</span>
    </button>
    
    <transition name="ai-slide">
      <div v-if="isOpen" class="ai-panel glass-card">
        <div class="ai-header">🤖 Помощник</div>
        <div class="ai-messages">
          <div class="ai-msg bot">Привет! Чем могу помочь? 😊</div>
          <div v-for="(m, i) in messages" :key="i" class="ai-msg" :class="m.type">{{ m.text }}</div>
        </div>
        <div class="ai-input">
          <input v-model="input" @keyup.enter="send" placeholder="Задайте вопрос..." class="input">
          <button @click="send" class="btn btn-p btn-sm">➤</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isOpen = ref(false);
const hasNew = ref(true);
const input = ref('');
const messages = ref([]);

const answers = {
  'расписание': '📅 Расписание доступно в разделе "Календарь". Запишитесь на удобное время!',
  'записаться': '📝 Запись на занятия через сайт: english-club-v1.onrender.com/calendar',
  'оплата': '💳 Оплата принимается через Telegram. Напишите @anna_english',
  'уровень': '📊 Уровни: A1 (Beginner), A2, B1 (Intermediate), B2, C1 (Advanced). Ваш уровень можно посмотреть в профиле.',
  'привет': '👋 Привет! Я виртуальный помощник English Club. Задайте вопрос!',
  'помощь': '🤖 Я могу помочь с:\n• Расписанием\n• Записью на занятия\n• Уровнями\n• Оплатой\n\nПросто спросите!'
};

const send = () => {
  if (!input.value.trim()) return;
  
  messages.value.push({ type: 'user', text: input.value });
  
  const q = input.value.toLowerCase();
  let answer = '🤔 Хороший вопрос! Напишите @anna_english в Telegram для уточнения.';
  
  for (const [key, val] of Object.entries(answers)) {
    if (q.includes(key)) { answer = val; break; }
  }
  
  setTimeout(() => {
    messages.value.push({ type: 'bot', text: answer });
  }, 500);
  
  input.value = '';
  hasNew.value = false;
};
</script>

<style scoped>
.ai-assistant { position: fixed; bottom: 24px; left: 24px; z-index: 1000; }
.ai-toggle { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #2dd4bf); border: none; color: #fff; font-size: 1.5rem; cursor: pointer; box-shadow: 0 4px 20px rgba(99,102,241,0.4); position: relative; }
.ai-badge { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; background: #ef4444; color: #fff; border-radius: 50%; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.glass-card { background: rgba(15,15,30,0.97); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; }
.ai-panel { position: absolute; bottom: 70px; left: 0; width: 320px; overflow: hidden; }
.ai-header { padding: 14px 18px; font-weight: 700; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.06); }
.ai-messages { height: 250px; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.ai-msg { padding: 8px 12px; border-radius: 12px; font-size: 0.85rem; max-width: 85%; }
.ai-msg.bot { background: rgba(99,102,241,0.1); align-self: flex-start; color: #cbd5e1; }
.ai-msg.user { background: linear-gradient(135deg, #6366f1, #2dd4bf); align-self: flex-end; color: #fff; }
.ai-input { display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.input { flex: 1; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
.btn { display: inline-flex; align-items: center; padding: 8px 12px; border-radius: 10px; border: none; cursor: pointer; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.ai-slide-enter-active, .ai-slide-leave-active { transition: all 0.3s ease; }
.ai-slide-enter-from, .ai-slide-leave-to { opacity: 0; transform: translateY(20px); }
</style>
