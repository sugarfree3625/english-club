<template>
  <div class="container" v-if="user?.id">
    <h2 class="section-title">👥 Группы</h2>
    <div class="group-create">
      <input class="input" v-model="newGroupName" placeholder="Название группы" style="max-width:300px">
      <button class="btn btn-p btn-sm" @click="createGroup">+ Создать</button>
    </div>
    <div class="group-list">
      <div v-for="g in groups" :key="g.id" class="group-card" @click="openGroup(g)">
        <h3>{{ g.name }}</h3>
        <small>{{ g.created_at ? new Date(g.created_at).toLocaleDateString('ru') : '' }}</small>
      </div>
      <p v-if="!groups.length" class="empty-text">Нет групп</p>
    </div>
    <div class="modal-overlay" v-if="activeGroup" @click.self="activeGroup = null">
      <div class="modal" style="max-width:600px;max-height:80vh">
        <div class="chat-header">
          <h3>{{ activeGroup.name }}</h3>
          <button class="btn btn-o btn-sm" @click="activeGroup = null">✕</button>
        </div>
        <div class="chat-messages" ref="groupMsgContainer">
          <div v-for="m in groupMessages" :key="m.id" class="msg" :class="{ mine: m.sender_id === currentUserId }">
            <strong>{{ m.users?.username || m.fn }}</strong>
            <div>{{ m.message }}</div>
            <small>{{ new Date(m.ts).toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'}) }}</small>
          </div>
        </div>
        <div class="chat-input">
          <input class="input" v-model="groupMsgText" @keydown.enter="sendGroupMsg" placeholder="Сообщение...">
          <button class="btn btn-p btn-sm" @click="sendGroupMsg">➤</button>
        </div>
        <button class="btn btn-o btn-sm mt-2" @click="showAddMember = true">+ Участник</button>
        <div v-if="showAddMember">
          <input class="input" v-model="memberSearch" @input="searchMembers" placeholder="Поиск пользователя...">
          <div v-for="u in memberResults" :key="u.id" class="search-item" @click="addMember(u.id)">{{ u.username }}</div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="container"><p>Войдите</p></div>
</template>

<script>
import axios from 'axios';
import { io } from 'socket.io-client';

export default {
  name: 'GroupChatPage',
  props: ['user'],
  data() { return { groups: [], newGroupName: '', activeGroup: null, groupMessages: [], groupMsgText: '', currentUserId: null, socket: null, showAddMember: false, memberSearch: '', memberResults: [] }; },
  async mounted() {
    if (!this.user?.id) return;
    this.currentUserId = this.user.id;
    await this.loadGroups();
    this.socket = io('https://english-club-v1.onrender.com', { transports: ['websocket', 'polling'] });
    this.socket.emit('join', { uid: this.currentUserId, uname: this.user.username });
    this.socket.on('groupMsg', msg => { if (this.activeGroup && msg.group_id === this.activeGroup.id) { this.groupMessages.push(msg); this.$nextTick(() => { const el = this.$refs.groupMsgContainer; if (el) el.scrollTop = el.scrollHeight; }); } });
  },
  beforeUnmount() { if (this.socket) this.socket.disconnect(); },
  methods: {
    async loadGroups() { try { const r = await axios.get('/api/groups'); this.groups = r.data; } catch(e) {} },
    async createGroup() { if (!this.newGroupName.trim()) return; try { await axios.post('/api/groups', { name: this.newGroupName }); this.newGroupName = ''; this.loadGroups(); } catch(e) {} },
    async openGroup(g) { this.activeGroup = g; this.socket.emit('joinGroup', g.id); try { const r = await axios.get(`/api/groups/${g.id}/messages`); this.groupMessages = r.data; this.$nextTick(() => { const el = this.$refs.groupMsgContainer; if (el) el.scrollTop = el.scrollHeight; }); } catch(e) {} },
    async sendGroupMsg() { if (!this.groupMsgText.trim() || !this.activeGroup) return; this.socket.emit('groupMsg', { groupId: this.activeGroup.id, msg: this.groupMsgText }); this.groupMsgText = ''; },
    async searchMembers() { if (this.memberSearch.length < 2) return; try { const r = await axios.get(`/api/users?q=${this.memberSearch}`); this.memberResults = r.data; } catch(e) {} },
    async addMember(uid) { try { await axios.post(`/api/groups/${this.activeGroup.id}/members`, { user_id: uid }); this.showAddMember = false; this.memberSearch = ''; } catch(e) {} }
  }
};
</script>
