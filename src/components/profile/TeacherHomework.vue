<template>
  <div class="teacher-homework">
    <!-- Заголовок -->
    <div class="page-header">
      <h2>📋 Все задания</h2>
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

    <!-- Поиск -->
    <div class="search-row">
      <input
        class="search-input"
        v-model="searchQuery"
        placeholder="🔍 Поиск по ученику или названию..."
      />
    </div>

    <!-- Список заданий -->
    <div class="homework-grid" v-if="filteredHomework.length">
      <div
        v-for="h in filteredHomework"
        :key="h.id"
        class="hw-card"
        :class="{ 'has-response': h.status === 'submitted' }"
      >
        <div class="hw-card-header">
          <AppAvatar :src="h.student_avatar" :name="h.student_name" :size="40" />
          <div class="hw-card-user">
            <strong>{{ h.student_name }}</strong>
            <small>{{ formatDate(h.created_at) }}</small>
          </div>
          <span class="hw-status-badge" :class="h.status">{{ statusLabel(h.status) }}</span>
        </div>

        <div class="hw-card-body">
          <div class="hw-type">{{ typeIcon(h.type) }} {{ typeLabel(h.type) }}</div>
          <h3>{{ h.title }}</h3>
          <p v-if="h.description" class="hw-desc">{{ h.description }}</p>
          <div class="hw-meta">
            <span v-if="h.due_date" class="hw-due" :class="{ overdue: isOverdue(h) }">
              📅 {{ formatDate(h.due_date) }}
            </span>
            <span class="hw-xp">🎯 {{ h.experience || 50 }} XP</span>
            <span v-if="h.grade" class="hw-grade">⭐ {{ h.grade }}/{{ h.max_grade || 10 }}</span>
          </div>
        </div>

        <div class="hw-card-actions">
          <button class="action-btn" @click="openEditModal(h)" title="Редактировать">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn" @click="confirmDelete(h)" title="Удалить">
            <i class="fas fa-trash"></i>
          </button>
          <button
            v-if="h.status === 'submitted'"
            class="action-btn review-btn pulse"
            @click="openReviewModal(h)"
            title="Проверить"
          >
            <i class="fas fa-check-circle"></i> Проверить
          </button>
          <button v-else class="action-btn" @click="openViewModal(h)" title="Смотреть">
            <i class="fas fa-eye"></i>
          </button>
        </div>

        <div v-if="h.student_answer && h.status === 'submitted'" class="student-answer-preview">
          <i class="fas fa-file-alt"></i> Ответ прикреплён
        </div>
      </div>
    </div>

    <div v-else class="empty-section">
      <div class="empty-icon">📭</div>
      <p class="empty-text">Нет заданий в этой категории</p>
    </div>

    <!-- МОДАЛКА ПРОВЕРКИ -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="reviewingHomework" class="modal-overlay" @click.self="reviewingHomework = null">
          <div class="modal-card review-modal">
            <div class="modal-header">
              <h2>🔍 Проверка задания</h2>
              <button class="close-btn" @click="reviewingHomework = null">✕</button>
            </div>

            <div class="review-info">
              <div class="review-student">
                <AppAvatar :src="reviewingHomework.student_avatar" :name="reviewingHomework.student_name" :size="48" />
                <div>
                  <strong>{{ reviewingHomework.student_name }}</strong>
                  <small>{{ reviewingHomework.title }}</small>
                </div>
              </div>
              <div class="review-meta">
                <span>{{ typeIcon(reviewingHomework.type) }} {{ typeLabel(reviewingHomework.type) }}</span>
                <span>📅 {{ formatDate(reviewingHomework.due_date) || 'Без дедлайна' }}</span>
              </div>
            </div>

            <div class="review-section" v-if="reviewingHomework.description">
              <h4>📋 Текст задания</h4>
              <p>{{ reviewingHomework.description }}</p>
            </div>

            <div class="review-section answer-section" v-if="reviewingHomework.student_answer">
              <h4>📤 Ответ ученика</h4>
              <div class="answer-content">
                <p>{{ reviewingHomework.student_answer }}</p>
              </div>
              <div v-if="reviewingHomework.answer_attachment_url" class="attachment-preview">
                <div v-if="isImage(reviewingHomework.answer_attachment_url)" class="image-preview">
                  <img :src="reviewingHomework.answer_attachment_url" alt="Файл ученика" />
                </div>
                <div v-else-if="isAudio(reviewingHomework.answer_attachment_url)" class="audio-preview">
                  <i class="fas fa-headphones"></i>
                  <audio controls :src="reviewingHomework.answer_attachment_url"></audio>
                </div>
                <div v-else class="file-preview">
                  <i class="fas fa-file-pdf"></i>
                  <a :href="reviewingHomework.answer_attachment_url" target="_blank">Открыть файл</a>
                </div>
              </div>
            </div>

            <div class="review-section">
              <h4>⭐ Оценка</h4>
              <div class="grade-input-row">
                <select class="grade-select" v-model="reviewGrade">
                  <option v-for="n in (reviewingHomework.max_grade || 10)" :key="n" :value="n">{{ n }}</option>
                </select>
                <span class="grade-max">/ {{ reviewingHomework.max_grade || 10 }}</span>
              </div>
              <textarea
                class="comment-input"
                v-model="reviewComment"
                rows="3"
                placeholder="Комментарий для ученика..."
              ></textarea>
            </div>

            <div class="review-actions">
              <button class="btn btn-accept" @click="acceptHomework">
                <i class="fas fa-check"></i> Принять (✅ Выполнено)
              </button>
              <button class="btn btn-return" @click="returnHomework">
                <i class="fas fa-undo"></i> Вернуть (🔄 В работу)
              </button>
            </div>

            <button class="btn btn-o w-100 mt-2" @click="reviewingHomework = null">Закрыть</button>
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
            <div class="view-info">
              <p v-if="viewingHomework.description">{{ viewingHomework.description }}</p>
              <p v-if="viewingHomework.grade">⭐ Оценка: {{ viewingHomework.grade }}/{{ viewingHomework.max_grade || 10 }}</p>
              <p v-if="viewingHomework.teacher_comment">💬 {{ viewingHomework.teacher_comment }}</p>
              <p v-if="viewingHomework.student_answer">📤 Ответ: {{ viewingHomework.student_answer }}</p>
            </div>
            <button class="btn btn-o w-100 mt-2" @click="viewingHomework = null">Закрыть</button>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- МОДАЛКА РЕДАКТИРОВАНИЯ -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="editingHomework" class="modal-overlay" @click.self="editingHomework = null">
          <div class="modal-card" style="max-width: 500px;">
            <h2>✏️ Редактировать задание</h2>
            <input class="input" v-model="editForm.title" placeholder="Название" />
            <textarea class="input" v-model="editForm.description" rows="3" placeholder="Описание"></textarea>
            <input class="input" v-model="editForm.due_date" type="date" />
            <button class="btn btn-p w-100 mt-2" @click="saveEdit" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
            <button class="btn btn-o w-100 mt-2" @click="editingHomework = null">Отмена</button>
          </div>
        </div>
      </transition>
    </Teleport>

    <ConfettiExplosion :active="showConfetti" />
  </div>
</template>

<script>
import axios from 'axios';
import AppAvatar from '../AppAvatar.vue';
import ConfettiExplosion from '../ConfettiExplosion.vue';

export default {
  name: 'TeacherHomework',
  components: { AppAvatar, ConfettiExplosion },
  inject: ['addToast'],
  data() {
    return {
      activeTab: 'all',
      searchQuery: '',
      homework: [],
      reviewingHomework: null,
      viewingHomework: null,
      editingHomework: null,
      editForm: { title: '', description: '', due_date: '' },
      saving: false,
      reviewGrade: 10,
      reviewComment: '',
      showConfetti: false
    };
  },
  computed: {
    tabs() {
      return [
        { key: 'all', icon: '📋', label: 'Все' },
        { key: 'assigned', icon: '📝', label: 'Назначено' },
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
      let list = this.homework;
      if (this.activeTab !== 'all') list = list.filter(h => h.status === this.activeTab);
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(h => (h.student_name || '').toLowerCase().includes(q) || (h.title || '').toLowerCase().includes(q));
      }
      return list;
    }
  },
  async mounted() { await this.loadHomework(); },
  methods: {
    async loadHomework() {
      try {
        const { data } = await axios.get('/api/homework/all');
        this.homework = data || [];
      } catch(e) {}
    },

    typeIcon(t) { const i = { homework:'📝', test:'🎯', essay:'📄', audio:'🎤' }; return i[t]||'📝'; },
    typeLabel(t) { const l = { homework:'Домашка', test:'Тест', essay:'Эссе', audio:'Аудио' }; return l[t]||t; },
    statusLabel(s) { const l = { assigned:'Назначено', in_progress:'В работе', submitted:'На проверке', completed:'Выполнено' }; return l[s]||s; },
    isOverdue(h) { return h.due_date && new Date(h.due_date) < new Date() && h.status !== 'completed'; },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('ru',{day:'numeric',month:'short',year:'numeric'}) : ''; },
    isImage(u) { return /\.(jpg|jpeg|png|gif|webp)$/i.test(u); },
    isAudio(u) { return /\.(mp3|wav|ogg)$/i.test(u); },

    openReviewModal(h) {
      this.reviewingHomework = h;
      this.reviewGrade = h.max_grade || 10;
      this.reviewComment = '';
    },
    openViewModal(h) { this.viewingHomework = h; },
    openEditModal(h) {
      this.editingHomework = h;
      this.editForm = { title: h.title || '', description: h.description || '', due_date: h.due_date ? h.due_date.split('T')[0] : '' };
    },
    async saveEdit() {
      this.saving = true;
      try {
        await axios.put(`/api/homework/${this.editingHomework.id}`, this.editForm);
        this.editingHomework = null;
        this.addToast('Обновлено! ✏️', 'success');
        await this.loadHomework();
      } catch(e) { this.addToast('Ошибка', 'error'); }
      finally { this.saving = false; }
    },
    async confirmDelete(h) {
      if (!confirm(`Удалить "${h.title}"?`)) return;
      try { await axios.delete(`/api/homework/${h.id}`); this.addToast('Удалено! 🗑', 'info'); await this.loadHomework(); }
      catch(e) { this.addToast('Ошибка', 'error'); }
    },

    // 🔥 ПРИНЯТЬ
    async acceptHomework() {
      try {
        await axios.put(`/api/homework/${this.reviewingHomework.id}`, {
          grade: this.reviewGrade,
          teacher_comment: this.reviewComment,
          status: 'completed'
        });
        this.reviewingHomework = null;
        this.showConfetti = true;
        this.addToast('✅ Принято!', 'success');
        await this.loadHomework();
        setTimeout(() => { this.showConfetti = false; }, 3000);
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },

    // 🔥 ВЕРНУТЬ (сброс оценки + фидбек)
    async returnHomework() {
      try {
        await axios.put(`/api/homework/${this.reviewingHomework.id}`, {
          teacher_comment: this.reviewComment || 'Требуется доработка',
          status: 'in_progress'
        });
        this.reviewingHomework = null;
        this.addToast('🔄 Возвращено на доработку. Фидбек создан!', 'info');
        await this.loadHomework();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    }
  }
};
</script>

<style scoped>
.teacher-homework { display: flex; flex-direction: column; gap: 20px; color: #e2e8f0; }
.page-header { margin-bottom: 4px; }
.page-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; }
.header-line { height: 3px; width: 60px; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; margin-top: 8px; }
.tabs-row { display: flex; gap: 6px; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.2s; font-family: inherit; }
.tab-btn:hover { border-color: rgba(99,102,241,0.3); color: #fff; }
.tab-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1)); border-color: rgba(99,102,241,0.5); color: #fff; box-shadow: 0 0 15px rgba(99,102,241,0.2); }
.tab-icon { font-size: 0.9rem; }
.tab-label { white-space: nowrap; }
.tab-count { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; background: rgba(255,255,255,0.08); }
.tab-count.submitted { background: rgba(16,185,129,0.15); color: #10b981; }
.tab-count.completed { background: rgba(16,185,129,0.2); color: #34d399; }
.search-row { }
.search-input { width: 100%; padding: 10px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.04); color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
.search-input:focus { border-color: #6366f1; }
.homework-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; }
@media (max-width: 768px) { .homework-grid { grid-template-columns: 1fr; } }
.hw-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; transition: all 0.3s; }
.hw-card:hover { border-color: rgba(99,102,241,0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.hw-card.has-response { border-color: rgba(16,185,129,0.3); box-shadow: 0 0 20px rgba(16,185,129,0.1); }
.hw-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.hw-card-user strong { color: #fff; font-size: 0.85rem; display: block; }
.hw-card-user small { color: #94a3b8; font-size: 0.7rem; }
.hw-status-badge { margin-left: auto; padding: 3px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; }
.hw-status-badge.assigned { background: rgba(99,102,241,0.15); color: #818cf8; }
.hw-status-badge.in_progress { background: rgba(251,191,36,0.15); color: #fbbf24; }
.hw-status-badge.submitted { background: rgba(16,185,129,0.15); color: #10b981; }
.hw-status-badge.completed { background: rgba(16,185,129,0.2); color: #34d399; }
.hw-card-body h3 { color: #fff; font-size: 0.95rem; margin: 0 0 4px; font-family: 'Space Grotesk', sans-serif; }
.hw-desc { color: #94a3b8; font-size: 0.8rem; margin: 0 0 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hw-type { color: #64748b; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 4px; }
.hw-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 0.75rem; color: #94a3b8; }
.hw-due.overdue { color: #ef4444; font-weight: 600; }
.hw-grade { color: #fbbf24; font-weight: 700; }
.hw-card-actions { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.action-btn { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.04); color: #94a3b8; cursor: pointer; font-size: 0.78rem; transition: all 0.2s; font-family: inherit; }
.action-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.action-btn.review-btn { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #10b981; font-weight: 600; }
.action-btn.review-btn:hover { background: rgba(16,185,129,0.25); }
.pulse { animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 50% { box-shadow: 0 0 20px 5px rgba(16,185,129,0.2); } }
.student-answer-preview { margin-top: 10px; padding: 8px 12px; background: rgba(16,185,129,0.08); border-radius: 8px; color: #10b981; font-size: 0.8rem; }
.empty-section { text-align: center; padding: 48px 24px; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-text { color: #64748b; }
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: rgba(15,15,30,0.98); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 28px; width: 100%; max-height: 85vh; overflow-y: auto; color: #e2e8f0; animation: modalPop 0.3s ease; }
@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.review-modal { max-width: 600px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; color: #fff; margin: 0; }
.close-btn { background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
.close-btn:hover { color: #fff; }
.review-info { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.review-student { display: flex; align-items: center; gap: 10px; }
.review-student strong { color: #fff; display: block; }
.review-student small { color: #94a3b8; }
.review-meta { display: flex; gap: 12px; font-size: 0.8rem; color: #94a3b8; }
.review-section { margin-bottom: 16px; }
.review-section h4 { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; margin: 0 0 8px; }
.review-section p { color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; margin: 0; }
.answer-section { background: rgba(99,102,241,0.06); padding: 14px; border-radius: 14px; border: 1px solid rgba(99,102,241,0.15); }
.answer-content { margin-bottom: 10px; }
.attachment-preview { margin-top: 10px; }
.image-preview img { max-width: 100%; max-height: 200px; border-radius: 10px; }
.audio-preview { display: flex; align-items: center; gap: 10px; color: #818cf8; }
.audio-preview audio { flex: 1; }
.file-preview { display: flex; align-items: center; gap: 8px; color: #ef4444; }
.file-preview a { color: #818cf8; }
.grade-input-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.grade-select { padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.05); color: #fbbf24; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; }
.grade-max { color: #94a3b8; font-size: 1rem; }
.comment-input { width: 100%; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.04); color: #fff; font-size: 0.85rem; outline: none; resize: vertical; font-family: inherit; }
.comment-input:focus { border-color: #6366f1; }
.review-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.btn-accept { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 20px; background: linear-gradient(135deg, #10b981, #34d399); border: none; border-radius: 12px; color: #fff; font-weight: 700; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; font-family: inherit; }
.btn-accept:hover { transform: translateY(-1px); box-shadow: 0 10px 25px rgba(16,185,129,0.3); }
.btn-return { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 20px; background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3); border-radius: 12px; color: #fbbf24; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; font-family: inherit; }
.btn-return:hover { background: rgba(251,191,36,0.25); }
.view-info p { margin-bottom: 8px; color: #cbd5e1; }
.input { width: 100%; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.04); color: #fff; font-size: 0.85rem; outline: none; margin-bottom: 8px; font-family: inherit; resize: vertical; }
.input:focus { border-color: #6366f1; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.w-100 { width: 100%; }
.mt-2 { margin-top: 10px; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
