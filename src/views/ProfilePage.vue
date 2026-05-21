<template>
  <div class="chat-container" :class="{ dark: isDark }">
    <!-- Левая панель -->
    <div class="chat-sidebar" :class="{ 'mobile-hidden': !showSidebar && activeChat }">
      <div class="search-box">
        <input v-model="searchQuery" @input="searchUsers" placeholder="🔍 Поиск людей..." class="search-input">
        <div v-if="searchResults.length" class="search-results">
          <div v-for="u in searchResults" :key="u.id" class="search-item" @click="startChat(u)">
            <img :src="u.avatar_url || 'https://ui-avatars.com/api/?name=' + u.username" class="dialog-avatar">
            <div>
              <strong>{{ u.username }}</strong>
              <small>{{ u.level }}</small>
            </div>
          </div>
        </div>
      </div>
      
      <h3>💬 Чаты</h3>
      <div class="dialog-list">
        <div v-for="d in dialogs" :key="d.partner_id" 
             class="dialog-item" :class="{ active: activeChat === d.partner_id }"
             @click="openChat(d)">
          <img :src="d.avatar_url || 'https://ui-avatars.com/api/?name=' + d.username" class="dialog-avatar">
          <div class="dialog-info">
            <strong>{{ d.username }}</strong>
            <small>{{ d.last_msg?.substring(0, 30) }}</small>
          </div>
        </div>
        <p v-if="!dialogs.length">Нет диалогов</p>
      </div>
      <button class="btn btn-p btn-sm" @click="$router.push('/profile')">← Назад</button>
    </div>

    <!-- Мобильная кнопка назад -->
    <button class="mobile-back" @click="showSidebar = true; activeChat = null">← Чаты</button>

    <!-- Правая панель -->
    <div class="chat-main" v-if="activeChat" :class="{ 'mobile-show': !showSidebar }">
      <div class="chat-header">
        <strong>{{ activeChatName }}</strong>
        <span :class="{ online: isPartnerOnline }">{{ isPartnerOnline ? '🟢 Онлайн' : '⚫ Оффлайн' }}</span>
      </div>
      <div class="chat-messages" ref="msgContainer">
        <div v-for="m in messages" :key="m.id" class="msg" :class="{ mine: m.sender_id === currentUserId }">
          <div v-if="m.message" class="msg-text">{{ m.message }}</div>
          <div v-if="m.files && m.files.length" class="msg-files">
            <div v-for="(f, i) in m.files" :key="i" class="msg-file">
              <img v-if="f.type === 'image'" :src="f.url" class="msg-img" @click="lightbox = f.url">
              <audio v-else-if="f.type === 'audio'" :src="f.url" controls></audio>
              <video v-else-if="f.type === 'video'" :src="f.url" controls class="msg-video"></video>
              <a v-else :href="f.url" target="_blank" class="file-link">📎 {{ f.name || 'Файл' }}</a>
            </div>
          </div>
          <small class="msg-time">{{ new Date(m.ts).toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'}) }}</small>
        </div>
      </div>
      
      <div class="chat-input">
        <div class="emoji-wrapper">
          <button class="btn btn-o btn-sm" @click="showEmoji = !showEmoji">😊</button>
          <div v-if="showEmoji" class="emoji-picker">
            <span v-for="e in emojis" :key="e" @click="msgText += e" style="cursor:pointer;font-size:1.2rem;padding:2px">{{ e }}</span>
          </div>
        </div>
        <button class="btn btn-o btn-sm" @click="$refs.fileInput.click()">📎</button>
        <input type="file" ref="fileInput" @change="handleFiles" hidden multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.zip">
        <button class="btn btn-o btn-sm" @mousedown="startRecord" @mouseup="stopRecord" @mouseleave="stopRecord" @touchstart.prevent="startRecord" @touchend.prevent="stopRecord">🎤</button>
        <span v-if="recording" style="color:red;font-size:0.8rem">🔴</span>
        <textarea v-model="msgText" @keydown.enter.exact.prevent="sendMsg" placeholder="Сообщение..." rows="1"></textarea>
        <button class="btn btn-p btn-sm" @click="sendMsg">➤</button>
      </div>
      
      <div v-if="pendingFiles.length" class="file-preview">
        <div v-for="(f, i) in pendingFiles" :key="i" class="preview-item">
          <span>{{ f.name }}</span>
          <button @click="pendingFiles.splice(i, 1)" class="remove-btn">✕</button>
        </div>
      </div>
    </div>

    <div class="chat-main empty-chat" v-else>
      <p>Выберите чат или найдите человека</p>
    </div>

    <div class="lightbox" v-if="lightbox" @click="lightbox = null">
      <img :src="lightbox" style="max-width:90%;max-height:90%;border-radius:12px">
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { io } from 'socket.io-client';

export default {
  name: 'MessagesPage',
  props: ['user'],
  data() {
    return {
      dialogs: [],
      messages: [],
      activeChat: null,
      activeChatName: '',
      currentUserId: null,
      msgText: '',
      socket: null,
      lightbox: null,
      searchQuery: '',
      searchResults: [],
      showEmoji: false,
      pendingFiles: [],
      recording: false,
      mediaRecorder: null,
      isPartnerOnline: false,
      chunks: [],
      showSidebar: true,
      emojis: ['😀','😂','🤣','😍','🥰','😘','😜','😎','🤩','😇','🤔','😴','🥳','😡','💀','👻','💩','👍','👎','❤️','💔','🔥','🎉','⭐','✅','❌','💯','🙏','🤝','💪','👀','🦄','🐶','🌹','🍕','⚽','🚀','🌈','🎵','📚','💡','💰','⏰','📍']
    };
  },
  computed: {
    isDark() {
      return document.body.classList.contains('dark');
    }
  },
  async mounted() {
    // Запрос разрешения на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    this.currentUserId = this.user?.id;
    await this.loadDialogs();
    
    this.socket = io('https://english-club-v1.onrender.com');
    this.socket.emit('join', { uid: this.currentUserId, uname: this.user?.username, role: this.user?.role });
    
    this.socket.on('dm', (msg) => {
      if (this.activeChat === msg.from || this.activeChat === msg.to) {
        this.messages.push(msg);
        this.$nextTick(() => this.scrollToBottom());
      }
      this.loadDialogs();
      
      // Браузерное уведомление если вкладка не активна
      if (document.hidden && msg.from !== this.currentUserId) {
        this.sendBrowserNotification(msg);
      }
    });
    
    this.socket.on('userStatus', ({ userId, online }) => {
      if (userId === this.activeChat) this.isPartnerOnline = online;
    });
  },
  beforeUnmount() {
    if (this.socket) this.socket.disconnect();
  },
  methods: {
    sendBrowserNotification(msg) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`💬 ${msg.fn || 'Новое сообщение'}`, {
          body: msg.msg?.substring(0, 100) || '📎 Файл',
          icon: 'https://ui-avatars.com/api/?name=' + (msg.fn || 'U'),
          tag: 'english-club'
        });
      }
    },
    async loadDialogs() {
      try { const r = await axios.get('/api/dialogs'); this.dialogs = r.data; } catch(e) {}
    },
    async searchUsers() {
      if (this.searchQuery.length < 2) { this.searchResults = []; return; }
      try { const r = await axios.get(`/api/users?q=${this.searchQuery}`); this.searchResults = r.data.filter(u => u.id !== this.currentUserId); } catch(e) {}
    },
    async startChat(u) {
      this.activeChat = u.id; this.activeChatName = u.username; this.searchQuery = ''; this.searchResults = []; this.showSidebar = false;
      try { const r = await axios.get(`/api/messages/${u.id}`); this.messages = r.data; this.$nextTick(() => this.scrollToBottom()); } catch(e) {}
      this.loadDialogs();
    },
    async openChat(d) {
      this.activeChat = d.partner_id; this.activeChatName = d.username; this.showSidebar = false;
      try { const r = await axios.get(`/api/messages/${d.partner_id}`); this.messages = r.data; this.$nextTick(() => this.scrollToBottom()); } catch(e) {}
    },
    async sendMsg() {
      const text = this.msgText.trim();
      if (!text && !this.pendingFiles.length || !this.activeChat) return;
      if (text) this.socket.emit('dm', { to: this.activeChat, msg: text });
      for (const file of this.pendingFiles) {
        const form = new FormData(); form.append('img', file);
        try {
          const r = await axios.post('/api/nimg', form);
          const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'file';
          this.socket.emit('dm', { to: this.activeChat, msg: '', files: [{ url: r.data.url, type, name: file.name }] });
        } catch(e) {}
      }
      this.msgText = ''; this.pendingFiles = [];
    },
    handleFiles(e) { this.pendingFiles.push(...Array.from(e.target.files)); e.target.value = ''; },
    async startRecord() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recording = true; this.mediaRecorder = new MediaRecorder(stream); this.chunks = [];
        this.mediaRecorder.ondataavailable = e => this.chunks.push(e.data);
        this.mediaRecorder.onstop = async () => {
          const blob = new Blob(this.chunks, { type: 'audio/webm' });
          const form = new FormData(); form.append('img', blob, 'voice.webm');
          try { const r = await axios.post('/api/nimg', form); this.socket.emit('dm', { to: this.activeChat, msg: '🎤 Голосовое', files: [{ url: r.data.url, type: 'audio', name: 'Голосовое' }] }); } catch(e) {}
          stream.getTracks().forEach(t => t.stop()); this.recording = false;
        };
        this.mediaRecorder.start();
      } catch(e) { this.recording = false; }
    },
    stopRecord() { if (this.mediaRecorder && this.mediaRecorder.state === 'recording') this.mediaRecorder.stop(); },
    scrollToBottom() { const el = this.$refs.msgContainer; if (el) el.scrollTop = el.scrollHeight; }
  }
};
</script>

<style scoped>
/* Базовые стили */
.chat-container { display: flex; height: calc(100vh - 60px); max-width: 1280px; margin: 0 auto; background: #f8fafc; color: #1e293b; }
.chat-container.dark { background: #0f172a; color: #e2e8f0; }
.chat-sidebar { width: 300px; border-right: 1px solid #e2e8f0; background: #fff; padding: 16px; display: flex; flex-direction: column; flex-shrink: 0; }
.dark .chat-sidebar { background: #1e293b; border-color: #334155; }
.chat-sidebar h3 { margin-bottom: 12px; }
.search-box { position: relative; margin-bottom: 12px; }
.search-input { width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 0.85rem; background: #fff; color: #1e293b; }
.dark .search-input { background: #334155; border-color: #475569; color: #e2e8f0; }
.search-results { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; max-height: 200px; overflow-y: auto; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.dark .search-results { background: #1e293b; border-color: #334155; }
.search-item { display: flex; align-items: center; gap: 8px; padding: 10px; cursor: pointer; }
.search-item:hover { background: #eef0ff; }
.dark .search-item:hover { background: #334155; }
.dialog-list { flex: 1; overflow-y: auto; }
.dialog-item { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 10px; cursor: pointer; margin-bottom: 4px; }
.dialog-item:hover, .dialog-item.active { background: #eef0ff; }
.dark .dialog-item:hover, .dark .dialog-item.active { background: #334155; }
.dialog-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.dialog-info { flex: 1; min-width: 0; }
.dialog-info strong { display: block; font-size: 0.9rem; }
.dialog-info small { color: #94a3b8; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.chat-main { flex: 1; display: flex; flex-direction: column; background: #f8fafc; }
.dark .chat-main { background: #0f172a; }
.empty-chat { align-items: center; justify-content: center; color: #94a3b8; }
.chat-header { padding: 14px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.dark .chat-header { background: #1e293b; border-color: #334155; }
.chat-header .online { color: #22c55e; font-size: 0.8rem; }
.chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.msg { max-width: 75%; padding: 10px 14px; border-radius: 16px; background: #e2e8f0; align-self: flex-start; }
.dark .msg { background: #334155; }
.msg.mine { background: #6366f1; color: #fff; align-self: flex-end; }
.msg-text { font-size: 0.9rem; word-break: break-word; }
.msg-files { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.msg-img { max-width: 200px; border-radius: 8px; cursor: pointer; }
.msg-video { max-width: 250px; border-radius: 8px; }
.file-link { color: #6366f1; text-decoration: none; font-size: 0.85rem; }
.msg-time { font-size: 0.7rem; opacity: 0.7; display: block; margin-top: 4px; }
.chat-input { display: flex; gap: 6px; padding: 12px 16px; background: #fff; border-top: 1px solid #e2e8f0; align-items: flex-end; position: relative; }
.dark .chat-input { background: #1e293b; border-color: #334155; }
.emoji-wrapper { position: relative; }
.emoji-picker { position: absolute; bottom: 45px; left: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; width: 260px; max-height: 180px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 2px; z-index: 200; box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
.dark .emoji-picker { background: #1e293b; border-color: #334155; }
.chat-input textarea { flex: 1; padding: 10px; border: 2px solid #e2e8f0; border-radius: 12px; font-family: inherit; font-size: 0.9rem; resize: none; outline: none; background: #fff; color: #1e293b; }
.dark .chat-input textarea { background: #334155; border-color: #475569; color: #e2e8f0; }
.file-preview { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 16px; background: #fff; }
.dark .file-preview { background: #1e293b; }
.preview-item { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; display: flex; align-items: center; gap: 4px; }
.dark .preview-item { background: #334155; }
.remove-btn { color: #ef4444; background: none; border: none; cursor: pointer; }
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 3000; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; }
.btn-p { background: #6366f1; color: #fff; }
.btn-o { border: 2px solid #6366f1; color: #6366f1; background: transparent; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
.mobile-back { display: none; }

/* Мобильная адаптация */
@media (max-width: 768px) {
  .chat-sidebar { width: 100%; height: 100%; }
  .chat-sidebar.mobile-hidden { display: none; }
  .chat-main { display: none; width: 100%; }
  .chat-main.mobile-show { display: flex; }
  .empty-chat { display: flex; }
  .mobile-back { display: block; padding: 10px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; font-weight: 600; cursor: pointer; border: none; width: 100%; text-align: left; }
  .dark .mobile-back { background: #1e293b; border-color: #334155; color: #e2e8f0; }
  .msg { max-width: 85%; }
  .emoji-picker { width: 220px; }
}
</style>
