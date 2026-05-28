<template>
  <div class="student-homework">
    <!-- Заголовок -->
    <div class="page-header">
      <h2>📋 Мои задания</h2>
      <div class="header-line"></div>
    </div>

    <!-- Табы-фильтры -->
    <div class="tabs-row">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span class="tab-count" :class="tab.key">{{ counts[tab.key] }}</span>
      </button>
    </div>

    <!-- Прогресс -->
    <div class="progress-section" v-if="homework.length">
      <div class="progress-header">
        <span>Прогресс выполнения</span>
        <span>{{ completedPercent }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: completedPercent + '%' }"></div>
      </div>
    </div>

    <!-- Список заданий -->
    <div class="homework-list" v-if="filteredHomework.length">
      <div
        v-for="h in filteredHomework"
        :key="h.id"
        class="hw-card"
        :class="{ 
          'in-progress': h.status === 'in_progress',
          'submitted': h.status === 'submitted',
          'completed': h.status === 'completed'
        }"
      >
        <!-- Шапка -->
        <div class="hw-card-header">
          <div class="hw-type-badge">{{ typeIcon(h.type) }} {{ typeLabel(h.type) }}</div>
          <span class="hw-status-badge" :class="h.status">{{ statusLabel(h.status) }}</span>
        </div>

        <!-- Тело -->
        <div class="hw-card-body">
          <h3>{{ h.title }}</h3>
          <p v-if="h.description" class="hw-desc">{{ h.description }}</p>
          <div class="hw-meta">
            <span v-if="h.due_date" class="hw-due" :class="{ overdue: isOverdue(h) }">
              📅 {{ formatDate(h.due_date) }}
            </span>
            <span class="hw-xp">🎯 {{ h.experience || 50 }} XP</span>
            <span v-if="h.grade" class="hw-grade">⭐ {{ h.grade }}/{{ h.max_grade || 10 }}</span>
          </div>

          <!-- Прогресс-бар (если в работе) -->
          <div v-if="h.status === 'in_progress'" class="mini-progress">
            <div class="mini-progress-bar">
              <div class="mini-progress-fill" :style="{ width: '50%' }"></div>
            </div>
            <span class="mini-progress-text">В процессе...</span>
          </div>

          <!-- Комментарий учителя -->
          <div v-if="h.teacher_comment && h.status === 'completed'" class="teacher-comment">
            💬 {{ h.teacher_comment }}
          </div>
        </div>

        <!-- Действия -->
        <div class="hw-card-actions">
          <!-- Назначено → Начать -->
          <button
            v-if="h.status === 'assigned'"
            class="action-btn start-btn"
            @click="startHomework(h)"
          >
            ▶️ Начать
          </button>

          <!-- В работе → Отправить -->
          <template v-if="h.status === 'in_progress'">
            <button class="action-btn send-btn" @click="openSendModal(h)">
              📤 Отправить
            </button>
          </template>

          <!-- На проверке → ждёт (мигает) -->
          <button
            v-if="h.status === 'submitted'"
            class="action-btn waiting-btn"
            disabled
          >
            ⏳ Ожидает проверки
          </button>

          <!-- Выполнено → Смотреть -->
          <button
            v-if="h.status === 'completed'"
            class="action-btn view-btn"
            @click="viewHomework(h)"
          >
            👁 Смотреть
          </button>
        </div>
      </div>
    </div>

    <!-- Пусто -->
    <div v-else class="empty-section">
      <div class="empty-icon">📭</div>
      <p class="empty-text">Нет заданий</p>
    </div>

    <!-- МОДАЛКА ОТПРАВКИ -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="sendingHomework" class="modal-overlay" @click.self="sendingHomework = null">
          <div class="modal-card" style="max-width: 500px;">
            <h2>📤 Отправить задание</h2>
            <p class="modal-subtitle">{{ sendingHomework.title }}</p>

            <div class="form-group">
              <label>Текст ответа</label>
              <textarea
                class="input"
                v-model="sendAnswer"
                rows="4"
                placeholder="Введите ваш ответ..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>Прикрепить файл</label>
              <input
                type="file"
                ref="fileInput"
                @change="onFileSelected"
                class="file-input-hidden"
                accept=".pdf,.jpg,.jpeg,.png,.mp3,.wav,.ogg,.doc,.docx"
              />
              <button class="btn btn-o btn-sm w-100" @click="$refs.fileInput.click()">
                📎 Выбрать файл
              </button>
              <div v-if="selectedFile" class="file-preview">
                📄 {{ selectedFile.name }}
                <button class="remove-file" @click="selectedFile = null">✕</button>
              </div>
            </div>

            <button
              class="btn btn-p w-100 mt-2"
              @click="submitHomework"
              :disabled="!sendAnswer || sending"
            >
              {{ sending ? 'Отправка...' : '📤 Отправить на проверку' }}
            </button>
            <button class="btn btn-o w-100 mt-2" @click="sendingHomework = null">Отмена</button>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- МОДАЛКА ПРОСМОТРА -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="viewingHomework" class="modal-overlay" @click.self="viewingHomework = null">
          <div class="modal-card" style="max-width: 500px;">
            <h2>{{ viewingHomework.title }}</h2>
            <p v-if="viewingHomework.description">{{ viewingHomework.description }}</p>
            <div v-if="viewingHomework.grade" class="grade-display">
              ⭐ {{ viewingHomework.grade }}/{{ viewingHomework.max_grade || 10 }}
            </div>
            <p v-if="viewingHomework.teacher_comment" class="teacher-comment">
              💬 {{ viewingHomework.teacher_comment }}
            </p>
            <p v-if="viewingHomework.student_answer" class="answer-text">
              📤 Ваш ответ: {{ viewingHomework.student_answer }}
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

export default {
  name: 'StudentHomework',
  inject: ['addToast'],
  data() {
    return {
      activeTab: 'all',
      homework: [],
      sendingHomework: null,
      viewingHomework: null,
      sendAnswer: '',
      selectedFile: null,
      sending: false
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
    counts() {
      return {
        all: this.homework.length,
        assigned: this.homework.filter(h => h.status === 'assigned').length,
        in_progress: this.homework.filter(h => h.status === 'in_progress').length,
        submitted: this.homework.filter(h => h.status === 'submitted').length,
        completed: this.homework.filter(h => h.status === 'completed').length
      };
    },
    filteredHomework() {
      if (this.activeTab === 'all') return this.homework;
      return this.homework.filter(h => h.status === this.activeTab);
    },
    completedPercent() {
      if (!this.homework.length) return 0;
      return Math.round((this.counts.completed / this.homework.length) * 100);
    }
  },
  async mounted() {
    await this.loadHomework();
  },
  methods: {
    async loadHomework() {
      try {
        const { data } = await axios.get('/api/homework/my');
        this.homework = data || [];
      } catch(e) {}
    },

    typeIcon(t) { const i = { homework:'📝', test:'🎯', essay:'📄', audio:'🎤' }; return i[t]||'📝'; },
    typeLabel(t) { const l = { homework:'Домашка', test:'Тест', essay:'Эссе', audio:'Аудио' }; return l[t]||t; },
    statusLabel(s) { const l = { assigned:'Назначено', in_progress:'В работе', submitted:'На проверке', completed:'Выполнено' }; return l[s]||s; },
    isOverdue(h) { return h.due_date && new Date(h.due_date) < new Date() && h.status !== 'completed'; },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('ru', { day:'numeric', month:'short' }) : ''; },

    async startHomework(h) {
      try {
        await axios.put(`/api/homework/${h.id}`, { status: 'in_progress' });
        this.addToast('Приступил к заданию! 🔄', 'success');
        await this.loadHomework();
      } catch(e) {
        this.addToast('Ошибка', 'error');
      }
    },

    openSendModal(h) {
      this.sendingHomework = h;
      this.sendAnswer = '';
      this.selectedFile = null;
    },

    onFileSelected(e) {
      this.selectedFile = e.target.files[0] || null;
    },

    async submitHomework() {
      if (!this.sendAnswer) return;
      this.sending = true;
      try {
        await axios.put(`/api/homework/${this.sendingHomework.id}`, {
          student_answer: this.sendAnswer,
          status: 'submitted'
        });
        this.sendingHomework = null;
        this.addToast('Отправлено на проверку! 📤', 'success');
        await this.loadHomework();
      } catch(e) {
        this.addToast('Ошибка', 'error');
      } finally {
        this.sending = false;
      }
    },

    viewHomework(h) {
      this.viewingHomework = h;
    }
  }
};
</script>

<style scoped>
.student-homework { display: flex; flex-direction: column; gap: 20px; color: #e2e8f0; }

.page-header { margin-bottom: 4px; }
.page-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; }
.header-line { height: 3px; width: 60px; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; margin-top: 8px; }

/* Табы */
.tabs-row { display: flex; gap: 6px; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.2s; font-family: inherit; }
.tab-btn:hover { border-color: rgba(99,102,241,0.3); color: #fff; }
.tab-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1)); border-color: rgba(99,102,241,0.5); color: #fff; box-shadow: 0 0 15px rgba(99,102,241,0.2); }
.tab-count { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; background: rgba(255,255,255,0.08); }

/* Прогресс */
.progress-section { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; }
.progress-header { display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; }
.progress-bar { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 4px; transition: width 0.6s ease; }

/* Список */
.homework-list { display: flex; flex-direction: column; gap: 10px; }
.hw-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; transition: all 0.3s; }
.hw-card:hover { border-color: rgba(99,102,241,0.3); }
.hw-card.in-progress { border-left: 3px solid #fbbf24; }
.hw-card.submitted { border-left: 3px solid #6366f1; }
.hw-card.completed { border-left: 3px solid #10b981; opacity: 0.85; }

.hw-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.hw-type-badge { font-size: 0.75rem; color: #94a3b8; }
.hw-status-badge { padding: 3px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; }
.hw-status-badge.assigned { background: rgba(99,102,241,0.15); color: #818cf8; }
.hw-status-badge.in_progress { background: rgba(251,191,36,0.15); color: #fbbf24; }
.hw-status-badge.submitted { background: rgba(99,102,241,0.15); color: #818cf8; }
.hw-status-badge.completed { background: rgba(16,185,129,0.2); color: #34d399; }

.hw-card-body h3 { color: #fff; font-size: 0.95rem; margin: 0 0 4px; font-family: 'Space Grotesk', sans-serif; }
.hw-desc { color: #94a3b8; font-size: 0.8rem; margin: 0 0 8px; line-height: 1.4; }
.hw-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px; }
.hw-due.overdue { color: #ef4444; font-weight: 600; }
.hw-grade { color: #fbbf24; font-weight: 700; }

.mini-progress { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.mini-progress-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
.mini-progress-fill { height: 100%; background: #fbbf24; border-radius: 2px; animation: progressPulse 1.5s ease-in-out infinite; }
@keyframes progressPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.mini-progress-text { font-size: 0.7rem; color: #fbbf24; }

.teacher-comment { margin-top: 8px; padding: 8px 12px; background: rgba(16,185,129,0.08); border-radius: 8px; color: #10b981; font-size: 0.8rem; font-style: italic; }

.hw-card-actions { display: flex; gap: 8px; margin-top: 12px; }
.action-btn { display: flex; align-items: center; gap: 4px; padding: 8px 16px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.start-btn { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.start-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99,102,241,0.3); }
.send-btn { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #10b981; }
.send-btn:hover { background: rgba(16,185,129,0.25); }
.waiting-btn { background: rgba(99,102,241,0.1); color: #818cf8; animation: blink 2s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.view-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; }
.view-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

.empty-section { text-align: center; padding: 48px 24px; }
.empty-icon { font-size: 3rem; }
.empty-text { color: #64748b; margin-top: 8px; }

/* Модалки */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: rgba(15,15,30,0.98); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 28px; width: 100%; max-height: 85vh; overflow-y: auto; color: #e2e8f0; animation: modalPop 0.3s ease; }
@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h2 { font-family: 'Space Grotesk', sans-serif; color: #fff; margin: 0 0 4px; }
.modal-subtitle { color: #94a3b8; font-size: 0.85rem; margin: 0 0 16px; }

.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; font-weight: 600; }

.input { width: 100%; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.04); color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; resize: vertical; }
.input:focus { border-color: #6366f1; }

.file-input-hidden { display: none; }
.file-preview { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding: 8px 12px; background: rgba(99,102,241,0.1); border-radius: 8px; color: #818cf8; font-size: 0.8rem; }
.remove-file { background: none; border: none; color: #ef4444; cursor: pointer; margin-left: auto; }

.grade-display { font-size: 1.2rem; color: #fbbf24; font-weight: 700; margin: 8px 0; }
.answer-text { color: #cbd5e1; margin: 8px 0; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.btn-sm { padding: 7px 14px; font-size: 0.78rem; }
.w-100 { width: 100%; }
.mt-2 { margin-top: 10px; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
