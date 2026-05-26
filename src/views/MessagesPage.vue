<template>
  <div class="chat-container" :class="{ dark: isDark }" v-if="user?.id">
    <!-- Сайдбар -->
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

    <!-- Чат -->
    <div class="chat-main" v-if="activeChat" :class="{ 'mobile-show': !showSidebar }">
      <div class="chat-header">
        <div style="display:flex;align-items:center;gap:12px">
          <img :src="partnerAvatar || 'https://ui-avatars.com/api/?name=' + activeChatName" class="chat-avatar tilt-avatar">
          <div><strong>{{ activeChatName }}</strong><small :class="{ online: isPartnerOnline }">{{ isPartnerOnline ? '🟢 Онлайн' : '⚫ Оффлайн' }}</small></div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-o btn-sm interactive-btn" @click="soundEnabled = !soundEnabled" :title="soundEnabled ? 'Звук вкл' : 'Звук выкл'">{{ soundEnabled ? '🔊' : '🔇' }}</button>
          <button class="btn btn-o btn-sm interactive-btn" @click="showMsgSearch = !showMsgSearch"><i class="fas fa-search"></i></button>
        </div>
      </div>

      <div class="msg-search" v-if="showMsgSearch">
        <input v-model="msgSearchQuery" placeholder="Поиск в чате..." class="search-input" @input="filterMessages">
        <button class="btn btn-o btn-sm interactive-btn" @click="showMsgSearch = false; msgSearchQuery = ''">✕</button>
      </div>

      <div class="chat-messages" ref="msgContainer">
        <transition-group name="msg-pop">
          <div v-for="(m, idx) in filteredMessages" :key="m.id || m.ts || idx" class="msg" :class="{ mine: m.sender_id === currentUserId || m.from === currentUserId }">
            <div v-if="m.reply_to" class="reply-preview">↩ {{ m.reply_to?.substring(0, 60) }}</div>
            <div v-if="m.message" class="msg-text" v-html="linkify(m.message)"></div>
            <div v-if="m.files?.length" class="msg-files">
              <div v-for="(f, i) in m.files" :key="i" class="msg-file">
                <img v-if="f.type === 'image'" :src="proxifyUrl(f.url)" class="msg-img" @click="lightbox = proxifyUrl(f.url)" @error="$event.target.style.display='none'">
                <div v-else-if="f.type === 'audio'" class="voice-msg">
                  <button @click="toggleAudio($event, proxifyUrl(f.url))" class="voice-play-btn interactive-btn">▶️</button>
                  <div class="voice-wave"><div class="voice-wave-bar" v-for="n in 12" :key="n" :style="{ height: Math.random() * 16 + 4 + 'px' }"></div></div>
                  <span class="voice-label">🎤 Голосовое</span>
                </div>
                <video v-else-if="f.type === 'video'" :src="proxifyUrl(f.url)" controls class="msg-video"></video>
                <a v-else :href="proxifyUrl(f.url)" target="_blank" class="file-link" :download="f.name || 'file'">📎 {{ f.name || 'Файл' }}</a>
              </div>
            </div>
            <small class="msg-time">{{ formatTime(m.ts) }}</small>
            <div class="msg-actions">
              <button @click="replyTo(m)" title="Ответить" class="interactive-btn">↩</button>
              <button @click="translateMsg(m)" title="Перевести" class="interactive-btn">🌐</button>
              <button v-if="m.sender_id === currentUserId || m.from === currentUserId" @click="deleteMsg(m.id)" title="Удалить" class="interactive-btn">🗑</button>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- Перевод -->
      <div v-if="showTranslate" class="translate-popup">
        <div class="translate-word">{{ selectedWord }}</div>
        <div class="translate-result" v-if="!translating">{{ translatedText }}</div>
        <div class="translate-loading" v-else>⏳ Перевод...</div>
        <div class="translate-actions">
          <button @click="copyTranslation" class="btn btn-o btn-sm interactive-btn">📋</button>
          <button @click="showTranslate = false" class="btn btn-o btn-sm interactive-btn">✕</button>
        </div>
      </div>

      <!-- Ввод -->
      <div class="chat-input">
        <button class="btn btn-o btn-sm emoji-btn interactive-btn" @click="showEmoji = !showEmoji">😊</button>
        <div v-if="showEmoji" class="emoji-picker"><span v-for="e in emojis" :key="e" @click="msgText += e" class="emoji-item">{{ e }}</span></div>
        <button class="btn btn-o btn-sm interactive-btn" @click="$refs.fileInput.click()"><i class="fas fa-paperclip"></i></button>
        <input type="file" ref="fileInput" @change="handleFiles" hidden multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.zip">
        <button class="btn btn-o btn-sm voice-btn interactive-btn" :class="{ recording }" @mousedown="startRecord" @mouseup="stopRecord" @mouseleave="stopRecord" @touchstart.prevent="startRecord" @touchend.prevent="stopRecord">🎤</button>
        <span v-if="recording" class="recording-time">{{ recordingTime }}с</span>
        <textarea v-model="msgText" @keydown.enter.exact.prevent="sendMsg" placeholder="Сообщение..." rows="1" :disabled="recording"></textarea>
        <button class="btn btn-p btn-sm send-btn interactive-btn" @click="sendMsg"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>

    <div class="chat-main empty-chat" v-else><div><i class="fas fa-comments" style="font-size:4rem;opacity:0.3"></i><p>Выберите чат</p></div></div>
    <div class="lightbox" v-if="lightbox" @click="lightbox = null"><img :src="lightbox" style="max-width:90%;max-height:90%;border-radius:16px"></div>
  </div>
  <div v-else class="container" style="text-align:center;padding:80px 20px">Войдите</div>
</template>

<script>
import axios from 'axios';
import { io } from 'socket.io-client';
import { useDebounce } from '../composables/useDebounce.js';
import { translateWord } from '../composables/useTranslator.js';

// Константы
const SUPABASE_STORAGE_URL = 'https://qmoxemhstzfxirpskext.supabase.co/storage/v1/object/public/uploads/';
const SOCKET_URL = 'https://english-club-v1.onrender.com';

export default {
  name: 'MessagesPage',
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      dialogs: [], messages: [], filteredMessages: [], activeChat: null,
      activeChatName: '', partnerAvatar: null, currentUserId: null, msgText: '',
      unreadCount: 0, socket: null, lightbox: null, searchQuery: '', searchResults: [],
      showEmoji: false, pendingFiles: [], recording: false, mediaRecorder: null,
      isPartnerOnline: false, chunks: [], showSidebar: true, showMsgSearch: false,
      msgSearchQuery: '', showTranslate: false, selectedWord: '', translatedText: '',
      translating: false, recordingTime: 0, recordingTimer: null, soundEnabled: false,
      emojis: ['😀','😂','🤣','😍','🥰','😘','😎','🤩','😇','🤔','😴','🥳','❤️','🔥','🎉','⭐','✅','💯','🙏','💪','🚀','🌈']
    };
  },
  computed: {
    isDark() { return document.body.classList.contains('dark'); }
  },
  async mounted() {
    if (!this.user?.id) return;
    this.currentUserId = this.user.id;
    console.log('👤 [CHAT] Пользователь:', this.user.username, 'ID:', this.currentUserId);
    
    await this.loadDialogs();
    console.log('📋 [CHAT] Диалоги:', this.dialogs.length);
    
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    
    this.initSocket();
    this.searchUsers = useDebounce(this.searchUsers, 300);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.translate-popup') && !e.target.closest('.msg-actions')) this.showTranslate = false;
    });
  },
  beforeUnmount() {
    this.socket?.disconnect();
    this.socket = null;
  },
  methods: {
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    initSocket() {
      console.log('🔌 [CHAT] Подключаю сокет...');
      this.socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      
      this.socket.on('connect', () => {
        console.log('🟢 [SOCKET] Подключён, ID:', this.socket.id);
        this.socket.emit('join', { uid: this.currentUserId, uname: this.user.username, role: this.user.role });
      });
      this.socket.on('disconnect', (reason) => console.log('🔴 [SOCKET] Отключён:', reason));
      this.socket.on('connect_error', (e) => console.log('❌ [SOCKET] Ошибка:', e.message));
      
      this.socket.on('unread', ({ count }) => {
        console.log('📬 [SOCKET] Непрочитанных:', count);
        this.unreadCount = count;
      });
      
      this.socket.on('dm', (msg) => this.handleIncomingMessage(msg));
    },

    // ==================== СООБЩЕНИЯ ====================
    handleIncomingMessage(msg) {
      console.log('💬 [SOCKET] Входящее от:', msg.from, 'текст:', (msg.msg || msg.message || '').substring(0, 30));
      
      if (typeof msg.files === 'string') {
        try { msg.files = JSON.parse(msg.files); } catch(e) { msg.files = null; }
      }
      
      if (msg.from === this.currentUserId) { this.loadDialogs(); return; }
      
      if (this.activeChat === msg.from) {
        if (!this.messages.find(m => m.id === msg.id)) {
          this.messages.push(msg);
          this.filterMessages();
          this.$nextTick(() => this.scrollToBottom());
        }
      }
      
      if (document.hidden && msg.from !== this.currentUserId) this.sendBrowserNotification(msg);
      this.loadDialogs();
    },

    async sendMsg() {
      const text = this.msgText.trim();
      console.log('📤 [SEND] Текст:', text.substring(0, 30), '| Файлов:', this.pendingFiles.length, '| Сокет:', this.socket?.connected);
      
      if ((!text && !this.pendingFiles.length) || !this.activeChat || !this.socket?.connected) {
        console.log('⛔ [SEND] Блокировано');
        return;
      }
      
      const replyTo = text.startsWith('↩') ? text.split('\n')[0] : null;
      const cleanText = replyTo ? text.split('\n').slice(1).join('\n').trim() : text;
      
      // Отправка текста
      if (cleanText) {
        console.log('📝 [SEND] Текст:', cleanText.substring(0, 30));
        const m = { id: Date.now(), from: this.currentUserId, sender_id: this.currentUserId, message: cleanText, ts: new Date().toISOString() };
        this.messages.push(m);
        this.filterMessages();
        this.socket.emit('dm', { to: this.activeChat, msg: cleanText, replyTo });
      }
      
      // Загрузка файлов
      await this.uploadPendingFiles();
      
      this.playSendSound();
      this.msgText = '';
      this.pendingFiles = [];
      this.$nextTick(() => this.scrollToBottom());
    },

    async uploadPendingFiles() {
      for (const file of this.pendingFiles) {
        console.log('📎 [SEND] Файл:', file.name, file.type, file.size);
        const form = new FormData();
        form.append('img', file);
        try {
          const r = await axios.post('/api/nimg', form);
          console.log('✅ [SEND] /api/nimg:', r.data?.url ? 'OK' : 'No URL');
          if (r.data?.url) {
            const type = this.getFileType(file);
            const msgText = type === 'audio' ? '🎤 Голосовое' : `${this.getFileIcon(type)} ${file.name}`;
            const fm = {
              id: Date.now(), from: this.currentUserId, sender_id: this.currentUserId,
              message: msgText, files: [{ url: r.data.url, type, name: file.name }], ts: new Date().toISOString()
            };
            this.messages.push(fm);
            this.filterMessages();
            this.socket.emit('dm', { to: this.activeChat, msg: msgText, files: [{ url: r.data.url, type, name: file.name }] });
          }
        } catch(e) {
          console.log('❌ [SEND] Ошибка:', e.message, e.response?.status);
        }
      }
    },

    // ==================== ФАЙЛЫ ====================
    handleFiles(e) {
      if (e.target.files?.length) {
        for (const file of e.target.files) {
          if (file.type.startsWith('image/')) file.preview = URL.createObjectURL(file);
          this.pendingFiles.push(file);
        }
      }
      e.target.value = '';
    },

    getFileType(file) {
      if (!file) return 'file';
      if (file.type) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type.startsWith('video/')) return 'video';
      }
      const ext = (file.name || '').split('.').pop()?.toLowerCase();
      if (['mp3','wav','ogg','aac','m4a','flac','webm'].includes(ext)) return 'audio';
      if (['mp4','webm','mov','avi'].includes(ext)) return 'video';
      if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
      return 'file';
    },

    getFileIcon(type) {
      return { image: '🖼️', audio: '🎤', video: '🎬' }[type] || '📎';
    },

    proxifyUrl(url) {
      if (!url) return '';
      return url.replace(SUPABASE_STORAGE_URL, '/api/file/');
    },

    parseFiles(m) {
      if (!m.files) return m;
      if (typeof m.files === 'string') {
        try { m.files = JSON.parse(m.files); } catch(e) { m.files = null; }
      }
      return m;
    },

    // ==================== АУДИО ====================
    toggleAudio(e, url) {
      console.log('🔊 [AUDIO]', url?.substring(0, 60));
      const btn = e.target;
      const existing = document.querySelector('audio.voice-audio');
      if (existing) { existing.pause(); existing.remove(); }
      
      if (btn.dataset.playing === 'true') {
        btn.dataset.playing = 'false';
        btn.textContent = '▶️';
        return;
      }
      
      const audio = new Audio(url);
      audio.classList.add('voice-audio');
      audio.preload = 'auto';
      
      btn.dataset.playing = 'true';
      btn.textContent = '⏳';
      
      audio.oncanplaythrough = () => {
        audio.play().then(() => {
          console.log('✅ [AUDIO] Играет');
          btn.textContent = '⏸️';
        }).catch(e => {
          console.log('❌ [AUDIO] Ошибка:', e.message);
          btn.dataset.playing = 'false';
          btn.textContent = '▶️';
        });
      };
      
      audio.onended = () => { btn.dataset.playing = 'false'; btn.textContent = '▶️'; audio.remove(); };
      audio.onerror = () => { btn.dataset.playing = 'false'; btn.textContent = '▶️'; audio.remove(); };
      
      document.body.appendChild(audio);
      audio.load();
    },

    async startRecord() {
      console.log('🎤 [RECORD] Старт...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recording = true;
        this.recordingTime = 0;
        this.recordingTimer = setInterval(() => this.recordingTime++, 1000);
        this.mediaRecorder = new MediaRecorder(stream);
        this.chunks = [];
        
        this.mediaRecorder.ondataavailable = e => this.chunks.push(e.data);
        this.mediaRecorder.onstop = async () => {
          clearInterval(this.recordingTimer);
          const blob = new Blob(this.chunks, { type: 'audio/webm' });
          console.log('🎤 [RECORD] Blob:', blob.size);
          
          const form = new FormData();
          form.append('img', blob, 'voice.webm');
          try {
            const r = await axios.post('/api/nimg', form);
            console.log('✅ [RECORD] /api/nimg:', r.data?.url ? 'OK' : 'No URL');
            if (r.data?.url) {
              const vm = {
                id: Date.now(), from: this.currentUserId, sender_id: this.currentUserId,
                message: '🎤 Голосовое', files: [{ url: r.data.url, type: 'audio', name: 'Голосовое' }], ts: new Date().toISOString()
              };
              this.messages.push(vm);
              this.filterMessages();
              this.socket.emit('dm', { to: this.activeChat, msg: '🎤 Голосовое', files: [{ url: r.data.url, type: 'audio', name: 'Голосовое' }] });
            }
          } catch(e) {
            console.log('❌ [RECORD] Ошибка:', e.message);
          }
          stream.getTracks().forEach(t => t.stop());
          this.recording = false;
          this.recordingTime = 0;
          this.$nextTick(() => this.scrollToBottom());
        };
        this.mediaRecorder.start();
      } catch(e) {
        console.log('❌ [RECORD] Микрофон:', e.message);
        this.recording = false;
        this.addToast('Нет доступа к микрофону 🎤', 'error');
      }
    },

    stopRecord() {
      if (this.mediaRecorder?.state === 'recording') this.mediaRecorder.stop();
    },

    // ==================== ДИАЛОГИ ====================
    async loadDialogs() {
      if (!this.currentUserId) return;
      try {
        const r = await axios.get('/api/dialogs');
        this.dialogs = Array.isArray(r.data) ? r.data : [];
      } catch(e) {}
    },

    async startChat(u) {
      Object.assign(this, {
        activeChat: u.id, activeChatName: u.username, partnerAvatar: u.avatar_url,
        searchQuery: '', searchResults: [], showSidebar: false
      });
      await this.loadMessages(u.id);
      this.loadDialogs();
    },

    async openChat(d) {
      const pid = d.partner_id || d.id;
      Object.assign(this, {
        activeChat: pid, activeChatName: d.username, partnerAvatar: d.avatar_url, showSidebar: false
      });
      await this.loadMessages(pid);
    },

    async loadMessages(userId) {
      try {
        const r = await axios.get(`/api/messages/${userId}`);
        this.messages = (r.data || []).map(m => this.parseFiles(m));
        this.filterMessages();
        this.$nextTick(() => this.scrollToBottom());
      } catch(e) {}
    },

    // ==================== УТИЛИТЫ ====================
    searchUsers() {},
    filterMessages() {
      const q = this.msgSearchQuery.toLowerCase();
      this.filteredMessages = q ? this.messages.filter(m => m.message?.toLowerCase().includes(q)) : this.messages;
    },
    formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ''; },
    linkify(text) { return text ? text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#818cf8;text-decoration:underline">$1</a>') : ''; },
    scrollToBottom() { const el = this.$refs.msgContainer; if (el) el.scrollTop = el.scrollHeight; },
    playSendSound() {
      if (!this.soundEnabled) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 1200; osc.type = 'sine';
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
      } catch(e) {}
    },

    replyTo(msg) {
      this.msgText = `↩ ${msg.fn || ''}: ${(msg.msg || msg.message || '').substring(0, 50)}\n`;
      this.$nextTick(() => this.$el.querySelector('textarea')?.focus());
    },

    async deleteMsg(id) {
      if (!confirm('Удалить?')) return;
      try {
        await axios.delete(`/api/msg/${id}`);
        this.messages = this.messages.filter(m => m.id !== id);
        this.filterMessages();
        this.addToast('Удалено 🗑', 'success');
      } catch(e) {}
    },

    sendBrowserNotification(msg) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      try {
        new Notification(`💬 ${msg.fn || 'Новое сообщение'}`, {
          body: (msg.msg || msg.message || '📎 Файл').substring(0, 100),
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🗣️</text></svg>',
          tag: 'engclub'
        });
      } catch(e) {}
    },

    async translateMsg(m) {
      if (!m.message) return;
      const word = m.message.split(' ').find(w => /^[a-zA-Z]+$/.test(w));
      if (!word) { this.addToast('Нет английских слов', 'info'); return; }
      this.selectedWord = word;
      this.showTranslate = true;
      this.translating = true;
      try {
        this.translatedText = await translateWord(word);
      } catch(e) {
        this.translatedText = 'Ошибка';
      } finally {
        this.translating = false;
      }
    },

    async copyTranslation() {
      try {
        await navigator.clipboard.writeText(this.translatedText);
        this.addToast('Перевод скопирован 📋', 'success');
      } catch(e) {}
    }
  }
};
</script>

<style scoped>
/* Только изменённые/добавленные стили, остальное как было */
.voice-msg { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(99,102,241,0.08); border-radius: 12px; }
.voice-play-btn { background: var(--p); color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; }
.voice-wave { display: flex; gap: 2px; align-items: flex-end; height: 24px; }
.voice-wave-bar { width: 3px; background: var(--p); border-radius: 2px; animation: wave 0.8s ease-in-out infinite; }
.voice-wave-bar:nth-child(odd) { animation-delay: 0.2s; }
.voice-label { font-size: 0.75rem; color: var(--t2); }
@keyframes wave { 0%, 100% { height: 4px; } 50% { height: 16px; } }
</style>
