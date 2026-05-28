<template>
  <div class="students-page">
    <div class="page-header">
      <h2>👨‍👩‍👧 Семьи</h2>
      <div class="header-line"></div>
    </div>

    <!-- Привязанные -->
    <div class="section">
      <h3 class="section-title earned"><CheckCircle :size="20" /> Привязанные ученики</h3>
      <div class="family-grid">
        <div v-for="parent in boundParents" :key="parent.id" class="family-card">
          <div class="family-parent">
            <AppAvatar :src="parent.avatar_url" :name="parent.username" :size="48" class="parent-avatar gold-border" />
            <div>
              <div class="parent-name">{{ parent.username }}</div>
              <span class="role-badge parent-badge">Родитель</span>
            </div>
            <button v-if="isAdmin" class="role-btn-sm" @click="toggleRole(parent)" title="Сменить роль">🔄</button>
          </div>
          <div class="family-divider"></div>
          <div class="family-children">
            <div v-for="child in parent.children" :key="child.id" class="child-row">
              <AppAvatar :src="child.avatar_url" :name="child.username" :size="36" class="child-avatar purple-border" />
              <div class="child-info">
                <div class="child-name">{{ child.username }}</div>
                <span class="role-badge student-badge">Ученик</span>
              </div>
              <button v-if="isAdmin" class="role-btn-sm" @click="toggleRole(child)" title="Сменить роль">🔄</button>
              <button v-if="isAdmin" class="feedback-btn-sm" @click="$emit('feedback', child)" title="Фидбек">⭐</button>
              <button class="unlink-btn" @click="confirmUnlink(child, parent)"><Unlink :size="14" /> Отвязать</button>
            </div>
            <p v-if="!parent.children?.length" class="empty-text">Нет привязанных учеников</p>
          </div>
        </div>
        <p v-if="!boundParents.length" class="empty-text">Нет привязанных семей</p>
      </div>
    </div>

    <!-- Непривязанные -->
    <div class="section">
      <h3 class="section-title locked"><Link :size="20" /> Непривязанные ученики</h3>
      <div class="unlinked-list">
        <div v-for="student in unlinkedStudents" :key="student.id" class="unlinked-row">
          <AppAvatar :src="student.avatar_url" :name="student.username" :size="36" class="child-avatar purple-border" />
          <div class="child-info">
            <div class="child-name">{{ student.username }}</div>
            <span class="role-badge" :class="student.role === 'parent' ? 'parent-badge' : 'student-badge'">
              {{ student.role === 'parent' ? 'Родитель' : 'Ученик' }}
            </span>
          </div>
          <button v-if="isAdmin" class="role-btn" @click="toggleRole(student)" :title="'Сделать ' + (student.role === 'student' ? 'родителем' : 'учеником')">🔄</button>
          <button v-if="isAdmin" class="feedback-btn" @click="$emit('feedback', student)" title="Фидбек">⭐</button>
          <button class="link-btn" @click="openBindModal(student)"><Link :size="14" /> Привязать</button>
        </div>
        <p v-if="!unlinkedStudents.length" class="empty-text">Все ученики привязаны</p>
      </div>
    </div>

    <!-- Быстрое добавление -->
    <div class="section">
      <h3 class="section-title">➕ Быстрое добавление</h3>
      <div class="quick-bind">
        <div class="quick-bind-row">
          <input class="quick-input" v-model="quickParentSearch" @input="searchQuickParents" placeholder="Поиск родителя..." />
          <input class="quick-input" v-model="quickStudentSearch" @input="searchQuickStudents" placeholder="Поиск ученика..." />
          <button class="quick-bind-btn" @click="quickBind" :disabled="!selectedQuickParent || !selectedQuickStudent"><Link :size="16" /> Привязать</button>
        </div>
        <div class="quick-results" v-if="quickParentResults.length || quickStudentResults.length">
          <div v-if="quickParentResults.length" class="quick-dropdown">
            <div v-for="p in quickParentResults" :key="p.id" class="quick-item" :class="{ selected: selectedQuickParent?.id === p.id }" @click="selectQuickParent(p)">{{ p.username }}</div>
          </div>
          <div v-if="quickStudentResults.length" class="quick-dropdown">
            <div v-for="s in quickStudentResults" :key="s.id" class="quick-item" :class="{ selected: selectedQuickStudent?.id === s.id }" @click="selectQuickStudent(s)">{{ s.username }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка выбора родителя -->
    <div v-if="showBindModal" class="modal-overlay" @click.self="showBindModal = false">
      <div class="modal-card">
        <h3>Выберите родителя</h3>
        <input class="modal-input" v-model="parentSearch" @input="searchParentsForBind" placeholder="Поиск родителя..." />
        <div class="modal-list">
          <div v-for="p in parentSearchResults" :key="p.id" class="modal-item" @click="bindStudent(p)">
            <AppAvatar :src="p.avatar_url" :name="p.username" :size="36" />
            <div><div class="modal-item-name">{{ p.username }}</div><span class="role-badge parent-badge">Родитель</span></div>
          </div>
        </div>
        <button class="modal-close-btn" @click="showBindModal = false">Закрыть</button>
      </div>
    </div>

    <!-- Подтверждение отвязки -->
    <div v-if="showUnlinkConfirm" class="modal-overlay" @click.self="showUnlinkConfirm = false">
      <div class="modal-card">
        <h3>Отвязать ученика?</h3>
        <p>{{ unlinkStudent?.username }} от {{ unlinkParent?.username }}</p>
        <div class="modal-actions">
          <button class="unlink-btn" @click="doUnlink">Да, отвязать</button>
          <button class="modal-close-btn" @click="showUnlinkConfirm = false">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import AppAvatar from '../AppAvatar.vue';
import { CheckCircle, Link, Unlink } from 'lucide-vue-next';

export default {
  name: 'ProfileTabStudents',
  components: { AppAvatar, CheckCircle, Link, Unlink },
  inject: ['addToast'],
  props: ['isAdmin'],
  emits: ['view', 'bind', 'homework', 'feedback'],
  data() {
    return {
      boundParents: [],
      unlinkedStudents: [],
      showBindModal: false,
      bindTargetStudent: null,
      parentSearch: '',
      parentSearchResults: [],
      showUnlinkConfirm: false,
      unlinkStudent: null,
      unlinkParent: null,
      quickParentSearch: '',
      quickStudentSearch: '',
      selectedQuickParent: null,
      selectedQuickStudent: null,
      quickParentResults: [],
      quickStudentResults: []
    };
  },
  async mounted() { await this.loadData(); },
  methods: {
    async loadData() {
      try {
        const { data: allUsers } = await axios.get('/api/users');
        let allLinks = [];
        try { const { data } = await axios.get('/api/admin/links'); allLinks = data || []; } catch(e) {}
        
        const parents = (allUsers || []).filter(u => u.role === 'parent');
        const students = (allUsers || []).filter(u => u.role !== 'admin' && u.role !== 'host' && u.role !== 'parent');
        
        const linkedStudentIds = new Set();
        this.boundParents = parents.map(parent => {
          const children = students.filter(s => allLinks.some(l => l.parent_id === parent.id && l.student_id === s.id));
          children.forEach(c => linkedStudentIds.add(c.id));
          return { ...parent, children };
        }).filter(p => p.children.length > 0);
        
        this.unlinkedStudents = students.filter(s => !linkedStudentIds.has(s.id));
      } catch(e) { console.error('Ошибка загрузки:', e); }
    },
    
    async toggleRole(user) {
      const newRole = user.role === 'student' ? 'parent' : 'student';
      try {
        await axios.put(`/api/users/${user.id}/role`, { role: newRole });
        user.role = newRole;
        this.addToast(`Роль изменена на ${newRole === 'student' ? 'ученик' : 'родитель'}`, 'success');
        await this.loadData();
      } catch(e) {
        this.addToast('Ошибка смены роли', 'error');
      }
    },
    
    openBindModal(student) { this.bindTargetStudent = student; this.showBindModal = true; this.parentSearch = ''; this.searchParentsForBind(); },
    async searchParentsForBind() { try { const r = await axios.get(`/api/users?q=${this.parentSearch || ''}`); this.parentSearchResults = (r.data || []).filter(u => u.role === 'parent'); } catch(e) {} },
    async bindStudent(parent) { try { await axios.post('/api/parent/bind', { student_id: this.bindTargetStudent.id, parent_id: parent.id }); this.showBindModal = false; this.addToast('Привязано!', 'success'); await this.loadData(); } catch(e) { this.addToast(e.response?.status === 409 ? 'Уже привязан' : 'Ошибка', e.response?.status === 409 ? 'info' : 'error'); if (e.response?.status === 409) { this.showBindModal = false; await this.loadData(); } } },
    confirmUnlink(student, parent) { this.unlinkStudent = student; this.unlinkParent = parent; this.showUnlinkConfirm = true; },
    async doUnlink() { try { await axios.delete(`/api/parent/unbind/${this.unlinkStudent.id}/${this.unlinkParent.id}`); this.showUnlinkConfirm = false; this.addToast('Отвязан', 'info'); await this.loadData(); } catch(e) { this.addToast('Ошибка', 'error'); } },
    
    async searchQuickParents() { if (this.quickParentSearch.length < 2) { this.quickParentResults = []; return; } try { const r = await axios.get(`/api/users?q=${this.quickParentSearch}`); this.quickParentResults = (r.data || []).filter(u => u.role === 'parent'); } catch(e) {} },
    async searchQuickStudents() { if (this.quickStudentSearch.length < 2) { this.quickStudentResults = []; return; } try { const r = await axios.get(`/api/users?q=${this.quickStudentSearch}`); this.quickStudentResults = (r.data || []).filter(u => u.role !== 'admin' && u.role !== 'host' && u.role !== 'parent'); } catch(e) {} },
    selectQuickParent(p) { this.selectedQuickParent = p; this.quickParentSearch = p.username; this.quickParentResults = []; },
    selectQuickStudent(s) { this.selectedQuickStudent = s; this.quickStudentSearch = s.username; this.quickStudentResults = []; },
    async quickBind() { if (!this.selectedQuickParent || !this.selectedQuickStudent) return; try { await axios.post('/api/parent/bind', { student_id: this.selectedQuickStudent.id, parent_id: this.selectedQuickParent.id }); this.addToast('Привязано!', 'success'); this.quickParentSearch = ''; this.quickStudentSearch = ''; this.selectedQuickParent = null; this.selectedQuickStudent = null; await this.loadData(); } catch(e) { this.addToast(e.response?.status === 409 ? 'Уже привязан' : 'Ошибка', 'info'); } }
  }
};
</script>

<style scoped>
.students-page { display: flex; flex-direction: column; gap: 28px; color: #e2e8f0; }
.page-header { margin-bottom: 4px; }
.page-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0; }
.header-line { height: 3px; width: 60px; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; margin-top: 8px; }
.section { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; }
.section-title { display: flex; align-items: center; gap: 8px; font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; font-weight: 700; margin: 0 0 16px; color: #fff; }
.section-title.earned { color: #10b981; }
.section-title.locked { color: #94a3b8; }
.family-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
@media (max-width: 768px) { .family-grid { grid-template-columns: 1fr; } }
.family-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 20px; transition: all 0.3s; }
.family-card:hover { box-shadow: 0 0 25px rgba(251,191,36,0.15); border-color: rgba(251,191,36,0.3); }
.family-parent { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.parent-name { font-weight: 600; color: #fff; font-size: 0.95rem; }
.family-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 12px 0; }
.family-children { display: flex; flex-direction: column; gap: 8px; }
.child-row { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 12px; transition: background 0.2s; }
.child-row:hover { background: rgba(255,255,255,0.03); }
.child-info { flex: 1; }
.child-name { font-size: 0.85rem; color: #fff; font-weight: 500; }
.unlinked-list { display: flex; flex-direction: column; gap: 6px; }
.unlinked-row { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; transition: background 0.2s; }
.unlinked-row:hover { background: rgba(255,255,255,0.03); }
.role-badge { font-size: 0.65rem; padding: 2px 8px; border-radius: 8px; font-weight: 600; }
.parent-badge { background: rgba(251,191,36,0.15); color: #fbbf24; }
.student-badge { background: rgba(99,102,241,0.15); color: #818cf8; }
.gold-border { border: 2px solid rgba(251,191,36,0.4); }
.purple-border { border: 2px solid rgba(99,102,241,0.4); }
.role-btn, .role-btn-sm { display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; color: #818cf8; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
.role-btn:hover, .role-btn-sm:hover { background: rgba(99,102,241,0.25); }
.role-btn-sm { padding: 4px 8px; font-size: 0.8rem; }
.feedback-btn, .feedback-btn-sm { display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3); border-radius: 8px; color: #fbbf24; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
.feedback-btn:hover, .feedback-btn-sm:hover { background: rgba(251,191,36,0.25); }
.feedback-btn-sm { padding: 4px 8px; font-size: 0.8rem; }
.unlink-btn { display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #ef4444; cursor: pointer; font-size: 0.75rem; font-weight: 600; }
.unlink-btn:hover { background: rgba(239,68,68,0.2); }
.link-btn { display: flex; align-items: center; gap: 4px; padding: 6px 14px; background: linear-gradient(135deg, #6366f1, #2dd4bf); border: none; border-radius: 10px; color: #fff; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
.link-btn:hover { opacity: 0.9; }
.quick-bind { position: relative; }
.quick-bind-row { display: flex; gap: 8px; }
.quick-input { flex: 1; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 0.85rem; outline: none; }
.quick-input:focus { border-color: #6366f1; }
.quick-bind-btn { display: flex; align-items: center; gap: 6px; padding: 10px 18px; background: linear-gradient(135deg, #6366f1, #2dd4bf); border: none; border-radius: 10px; color: #fff; cursor: pointer; font-weight: 600; font-size: 0.85rem; white-space: nowrap; }
.quick-bind-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.quick-results { display: flex; gap: 8px; margin-top: 4px; }
.quick-dropdown { flex: 1; max-height: 150px; overflow-y: auto; background: rgba(20,20,40,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; }
.quick-item { padding: 8px 12px; cursor: pointer; font-size: 0.8rem; color: #94a3b8; }
.quick-item:hover, .quick-item.selected { background: rgba(99,102,241,0.1); color: #fff; }
.modal-overlay { position: fixed; inset: 0; z-index: 5000; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; }
.modal-card { background: rgba(20,20,40,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 28px; max-width: 420px; width: 90%; color: #fff; animation: modalPop 0.3s ease; }
@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem; margin: 0 0 16px; }
.modal-card p { color: #94a3b8; margin-bottom: 16px; }
.modal-input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 0.85rem; outline: none; margin-bottom: 12px; }
.modal-list { max-height: 200px; overflow-y: auto; margin-bottom: 12px; }
.modal-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; cursor: pointer; }
.modal-item:hover { background: rgba(255,255,255,0.05); }
.modal-item-name { font-size: 0.85rem; color: #fff; }
.modal-close-btn { width: 100%; padding: 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; cursor: pointer; font-size: 0.85rem; margin-top: 8px; }
.modal-actions { display: flex; gap: 8px; }
.empty-text { text-align: center; color: #64748b; padding: 20px; font-size: 0.85rem; }
</style>
