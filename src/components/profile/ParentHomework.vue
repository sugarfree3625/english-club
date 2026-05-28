<template>
  <div class="parent-homework">
    <!-- Заголовок -->
    <div class="page-header">
      <h2>📋 Задания детей</h2>
      <div class="header-line"></div>
    </div>

    <!-- Переключатель между детьми -->
    <div class="child-switcher" v-if="children.length">
      <button
        v-for="child in children"
        :key="child.id"
        class="child-btn"
        :class="{ active: selectedChild?.id === child.id }"
        @click="selectChild(child)"
      >
        <AppAvatar :src="child.avatar_url" :name="child.username" :size="32" />
        <span>{{ child.username }}</span>
        <span class="child-task-count">{{ getChildCount(child.id) }}</span>
      </button>
    </div>
    <div v-else class="empty-section">
      <p class="empty-text">Нет привязанных детей</p>
    </div>

    <!-- Табы-фильтры -->
    <div class="tabs-row" v-if="selectedChild">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span class="tab-count">{{ getCount(tab.key) }}</span>
      </button>
    </div>

    <!-- Список заданий -->
    <div class="homework-list" v-if="selectedChild && filteredHomework.length">
      <div
        v-for="h in filteredHomework"
        :key="h.id"
        class="hw-card"
        :class="{ completed: h.status === 'completed', overdue: isOverdue(h) }"
      >
        <div class="hw-card-header">
          <div class="hw-type-badge">{{ typeIcon(h.type) }} {{ typeLabel(h.type) }}</div>
          <span class="hw-status-badge" :class="h.status">{{ statusLabel(h.status) }}</span>
        </div>

        <div class="hw-card-body">
          <h3>{{ h.title }}</h3>
          <p v-if="h.description" class="hw-desc">{{ h.description }}</p>
          <div class="hw-meta">
            <span v-if="h.due_date" class="hw-due" :class="{ overdue: isOverdue(h) }">
              📅 {{ formatDate(h.due_date) }}
            </span>
            <span class="hw-xp">🎯 {{ h.experience || 50 }} XP</span>
          </div>

          <!-- Оценка -->
          <div v-if="h.grade" class="grade-row">
            ⭐ {{ h.grade }}/{{ h.max_grade || 10 }}
          </div>
          <div v-if="h.teacher_comment" class="teacher-comment">
            💬 {{ h.teacher_comment }}
          </div>
        </div>

        <div class="hw-card-actions">
          <!-- Кнопка Напомнить -->
          <button
            v-if="h.status !== 'completed'"
            class="action-btn remind-btn"
            :class="{ reminded: remindedTasks.has(h.id) }"
            @click="remindChild(h)"
          >
            {{ remindedTasks.has(h.id) ? '✅ Напомнили!' : '🔔 Напомнить' }}
          </button>

          <!-- Смотреть -->
          <button class="action-btn view-btn" @click="viewHomework(h)">
            👁 Смотреть
          </button>
        </div>
      </div>
    </div>

    <!-- Пусто -->
    <div v-else-if="selectedChild" class="empty-section">
      <div class="empty-icon">📭</div>
      <p class="empty-text">Нет заданий в этой категории</p>
    </div>

    <!-- МОДАЛКА ПРОСМОТРА -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="viewingHomework" class="modal-overlay" @click.self="viewingHomework = null">
          <div class="modal-card" style="max-width: 500px;">
            <h2>{{ viewingHomework.title }}</h2>
            <p class="modal-student">👨‍🎓 {{ selectedChild?.username }}</p>
            <p v-if="viewingHomework.description">{{ viewingHomework.description }}</p>

            <div class="modal-info">
              <div v-if="viewingHomework.due_date">
                📅 {{ formatDate(viewingHomework.due_date) }}
                <span v-if="isOverdue(viewingHomework)" class="overdue-text">(просрочено!)</span>
              </div>
              <div>🎯 {{ viewingHomework.experience || 50 }} XP</div>
              <div>📊 Статус: {{ statusLabel(viewingHomework.status) }}</div>
            </div>

            <div v-if="viewingHomework.grade" class="grade-display">
              ⭐ Оценка: {{ viewingHomework.grade }}/{{ viewingHomework.max_grade || 10 }}
            </div>
            <p v-if="viewingHomework.teacher_comment" class="teacher-comment">
              💬 {{ viewingHomework.teacher_comment }}
            </p>
            <p v-if="viewingHomework.student_answer" class="answer-text">
              📤 Ответ: {{ viewingHomework.student_answer }}
            </p>

            <button class="btn btn-o w-100 mt-2" @click="viewingHomework = null">Закрыть</button>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios';
import AppAvatar from '../AppAvatar.vue';

export default {
  name: 'ParentHomework',
  components: { AppAvatar },
  inject: ['addToast'],
  data() {
    return {
      children: [],
      selectedChild: null,
      activeTab: 'all',
      allHomework: [],
      viewingHomework: null,
      remindedTasks: new Set()
    };
  },
  computed: {
    tabs() {
      return [
        { key: 'all', icon: '📋', label: 'Все' },
        { key: 'assigned', icon: '📝', label: 'Новые' },
        { key: 'in_progress', icon: '🔄', label: 'В работе' },
        { key: 'submitted', icon: '📤', label: 'На проверке' },
        { key: 'completed', icon: '✅', label: 'Выполнено' }
      ];
    },
    childHomework() {
      if (!this.selectedChild) return [];
      return this.allHomework.filter(h => h.student_id === this.selectedChild.id);
    },
    filteredHomework() {
      if (this.activeTab === 'all') return this.childHomework;
      return this.childHomework.filter(h => h.status === this.activeTab);
    }
  },
  async mounted() {
    await this.loadChildren();
  },
  methods: {
    async loadChildren() {
      try {
        const { data } = await axios.get('/api/parent/students');
        this.children = data || [];
        if (this.children.length) {
          this.selectChild(this.children[0]);
        }
      } catch(e) {}
    },

    async selectChild(child) {
      this.selectedChild = child;
      this.activeTab = 'all';
      await this.loadChildHomework();
    },

    async loadChildHomework() {
      try {
        const { data } = await axios.get('/api/homework/children');
        this.allHomework = data || [];
      } catch(e) {}
    },

    getChildCount(childId) {
      return this.allHomework.filter(h => h.student_id === childId && h.status !== 'completed').length;
    },

    getCount(tabKey) {
      if (tabKey === 'all') return this.childHomework.length;
      return this.childHomework.filter(h => h.status === tabKey).length;
    },

    typeIcon(t) { const i = { homework:'📝', test:'🎯', essay:'📄', audio:'🎤' }; return i[t]||'📝'; },
    typeLabel(t) { const l = { homework:'Домашка', test:'Тест', essay:'Эссе', audio:'Аудио' }; return l[t]||t; },
    statusLabel(s) { const l = { assigned:'Назначено', in_progress:'В работе', submitted:'На проверке', completed:'Выполнено' }; return l[s]||s; },
    isOverdue(h) { return h.due_date && new Date(h.due_date) < new Date() && h.status !== 'completed'; },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('ru', { day:'numeric', month:'short' }) : ''; },

    remindChild(h) {
      this.remindedTasks.add(h.id);
      this.addToast(`🔔 Напоминание отправлено ученику!`, 'info');
      setTimeout(() => { this.remindedTasks.delete(h.id); }, 5000);
    },

    viewHomework(h) {
      this.viewingHomework = h;
    }
  }
};
</script>

<style scoped>
.parent-homework { display: flex; flex-direction: column; gap: 20px; color: #e2e8f0; }

.page-header { margin-bottom: 4px; }
.page-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; }
.header-line { height: 3px; width: 60px; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; margin-top: 8px; }

/* Переключатель детей */
.child-switcher { display: flex; gap: 8px; flex-wrap: wrap; }
.child-btn { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; font-family: inherit; }
.child-btn:hover { border-color: rgba(99,102,241,0.3); color: #fff; }
.child-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1)); border-color: rgba(99,102,241,0.5); color: #fff; }
.child-task-count { padding: 2px 8px; background: rgba(239,68,68,0.15); color: #ef4444; border-radius: 8px; font-size: 0.7rem; font-weight: 700; }

/* Табы */
.tabs-row { display: flex; gap: 6px; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.2s; font-family: inherit; }
.tab-btn:hover { border-color: rgba(99,102,241,0.3); color: #fff; }
.tab-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1)); border-color: rgba(99,102,241,0.5); color: #fff; box-shadow: 0 0 15px rgba(99,102,241,0.2); }
.tab-count { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; background: rgba(255,255,255,0.08); }

/* Список */
.homework-list { display: flex; flex-direction: column; gap: 10px; }
.hw-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; transition: all 0.3s; }
.hw-card:hover { border-color: rgba(99,102,241,0.3); }
.hw-card.completed { opacity: 0.8; border-left: 3px solid #10b981; }
.hw-card.overdue { border-left: 3px solid #ef4444; }

.hw-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.hw-type-badge { font-size: 0.75rem; color: #94a3b8; }
.hw-status-badge { padding: 3px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; }
.hw-status-badge.assigned { background: rgba(99,102,241,0.15); color: #818cf8; }
.hw-status-badge.in_progress { background: rgba(251,191,36,0.15); color: #fbbf24; }
.hw-status-badge.submitted { background: rgba(99,102,241,0.15); color: #818cf8; }
.hw-status-badge.completed { background: rgba(16,185,129,0.2); color: #34d399; }

.hw-card-body h3 { color: #fff; font-size: 0.95rem; margin: 0 0 4px; font-family: 'Space Grotesk', sans-serif; }
.hw-desc { color: #94a3b8; font-size: 0.8rem; margin: 0 0 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hw-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 0.75rem; color: #94a3b8; }
.hw-due.overdue { color: #ef4444; font-weight: 600; }
.grade-row { margin-top: 8px; color: #fbbf24; font-weight: 700; font-size: 0.9rem; }
.teacher-comment { margin-top: 8px; padding: 8px 12px; background: rgba(16,185,129,0.08); border-radius: 8px; color: #10b981; font-size: 0.8rem; font-style: italic; }

.hw-card-actions { display: flex; gap: 8px; margin-top: 12px; }
.action-btn { display: flex; align-items: center; gap: 4px; padding: 8px 16px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.remind-btn { background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3); color: #fbbf24; }
.remind-btn:hover { background: rgba(251,191,36,0.25); }
.remind-btn.reminded { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #10b981; }
.view-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; }
.view-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

.empty-section { text-align: center; padding: 48px 24px; }
.empty-icon { font-size: 3rem; }
.empty-text { color: #64748b; margin-top: 8px; }

/* Модалка */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: rgba(15,15,30,0.98); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 28px; width: 100%; max-height: 85vh; overflow-y: auto; color: #e2e8f0; animation: modalPop 0.3s ease; }
@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h2 { font-family: 'Space Grotesk', sans-serif; color: #fff; margin: 0 0 4px; }
.modal-student { color: #818cf8; font-size: 0.85rem; margin: 0 0 12px; }
.modal-info { display: flex; flex-direction: column; gap: 6px; margin: 12px 0; font-size: 0.85rem; color: #94a3b8; }
.overdue-text { color: #ef4444; font-weight: 600; }
.grade-display { font-size: 1.1rem; color: #fbbf24; font-weight: 700; margin: 8px 0; }
.answer-text { color: #cbd5e1; margin: 8px 0; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.w-100 { width: 100%; }
.mt-2 { margin-top: 10px; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
