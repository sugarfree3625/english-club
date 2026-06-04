<template>
  <button class="notif-bell" @click="togglePanel">
    <span class="bell-icon">🔔</span>
    <span v-if="unreadCount" class="bell-badge">{{ unreadCount }}</span>
  </button>
  <transition name="notif-slide">
    <div v-if="showPanel" class="notif-panel glass-card">
      <div class="notif-header">Уведомления</div>
      <div class="notif-list">
        <div v-for="n in notifications" :key="n.id" class="notif-item" :class="{ unread: !n.read }">
          <span class="notif-icon">{{ n.icon }}</span>
          <div class="notif-text">{{ n.text }}</div>
          <span class="notif-time">{{ n.time }}</span>
        </div>
        <p v-if="!notifications.length" class="notif-empty">Нет уведомлений</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';

const showPanel = ref(false);
const unreadCount = ref(3);
const notifications = ref([
  { id: 1, icon: '📅', text: 'Завтра занятие в 15:00', time: '5м', read: false },
  { id: 2, icon: '⭐', text: 'Вы получили достижение!', time: '1ч', read: false },
  { id: 3, icon: '💬', text: 'Новое сообщение от Анны', time: '3ч', read: false },
]);

const togglePanel = () => { showPanel.value = !showPanel.value; };
</script>

<style scoped>
.notif-bell { position: fixed; top: 80px; right: 24px; z-index: 1000; width: 44px; height: 44px; border-radius: 50%; background: var(--surface); border: 1px solid var(--b); cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md); }
.bell-badge { position: absolute; top: -4px; right: -4px; width: 18px; height: 18px; background: #ef4444; color: #fff; border-radius: 50%; font-size: 0.65rem; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.glass-card { background: rgba(15,15,30,0.97); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; }
.notif-panel { position: fixed; top: 130px; right: 24px; width: 320px; max-height: 400px; overflow-y: auto; z-index: 999; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
.notif-header { padding: 14px 18px; font-weight: 700; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.06); }
.notif-list { padding: 8px; }
.notif-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; transition: all 0.2s; cursor: pointer; }
.notif-item:hover { background: rgba(255,255,255,0.03); }
.notif-item.unread { background: rgba(99,102,241,0.05); }
.notif-icon { font-size: 1.2rem; }
.notif-text { flex: 1; font-size: 0.82rem; color: #cbd5e1; }
.notif-time { font-size: 0.7rem; color: #64748b; }
.notif-empty { text-align: center; color: #64748b; padding: 20px; font-size: 0.85rem; }
.notif-slide-enter-active, .notif-slide-leave-active { transition: all 0.3s ease; }
.notif-slide-enter-from, .notif-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>