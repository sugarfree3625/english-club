<template>
  <div class="chat-container">
    <!-- Левая панель: список диалогов -->
    <div class="chat-sidebar">
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
      <button class="btn btn-p btn-sm" @click="$router.push('/dashboard')">← Назад</button>
    </div>

    <!-- Правая панель: сообщения -->
    <div class="chat-main" v-if="activeChat">
      <div class="chat-header">
        <strong>{{ activeChatName }}</strong>
      </div>
      <div class="chat-messages" ref="msgContainer">
        <div v-for="m in messages" :key="m.id" class="msg" :class="{ mine: m.sender_id === currentUserId }">
          <div v-if="m.message" class="msg-text">{{ m.message }}</div>
          <div v-if="m.file_url" class="msg-file">
            <img v-if="m.file_type === 'image'" :src="m.file_url" class="msg-img" @click="lightbox = m.file_url">
            <audio v-else-if="m.file_type === 'audio'" :src="m.file_url" controls></audio>
            <video v-else-if="m.file_type === 'video'" :src="m.file_url" controls></video>
            <a v-else :href="m.file_url" target="_blank">📎 Файл</a>
          </div>
          <small class="msg-time">{{ new Date(m.ts).toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'}) }}</small>
        </div>
      </div>
      
      <!-- Поле ввода -->
      <div class="chat-input">
        <button class="btn btn-o btn-sm" @click="$refs.fileInput.click()">📎</button>
        <input type="file" ref="fileInput" @change="sendFile" hidden multiple>
        <textarea v-model="msgText" @keydown.enter.exact.prevent="sendMsg" placeholder="Сообщение..." rows="1"></textarea>
        <button class="btn btn-p btn-sm" @click="sendMsg">➤</button>
      </div>
    </div>

    <!-- Если чат не выбран -->
    <div class="chat-main" v-else>
      <p style="text-align:center;color:#94a3b8;margin-top:40px">Выберите чат</p>
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
      lightbox: null
    };
  },
  async mounted() {
    this.currentUserId = this.user?.id;
    await this.loadDialogs();
    
    // Подключаем WebSocket
    this.socket = io('https://english-club-v1.onrender.com');
    this.socket.emit('join', { uid: this.currentUserId, uname: this.user?.username, role: this.user?.role });
    
    this.socket.on('dm', (msg) => {
      if (this.activeChat === msg.from || (this.activeChat === msg.to && msg.from === this.currentUserId)) {
        this.messages.push(msg);
        this.$nextTick(() => this.scrollToBottom());
      }
      this.loadDialogs();
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
      if (!text || !this.activeChat) return;
      
      this.socket.emit('dm', { to: this.activeChat, msg: text });
      this.msgText = '';
    },
    async sendFile(e) {
      const file = e.target.files[0];
      if (!file || !this.activeChat) return;
      
      const form = new FormData();
      form.append('img', file);
      
      try {
        const r = await axios.post('/api/nimg', form);
        const url = r.data.url;
        const type = file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('audio/') ? 'audio' : 
                     file.type.startsWith('video/') ? 'video' : 'file';
        
        this.socket.emit('dm', { to: this.activeChat, msg: '', fileUrl: url, fileType: type });
      } catch(e) {}
    },
    scrollToBottom() {
      const el = this.$refs.msgContainer;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }
};
</script>

<style scoped>
.chat-container { display: flex; height: calc(100vh - 60px); max-width: 1280px; margin: 0 auto; }
.chat-sidebar { width: 280px; border-right: 1px solid #e2e8f0; background: #fff; padding: 16px; display: flex; flex-direction: column; }
.chat-sidebar h3 { margin-bottom: 12px; }
.dialog-list { flex: 1; overflow-y: auto; }
.dialog-item { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 10px; cursor: pointer; margin-bottom: 4px; }
.dialog-item:hover, .dialog-item.active { background: #eef0ff; }
.dialog-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.dialog-info { flex: 1; min-width: 0; }
.dialog-info strong { display: block; font-size: 0.9rem; }
.dialog-info small { color: #94a3b8; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.chat-main { flex: 1; display: flex; flex-direction: column; background: #f8fafc; }
.chat-header { padding: 14px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; font-size: 1rem; }
.chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.msg { max-width: 70%; padding: 8px 12px; border-radius: 12px; background: #e2e8f0; align-self: flex-start; }
.msg.mine { background: #6366f1; color: #fff; align-self: flex-end; }
.msg-text { font-size: 0.9rem; word-break: break-word; }
.msg-img { max-width: 200px; border-radius: 8px; cursor: pointer; }
.msg-time { font-size: 0.7rem; opacity: 0.7; display: block; margin-top: 4px; }
.chat-input { display: flex; gap: 6px; padding: 12px 16px; background: #fff; border-top: 1px solid #e2e8f0; align-items: flex-end; }
.chat-input textarea { flex: 1; padding: 8px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 0.9rem; resize: none; outline: none; }
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 3000; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; }
.btn-p { background: #6366f1; color: #fff; }
.btn-o { border: 2px solid #6366f1; color: #6366f1; background: transparent; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
@media (max-width: 768px) { .chat-container { flex-direction: column; } .chat-sidebar { width: 100%; height: auto; } }
</style>
