<template>
  <div class="chat-container">
    <!-- Левая панель -->
    <div class="chat-sidebar">
      <!-- Поиск пользователей -->
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
          <span v-if="d.unread" class="unread-badge">{{ d.unread }}</span>
        </div>
        <p v-if="!dialogs.length">Нет диалогов</p>
      </div>
      <button class="btn btn-p btn-sm" @click="$router.push('/profile')">← Назад</button>
    </div>

    <!-- Правая панель: сообщения -->
    <div class="chat-main" v-if="activeChat">
      <div class="chat-header">
        <strong>{{ activeChatName }}</strong>
        <span class="online-status" :class="{ online: isPartnerOnline }">{{ isPartnerOnline ? '🟢 Онлайн' : '⚫ Оффлайн' }}</span>
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
      
      <!-- Поле ввода -->
      <div class="chat-input">
        <!-- Эмодзи -->
        <button class="btn btn-o btn-sm" @click="showEmoji = !showEmoji">😊</button>
        <div v-if="showEmoji" class="emoji-picker">
          <span v-for="e in emojis" :key="e" @click="msgText += e" style="cursor:pointer;font-size:1.2rem;padding:2px">{{ e }}</span>
        </div>
        
        <!-- Файлы -->
        <button class="btn btn-o btn-sm" @click="$refs.fileInput.click()">📎</button>
        <input type="file" ref="fileInput" @change="handleFiles" hidden multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.zip">
        
        <!-- Голосовое -->
        <button class="btn btn-o btn-sm" @mousedown="startRecord" @mouseup="stopRecord" @touchstart="startRecord" @touchend="stopRecord">🎤</button>
        <span v-if="recording" style="color:red;font-size:0.8rem">🔴 Запись...</span>
        
        <textarea v-model="msgText" @keydown.enter.exact.prevent="sendMsg" placeholder="Сообщение..." rows="1"></textarea>
        <button class="btn btn-p btn-sm" @click="sendMsg">➤</button>
      </div>
      
      <!-- Превью файлов -->
      <div v-if="pendingFiles.length" class="file-preview">
        <div v-for="(f, i) in pendingFiles" :key="i" class="preview-item">
          <span>{{ f.name }}</span>
          <button @click="pendingFiles.splice(i, 1)" style="color:red;background:none;border:none;cursor:pointer">✕</button>
        </div>
      </div>
    </div>

    <div class="chat-main" v-else>
      <p style="text-align:center;color:#94a3b8;margin-top:40px">Выберите чат или найдите человека</p>
    </div>

    <!-- Лайтбокс -->
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
      emojis: ['😀','😂','🤣','😍','🥰','😘','😜','😎','🤩','😇','🤔','😴','🥳','😡','💀','👻','💩','👍','👎','❤️','💔','🔥','🎉','⭐','✅','❌','💯','🙏','🤝','💪','👀','🦄','🐶','🌹','🍕','⚽','🚀','🌈','🎵','📚','💡','💰','⏰','📍']
    };
  },
  async mounted() {
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
    });
    
    this.socket.on('userStatus', ({ userId, online }) => {
      if (userId === this.activeChat) {
        this.isPartnerOnline = online;
      }
    });
  },
  beforeUnmount() {
    if (this.socket) this.socket.disconnect();
  },
  methods: {
    async loadDialogs() {
      try {
        const r = await axios.get('/api/dialogs');
        this.dialogs = r.data;
      } catch(e) {}
    },
    async searchUsers() {
      if (this.searchQuery.length < 2) { this.searchResults = []; return; }
      try {
        const r = await axios.get(`/api/users?q=${this.searchQuery}`);
        this.searchResults = r.data.filter(u => u.id !== this.currentUserId);
      } catch(e) {}
    },
    async startChat(u) {
      this.activeChat = u.id;
      this.activeChatName = u.username;
      this.searchQuery = '';
      this.searchResults = [];
      try {
        const r = await axios.get(`/api/messages/${u.id}`);
        this.messages = r.data;
        this.$nextTick(() => this.scrollToBottom());
      } catch(e) {}
      this.loadDialogs();
    },
    async openChat(d) {
      this.activeChat = d.partner_id;
      this.activeChatName = d.username;
      try {
        const r = await axios.get(`/api/messages/${d.partner_id}`);
        this.messages = r.data;
        this.$nextTick(() => this.scrollToBottom());
      } catch(e) {}
    },
    async sendMsg() {
      const text = this.msgText.trim();
      if (!text && !this.pendingFiles.length) return;
      if (!this.activeChat) return;
      
      if (text) {
        this.socket.emit('dm', { to: this.activeChat, msg: text });
      }
      
      // Отправка файлов
      for (const file of this.pendingFiles) {
        const form = new FormData();
        form.append('img', file);
        try {
          const r = await axios.post('/api/nimg', form);
          const url = r.data.url;
          const type = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('audio/') ? 'audio' : 
                       file.type.startsWith('video/') ? 'video' : 'file';
          this.socket.emit('dm', { to: this.activeChat, msg: '', files: [{ url, type, name: file.name }] });
        } catch(e) {}
      }
      
      this.msgText = '';
      this.pendingFiles = [];
    },
    handleFiles(e) {
      this.pendingFiles.push(...Array.from(e.target.files));
      e.target.value = '';
    },
    // Голосовое сообщение
    async startRecord() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recording = true;
        this.mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        this.mediaRecorder.ondataavailable = e => chunks.push(e.data);
        this.mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const form = new FormData();
          form.append('img', blob, 'voice.webm');
          try {
            const r = await axios.post('/api/nimg', form);
            this.socket.emit('dm', { to: this.activeChat, msg: '', files: [{ url: r.data.url, type: 'audio', name: 'Голосовое' }] });
          } catch(e) {}
          stream.getTracks().forEach(t => t.stop());
          this.recording = false;
        };
        this.mediaRecorder.start();
      } catch(e) { this.recording = false; }
    },
    stopRecord() {
      if (this.mediaRecorder && this.recording) {
        this.mediaRecorder.stop();
      }
    },
    scrollToBottom() {
      const el = this.$refs.msgContainer;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }
};
</script>

<style scoped>
/* ... стили ... */
</style>
