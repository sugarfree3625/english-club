<template>
  <div class="ai-assistant" :class="{ open: isOpen }">
    <button class="ai-toggle" @click="toggleAssistant">
      <span v-if="!isOpen">🤖</span>
      <span v-else>✕</span>
      <span v-if="hasNew && !isOpen" class="ai-badge">1</span>
    </button>
    
    <transition name="ai-slide">
      <div v-if="isOpen" class="ai-panel glass-card">
        <div class="ai-header">
          <span>🤖 AI Помощник</span>
          <button class="ai-clear" @click="messages = []; hasNew = true" title="Очистить чат">🗑</button>
        </div>
        
        <div class="ai-messages" ref="msgContainer">
          <div class="ai-msg bot">
            Привет! 👋 Я AI-помощник English Club. Выберите команду или задайте вопрос:
            <div class="ai-suggestions">
              <div class="ai-suggestions-title">⚡ Быстрые команды:</div>
              <div class="ai-suggestions-grid">
                <button 
                  v-for="cmd in quickCommands" 
                  :key="cmd.text" 
                  class="ai-suggestion" 
                  @click="quickAsk(cmd.text)"
                >
                  <span class="ai-cmd-icon">{{ cmd.icon }}</span>
                  <span class="ai-cmd-text">{{ cmd.text }}</span>
                </button>
              </div>
            </div>
          </div>
          <div v-for="(m, i) in messages" :key="i" class="ai-msg" :class="m.type">
            {{ m.text }}
          </div>
          <div v-if="typing" class="ai-msg bot typing">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
        
        <div class="ai-input">
          <input 
            v-model="input" 
            @keyup.enter="send" 
            placeholder="Задайте вопрос..." 
            class="input"
            :disabled="typing"
          />
          <button @click="send" class="btn btn-p btn-sm" :disabled="!input.trim() || typing">➤</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const isOpen = ref(false);
const hasNew = ref(true);
const input = ref('');
const messages = ref([]);
const typing = ref(false);
const msgContainer = ref(null);

const quickCommands = [
  { icon: '📅', text: 'Расписание' },
  { icon: '📝', text: 'Записаться' },
  { icon: '💰', text: 'Цены' },
  { icon: '📊', text: 'Мой уровень' },
  { icon: '🏆', text: 'Достижения' },
  { icon: '📚', text: 'Словарь' },
  { icon: '💬', text: 'Чат' },
  { icon: '👤', text: 'Профиль' },
  { icon: '📞', text: 'Контакты' },
  { icon: '❓', text: 'Помощь' },
];

const answers = {
  'расписание': '📅 Расписание доступно в разделе "Календарь". Там вы можете:\n• Посмотреть ближайшие занятия\n• Записаться на удобное время\n• Отменить запись\n\n👉 Перейти: /calendar',
  'записаться': '📝 Чтобы записаться на занятие:\n1️⃣ Зайдите в раздел "Календарь"\n2️⃣ Выберите свободный слот\n3️⃣ Нажмите "Записаться"\n\nИли напишите @anna_english в Telegram!',
  'цены': '💰 Цены на занятия:\n• Индивидуальное: 1 500 ₽ / 60 мин\n• IELTS: 2 000 ₽ / 90 мин\n• Групповое: 800 ₽ / 90 мин',
  'оплата': '💳 Способы оплаты:\n• Перевод на карту\n• Через Telegram @anna_english',
  'уровень': '📊 Уровни английского:\n🟢 A1 — Beginner\n🟢 A2 — Elementary\n🔵 B1 — Intermediate\n🔵 B2 — Upper-Intermediate\n🟣 C1 — Advanced\n🟣 C2 — Proficient\n\nВаш уровень в профиле: /profile',
  'достижения': '🏆 Достижения — награды за активность!\n📚 Слова 📅 Встречи 💬 Сообщения ⭐ Рейтинг 🔥 Стрик\n\nСмотреть: /profile → Достижения',
  'словарь': '📚 Словарь — личный инструмент для запоминания слов.\n• Добавляйте новые слова\n• Отмечайте изученные\n• Следите за прогрессом\n\n👉 /profile → Словарь',
  'чат': '💬 Чат доступен после входа:\n• Личные сообщения\n• Групповые чаты\n• Голосовые сообщения\n\n👉 /messages',
  'профиль': '👤 В профиле: информация, достижения, расписание, словарь, блокнот, задания, прогресс.\n\n👉 /profile',
  'контакты': '📞 Связь с учителем:\n✈️ Telegram: @anna_english\n📱 WhatsApp: +7 (916) 123-45-67\n\nИли через сайт в разделе "Контакты"',
  'помощь': '🤖 Я могу помочь с:\n📅 Расписанием\n📝 Записью\n💰 Оплатой\n📊 Уровнями\n🏆 Достижениями\n📚 Словарём\n💬 Чатом\n👤 Профилем\n📞 Контактами\n\nПросто нажмите на кнопку или напишите!',
  'привет': '👋 Привет! Я AI-помощник English Club. Выберите команду из списка или задайте вопрос! 😊',
};

const toggleAssistant = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    hasNew.value = false;
    nextTick(() => scrollToBottom());
  }
};

const quickAsk = (q) => {
  input.value = q;
  send();
};

const scrollToBottom = () => {
  if (msgContainer.value) {
    msgContainer.value.scrollTop = msgContainer.value.scrollHeight;
  }
};

const send = () => {
  if (!input.value.trim() || typing.value) return;
  
  messages.value.push({ type: 'user', text: input.value });
  typing.value = true;
  
  const q = input.value.toLowerCase();
  let answer = '🤔 Хороший вопрос! Напишите @anna_english в Telegram для уточнения.';
  
  for (const [key, val] of Object.entries(answers)) {
    if (q.includes(key)) { answer = val; break; }
  }
  
  input.value = '';
  
  setTimeout(() => {
    messages.value.push({ type: 'bot', text: answer });
    typing.value = false;
    nextTick(() => scrollToBottom());
  }, 600 + Math.random() * 400);
};
</script>

<style scoped>
.ai-assistant { position: fixed; bottom: 24px; left: 24px; z-index: 1000; }
.ai-toggle { 
  width: 56px; height: 56px; border-radius: 50%; 
  background: linear-gradient(135deg, #6366f1, #2dd4bf); 
  border: none; color: #fff; font-size: 1.5rem; cursor: pointer; 
  box-shadow: 0 4px 20px rgba(99,102,241,0.4); 
  position: relative; transition: all 0.3s;
}
.ai-toggle:hover { transform: scale(1.1); box-shadow: 0 8px 30px rgba(99,102,241,0.6); }
.ai-badge { 
  position: absolute; top: -4px; right: -4px; 
  width: 20px; height: 20px; background: #ef4444; color: #fff; 
  border-radius: 50%; font-size: 0.7rem; 
  display: flex; align-items: center; justify-content: center; 
  font-weight: 700; animation: badgePulse 2s infinite;
}
@keyframes badgePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }

.glass-card { 
  background: rgba(15,15,30,0.97); 
  backdrop-filter: blur(20px); 
  border: 1px solid rgba(99,102,241,0.2); 
  border-radius: 16px; 
}
.ai-panel { 
  position: absolute; bottom: 70px; left: 0; 
  width: 360px; max-height: 520px; 
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}
.ai-header { 
  padding: 14px 18px; font-weight: 700; color: #fff; 
  border-bottom: 1px solid rgba(255,255,255,0.06); 
  display: flex; justify-content: space-between; align-items: center;
}
.ai-clear { 
  background: none; border: none; color: #94a3b8; 
  cursor: pointer; font-size: 0.9rem; padding: 4px 8px; border-radius: 6px;
}
.ai-clear:hover { background: rgba(255,255,255,0.05); }

.ai-messages { 
  flex: 1; overflow-y: auto; padding: 14px; 
  display: flex; flex-direction: column; gap: 8px; 
  max-height: 380px;
}
.ai-msg { 
  padding: 10px 14px; border-radius: 14px; 
  font-size: 0.85rem; max-width: 92%; line-height: 1.5;
  white-space: pre-line;
}
.ai-msg.bot { 
  background: rgba(99,102,241,0.1); 
  align-self: flex-start; color: #cbd5e1; 
  border-bottom-left-radius: 4px;
}
.ai-msg.user { 
  background: linear-gradient(135deg, #6366f1, #2dd4bf); 
  align-self: flex-end; color: #fff; 
  border-bottom-right-radius: 4px;
}

.ai-suggestions { margin-top: 10px; width: 100%; }
.ai-suggestions-title { font-size: 0.7rem; color: #94a3b8; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.ai-suggestions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
.ai-suggestion { 
  display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 10px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: #cbd5e1; cursor: pointer; font-size: 0.72rem; transition: all 0.2s;
  font-family: inherit; white-space: nowrap;
}
.ai-suggestion:hover { 
  background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); 
  color: #fff; transform: translateY(-1px);
}
.ai-cmd-icon { font-size: 0.9rem; flex-shrink: 0; }
.ai-cmd-text { overflow: hidden; text-overflow: ellipsis; }

.typing { display: flex; gap: 4px; align-items: center; padding: 14px 18px; }
.typing-dot { width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; animation: typingBounce 1.4s infinite ease-in-out both; }
.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
.typing-dot:nth-child(3) { animation-delay: 0s; }
@keyframes typingBounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }

.ai-input { display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.input { flex: 1; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
.input:focus { border-color: #6366f1; }
.input:disabled { opacity: 0.5; }
.btn { display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 12px; border: none; cursor: pointer; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-p:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 8px 14px; font-size: 0.9rem; }
.ai-slide-enter-active, .ai-slide-leave-active { transition: all 0.3s ease; }
.ai-slide-enter-from, .ai-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

/* МОБИЛЬНЫЕ СТИЛИ */
@media (max-width: 768px) {
  .ai-assistant { 
    bottom: 90px !important;
    left: 12px !important; 
    z-index: 9999 !important; 
  }
  .ai-toggle {
    width: 48px !important;
    height: 48px !important;
    font-size: 1.2rem !important;
  }
  .ai-panel { 
    width: 290px !important; 
    max-height: 400px !important;
    bottom: 56px !important;
  }
  .ai-messages { max-height: 250px !important; }
  .ai-suggestions-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
</style>