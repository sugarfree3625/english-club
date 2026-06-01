<template>
  <div class="groups-page" v-if="user?.id">
    <div class="groups-container">
      <!-- Сайдбар групп -->
      <div class="groups-sidebar" :class="{ 'mobile-hidden': !showSidebar && activeGroup }">
        <div class="sidebar-header">
          <h2 class="section-title">👥 Группы</h2>
          <span v-if="groups.length" class="group-count">{{ groups.length }}</span>
        </div>

        <!-- Создание группы -->
        <div class="group-create">
          <input 
            class="input" 
            v-model="newGroupName" 
            placeholder="Название группы..." 
            @keyup.enter="createGroup"
          >
          <button class="btn btn-p btn-sm" @click="createGroup" :disabled="!newGroupName.trim()">
            <i class="fas fa-plus"></i> Создать
          </button>
        </div>

        <!-- Список групп -->
        <div class="group-list">
          <div 
            v-for="g in groups" 
            :key="g.id" 
            class="group-card fade-in-up"
            :class="{ active: activeGroup?.id === g.id, unread: g._unread }"
            @click="openGroup(g)"
          >
            <div class="group-avatar" :style="{ background: g._color || getGroupColor(g.name) }">
              {{ getGroupInitials(g.name) }}
            </div>
            <div class="group-info">
              <div class="group-name">{{ g.name }}</div>
              <div class="group-last-msg">{{ g._lastMsg || 'Нет сообщений' }}</div>
            </div>
            <div class="group-meta">
              <span v-if="g._unread" class="unread-dot"></span>
              <span class="group-members-count">{{ g._memberCount || 0 }} 👤</span>
            </div>
          </div>
          <p v-if="!groups.length" class="empty-text">
            <span class="empty-icon">👥</span>
            <span>Нет групп. Создайте первую!</span>
          </p>
        </div>

        <button class="btn btn-o btn-sm w-100" @click="$router.push('/messages')">
          <i class="fas fa-comments"></i> Личные чаты
        </button>
      </div>

      <button class="mobile-back" @click="showSidebar = true; activeGroup = null">
        ← Группы
      </button>

      <!-- Окно группы -->
      <div class="group-chat" v-if="activeGroup" :class="{ 'mobile-show': !showSidebar }">
        <!-- Шапка -->
        <div class="chat-header">
          <div class="chat-header-left">
            <div class="group-avatar-lg" :style="{ background: getGroupColor(activeGroup.name) }">
              {{ getGroupInitials(activeGroup.name) }}
            </div>
            <div>
              <h3>{{ activeGroup.name }}</h3>
              <small>{{ activeGroup._memberCount || 0 }} участников · {{ activeGroup._onlineCount || 0 }} онлайн</small>
            </div>
          </div>
          <div class="chat-header-right">
            <button class="btn btn-o btn-sm" @click="showMembers = !showMembers" title="Участники">
              <i class="fas fa-users"></i>
            </button>
            <button class="btn btn-o btn-sm" @click="showGroupSettings = !showGroupSettings" title="Настройки">
              <i class="fas fa-cog"></i>
            </button>
            <button class="btn btn-o btn-sm" @click="activeGroup = null; showSidebar = true">
              ✕
            </button>
          </div>
        </div>

        <!-- Панель участников -->
        <div v-if="showMembers" class="members-panel">
          <div class="members-header">
            <h4>Участники ({{ groupMembers.length }})</h4>
            <button class="btn btn-o btn-sm" @click="showAddMember = !showAddMember">
              <i class="fas fa-user-plus"></i> Добавить
            </button>
          </div>
          <div v-if="showAddMember" class="add-member-search">
            <input 
              class="input" 
              v-model="memberSearch" 
              @input="searchMembers" 
              placeholder="Поиск пользователя..."
            >
            <div v-if="memberResults.length" class="search-results">
              <div 
                v-for="u in memberResults" 
                :key="u.id" 
                class="search-item"
                @click="addMember(u.id)"
              >
                <AppAvatar :src="u.avatar_url" :name="u.username" :size="36" />
                <span>{{ u.username }}</span>
                <i class="fas fa-plus"></i>
              </div>
            </div>
          </div>
          <div class="members-list">
            <div v-for="m in groupMembers" :key="m.id" class="member-item">
              <AppAvatar :src="m.avatar_url" :name="m.username" :size="36" />
              <span>{{ m.username }}</span>
              <span v-if="m.role === 'admin'" class="admin-badge">Админ</span>
              <span class="online-dot" :class="{ online: m._online }"></span>
            </div>
          </div>
        </div>

        <!-- Сообщения -->
        <div class="chat-messages" ref="groupMsgContainer">
          <div v-if="groupMessages.length === 0" class="empty-chat">
            <span class="empty-icon">💬</span>
            <p>Нет сообщений. Напишите первое!</p>
          </div>
          <transition-group name="msg-pop">
            <div 
              v-for="(m, idx) in groupMessages" 
              :key="m.id || idx" 
              class="msg" 
              :class="{ mine: m.sender_id === currentUserId }"
            >
              <div v-if="m.sender_id !== currentUserId" class="msg-sender">
                <AppAvatar :src="m.users?.avatar_url || m._avatar" :name="m.users?.username || m.fn" :size="28" />
                <strong>{{ m.users?.username || m.fn }}</strong>
              </div>
              <div v-if="m.message" class="msg-text">{{ m.message }}</div>
              <div v-if="m.files?.length" class="msg-files">
                <img 
                  v-for="(f, i) in m.files" 
                  :key="i" 
                  v-if="f.type === 'image'" 
                  :src="f.url" 
                  class="msg-img"
                  @click="lightbox = f.url"
                >
              </div>
              
              <!-- Реакции -->
              <div v-if="m.reactions && Object.keys(m.reactions).length" class="msg-reactions">
                <span 
                  v-for="(count, emoji) in m.reactions" 
                  :key="emoji" 
                  class="reaction-badge"
                  @click="toggleReaction(m, emoji)"
                >
                  {{ emoji }} {{ count }}
                </span>
              </div>

              <small class="msg-time">{{ formatTime(m.ts || m.created_at) }}</small>
              <div class="msg-actions">
                <button @click="replyToMsg(m)" title="Ответить">↩</button>
                <button @click="openReactionPicker(m)" title="Реакция">😊</button>
                <button 
                  v-if="m.sender_id === currentUserId || isAdmin" 
                  @click="deleteGroupMsg(m.id)" 
                  title="Удалить"
                >🗑</button>
              </div>

              <!-- Пикер реакций -->
              <div v-if="reactionPickerId === (m.id || m._tempId)" class="reaction-picker">
                <span 
                  v-for="e in reactionEmojis" 
                  :key="e" 
                  @click="addReaction(m, e)" 
                  class="reaction-emoji"
                >{{ e }}</span>
              </div>
            </div>
          </transition-group>
        </div>

        <!-- Ввод сообщения -->
        <div class="chat-input">
          <button class="btn btn-o btn-sm emoji-btn" @click="showEmoji = !showEmoji">😊</button>
          <div v-if="showEmoji" class="emoji-picker">
            <span v-for="e in emojis" :key="e" @click="groupMsgText += e" class="emoji-item">{{ e }}</span>
          </div>
          <button class="btn btn-o btn-sm" @click="$refs.groupFileInput.click()">
            <i class="fas fa-paperclip"></i>
          </button>
          <input type="file" ref="groupFileInput" @change="handleGroupFiles" hidden multiple accept="image/*">
          <textarea 
            v-model="groupMsgText" 
            @keydown.enter.exact.prevent="sendGroupMsg" 
            placeholder="Сообщение..." 
            rows="1"
          ></textarea>
          <button class="btn btn-p btn-sm send-btn" @click="sendGroupMsg">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <!-- Пустое состояние -->
      <div class="group-chat empty-state" v-else>
        <div>
          <span class="empty-icon">👥</span>
          <p>Выберите группу или создайте новую</p>
        </div>
      </div>
    </div>

    <!-- Лайтбокс -->
    <div class="lightbox" v-if="lightbox" @click="lightbox = null">
      <img :src="lightbox" style="max-width:90%;max-height:90%;border-radius:16px">
    </div>
  </div>
  <div v-else class="container" style="text-align:center;padding:80px 20px">
    <p>Войдите, чтобы видеть группы</p>
  </div>
</template>

<script>
import axios from 'axios';
import { io } from 'socket.io-client';
import AppAvatar from '../components/AppAvatar.vue';

export default {
  name: 'GroupChatPage',
  components: { AppAvatar },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      groups: [],
      newGroupName: '',
      activeGroup: null,
      groupMessages: [],
      groupMsgText: '',
      currentUserId: null,
      socket: null,
      showAddMember: false,
      memberSearch: '',
      memberResults: [],
      groupMembers: [],
      showMembers: false,
      showGroupSettings: false,
      showSidebar: true,
      lightbox: null,
      showEmoji: false,
      reactionPickerId: null,
      emojis: ['😀','😂','🤣','😍','🥰','😘','😎','🤩','❤️','🔥','🎉','⭐','✅','💯','🙏','💪','🚀'],
      reactionEmojis: ['👍','❤️','😂','😮','😢','😡','🔥','👏','🎉','💯'],
      isAdmin: false
    };
  },
  computed: {
    groupColors() {
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];
      return this.groups.reduce((acc, g, i) => {
        acc[g.id] = colors[i % colors.length];
        return acc;
      }, {});
    }
  },
  async mounted() {
    if (!this.user?.id) return;
    this.currentUserId = this.user.id;
    this.isAdmin = this.user.role === 'admin' || this.user.role === 'host';
    await this.loadGroups();
    
    this.socket = io('https://english-club-v1.onrender.com', { 
      transports: ['websocket', 'polling'] 
    });
    this.socket.emit('join', { uid: this.currentUserId, uname: this.user.username });
    
    this.socket.on('groupMsg', msg => {
      if (this.activeGroup && msg.group_id === this.activeGroup.id) {
        if (!this.groupMessages.find(m => m.id === msg.id)) {
          this.groupMessages.push({...msg, reactions: {}});
          this.$nextTick(() => this.scrollToBottom());
        }
      }
      this.loadGroups(); // Обновить lastMsg
    });

    this.socket.on('groupMemberJoined', data => {
      if (this.activeGroup?.id === data.group_id) {
        this.loadGroupMembers();
      }
    });
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.emit('leaveGroup', this.activeGroup?.id);
      this.socket.disconnect();
    }
  },
  methods: {
    getGroupColor(name) {
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];
      let hash = 0;
      for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    },
    getGroupInitials(name) {
      return (name || '??').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    },
    async loadGroups() {
      try {
        const r = await axios.get('/api/groups');
        this.groups = (r.data || []).map(g => ({
          ...g,
          _color: this.getGroupColor(g.name),
          _unread: g.unread_count > 0,
          _lastMsg: g.last_message || 'Нет сообщений',
          _memberCount: g.member_count || 0,
          _onlineCount: g.online_count || 0
        }));
      } catch(e) {}
    },
    async createGroup() {
      if (!this.newGroupName.trim()) return;
      try {
        await axios.post('/api/groups', { name: this.newGroupName });
        this.newGroupName = '';
        this.addToast?.('Группа создана! 👥', 'success');
        this.loadGroups();
      } catch(e) {
        this.addToast?.('Ошибка создания группы', 'error');
      }
    },
    async openGroup(g) {
      this.activeGroup = g;
      this.showSidebar = false;
      this.showMembers = false;
      this.showAddMember = false;
      this.socket.emit('joinGroup', g.id);
      this.loadGroupMembers();
      try {
        const r = await axios.get(`/api/groups/${g.id}/messages`);
        this.groupMessages = (r.data || []).map(m => ({
          ...m,
          reactions: m.reactions || {}
        }));
        this.$nextTick(() => this.scrollToBottom());
      } catch(e) {}
    },
    async loadGroupMembers() {
      if (!this.activeGroup) return;
      try {
        const r = await axios.get(`/api/groups/${this.activeGroup.id}/members`);
        this.groupMembers = (r.data || []).map(m => ({
          ...m,
          _online: Math.random() > 0.5 // Заглушка, потом заменить на реальный статус
        }));
      } catch(e) {}
    },
    async sendGroupMsg() {
      if (!this.groupMsgText.trim() || !this.activeGroup) return;
      this.socket.emit('groupMsg', {
        groupId: this.activeGroup.id,
        msg: this.groupMsgText,
        sender_id: this.currentUserId,
        fn: this.user.username
      });
      this.groupMsgText = '';
    },
    async searchMembers() {
      if (this.memberSearch.length < 2) { this.memberResults = []; return; }
      try {
        const r = await axios.get(`/api/users?q=${this.memberSearch}`);
        this.memberResults = (r.data || []).filter(u => 
          !this.groupMembers.find(m => m.id === u.id)
        );
      } catch(e) {}
    },
    async addMember(uid) {
      try {
        await axios.post(`/api/groups/${this.activeGroup.id}/members`, { user_id: uid });
        this.showAddMember = false;
        this.memberSearch = '';
        this.memberResults = [];
        this.loadGroupMembers();
        this.addToast?.('Участник добавлен! ✅', 'success');
      } catch(e) {
        this.addToast?.('Ошибка', 'error');
      }
    },
    replyToMsg(m) {
      this.groupMsgText = `↩ ${m.users?.username || m.fn}: ${(m.message || '').substring(0, 40)}\n`;
      this.$nextTick(() => this.$el.querySelector('textarea')?.focus());
    },
    openReactionPicker(m) {
      this.reactionPickerId = this.reactionPickerId === (m.id || m._tempId) ? null : (m.id || m._tempId);
    },
    addReaction(m, emoji) {
      if (!m.reactions) m.reactions = {};
      m.reactions[emoji] = (m.reactions[emoji] || 0) + 1;
      this.reactionPickerId = null;
    },
    toggleReaction(m, emoji) {
      this.addReaction(m, emoji);
    },
    async deleteGroupMsg(id) {
      if (!confirm('Удалить сообщение?')) return;
      try {
        await axios.delete(`/api/group-messages/${id}`);
        this.groupMessages = this.groupMessages.filter(m => m.id !== id);
        this.addToast?.('Удалено 🗑', 'success');
      } catch(e) {
        this.addToast?.('Ошибка', 'error');
      }
    },
    handleGroupFiles(e) {
      // Заглушка для файлов
      this.addToast?.('Загрузка файлов скоро будет! 📎', 'info');
    },
    formatTime(ts) {
      return ts ? new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : '';
    },
    scrollToBottom() {
      const el = this.$refs.groupMsgContainer;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }
};
</script>

<style scoped>
.groups-page {
  min-height: 100vh;
  background: #0b1120;
  padding: 20px;
}

.groups-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 40px);
  background: #0b1120;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
}

/* САЙДБАР */
.groups-sidebar {
  width: 340px;
  flex-shrink: 0;
  background: rgba(15,15,30,0.95);
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  padding: 0;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.group-count {
  background: rgba(99,102,241,0.15);
  color: #818cf8;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
}

.group-create {
  padding: 0 20px 12px;
  display: flex;
  gap: 8px;
}

.input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  color: #fff;
  font-size: 0.85rem;
  outline: none;
  font-family: inherit;
}

.input:focus {
  border-color: #6366f1;
}

.group-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px;
}

.group-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  cursor: pointer;
  margin-bottom: 3px;
  transition: all 0.2s;
}

.group-card:hover,
.group-card.active {
  background: rgba(99,102,241,0.06);
}

.group-card.unread {
  background: rgba(99,102,241,0.03);
}

.group-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-weight: 700;
  color: #fff;
  font-size: 0.9rem;
}

.group-last-msg {
  color: #64748b;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6366f1;
}

.group-members-count {
  font-size: 0.65rem;
  color: #64748b;
}

.empty-text {
  text-align: center;
  color: #64748b;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}

/* ЧАТ ГРУППЫ */
.group-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #0b1120;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
}

.empty-state .empty-icon {
  font-size: 4rem;
}

.chat-header {
  padding: 16px 20px;
  background: rgba(15,15,30,0.95);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-avatar-lg {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
}

.chat-header-left h3 {
  margin: 0;
  font-weight: 700;
  color: #fff;
  font-size: 1rem;
}

.chat-header-left small {
  color: #64748b;
  font-size: 0.75rem;
}

.chat-header-right {
  display: flex;
  gap: 6px;
}

/* ПАНЕЛЬ УЧАСТНИКОВ */
.members-panel {
  padding: 16px 20px;
  background: rgba(15,15,30,0.95);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  max-height: 250px;
  overflow-y: auto;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.members-header h4 {
  color: #fff;
  margin: 0;
  font-size: 0.9rem;
}

.add-member-search {
  margin-bottom: 12px;
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(15,15,40,0.98);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 100;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  color: #cbd5e1;
}

.search-item:hover {
  background: rgba(99,102,241,0.1);
}

.search-item i {
  margin-left: auto;
  color: #10b981;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 0.85rem;
}

.member-item:hover {
  background: rgba(255,255,255,0.03);
}

.admin-badge {
  padding: 1px 8px;
  background: rgba(251,191,36,0.15);
  color: #fbbf24;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
  margin-left: auto;
}

.online-dot.online {
  background: #22c55e;
}

/* СООБЩЕНИЯ */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-chat {
  text-align: center;
  color: #64748b;
  padding: 40px;
}

.msg {
  max-width: 75%;
  padding: 10px 16px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  align-self: flex-start;
  position: relative;
}

.msg.mine {
  background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(45,212,191,0.1));
  align-self: flex-end;
}

.msg-sender {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.msg-sender strong {
  font-size: 0.8rem;
  color: #818cf8;
}

.msg-text {
  font-size: 0.9rem;
  color: #e2e8f0;
  line-height: 1.5;
}

.msg-img {
  max-width: 250px;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 6px;
}

.msg-reactions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.reaction-badge {
  padding: 1px 7px;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 8px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reaction-badge:hover {
  background: rgba(99,102,241,0.2);
  transform: scale(1.1);
}

.msg-time {
  font-size: 0.65rem;
  color: #64748b;
  margin-top: 6px;
  display: block;
}

.msg:hover .msg-actions {
  display: flex;
}

.msg-actions {
  display: none;
  position: absolute;
  top: -8px;
  right: 6px;
  gap: 3px;
}

.msg-actions button {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(15,15,30,0.95);
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.55rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.msg-actions button:hover {
  background: #6366f1;
  color: #fff;
}

.reaction-picker {
  position: absolute;
  bottom: -35px;
  right: 0;
  display: flex;
  gap: 4px;
  padding: 5px 8px;
  background: rgba(15,15,30,0.98);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  z-index: 10;
}

.reaction-emoji {
  cursor: pointer;
  font-size: 1rem;
  padding: 3px;
  border-radius: 4px;
  transition: all 0.2s;
}

.reaction-emoji:hover {
  background: rgba(99,102,241,0.1);
  transform: scale(1.3);
}

/* ВВОД СООБЩЕНИЯ */
.chat-input {
  display: flex;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(15,15,30,0.95);
  border-top: 1px solid rgba(255,255,255,0.06);
  align-items: flex-end;
  position: relative;
}

.emoji-picker {
  position: absolute;
  bottom: 55px;
  left: 20px;
  background: rgba(15,15,30,0.98);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 10px;
  width: 280px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  z-index: 200;
}

.emoji-item {
  cursor: pointer;
  font-size: 1.3rem;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.emoji-item:hover {
  background: rgba(99,102,241,0.1);
  transform: scale(1.2);
}

.chat-input textarea {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
  color: #fff;
  font-size: 0.9rem;
  resize: none;
  outline: none;
  font-family: inherit;
}

.chat-input textarea:focus {
  border-color: #6366f1;
}

.send-btn {
  width: 40px;
  height: 40px;
  padding: 0 !important;
  justify-content: center;
  border-radius: 50% !important;
}

/* ЛАЙТБОКС */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.95);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* КНОПКИ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-p {
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  color: #fff;
}

.btn-o {
  border: 1px solid rgba(255,255,255,0.1);
  color: #cbd5e1;
  background: rgba(255,255,255,0.03);
}

.btn-o:hover {
  background: rgba(99,102,241,0.1);
  border-color: rgba(99,102,241,0.3);
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.75rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.w-100 {
  width: calc(100% - 24px);
  margin: 12px;
}

/* АНИМАЦИИ */
.fade-in-up {
  animation: fadeInUp 0.4s ease both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.msg-pop-enter-active {
  animation: msgPop 0.3s ease;
}

@keyframes msgPop {
  from { opacity: 0; transform: translateY(8px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.mobile-back {
  display: none;
}

/* АДАПТИВ */
@media (max-width: 768px) {
  .groups-container {
    flex-direction: column;
    height: auto;
  }
  
  .groups-sidebar {
    width: 100%;
    position: absolute;
    inset: 0;
    z-index: 10;
  }
  
  .groups-sidebar.mobile-hidden {
    display: none;
  }
  
  .group-chat {
    display: none;
  }
  
  .group-chat.mobile-show {
    display: flex;
  }
  
  .empty-state {
    display: flex;
  }
  
  .mobile-back {
    display: block;
    padding: 14px 20px;
    background: rgba(15,15,30,0.95);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    font-weight: 600;
    cursor: pointer;
    border: none;
    width: 100%;
    text-align: left;
    color: #cbd5e1;
    font-family: inherit;
  }
  
  .msg {
    max-width: 90%;
  }
}
</style>
