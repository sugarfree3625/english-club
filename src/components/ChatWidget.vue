<template>
  <div class="chat-wrapper">
    <!-- Хедер чата -->
    <div class="chat-header">
      <div class="chat-header-left">
        <div class="avatar-wrapper" :class="{ online: teacherOnline }">
          <div class="avatar-glow"></div>
          <img :src="teacherAvatar" class="avatar-img floating" alt="Teacher">
        </div>
        <div>
          <h3 class="teacher-name">{{ teacherName }}</h3>
          <span class="teacher-status">{{ teacherOnline ? '🟢 Онлайн' : '⚫ Оффлайн' }}</span>
        </div>
      </div>
      <button class="btn-icon" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Сообщения -->
    <div class="chat-messages" ref="messagesContainer">
      <transition-group name="msg-materialize">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-row"
          :class="{ mine: msg.mine }"
          @touchstart="handleTouchStart($event, msg)"
          @touchend="handleTouchEnd($event, msg)"
          ref="messageRefs"
        >
          <div class="message-bubble" :class="{ swiped: msg.swiped }">
            <img 
              :src="msg.mine ? studentAvatar : teacherAvatar" 
              class="msg-avatar floating"
              alt=""
            >
            <div class="bubble-content">
              <span class="msg-text">{{ msg.text }}</span>
              <span class="msg-time">{{ msg.time }}</span>
            </div>
          </div>

          <!-- Свайп влево — перевод -->
          <transition name="swipe-panel">
            <div v-if="msg.showTranslation" class="swipe-panel translation-panel">
              <span class="translation-text">{{ msg.translation }}</span>
            </div>
          </transition>

          <!-- Свайп вправо — действия -->
          <transition name="swipe-panel">
            <div v-if="msg.showActions" class="swipe-panel actions-panel">
              <button @click="copyText(msg)" title="Копировать">📋</button>
              <button @click="replyTo(msg)" title="Ответить">↩️</button>
              <button @click="deleteMsg(msg)" title="Удалить">🗑</button>
            </div>
          </transition>
        </div>
      </transition-group>
    </div>

    <!-- Отправка -->
    <div class="chat-input">
      <button class="btn-icon emoji-btn" @click="showEmoji = !showEmoji">😊</button>
      <transition name="emoji-fade">
        <div v-if="showEmoji" class="emoji-picker">
          <span v-for="e in emojis" :key="e" @click="newMsg += e">{{ e }}</span>
        </div>
      </transition>
      <textarea
        v-model="newMsg"
        @keydown.enter.exact.prevent="sendMessage"
        placeholder="Сообщение..."
        rows="1"
        ref="msgInput"
      ></textarea>
      <button class="btn-send" @click="sendMessage" :class="{ sending: isSending }">
        <transition name="plane-fly" mode="out-in">
          <i v-if="!isSending" class="fas fa-paper-plane"></i>
          <i v-else class="fas fa-paper-plane plane-fly-icon"></i>
        </transition>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';

const props = defineProps({
  teacherName: { type: String, default: 'Анна Петрова' },
  teacherAvatar: { type: String, default: 'https://ui-avatars.com/api/?name=Анна+П&background=6366f1&color=fff' },
  studentAvatar: { type: String, default: 'https://ui-avatars.com/api/?name=Ученик&background=2dd4bf&color=fff' },
  teacherOnline: { type: Boolean, default: true },
});

const emit = defineEmits(['close', 'send']);

const messagesContainer = ref(null);
const messageRefs = ref([]);
const msgInput = ref(null);

const newMsg = ref('');
const isSending = ref(false);
const showEmoji = ref(false);

const messages = ref([
  { id: 1, text: 'Привет! Готов к уроку?', mine: false, time: '10:00', translation: 'Hi! Ready for the lesson?', showTranslation: false, showActions: false, swiped: false },
  { id: 2, text: 'Да, очень жду!', mine: true, time: '10:01', translation: 'Yes, looking forward to it!', showTranslation: false, showActions: false, swiped: false },
  { id: 3, text: 'Today we will practice speaking about travel', mine: false, time: '10:02', translation: 'Сегодня будем практиковать разговорную речь о путешествиях', showTranslation: false, showActions: false, swiped: false },
]);

const emojis = ['😀','😂','🤣','😍','🥰','😘','😎','🤩','😇','🤔','😴','🥳','❤️','🔥','🎉','⭐','✅','💯','🙏','💪','🚀','🌈'];

// Touch swipe
let touchStartX = 0;
let touchStartY = 0;
let currentMsg = null;

const handleTouchStart = (e, msg) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  currentMsg = msg;
};

const handleTouchEnd = (e, msg) => {
  if (!currentMsg || currentMsg.id !== msg.id) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  
  // Только если горизонтальный свайп больше вертикального
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
    // Свайп вправо (действия)
    if (diffX > 0) {
      msg.showActions = !msg.showActions;
      msg.showTranslation = false;
      msg.swiped = msg.showActions;
    }
    // Свайп влево (перевод)
    else {
      msg.showTranslation = !msg.showTranslation;
      msg.showActions = false;
      msg.swiped = msg.showTranslation;
    }
  }
  
  currentMsg = null;
};

// Actions
const copyText = (msg) => {
  navigator.clipboard.writeText(msg.text);
  msg.showActions = false;
  msg.swiped = false;
};

const replyTo = (msg) => {
  newMsg.value = `↩ ${msg.text.substring(0, 50)}\n`;
  msg.showActions = false;
  msg.swiped = false;
  nextTick(() => msgInput.value?.focus());
};

const deleteMsg = (msg) => {
  messages.value = messages.value.filter(m => m.id !== msg.id);
};

// Send message
const sendMessage = async () => {
  const text = newMsg.value.trim();
  if (!text) return;
  
  isSending.value = true;
  
  // Анимация отправки
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newMessage = {
    id: Date.now(),
    text,
    mine: true,
    time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    translation: '',
    showTranslation: false,
    showActions: false,
    swiped: false,
  };
  
  // Пробуем перевести
  try {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ru&dt=t&q=${encodeURIComponent(text)}`);
    const data = await r.json();
    newMessage.translation = data[0]?.map(item => item[0]).join('') || '';
  } catch(e) {}
  
  messages.value.push(newMessage);
  newMsg.value = '';
  isSending.value = false;
  
  emit('send', newMessage);
  
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Автоскролл
watch(() => messages.value.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 600px;
  background: var(--surface, #f8fafc);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}

/* Хедер */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--surface, #ffffff);
  border-bottom: 1px solid var(--b, #e2e8f0);
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrapper {
  position: relative;
  width: 44px;
  height: 44px;
}

.avatar-wrapper.online .avatar-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid #10b981;
  animation: avatarPulse 2s ease-in-out infinite;
}

@keyframes avatarPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.5; }
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--b, #e2e8f0);
}

.floating {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.teacher-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--t, #1e293b);
}

.teacher-status {
  font-size: 0.75rem;
  color: var(--t2, #64748b);
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--t2, #64748b);
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(99,102,241,0.06);
  color: var(--p, #6366f1);
}

/* Сообщения */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-row {
  position: relative;
}

.message-bubble {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 75%;
  transition: transform 0.3s ease;
}

.message-row.mine .message-bubble {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-bubble.swiped {
  transform: translateX(10px);
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.bubble-content {
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.message-row.mine .bubble-content {
  background: linear-gradient(135deg, var(--p, #6366f1), var(--p2, #8b5cf6));
  color: #fff;
  border-bottom-right-radius: 6px;
}

.message-row:not(.mine) .bubble-content {
  background: var(--bg, #f1f5f9);
  color: var(--t, #1e293b);
  border-bottom-left-radius: 6px;
}

.msg-text {
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
}

.msg-time {
  font-size: 0.7rem;
  opacity: 0.6;
  display: block;
  margin-top: 4px;
  text-align: right;
}

/* Материализация */
.msg-materialize-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.msg-materialize-leave-active {
  transition: all 0.3s ease;
}
.msg-materialize-enter-from {
  opacity: 0;
  filter: blur(10px);
  transform: translateY(10px);
}
.msg-materialize-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Свайп-панели */
.swipe-panel {
  margin-top: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  max-width: 75%;
}

.translation-panel {
  background: rgba(99,102,241,0.08);
  border: 1px solid rgba(99,102,241,0.15);
  color: var(--p, #6366f1);
  backdrop-filter: blur(8px);
}

.actions-panel {
  background: rgba(255,255,255,0.9);
  border: 1px solid var(--b, #e2e8f0);
  display: flex;
  gap: 8px;
  backdrop-filter: blur(8px);
}

.actions-panel button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.actions-panel button:hover {
  background: rgba(99,102,241,0.08);
}

.swipe-panel-enter-active {
  transition: all 0.3s ease;
}
.swipe-panel-leave-active {
  transition: all 0.2s ease;
}
.swipe-panel-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}
.swipe-panel-enter-to {
  opacity: 1;
  max-height: 100px;
}
.swipe-panel-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Отправка */
.chat-input {
  display: flex;
  gap: 8px;
  padding: 14px 20px;
  background: var(--surface, #ffffff);
  border-top: 1px solid var(--b, #e2e8f0);
  align-items: flex-end;
  position: relative;
}

.chat-input textarea {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--b, #e2e8f0);
  border-radius: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  resize: none;
  outline: none;
  background: var(--bg, #f8fafc);
  color: var(--t, #1e293b);
  transition: border-color 0.2s;
}

.chat-input textarea:focus {
  border-color: var(--p, #6366f1);
}

.btn-send {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--p, #6366f1), var(--p2, #8b5cf6));
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.btn-send:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(99,102,241,0.4);
}

.btn-send.sending {
  background: var(--b, #e2e8f0);
  pointer-events: none;
}

.plane-fly-icon {
  animation: flyAway 0.4s ease-in forwards;
}

@keyframes flyAway {
  0% { transform: translate(0, 0) rotate(0); opacity: 1; }
  100% { transform: translate(30px, -30px) rotate(45deg); opacity: 0; }
}

.plane-fly-enter-active { transition: all 0.2s ease; }
.plane-fly-leave-active { transition: all 0.4s ease; }
.plane-fly-enter-from { opacity: 0; transform: scale(0.5); }
.plane-fly-leave-to { opacity: 0; transform: translate(30px, -30px) rotate(45deg); }

/* Эмодзи */
.emoji-btn {
  font-size: 1.2rem;
}

.emoji-picker {
  position: absolute;
  bottom: 60px;
  left: 20px;
  background: var(--surface, #ffffff);
  border: 1px solid var(--b, #e2e8f0);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 280px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  z-index: 100;
}

.emoji-picker span {
  cursor: pointer;
  font-size: 1.3rem;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s;
}

.emoji-picker span:hover {
  background: rgba(99,102,241,0.08);
  transform: scale(1.2);
}

.emoji-fade-enter-active { transition: all 0.2s ease; }
.emoji-fade-leave-active { transition: all 0.15s ease; }
.emoji-fade-enter-from, .emoji-fade-leave-to { opacity: 0; transform: translateY(10px); }

@media (max-width: 768px) {
  .message-bubble { max-width: 85%; }
  .emoji-picker { width: 240px; }
}
</style>
