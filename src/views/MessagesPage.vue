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
            <AppAvatar :src="u.avatar_url" :name="u.username" :size="48" class="dialog-avatar" />
            <div><strong>{{ u.username }}</strong><small>{{ u.level }}</small></div>
          </div>
        </div>
      </div>
      <div class="dialog-list">
        <div v-for="(d, idx) in dialogs" :key="d.partner_id || d.id" class="dialog-item fade-in-up" :class="{ active: activeChat === (d.partner_id || d.id) }" :style="{ animationDelay: `${idx * 0.03}s` }" @click="openChat(d)">
          <AppAvatar :src="d.avatar_url" :name="d.username || 'U'" :size="48" class="dialog-avatar" />
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
          <AppAvatar :src="partnerAvatar" :name="activeChatName" :size="40" class="chat-avatar tilt-avatar" />
          <div>
            <strong>{{ activeChatName }}</strong>
            <small :class="{ online: isPartnerOnline }">{{ partnerStatusText }}</small>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-o btn-sm interactive-btn" @click="startVideoCall" title="Видеозвонок">📹</button>
          <button class="btn btn-o btn-sm interactive-btn" @click="soundEnabled = !soundEnabled" :title="soundEnabled ? 'Звук вкл' : 'Звук выкл'">{{ soundEnabled ? '🔊' : '🔇' }}</button>
          <button class="btn btn-o btn-sm interactive-btn" @click="showMsgSearch = !showMsgSearch"><i class="fas fa-search"></i></button>
        </div>
      </div>

      <div v-if="jitsiActive" class="jitsi-container">
        <button class="jitsi-close" @click="closeVideoCall">✕ Завершить звонок</button>
        <iframe :src="jitsiUrl" allow="camera; microphone; fullscreen; display-capture" class="jitsi-frame"></iframe>
      </div>

      <div class="msg-search" v-if="showMsgSearch">
        <input v-model="msgSearchQuery" placeholder="Поиск в чате..." class="search-input" @input="filterMessages">
        <button class="btn btn-o btn-sm interactive-btn" @click="showMsgSearch = false; msgSearchQuery = ''">✕</button>
      </div>

      <div class="chat-messages" ref="msgContainer">
        <template v-for="(group, gIdx) in groupedMessages" :key="'g-'+gIdx">
          <div class="date-divider"><span>{{ group.label }}</span></div>
          <transition-group name="msg-pop">
            <div v-for="(m, idx) in group.messages" :key="m.id || m.ts || idx" class="msg" :class="{ mine: m.sender_id === currentUserId || m.from === currentUserId }">
              <div v-if="m.reply_to" class="reply-preview">↩ {{ m.reply_to?.substring(0, 60) }}</div>
              <div v-if="m.message" class="msg-text" v-html="linkify(m.message)"></div>
              <div v-if="m.files?.length" class="msg-files">
                <div v-for="(f, i) in m.files" :key="i" class="msg-file">
                  <img v-if="f.type === 'image'" :src="proxifyUrl(f.url)" class="msg-img" @click="lightbox = proxifyUrl(f.url)" @error="$event.target.style.display='none'">
                  <div v-else-if="f.type === 'audio'" class="voice-msg">
                    <button @click="toggleAudio($event, proxifyUrl(f.url))" class="voice-play-btn interactive-btn">▶️</button>
                    <div class="voice-wave"><div class="voice-wave-bar" v-for="n in 12" :key="n" :style="{ height: Math.random() * 16 + 4 + 'px' }"></div></div>
                    <span class="voice-label">{{ f.name || '🎤 Голосовое' }}</span>
                  </div>
                  <video v-else-if="f.type === 'video'" :src="proxifyUrl(f.url)" controls class="msg-video"></video>
                  <a v-else :href="proxifyUrl(f.url)" target="_blank" class="file-link" :download="f.name || 'file'">📎 {{ f.name || 'Файл' }}</a>
                </div>
              </div>
              <div v-if="m.reactions && Object.keys(m.reactions).length" class="msg-reactions">
                <span v-for="(count, emoji) in m.reactions" :key="emoji" class="reaction-badge" @click="toggleReaction(m, emoji)">{{ emoji }} {{ count }}</span>
              </div>
              <small class="msg-time">{{ formatTime(m.ts) }}</small>
              <div class="msg-actions">
                <button @click="replyTo(m)" title="Ответить" class="interactive-btn">↩</button>
                <button @click="openReactionPicker(m)" title="Реакция" class="interactive-btn">😊</button>
                <button @click="translateMsg(m)" title="Перевести" class="interactive-btn">🌐</button>
                <button v-if="m.sender_id === currentUserId || m.from === currentUserId" @click="deleteMsg(m.id)" title="Удалить" class="interactive-btn">🗑</button>
              </div>
              <div v-if="reactionPickerId === (m.id || m.ts)" class="reaction-picker">
                <span v-for="e in reactionEmojis" :key="e" @click="addReaction(m, e)" class="reaction-emoji">{{ e }}</span>
              </div>
            </div>
          </transition-group>
        </template>
      </div>

      <div v-if="partnerTyping" class="typing-indicator">
        <div class="typing-dots"><span></span><span></span><span></span></div>
        <span class="typing-text">{{ activeChatName }} печатает...</span>
      </div>

      <div v-if="showTranslate" class="translate-popup">
        <div class="translate-word">{{ selectedWord }}</div>
        <div class="translate-result" v-if="!translating">{{ translatedText }}</div>
        <div class="translate-loading" v-else>⏳ Перевод...</div>
        <div class="translate-actions">
          <button @click="copyTranslation" class="btn btn-o btn-sm interactive-btn">📋</button>
          <button @click="showTranslate = false" class="btn btn-o btn-sm interactive-btn">✕</button>
        </div>
      </div>

      <div class="chat-input" v-if="!jitsiActive">
        <button class="btn btn-o btn-sm emoji-btn interactive-btn" @click="showEmoji = !showEmoji">😊</button>
        <div v-if="showEmoji" class="emoji-picker"><span v-for="e in emojis" :key="e" @click="msgText += e" class="emoji-item">{{ e }}</span></div>
        <button class="btn btn-o btn-sm interactive-btn" @click="$refs.fileInput.click()"><i class="fas fa-paperclip"></i></button>
        <input type="file" ref="fileInput" @change="handleFiles" hidden multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.zip">
        <button class="btn btn-o btn-sm voice-btn interactive-btn" :class="{ recording }" @mousedown="startRecord" @mouseup="stopRecord" @mouseleave="stopRecord" @touchstart.prevent="startRecord" @touchend.prevent="stopRecord">🎤</button>
        <span v-if="recording" class="recording-time">{{ recordingTime }}с</span>
        <div v-if="pendingFiles.length" class="file-preview-bar">
          <div v-for="(f, i) in pendingFiles" :key="i" class="file-preview-item">
            <img v-if="f.type?.startsWith('image/')" :src="f.preview" class="file-preview-img">
            <span v-else>{{ fileIcon(f) }} {{ f.name }}</span>
            <button @click="pendingFiles.splice(i, 1)" class="file-preview-remove">✕</button>
          </div>
        </div>
        <textarea v-model="msgText" @keydown.enter.exact.prevent="sendMsg" @input="emitTyping" placeholder="Сообщение..." rows="1" :disabled="recording"></textarea>
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
import { useFiles } from '../composables/useFiles.js';
import { useSocket } from '../composables/useSocket.js';
import { useDebounce } from '../composables/useDebounce.js';
import { translateWord } from '../composables/useTranslator.js';
import { sendNotification, playNotificationSound } from '../composables/useNotifications.js';
import { useXP } from '../composables/useXP';
import AppAvatar from '../components/AppAvatar.vue';

const { uploadFile, getFileType, getFileIcon, proxifyUrl } = useFiles();
const { addXP } = useXP();

export default {
  name: 'MessagesPage',
  components: { AppAvatar },
  props: ['user'],
  inject: ['addToast', 'showXP'],
  data() {
    return {
      dialogs: [], messages: [], filteredMessages: [], activeChat: null,
      activeChatName: '', partnerAvatar: null, currentUserId: null, msgText: '',
      unreadCount: 0, socket: null, lightbox: null, searchQuery: '', searchResults: [],
      showEmoji: false, pendingFiles: [], recording: false, mediaRecorder: null,
      isPartnerOnline: false, chunks: [], showSidebar: true, showMsgSearch: false,
      msgSearchQuery: '', showTranslate: false, selectedWord: '', translatedText: '',
      translating: false, recordingTime: 0, recordingTimer: null, soundEnabled: false,
      emojis: ['😀','😂','🤣','😍','🥰','😘','😎','🤩','😇','🤔','😴','🥳','❤️','🔥','🎉','⭐','✅','💯','🙏','💪','🚀','🌈'],
      reactionEmojis: ['👍','❤️','😂','😮','😢','😡','🔥','👏','🎉','💯'],
      reactionPickerId: null, jitsiActive: false, jitsiUrl: '',
      partnerTyping: false, typingTimer: null, typingEmitTimer: null,
      xpMessageCount: 0
    };
  },
  computed: {
    isDark() { return document.body.classList.contains('dark'); },
    partnerStatusText() {
      if (this.partnerTyping) return '✍️ Печатает...';
      return this.isPartnerOnline ? '🟢 Онлайн' : '⚫ Оффлайн';
    },
    groupedMessages() {
      const groups = [];
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      this.filteredMessages.forEach(m => {
        const date = new Date(m.ts).toDateString();
        let label;
        if (date === today) label = 'Сегодня';
        else if (date === yesterday) label = 'Вчера';
        else label = new Date(m.ts).toLocaleDateString('ru', { day: 'numeric', month: 'long' });
        let group = groups.find(g => g.label === label);
        if (!group) { group = { label, messages: [] }; groups.push(group); }
        group.messages.push(m);
      });
      return groups;
    }
  },
  async mounted() {
    if (!this.user?.id) return;
    this.currentUserId = this.user.id;
    await this.loadDialogs();
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    this.socket = useSocket(this.currentUserId, this.user.username, this.user.role);
    this.socket.on('unread', ({ count }) => { this.unreadCount = count; });
    this.socket.on('dm', (msg) => this.handleIncomingMessage(msg));
    this.socket.on('typing', ({ from }) => {
      if (from === this.activeChat) {
        this.partnerTyping = true;
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => { this.partnerTyping = false; }, 2000);
      }
    });
    this.searchUsers = useDebounce(this.searchUsers, 300);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.translate-popup') && !e.target.closest('.msg-actions')) this.showTranslate = false;
      if (!e.target.closest('.reaction-picker') && !e.target.closest('.msg-actions')) this.reactionPickerId = null;
    });
  },
  beforeUnmount() {
    this.socket?.disconnect();
    clearTimeout(this.typingTimer);
    clearTimeout(this.typingEmitTimer);
  },
  methods: {
    proxifyUrl, fileIcon: getFileIcon,
    openReactionPicker(m) { this.reactionPickerId = this.reactionPickerId === (m.id || m.ts) ? null : (m.id || m.ts); },
    addReaction(m, emoji) { if (!m.reactions) m.reactions = {}; m.reactions[emoji] = (m.reactions[emoji] || 0) + 1; this.reactionPickerId = null; this.socket?.emit('reaction', { messageId: m.id || m.ts, emoji, to: this.activeChat }); },
    toggleReaction(m, emoji) { this.addReaction(m, emoji); },
    emitTyping() { if (!this.socket?.connected || !this.activeChat) return; clearTimeout(this.typingEmitTimer); this.socket.emit('typing', { to: this.activeChat }); },
    startVideoCall() { const roomName = `english-club-${this.currentUserId}-${this.activeChat}`; this.jitsiUrl = `https://meet.jit.si/${roomName}`; this.jitsiActive = true; this.addToast('Видеозвонок начат! 📹', 'info'); },
    closeVideoCall() { this.jitsiActive = false; this.jitsiUrl = ''; },
    handleIncomingMessage(msg) {
      if (typeof msg.files === 'string') { try { msg.files = JSON.parse(msg.files); } catch(e) { msg.files = null; } }
      if (msg.from === this.currentUserId) { this.loadDialogs(); return; }
      if (this.activeChat === msg.from) {
        if (!this.messages.find(m => m.id === msg.id)) { this.messages.push(msg); this.filterMessages(); this.$nextTick(() => this.scrollToBottom()); }
      }
      if (document.hidden && msg.from !== this.currentUserId) { sendNotification(`💬 ${msg.fn || 'Новое сообщение'}`, msg.msg || msg.message || '📎 Файл'); playNotificationSound(); }
      this.loadDialogs();
    },

    // 🔥 ОТПРАВКА СООБЩЕНИЯ С XP
    async sendMsg() {
      const text = this.msgText.trim();
      if ((!text && !this.pendingFiles.length) || !this.activeChat || !this.socket?.connected) return;
      const replyTo = text.startsWith('↩') ? text.split('\n')[0] : null;
      const cleanText = replyTo ? text.split('\n').slice(1).join('\n').trim() : text;
      if (cleanText) {
        this.messages.push({ id: Date.now(), from: this.currentUserId, sender_id: this.currentUserId, message: cleanText, ts: new Date().toISOString(), reactions: {} });
        this.filterMessages();
        this.socket.emit('dm', { to: this.activeChat, msg: cleanText, replyTo });
      }
      for (const file of this.pendingFiles) {
        const url = await uploadFile(file);
        if (url) {
          const type = getFileType(file);
          const msgText = type === 'audio' ? `🎵 ${file.name}` : `${getFileIcon(type)} ${file.name}`;
          this.messages.push({ id: Date.now(), from: this.currentUserId, sender_id: this.currentUserId, message: msgText, files: [{ url, type, name: file.name }], ts: new Date().toISOString(), reactions: {} });
          this.filterMessages();
          this.socket.emit('dm', { to: this.activeChat, msg: msgText, files: [{ url, type, name: file.name }] });
        }
      }
      this.playSendSound(); this.msgText = ''; this.pendingFiles = []; this.$nextTick(() => this.scrollToBottom());
      this.partnerTyping = false;

      // 🔥 НАЧИСЛЯЕМ XP ЗА СООБЩЕНИЕ
      this.xpMessageCount++;
      const xpResult = await addXP('message_sent');
      if (xpResult) {
        this.showXP?.(xpResult.xp_added, window.innerWidth / 2, window.innerHeight / 2);
        if (xpResult.leveled_up) {
          this.addToast(`🎉 Уровень повышен до ${xpResult.level}!`, 'success');
        }
      }
    },

    handleFiles(e) {
      if (e.target.files?.length) { for (const file of e.target.files) { if (file.type.startsWith('image/')) file.preview = URL.createObjectURL(file); this.pendingFiles.push(file); } }
      e.target.value = '';
    },
    toggleAudio(e, url) {
      const btn = e.target; const existing = document.querySelector('audio.voice-audio'); if (existing) { existing.pause(); existing.remove(); }
      if (btn.dataset.playing === 'true') { btn.dataset.playing = 'false'; btn.textContent = '▶️'; return; }
      const audio = new Audio(url); audio.classList.add('voice-audio'); audio.preload = 'auto';
      btn.dataset.playing = 'true'; btn.textContent = '⏳';
      audio.oncanplaythrough = () => { audio.play().then(() => { btn.textContent = '⏸️'; }).catch(() => { btn.dataset.playing = 'false'; btn.textContent = '▶️'; }); };
      audio.onended = () => { btn.dataset.playing = 'false'; btn.textContent = '▶️'; audio.remove(); };
      audio.onerror = () => { btn.dataset.playing = 'false'; btn.textContent = '▶️'; audio.remove(); };
      document.body.appendChild(audio); audio.load();
    },
    async startRecord() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); this.recording = true; this.recordingTime = 0;
        this.recordingTimer = setInterval(() => this.recordingTime++, 1000); this.mediaRecorder = new MediaRecorder(stream); this.chunks = [];
        this.mediaRecorder.ondataavailable = e => this.chunks.push(e.data);
        this.mediaRecorder.onstop = async () => { clearInterval(this.recordingTimer); const blob = new Blob(this.chunks, { type: 'audio/webm' }); const form = new FormData(); form.append('img', blob, 'voice.webm'); try { const r = await axios.post('/api/nimg', form); if (r.data?.url) { this.messages.push({ id: Date.now(), from: this.currentUserId, sender_id: this.currentUserId, message: '🎤 Голосовое', files: [{ url: r.data.url, type: 'audio', name: 'Голосовое' }], ts: new Date().toISOString(), reactions: {} }); this.filterMessages(); this.socket.emit('dm', { to: this.activeChat, msg: '🎤 Голосовое', files: [{ url: r.data.url, type: 'audio', name: 'Голосовое' }] }); } } catch(e) {} stream.getTracks().forEach(t => t.stop()); this.recording = false; this.recordingTime = 0; this.$nextTick(() => this.scrollToBottom()); };
        this.mediaRecorder.start();
      } catch(e) { this.recording = false; this.addToast('Нет доступа к микрофону 🎤', 'error'); }
    },
    stopRecord() { if (this.mediaRecorder?.state === 'recording') this.mediaRecorder.stop(); },
    async loadDialogs() { if (!this.currentUserId) return; try { const r = await axios.get('/api/dialogs'); this.dialogs = Array.isArray(r.data) ? r.data : []; } catch(e) {} },
    async startChat(u) { Object.assign(this, { activeChat: u.id, activeChatName: u.username, partnerAvatar: u.avatar_url, searchQuery: '', searchResults: [], showSidebar: false, partnerTyping: false }); await this.loadMessages(u.id); this.loadDialogs(); },
    async openChat(d) { const pid = d.partner_id || d.id; Object.assign(this, { activeChat: pid, activeChatName: d.username, partnerAvatar: d.avatar_url, showSidebar: false, partnerTyping: false }); await this.loadMessages(pid); },
    async loadMessages(userId) { try { const r = await axios.get(`/api/messages/${userId}`); this.messages = (r.data || []).map(m => { if (m.files && typeof m.files === 'string') try { m.files = JSON.parse(m.files); } catch(e) { m.files = null; } if (!m.reactions) m.reactions = {}; return m; }); this.filterMessages(); this.$nextTick(() => this.scrollToBottom()); } catch(e) {} },
    async searchUsers() { if (this.searchQuery.length < 2) { this.searchResults = []; return; } try { const r = await axios.get(`/api/users?q=${this.searchQuery}`); this.searchResults = (r.data || []).filter(u => u.id !== this.currentUserId); } catch(e) {} },
    filterMessages() { const q = this.msgSearchQuery.toLowerCase(); this.filteredMessages = q ? this.messages.filter(m => m.message?.toLowerCase().includes(q)) : this.messages; },
    formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ''; },
    linkify(text) { return text ? text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#818cf8;text-decoration:underline">$1</a>') : ''; },
    scrollToBottom() { const el = this.$refs.msgContainer; if (el) el.scrollTop = el.scrollHeight; },
    playSendSound() { if (!this.soundEnabled) return; try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 1200; o.type = 'sine'; g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1); } catch(e) {} },
    replyTo(msg) { this.msgText = `↩ ${msg.fn || ''}: ${(msg.msg || msg.message || '').substring(0, 50)}\n`; this.$nextTick(() => this.$el.querySelector('textarea')?.focus()); },
    async deleteMsg(id) { if (!confirm('Удалить?')) return; try { await axios.delete(`/api/msg/${id}`); this.messages = this.messages.filter(m => m.id !== id); this.filterMessages(); this.addToast('Удалено 🗑', 'success'); } catch(e) {} },
    async translateMsg(m) { if (!m.message) return; const word = m.message.split(' ').find(w => /^[a-zA-Z]+$/.test(w)); if (!word) { this.addToast('Нет английских слов', 'info'); return; } this.selectedWord = word; this.showTranslate = true; this.translating = true; try { this.translatedText = await translateWord(word); } catch(e) { this.translatedText = 'Ошибка'; } finally { this.translating = false; } },
    async copyTranslation() { try { await navigator.clipboard.writeText(this.translatedText); this.addToast('Перевод скопирован 📋', 'success'); } catch(e) {} }
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
.search-input { width: 100%; padding: 11px 16px; border: 2px solid var(--b); border-radius: 14px; font-family: inherit; font-size: 0.85rem; background: var(--bg); color: var(--t); outline: none; }
.search-input:focus { border-color: var(--p); }
.search-results { position: absolute; top: 100%; left: 12px; right: 12px; background: var(--surface); border: 1px solid var(--b); border-radius: 14px; max-height: 220px; overflow-y: auto; z-index: 100; box-shadow: var(--shadow-lg); }
.search-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; }
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
.chat-header { padding: 16px 22px; background: var(--surface); border-bottom: 1px solid var(--b); display: flex; justify-content: space-between; align-items: center; }
.chat-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--b); }
.tilt-avatar:hover { transform: scale(1.1) rotate(-3deg); }
.chat-header small { font-size: 0.75rem; color: var(--t2); }
.chat-header small.online { color: #22c55e; }
.typing-indicator { display: flex; align-items: center; gap: 8px; padding: 8px 22px; background: var(--surface); border-top: 1px solid var(--b); }
.typing-dots { display: flex; gap: 3px; }
.typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--p); animation: typingBounce 1.4s infinite ease-in-out both; }
.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }
.typing-dots span:nth-child(3) { animation-delay: 0s; }
@keyframes typingBounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
.typing-text { font-size: 0.8rem; color: var(--t2); font-style: italic; }
.date-divider { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.date-divider::before,.date-divider::after { content: ''; flex: 1; height: 1px; background: var(--b); }
.date-divider span { font-size: 0.7rem; color: var(--t2); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.msg-reactions { display: flex; gap: 4px; margin-top: 4px; }
.reaction-badge { padding: 2px 8px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
.reaction-badge:hover { background: rgba(99,102,241,0.2); transform: scale(1.1); }
.reaction-picker { position: absolute; bottom: -40px; right: 0; display: flex; gap: 4px; padding: 6px 10px; background: var(--surface); border: 1px solid var(--b); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); z-index: 50; }
.reaction-emoji { cursor: pointer; font-size: 1.1rem; padding: 4px; border-radius: 6px; transition: all 0.2s; }
.reaction-emoji:hover { background: rgba(99,102,241,0.1); transform: scale(1.3); }
.jitsi-container { position: relative; width: 100%; height: 500px; margin-bottom: 8px; }
.jitsi-frame { width: 100%; height: 100%; border: none; border-radius: 16px; }
.jitsi-close { position: absolute; top: 8px; right: 8px; z-index: 10; padding: 8px 16px; background: #ef4444; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; }
.msg-search { display: flex; gap: 8px; padding: 10px 22px; background: var(--surface); border-bottom: 1px solid var(--b); }
.chat-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.msg { max-width: 72%; padding: 12px 18px; border-radius: 20px; background: var(--surface); align-self: flex-start; box-shadow: 0 2px 8px rgba(0,0,0,0.04); position: relative; }
.msg.mine { background: linear-gradient(135deg, var(--p), var(--p2)); color: #fff; align-self: flex-end; }
.msg:hover .msg-actions { display: flex; }
.msg-actions { display: none; position: absolute; top: -10px; right: 6px; gap: 3px; }
.msg.mine .msg-actions { right: auto; left: 6px; }
.msg-actions button { background: var(--surface); border: 1px solid var(--b); border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; }
.msg-actions button:hover { background: var(--p); color: #fff; border-color: var(--p); }
.reply-preview { border-left: 3px solid var(--p); padding: 4px 10px; margin-bottom: 6px; font-size: 0.8rem; opacity: 0.7; }
.msg-text { font-size: 0.9rem; line-height: 1.55; word-break: break-word; }
.msg-text a { color: #818cf8; text-decoration: underline; }
.msg.mine .msg-text a { color: #fff; }
.msg-files { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.msg-img { max-width: 300px; border-radius: 12px; cursor: pointer; }
.msg-video { max-width: 280px; border-radius: 12px; }
.voice-msg { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(99,102,241,0.08); border-radius: 12px; }
.voice-play-btn { background: var(--p); color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; }
.voice-wave { display: flex; gap: 2px; align-items: flex-end; height: 24px; }
.voice-wave-bar { width: 3px; background: var(--p); border-radius: 2px; animation: wave 0.8s ease-in-out infinite; }
.voice-wave-bar:nth-child(odd) { animation-delay: 0.2s; }
.voice-label { font-size: 0.75rem; color: var(--t2); }
.file-link { color: var(--p); text-decoration: none; font-size: 0.85rem; font-weight: 500; }
.msg.mine .file-link { color: #fff; }
.msg-time { font-size: 0.7rem; opacity: 0.65; display: block; margin-top: 8px; }
.chat-input { display: flex; gap: 10px; padding: 16px 22px; background: var(--surface); border-top: 1px solid var(--b); align-items: flex-end; flex-wrap: wrap; position: relative; }
.file-preview-bar { display: flex; gap: 6px; padding: 6px 0; width: 100%; flex-wrap: wrap; }
.file-preview-item { display: flex; align-items: center; gap: 4px; background: var(--bg); padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; }
.file-preview-img { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; }
.file-preview-remove { background: none; border: none; color: var(--t2); cursor: pointer; font-size: 0.65rem; padding: 2px 4px; }
.emoji-picker { position: absolute; bottom: 55px; left: 0; background: var(--surface); border: 1px solid var(--b); border-radius: 16px; padding: 12px; width: 300px; max-height: 220px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 5px; z-index: 200; box-shadow: var(--shadow-lg); }
.emoji-item { cursor: pointer; font-size: 1.4rem; padding: 5px; border-radius: 8px; transition: all 0.2s; }
.emoji-item:hover { background: rgba(99,102,241,0.08); transform: scale(1.2); }
.chat-input textarea { flex: 1; padding: 12px 16px; border: 2px solid var(--b); border-radius: 16px; font-family: inherit; font-size: 0.9rem; resize: none; outline: none; background: var(--bg); color: var(--t); min-width: 100px; }
.chat-input textarea:focus { border-color: var(--p); }
.send-btn { width: 44px; height: 44px; padding: 0 !important; justify-content: center; border-radius: 50% !important; }
.voice-btn { width: 44px; height: 44px; padding: 0 !important; justify-content: center; border-radius: 50% !important; font-size: 1.2rem; }
.voice-btn.recording { background: #ef4444; color: #fff; border-color: #ef4444; animation: pulse 0.8s infinite; }
.recording-time { color: #ef4444; font-weight: 700; font-size: 0.85rem; min-width: 35px; }
.translate-popup { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); background: var(--surface); border: 2px solid var(--p); border-radius: 16px; padding: 14px 18px; min-width: 200px; box-shadow: 0 12px 40px rgba(0,0,0,0.2); z-index: 9999; text-align: center; }
.translate-word { font-weight: 700; font-size: 0.9rem; color: var(--p); margin-bottom: 6px; }
.translate-result { font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; }
.translate-loading { color: var(--t2); font-size: 0.85rem; margin-bottom: 8px; }
.translate-actions { display: flex; gap: 8px; justify-content: center; }
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 3000; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, var(--p), var(--p2)); color: #fff; }
.btn-o { border: 2px solid var(--b); color: var(--t); background: transparent; }
.btn-o:hover { background: rgba(99,102,241,0.04); border-color: var(--p); }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.w-100 { width: 100%; }
.mobile-back { display: none; }
.interactive-btn { transition: all 0.2s; }
.interactive-btn:hover { transform: translateY(-1px); }
.msg-pop-enter-active { animation: msgIn 0.3s ease; }
@keyframes msgIn { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
.fade-in-up { animation: fadeInUp 0.4s ease both; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.08)} }
@keyframes wave { 0%,100%{height:4px} 50%{height:16px} }
@media (max-width: 768px) { .chat-sidebar { width: 100%; position: absolute; inset: 0; z-index: 10; } .chat-sidebar.mobile-hidden { display: none; } .chat-main { display: none; width: 100%; } .chat-main.mobile-show { display: flex; } .empty-chat { display: flex; } .mobile-back { display: block; padding: 14px 22px; background: var(--surface); border-bottom: 1px solid var(--b); font-weight: 600; cursor: pointer; border: none; width: 100%; text-align: left; color: var(--t); font-family: inherit; } .msg { max-width: 85%; } .emoji-picker { width: 260px; } .jitsi-container { height: 350px; } }
</style>
