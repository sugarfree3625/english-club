<template>
  <div class="chat-container" :class="{ dark: isDark }" v-if="user?.id">
    <!-- Сайдбар с диалогами (твой оригинальный) -->
    <div class="chat-sidebar" :class="{ 'mobile-hidden': !showSidebar && activeChat }">
      <div class="sidebar-header">
        <h3>💬 Сообщения</h3>
        <span v-if="unreadCount" class="unread-badge pulse-badge">{{ unreadCount }}</span>
      </div>
      <div class="search-box" v-if="user?.role === 'admin' || user?.role === 'host'">
        <input v-model="searchQuery" @input="searchUsers" placeholder="Поиск ученика..." class="search-input">
        <div v-if="searchResults.length" class="search-results">
          <div v-for="(u, idx) in searchResults" :key="u.id" class="search-item fade-in-up" :style="{ animationDelay: `${idx * 0.04}s` }" @click="startChat(u)">
            <img :src="u.avatar_url || 'https://ui-avatars.com/api/?name=' + u.username" class="dialog-avatar">
            <div><strong>{{ u.username }}</strong><small>{{ u.level }}</small></div>
          </div>
        </div>
      </div>
      <div class="dialog-list">
        <div v-for="(d, idx) in dialogs" :key="d.partner_id || d.id" class="dialog-item fade-in-up" :class="{ active: activeChat === (d.partner_id || d.id) }" :style="{ animationDelay: `${idx * 0.03}s` }" @click="openChat(d)">
          <img :src="d.avatar_url || 'https://ui-avatars.com/api/?name=' + (d.username || 'U')" class="dialog-avatar">
          <div class="dialog-info"><strong>{{ d.username }}</strong><small>{{ (d.message || d.last_msg || '').substring(0, 35) }}</small></div>
        </div>
        <p v-if="!dialogs.length" class="empty-text">Нет диалогов</p>
      </div>
      <button class="btn btn-o btn-sm w-100 interactive-btn" @click="$router.push('/profile')"><i class="fas fa-arrow-left"></i> В профиль</button>
    </div>

    <button class="mobile-back interactive-btn" @click="showSidebar = true; activeChat = null">← Чаты</button>

    <!-- Новый чат-виджет -->
    <div class="chat-main" v-if="activeChat" :class="{ 'mobile-show': !showSidebar }">
      <ChatWidget
        :teacherName="activeChatName"
        :teacherAvatar="partnerAvatar || 'https://ui-avatars.com/api/?name=' + activeChatName"
        :studentAvatar="user?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.username || 'U')"
        :teacherOnline="isPartnerOnline"
        @close="activeChat = null; showSidebar = true"
        @send="onMessageSent"
        ref="chatWidget"
      />
    </div>

    <div class="chat-main empty-chat" v-else>
      <div>
        <i class="fas fa-comments" style="font-size:4rem;opacity:0.3"></i>
        <p>Выберите чат</p>
      </div>
    </div>
  </div>
  <div v-else class="container" style="text-align:center;padding:80px 20px">Войдите</div>
</template>

<script>
import axios from 'axios';
import { io } from 'socket.io-client';
import { useDebounce } from '../composables/useDebounce.js';
import ChatWidget from '../components/ChatWidget.vue';

export default {
  name: 'MessagesPage',
  components: { ChatWidget },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      dialogs: [], activeChat: null, activeChatName: '', partnerAvatar: null,
      currentUserId: null, unreadCount: 0, socket: null,
      searchQuery: '', searchResults: [], showSidebar: true,
      isPartnerOnline: false,
    };
  },
  computed: {
    isDark() { return document.body.classList.contains('dark'); }
  },
  async mounted() {
    if (!this.user?.id) return;
    this.currentUserId = this.user.id;
    await this.loadDialogs();

    this.socket = io('https://english-club-v1.onrender.com', { transports: ['websocket', 'polling'] });
    this.socket.on('connect', () => this.socket.emit('join', { uid: this.currentUserId, uname: this.user.username, role: this.user.role }));
    this.socket.on('unread', ({ count }) => { this.unreadCount = count; });
    this.socket.on('dm', (msg) => {
      if (msg.from === this.currentUserId) { this.loadDialogs(); return; }
      if (this.$refs.chatWidget && this.activeChat === msg.from) {
        this.$refs.chatWidget.addMessage({
          id: msg.id || Date.now(),
          text: msg.message || msg.msg || '📎 Файл',
          mine: false,
          time: new Date(msg.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
          translation: '',
        });
      }
      this.loadDialogs();
    });

    this.searchUsers = useDebounce(this.searchUsers, 300);
  },
  beforeUnmount() {
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
  },
  methods: {
    async loadDialogs() {
      if (!this.currentUserId) return;
      try {
        const r = await axios.get('/api/dialogs');
        this.dialogs = Array.isArray(r.data) ? r.data : [];
      } catch(e) {}
    },
    async searchUsers() {
      if (this.searchQuery.length < 2) { this.searchResults = []; return; }
      try {
        const r = await axios.get(`/api/users?q=${this.searchQuery}`);
        this.searchResults = (r.data || []).filter(u => u.id !== this.currentUserId);
      } catch(e) {}
    },
    startChat(u) {
      this.activeChat = u.id;
      this.activeChatName = u.username;
      this.partnerAvatar = u.avatar_url;
      this.searchQuery = '';
      this.searchResults = [];
      this.showSidebar = false;
      this.loadDialogs();
    },
    openChat(d) {
      const pid = d.partner_id || d.id;
      this.activeChat = pid;
      this.activeChatName = d.username;
      this.partnerAvatar = d.avatar_url;
      this.showSidebar = false;
    },
    onMessageSent(msg) {
      if (this.socket?.connected) {
        this.socket.emit('dm', {
          to: this.activeChat,
          msg: msg.text,
        });
      }
    }
  }
};
</script>

<style scoped>
.chat-container { display: flex; height: calc(100vh - 60px); max-width: 1280px; margin: 0 auto; background: var(--bg); overflow: hidden; }
.chat-sidebar { width: 340px; border-right: 1px solid var(--b); background: var(--surface); display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-header { padding: 18px; border-bottom: 1px solid var(--b); display: flex; justify-content: space-between; align-items: center; }
.sidebar-header h3 { font-size: 1.1rem; font-weight: 700; }
.unread-badge { background: var(--p); color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
.pulse-badge { animation: pulse 2s infinite; }
.search-box { position: relative; padding: 12px; }
.search-input { width: 100%; padding: 11px 16px; border: 2px solid var(--b); border-radius: 14px; font-family: inherit; font-size: 0.85rem; background: var(--bg); color: var(--t); outline: none; transition: all 0.2s; }
.search-input:focus { border-color: var(--p); }
.search-results { position: absolute; top: 100%; left: 12px; right: 12px; background: var(--surface); border: 1px solid var(--b); border-radius: 14px; max-height: 220px; overflow-y: auto; z-index: 100; box-shadow: var(--shadow-lg); }
.search-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background 0.2s; }
.search-item:hover { background: rgba(99,102,241,0.04); }
.dialog-list { flex: 1; overflow-y: auto; padding: 8px 12px; }
.dialog-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; cursor: pointer; margin-bottom: 3px; transition: all 0.2s; }
.dialog-item:hover, .dialog-item.active { background: rgba(99,102,241,0.05); }
.dialog-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid var(--b); }
.dialog-info { flex: 1; min-width: 0; }
.dialog-info strong { display: block; font-size: 0.9rem; }
.dialog-info small { color: var(--t2); font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.empty-text { text-align: center; color: var(--t2); padding: 30px; font-size: 0.85rem; }
.chat-main { flex: 1; display: flex; flex-direction: column; background: var(--bg); }
.empty-chat { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; color: var(--t2); }
.mobile-back { display: none; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-o { border: 2px solid var(--b); color: var(--t); background: transparent; }
.btn-o:hover { background: rgba(99,102,241,0.04); border-color: var(--p); }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.w-100 { width: 100%; }
.interactive-btn { transition: all 0.2s; }
.interactive-btn:hover { transform: translateY(-1px); }
.fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
@media (max-width: 768px) {
  .chat-sidebar { width: 100%; position: absolute; inset: 0; z-index: 10; }
  .chat-sidebar.mobile-hidden { display: none; }
  .chat-main { display: none; width: 100%; }
  .chat-main.mobile-show { display: flex; }
  .empty-chat { display: flex; }
  .mobile-back { display: block; padding: 14px 22px; background: var(--surface); border-bottom: 1px solid var(--b); font-weight: 600; cursor: pointer; border: none; width: 100%; text-align: left; color: var(--t); font-family: inherit; }
}
</style>
