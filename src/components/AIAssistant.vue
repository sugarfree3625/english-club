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
            Привет! 👋 Я AI-помощник English Club. Спросите меня о:
            <div class="ai-suggestions">
              <button v-for="s in suggestions" :key="s" class="ai-suggestion" @click="quickAsk(s)">{{ s }}</button>
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

const suggestions = ['📅 Расписание', '📝 Записаться', '💰 Оплата', '📊 Мой уровень', '🏆 Достижения', '📚 Словарь'];

const answers = {
  'расписание': '📅 Расписание доступно в разделе "Календарь". Там вы можете:\n• Посмотреть ближайшие занятия\n• Записаться на удобное время\n• Отменить запись\n\n👉 Перейти: /calendar',
  'записаться': '📝 Чтобы записаться на занятие:\n1️⃣ Зайдите в раздел "Календарь"\n2️⃣ Выберите свободный слот\n3️⃣ Нажмите "Записаться"\n\nИли напишите @anna_english в Telegram!',
  'оплата': '💳 Способы оплаты:\n• Перевод на карту\n• Через Telegram @anna_english\n\nСтоимость:\n• Индивидуальное занятие: 1 500 ₽ / 60 мин\n• Подготовка к IELTS: 2 000 ₽ / 90 мин',
  'оплат': '💳 Способы оплаты:\n• Перевод на карту\n• Через Telegram @anna_english\n\nСтоимость:\n• Индивидуальное занятие: 1 500 ₽ / 60 мин\n• Подготовка к IELTS: 2 000 ₽ / 90 мин',
  'цена': '💰 Цены на занятия:\n• Индивидуальное: 1 500 ₽ / 60 мин\n• IELTS: 2 000 ₽ / 90 мин\n• Групповое: 800 ₽ / 90 мин',
  'стоимость': '💰 Цены на занятия:\n• Индивидуальное: 1 500 ₽ / 60 мин\n• IELTS: 2 000 ₽ / 90 мин\n• Групповое: 800 ₽ / 90 мин',
  'уровень': '📊 Уровни английского:\n🟢 A1 — Beginner (начинающий)\n🟢 A2 — Elementary\n🔵 B1 — Intermediate (средний)\n🔵 B2 — Upper-Intermediate\n🟣 C1 — Advanced (продвинутый)\n🟣 C2 — Proficient\n\nВаш уровень можно посмотреть в профиле (/profile)',
  'привет': '👋 Привет! Я AI-помощник English Club.\n\nЯ могу:\n• Рассказать о расписании\n• Помочь с записью\n• Объяснить уровни\n• Подсказать по оплате\n• И многое другое!\n\nПросто спросите! 😊',
  'помощь': '🤖 Я могу помочь с:\n\n📅 Расписанием\n📝 Записью на занятия\n💰 Оплатой и ценами\n📊 Уровнями английского\n🏆 Достижениями\n📚 Словарём\n💬 Чатом и сообщениями\n📅 Календарём\n👤 Профилем\n\nПросто напишите свой вопрос!',
  'достижения': '🏆 Достижения — это награды за активность!\n\nКатегории:\n📚 Слова (добавляйте в словарь)\n📅 Встречи (посещайте занятия)\n💬 Сообщения (общайтесь в чате)\n⭐ Рейтинг (зарабатывайте XP)\n🔥 Стрик (занимайтесь без пропусков)\n\nСмотреть: /profile → Достижения',
  'словарь': '📚 Словарь — ваш личный инструмент для запоминания слов.\n\n• Добавляйте новые слова\n• Отмечайте изученные\n• Следите за прогрессом\n\n👉 Смотреть: /profile → Словарь',
  'чат': '💬 Чат доступен после входа:\n• Личные сообщения\n• Групповые чаты\n• Голосовые сообщения\n• Видеозвонки\n\n👉 Перейти: /messages',
  'календарь': '📅 Календарь показывает все занятия:\n• Просмотр по месяцам и неделям\n• Запись в один клик\n• Цветные метки типов занятий\n\n👉 Перейти: /calendar',
  'профиль': '👤 В профиле вы найдёте:\n• Личную информацию\n• Достижения\n• Расписание\n• Словарь\n• Блокнот\n• Задания\n• Прогресс\n\n👉 Перейти: /profile',
  'как дела': '😊 У меня всё отлично! Я всегда готов помочь!\n\nА у вас как настроение? Готовы к новым знаниям? 🚀',
  'спасибо': '🙏 Пожалуйста! Рад помочь!\n\nЕсли понадоблюсь — я всегда здесь, в правом нижнем углу 😊',
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
  let answer = '🤔 Хороший вопрос! Я пока учусь и не всё знаю.\n\nНапишите @anna_english в Telegram, и вам помогут! 💬';
  
  // Поиск по ключевым словам
  for (const [key, val] of Object.entries(answers)) {
    if (q.includes(key)) { 
      answer = val; 
      break; 
    }
  }
  
  // Умный поиск по нескольким словам
  if (answer.includes('@anna_english')) {
    if (q.includes('занят') || q.includes('урок') || q.includes('учител')) {
      answer = answers['записаться'];
    }
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
  width: 340px; max-height: 500px; 
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
  max-height: 350px;
}
.ai-msg { 
  padding: 10px 14px; border-radius: 14px; 
  font-size: 0.85rem; max-width: 90%; line-height: 1.5;
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

.ai-suggestions { 
  display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; 
}
.ai-suggestion { 
  padding: 4px 10px; border-radius: 12px; 
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8; cursor: pointer; font-size: 0.7rem; 
  transition: all 0.2s; font-family: inherit;
}
.ai-suggestion:hover { 
  background: rgba(99,102,241,0.2); color: #fff; border-color: rgba(99,102,241,0.3); 
}

.typing { display: flex; gap: 4px; align-items: center; padding: 14px 18px; }
.typing-dot { 
  width: 6px; height: 6px; border-radius: 50%; 
  background: #94a3b8; 
  animation: typingBounce 1.4s infinite ease-in-out both; 
}
.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
.typing-dot:nth-child(3) { animation-delay: 0s; }
@keyframes typingBounce { 
  0%,80%,100%{transform:scale(0.6);opacity:0.4} 
  40%{transform:scale(1);opacity:1} 
}

.ai-input { 
  display: flex; gap: 8px; padding: 12px; 
  border-top: 1px solid rgba(255,255,255,0.06); 
}
.input { 
  flex: 1; padding: 10px 14px; 
  border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; 
  background: rgba(255,255,255,0.03); color: #fff; 
  font-size: 0.85rem; outline: none; font-family: inherit; 
}
.input:focus { border-color: #6366f1; }
.input:disabled { opacity: 0.5; }

.btn { 
  display: inline-flex; align-items: center; padding: 8px 14px; 
  border-radius: 12px; border: none; cursor: pointer; 
}
.btn-p { 
  background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; 
}
.btn-p:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 8px 14px; font-size: 0.9rem; }

.ai-slide-enter-active, .ai-slide-leave-active { 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
}
.ai-slide-enter-from, .ai-slide-leave-to { 
  opacity: 0; transform: translateY(20px) scale(0.95); 
}

@media (max-width: 480px) {
  .ai-panel { width: 290px; }
  .ai-assistant { bottom: 16px; left: 16px; }
}
</style>
