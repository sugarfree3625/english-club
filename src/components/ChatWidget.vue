<template>
  <div class="chat-wrapper">
    <!-- Хедер -->
    <div class="chat-header">
      <div class="chat-header-left">
        <div class="avatar-wrapper" :class="{ online: teacherOnline }">
          <div class="avatar-glow"></div>
          <img :src="teacherAvatar" class="avatar-img floating" alt="">
        </div>
        <div>
          <h3 class="teacher-name">{{ teacherName }}</h3>
          <span class="teacher-status">{{ teacherOnline ? '🟢 Онлайн' : '⚫ Оффлайн' }}</span>
        </div>
      </div>
      <button class="btn-icon" @click="$emit('close')"><i class="fas fa-times"></i></button>
    </div>

    <!-- Сообщения -->
    <div class="chat-messages" ref="msgContainer">
      <transition-group name="msg-materialize">
        <div v-for="m in filteredMessages" :key="m.id || m.ts" class="message-row" :class="{ mine: m.mine }">
          <div class="message-bubble">
            <img :src="m.mine ? studentAvatar : teacherAvatar" class="msg-avatar floating" alt="">
            <div class="bubble-content">
              <div v-if="m.reply_to" class="reply-preview">↩ {{ m.reply_to?.substring(0, 60) }}</div>
              <span v-if="m.text" class="msg-text" v-html="linkify(m.text)"></span>
              <div v-if="m.files?.length" class="msg-files">
                <div v-for="(f, i) in m.files" :key="i">
                  <img v-if="f.type === 'image'" :src="f.url" class="msg-img" @click="$emit('lightbox', f.url)">
                  <div v-else-if="f.type === 'audio'" class="voice-msg">
                    <button @click="toggleAudio($event, f.url)" class="voice-play-btn">▶️</button>
                    <div class="voice-wave"><div class="voice-wave-bar" v-for="n in 12" :key="n" :style="{ height: Math.random() * 16 + 4 + 'px' }"></div></div>
                    <span class="voice-label">🎤 Голосовое</span>
                  </div>
                  <video v-else-if="f.type === 'video'" :src="f.url" controls class="msg-video"></video>
                  <a v-else :href="f.url" target="_blank" class="file-link" :download="f.name || 'file'">📎 {{ f.name || 'Файл' }}</a>
                </div>
              </div>
              <span class="msg-time">{{ m.time }}</span>
            </div>
          </div>
          <div class="msg-actions">
            <button @click="replyTo(m)" title="Ответить">↩</button>
            <button @click="translateMsg(m)" title="Перевести">🌐</button>
            <button v-if="m.mine" @click="deleteMsg(m.id)" title="Удалить">🗑</button>
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
        <button @click="copyTranslation" class="btn-icon">📋</button>
        <button @click="showTranslate = false" class="btn-icon">✕</button>
      </div>
    </div>

    <!-- Превью файлов -->
    <div v-if="pendingFiles.length" class="pending-files">
      <div v-for="(f, i) in pendingFiles" :key="i" class="pending-file">
        <span>{{ f.name }}</span>
        <button @click="pendingFiles.splice(i, 1)" class="btn-icon">✕</button>
      </div>
    </div>

    <!-- Отправка -->
    <div class="chat-input">
      <button class="btn-icon emoji-btn" @click="showEmoji = !showEmoji">😊</button>
      <transition name="emoji-fade">
        <div v-if="showEmoji" class="emoji-picker">
          <span v-for="e in emojis" :key="e" @click="msgText += e">{{ e }}</span>
        </div>
      </transition>
      <button class="btn-icon" @click="$refs.fileInput.click()"><i class="fas fa-paperclip"></i></button>
      <input type="file" ref="fileInput" @change="handleFiles" hidden multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.zip">
      <button class="btn-icon voice-btn" :class="{ recording }" @mousedown="startRecord" @mouseup="stopRecord" @mouseleave="stopRecord">🎤</button>
      <span v-if="recording" class="recording-time">{{ recordingTime }}с</span>
      <textarea v-model="msgText" @keydown.enter.exact.prevent="sendMsg" placeholder="Сообщение..." rows="1" :disabled="recording" ref="msgInput"></textarea>
      <button class="btn-send" @click="sendMsg"><i class="fas fa-paper-plane"></i></button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { io } from 'socket.io-client';
import { translateWord } from '../composables/useTranslator.js';

export default {
  name: 'ChatWidget',
  props: {
    teacherName: { type: String, default: 'Преподаватель' },
    teacherAvatar: { type: String, default: '' },
    studentAvatar: { type: String, default: '' },
    teacherOnline: { type: Boolean, default: false },
    currentUserId: { type: Number },
    activeChat: { type: Number },
  },
  emits: ['close', 'lightbox'],
  data() {
    return {
      messages: [],
      filteredMessages: [],
      msgText: '',
      socket: null,
      showEmoji: false,
      pendingFiles: [],
      recording: false,
      mediaRecorder: null,
      recordingTime: 0,
      recordingTimer: null,
      showTranslate: false,
      selectedWord: '',
      translatedText: '',
      translating: false,
      emojis: ['😀','😂','🤣','😍','🥰','😘','😎','🤩','😇','🤔','😴','🥳','❤️','🔥','🎉','⭐','✅','💯','🙏','💪','🚀','🌈'],
    };
  },
  watch: {
    activeChat(val) { if (val) this.loadMessages(); },
  },
  mounted() {
    this.socket = io('https://english-club-v1.onrender.com', { transports: ['websocket', 'polling'] });
    this.socket.on('dm', (msg) => {
      if (typeof msg.files === 'string') { try { msg.files = JSON.parse(msg.files); } catch(e) { msg.files = null; } }
      if (msg.from === this.activeChat || msg.sender_id === this.activeChat || msg.from === this.currentUserId) {
        const exists = this.messages.find(m => m.id === msg.id);
        if (!exists) {
          this.messages.push({
            id: msg.id || Date.now(),
            text: msg.message || msg.msg || '',
            mine: msg.from === this.currentUserId || msg.sender_id === this.currentUserId,
            time: new Date(msg.ts || Date.now()).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
            files: msg.files || null,
            reply_to: msg.reply_to || msg.replyTo || null,
          });
          this.filterMessages();
          this.$nextTick(() => this.scrollToBottom());
        }
      }
    });
    if (this.activeChat) this.loadMessages();
    document.addEventListener('click', this.onClickOutside);
  },
  beforeUnmount() {
    if (this.socket) this.socket.disconnect();
    document.removeEventListener('click', this.onClickOutside);
  },
  methods: {
    async loadMessages() {
      try {
        const r = await axios.get(`/api/messages/${this.activeChat}`);
        this.messages = (r.data || []).map(m => ({
          id: m.id,
          text: m.message,
          mine: m.sender_id === this.currentUserId,
          time: new Date(m.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
          files: this.parseFiles(m.files),
          reply_to: m.reply_to,
        }));
        this.filterMessages();
        this.$nextTick(() => this.scrollToBottom());
      } catch(e) {}
    },
    parseFiles(f) { if (!f) return null; if (typeof f === 'string') { try { return JSON.parse(f); } catch(e) { return null; } } return f; },
    linkify(text) { if (!text) return ''; return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#818cf8;text-decoration:underline">$1</a>'); },
    filterMessages() { this.filteredMessages = this.messages; },
    toggleAudio(e, url) {
      const btn = e.target;
      const existing = document.querySelector('audio.voice-audio');
      if (existing) { existing.pause(); existing.remove(); }
      if (btn.dataset.playing === 'true') { btn.dataset.playing = 'false'; btn.textContent = '▶️'; return; }
      const audio = new Audio(url);
      audio.classList.add('voice-audio');
      audio.onended = () => { btn.dataset.playing = 'false'; btn.textContent = '▶️'; audio.remove(); };
      audio.play(); btn.dataset.playing = 'true'; btn.textContent = '⏸️';
      document.body.appendChild(audio);
    },
    async translateMsg(m) {
      if (!m.text) return;
      const word = m.text.split(' ').find(w => /^[a-zA-Z]+$/.test(w));
      if (!word) return;
      this.selectedWord = word; this.showTranslate = true; this.translating = true; this.translatedText = '';
      try { this.translatedText = await translateWord(word); } catch(e) { this.translatedText = 'Ошибка'; }
      this.translating = false;
    },
    async copyTranslation() { try { await navigator.clipboard.writeText(this.translatedText); } catch(e) {} },
    onClickOutside(e) { if (!e.target.closest('.translate-popup') && !e.target.closest('.msg-actions')) this.showTranslate = false; },
    getFileType(file) {
      if (file.type.startsWith('image/')) return 'image';
      if (file.type.startsWith('audio/')) return 'audio';
      if (file.type.startsWith('video/')) return 'video';
      const ext = (file.name || '').split('.').pop()?.toLowerCase();
      if (['mp3','wav','ogg','aac','m4a','flac','webm'].includes(ext)) return 'audio';
      if (['mp4','webm','mov','avi'].includes(ext)) return 'video';
      if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
      return 'file';
    },
    handleFiles(e) { if (e.target.files?.length) { for (const file of e.target.files) { if (file.type.startsWith('image/')) file.preview = URL.createObjectURL(file); this.pendingFiles.push(file); } } e.target.value = ''; },
    async startRecord() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.recording = true; this.recordingTime = 0;
        this.recordingTimer = setInterval(() => this.recordingTime++, 1000);
        const chunks = [];
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = e => chunks.push(e.data);
        this.mediaRecorder.onstop = async () => {
          clearInterval(this.recordingTimer);
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const form = new FormData(); form.append('img', blob, 'voice.webm');
          try {
            const r = await axios.post('/api/nimg', form);
            if (r.data?.url) this.sendMsgInternal('🎤 Голосовое', [{ url: r.data.url, type: 'audio', name: 'Голосовое' }]);
          } catch(e) {}
          stream.getTracks().forEach(t => t.stop());
          this.recording = false; this.recordingTime = 0;
        };
        this.mediaRecorder.start();
      } catch(e) { this.recording = false; }
    },
    stopRecord() { if (this.mediaRecorder?.state === 'recording') this.mediaRecorder.stop(); },
    replyTo(m) { this.msgText = `↩ ${m.text?.substring(0, 50)}\n`; this.$nextTick(() => this.$refs.msgInput?.focus()); },
    async deleteMsg(id) { if (confirm('Удалить?')) { try { await axios.delete(`/api/msg/${id}`); this.messages = this.messages.filter(m => m.id !== id); this.filterMessages(); } catch(e) {} } },
    async sendMsg() {
      const text = this.msgText.trim();
      if ((!text && !this.pendingFiles.length) || !this.activeChat || !this.socket?.connected) return;
      const replyTo = text.startsWith('↩') ? text.split('\n')[0] : null;
      const cleanText = replyTo ? text.split('\n').slice(1).join('\n').trim() : text;
      
      const files = [];
      for (const file of this.pendingFiles) {
        const form = new FormData(); form.append('img', file);
        try { const r = await axios.post('/api/nimg', form); if (r.data?.url) files.push({ url: r.data.url, type: this.getFileType(file), name: file.name }); } catch(e) {}
      }
      
      this.sendMsgInternal(cleanText, files, replyTo);
      this.msgText = ''; this.pendingFiles = [];
    },
    sendMsgInternal(text, files, replyTo = null) {
      const msg = {
        id: Date.now(),
        from: this.currentUserId,
        sender_id: this.currentUserId,
        message: text || '',
        files: files?.length ? files : null,
        ts: new Date().toISOString(),
        reply_to: replyTo,
      };
      this.messages.push({
        id: msg.id, text: text || '', mine: true,
        time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
        files: files?.length ? files : null, reply_to: replyTo,
      });
      this.filterMessages();
      if (this.socket?.connected) {
        this.socket.emit('dm', { to: this.activeChat, msg: text || '', files: files?.length ? files : null, replyTo });
      }
      this.$nextTick(() => this.scrollToBottom());
    },
    scrollToBottom() { const el = this.$refs.msgContainer; if (el) el.scrollTop = el.scrollHeight; },
  },
};
</script>

<style scoped>
.chat-wrapper { display: flex; flex-direction: column; height: 100%; background: #0b1120; border-radius: 0; overflow: hidden; }
.chat-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06); }
.chat-header-left { display: flex; align-items: center; gap: 12px; }
.avatar-wrapper { position: relative; width: 44px; height: 44px; }
.avatar-wrapper.online .avatar-glow { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #10b981; animation: avatarPulse 2s ease-in-out infinite; }
@keyframes avatarPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:.5} }
.avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.1); }
.floating { animation: float 3s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
.teacher-name { font-weight: 600; font-size: 1rem; color: #fff; }
.teacher-status { font-size: 0.75rem; color: #94a3b8; }
.btn-icon { width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #94a3b8; transition: all 0.2s; }
.btn-icon:hover { background: rgba(99,102,241,0.1); color: #fff; }

.chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.message-row { position: relative; }
.message-bubble { display: flex; align-items: flex-end; gap: 10px; max-width: 75%; }
.message-row.mine .message-bubble { margin-left: auto; flex-direction: row-reverse; }
.msg-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.bubble-content { padding: 12px 16px; border-radius: 18px; position: relative; }
.message-row.mine .bubble-content { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border-bottom-right-radius: 6px; }
.message-row:not(.mine) .bubble-content { background: rgba(255,255,255,0.06); color: #e2e8f0; border-bottom-left-radius: 6px; }
.msg-text { font-size: 0.9rem; line-height: 1.5; word-break: break-word; }
.msg-text a { color: #818cf8; text-decoration: underline; }
.message-row.mine .msg-text a { color: #fff; }
.msg-time { font-size: 0.7rem; opacity: 0.6; display: block; margin-top: 4px; text-align: right; }
.reply-preview { border-left: 3px solid #6366f1; padding: 4px 10px; margin-bottom: 6px; font-size: 0.8rem; opacity: 0.7; }

.msg-actions { display: none; position: absolute; top: -10px; right: 6px; gap: 3px; }
.message-row:hover .msg-actions { display: flex; }
.message-row.mine .msg-actions { right: auto; left: 6px; }
.msg-actions button { background: rgba(30,30,30,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; color: #94a3b8; transition: all 0.2s; }
.msg-actions button:hover { background: #6366f1; color: #fff; border-color: #6366f1; }

.msg-files { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.msg-img { max-width: 250px; border-radius: 12px; cursor: pointer; }
.msg-video { max-width: 250px; border-radius: 12px; }
.voice-msg { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(99,102,241,0.15); border-radius: 12px; }
.voice-play-btn { background: #6366f1; color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; }
.voice-wave { display: flex; gap: 2px; align-items: flex-end; height: 20px; }
.voice-wave-bar { width: 3px; background: #6366f1; border-radius: 2px; animation: wave 0.8s ease-in-out infinite; }
.voice-wave-bar:nth-child(odd) { animation-delay: 0.2s; }
@keyframes wave { 0%,100%{height:4px} 50%{height:14px} }
.voice-label { font-size: 0.75rem; color: #94a3b8; }
.file-link { color: #818cf8; text-decoration: none; font-size: 0.85rem; }
.message-row.mine .file-link { color: #fff; }

.translate-popup { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); background: rgba(30,30,30,0.98); border: 2px solid #6366f1; border-radius: 16px; padding: 14px 18px; min-width: 200px; z-index: 9999; text-align: center; color: #fff; }
.translate-word { font-weight: 700; font-size: 0.9rem; color: #818cf8; margin-bottom: 6px; }
.translate-result { font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; }
.translate-loading { color: #94a3b8; font-size: 0.85rem; margin-bottom: 8px; }
.translate-actions { display: flex; gap: 8px; justify-content: center; }

.pending-files { display: flex; gap: 8px; padding: 8px 20px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
.pending-file { display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(99,102,241,0.1); border-radius: 8px; font-size: 0.8rem; color: #cbd5e1; }

.chat-input { display: flex; gap: 8px; padding: 14px 20px; background: rgba(255,255,255,0.03); border-top: 1px solid rgba(255,255,255,0.06); align-items: flex-end; position: relative; }
.chat-input textarea { flex: 1; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; font-family: inherit; font-size: 0.9rem; resize: none; outline: none; background: rgba(255,255,255,0.05); color: #fff; }
.chat-input textarea:focus { border-color: #6366f1; }
.chat-input textarea::placeholder { color: #64748b; }
.btn-send { width: 44px; height: 44px; border-radius: 50%; border: none; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.btn-send:hover { transform: scale(1.05); box-shadow: 0 4px 15px rgba(99,102,241,0.4); }
.voice-btn.recording { background: #ef4444; color: #fff; animation: pulse 0.8s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
.recording-time { color: #ef4444; font-weight: 700; font-size: 0.85rem; min-width: 35px; }

.emoji-picker { position: absolute; bottom: 60px; left: 20px; background: rgba(30,30,30,0.98); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 12px; display: flex; flex-wrap: wrap; gap: 6px; width: 280px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 100; }
.emoji-picker span { cursor: pointer; font-size: 1.3rem; padding: 4px; border-radius: 8px; transition: all 0.2s; }
.emoji-picker span:hover { background: rgba(99,102,241,0.15); transform: scale(1.2); }
.emoji-fade-enter-active { transition: all 0.2s ease; }
.emoji-fade-leave-active { transition: all 0.15s ease; }
.emoji-fade-enter-from, .emoji-fade-leave-to { opacity: 0; transform: translateY(10px); }

.msg-materialize-enter-active { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
.msg-materialize-enter-from { opacity: 0; filter: blur(10px); transform: translateY(10px); }

@media (max-width: 768px) { .message-bubble { max-width: 85%; } .emoji-picker { width: 240px; } }
</style>
