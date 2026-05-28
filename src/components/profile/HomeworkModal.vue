<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="homework" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <!-- Заголовок -->
          <div class="modal-header">
            <div class="modal-type-icon">{{ typeIcon }}</div>
            <div>
              <h2>{{ homework.title }}</h2>
              <span class="status-badge" :class="homework.status">{{ statusLabel }}</span>
            </div>
            <button class="close-btn" @click="$emit('close')">✕</button>
          </div>

          <!-- Инфо-бар -->
          <div class="info-bar">
            <div class="info-item" v-if="homework.student_name">
              <span class="info-icon">👨‍🎓</span>
              <span>{{ homework.student_name }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">📅</span>
              <span v-if="homework.due_date" :class="{ overdue: isOverdue }">
                До {{ formatDate(homework.due_date) }}
              </span>
              <span v-else>Без дедлайна</span>
            </div>
            <div class="info-item" v-if="homework.grade">
              <span class="info-icon">⭐</span>
              <span>{{ homework.grade }}/{{ homework.max_grade || 10 }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">🎯</span>
              <span>{{ homework.experience || 50 }} XP</span>
            </div>
          </div>

          <!-- Описание -->
          <div class="modal-section" v-if="homework.description">
            <h4>📋 Описание</h4>
            <p>{{ homework.description }}</p>
          </div>

          <!-- Прогресс -->
          <div class="modal-section">
            <h4>📊 Прогресс</h4>
            <div class="status-steps">
              <div class="step" :class="{ done: isStatusDone('assigned') }">📝 Назначено</div>
              <div class="step-line" :class="{ done: isStatusDone('in_progress') }"></div>
              <div class="step" :class="{ done: isStatusDone('in_progress') }">🔄 В работе</div>
              <div class="step-line" :class="{ done: isStatusDone('submitted') }"></div>
              <div class="step" :class="{ done: isStatusDone('submitted') }">📤 На проверке</div>
              <div class="step-line" :class="{ done: isStatusDone('completed') }"></div>
              <div class="step" :class="{ done: isStatusDone('completed') }">✅ Выполнено</div>
            </div>
          </div>

          <!-- Ответ ученика -->
          <div class="modal-section" v-if="homework.student_answer">
            <h4>📤 Ответ ученика</h4>
            <p class="answer-text">{{ homework.student_answer }}</p>
          </div>

          <!-- Оценка и комментарий -->
          <div class="modal-section" v-if="homework.grade || homework.teacher_comment">
            <h4>⭐ Оценка репетитора</h4>
            <div v-if="homework.grade" class="grade-display">
              <span class="grade-value">{{ homework.grade }}</span>
              <span class="grade-max">/{{ homework.max_grade || 10 }}</span>
            </div>
            <p v-if="homework.teacher_comment" class="comment-text">💬 {{ homework.teacher_comment }}</p>
          </div>

          <!-- Действия -->
          <div class="modal-actions">
            <!-- Ученик: отправить ответ -->
            <template v-if="canSubmit">
              <textarea class="input" v-model="answer" rows="2" placeholder="Ваш ответ..."></textarea>
              <button class="btn btn-p w-100" @click="submitAnswer" :disabled="!answer">📤 Отправить на проверку</button>
            </template>

            <!-- Репетитор: оценить -->
            <template v-if="canGrade">
              <div class="grade-row">
                <select class="input" v-model="grade" style="width:auto">
                  <option v-for="n in (homework.max_grade || 10)" :key="n" :value="n">{{ n }}</option>
                </select>
                <span class="grade-max">/ {{ homework.max_grade || 10 }}</span>
              </div>
              <textarea class="input" v-model="comment" rows="2" placeholder="Комментарий..."></textarea>
              <button class="btn btn-p w-100" @click="submitGrade">✅ Оценить</button>
            </template>

            <!-- Смена статуса -->
            <div class="status-actions">
              <button v-if="homework.status === 'assigned'" class="btn btn-o btn-sm" @click="changeStatus('in_progress')">🔄 Начать</button>
              <button v-if="homework.status === 'in_progress'" class="btn btn-o btn-sm" @click="changeStatus('submitted')">📤 Отправить</button>
            </div>
          </div>

          <button class="btn btn-o w-100 mt-2" @click="$emit('close')">Закрыть</button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
export default {
  name: 'HomeworkModal',
  props: {
    homework: Object,
    userRole: String,
    userId: [Number, String]
  },
  emits: ['close', 'update', 'submit-answer', 'submit-grade', 'change-status'],
  data() {
    return { answer: '', grade: 10, comment: '' };
  },
  computed: {
    typeIcon() {
      const icons = { homework: '📝', test: '🎯', essay: '📄', audio: '🎤' };
      return icons[this.homework?.type] || '📝';
    },
    statusLabel() {
      const labels = { assigned: 'Назначено', in_progress: 'В работе', submitted: 'На проверке', completed: 'Выполнено' };
      return labels[this.homework?.status] || 'Назначено';
    },
    isOverdue() {
      return this.homework?.due_date && new Date(this.homework.due_date) < new Date() && this.homework?.status !== 'completed';
    },
    canSubmit() {
      return this.homework?.student_id == this.userId && ['assigned', 'in_progress'].includes(this.homework?.status);
    },
    canGrade() {
      return (this.userRole === 'admin' || this.userRole === 'host') && this.homework?.status === 'submitted';
    },
    statusOrder() {
      return ['assigned', 'in_progress', 'submitted', 'completed'];
    }
  },
  methods: {
    formatDate(d) { return d ? new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; },
    isStatusDone(status) {
      const currentIdx = this.statusOrder.indexOf(this.homework?.status);
      const checkIdx = this.statusOrder.indexOf(status);
      return currentIdx >= checkIdx;
    },
    submitAnswer() {
      this.$emit('submit-answer', { answer: this.answer });
      this.answer = '';
    },
    submitGrade() {
      this.$emit('submit-grade', { grade: this.grade, comment: this.comment });
      this.comment = '';
    },
    changeStatus(status) {
      this.$emit('change-status', { status });
    }
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: rgba(15,15,30,0.98); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 28px; max-width: 550px; width: 100%; max-height: 85vh; overflow-y: auto; color: #e2e8f0; animation: modalPop 0.3s ease; }
@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.modal-header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.modal-type-icon { font-size: 2rem; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; color: #fff; margin: 0 0 4px; }
.close-btn { margin-left: auto; background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.close-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }

.status-badge { font-size: 0.7rem; padding: 3px 10px; border-radius: 10px; font-weight: 600; }
.status-badge.assigned { background: rgba(251,191,36,0.15); color: #fbbf24; }
.status-badge.in_progress { background: rgba(99,102,241,0.15); color: #818cf8; }
.status-badge.submitted { background: rgba(16,185,129,0.15); color: #10b981; }
.status-badge.completed { background: rgba(16,185,129,0.2); color: #34d399; }

.info-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.info-item { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: rgba(255,255,255,0.04); border-radius: 10px; font-size: 0.8rem; color: #94a3b8; }
.info-icon { font-size: 0.9rem; }
.overdue { color: #ef4444; font-weight: 600; }

.modal-section { margin-bottom: 18px; }
.modal-section h4 { font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; margin: 0 0 8px; font-weight: 600; }
.modal-section p { color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; margin: 0; }

.status-steps { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.step { padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.75rem; color: #94a3b8; border: 1px solid rgba(255,255,255,0.06); }
.step.done { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #10b981; }
.step-line { width: 20px; height: 2px; background: rgba(255,255,255,0.06); }
.step-line.done { background: #10b981; }

.answer-text { background: rgba(99,102,241,0.08); padding: 12px; border-radius: 12px; border: 1px solid rgba(99,102,241,0.2); }

.grade-display { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
.grade-value { font-size: 2rem; font-weight: 700; color: #fbbf24; font-family: 'Space Grotesk', sans-serif; }
.grade-max { color: #94a3b8; font-size: 1.2rem; }
.comment-text { font-style: italic; color: #94a3b8; }

.modal-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.grade-row { display: flex; align-items: center; gap: 8px; }
.status-actions { display: flex; gap: 8px; }

.input { padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-family: inherit; font-size: 0.85rem; background: rgba(255,255,255,0.05); color: #fff; outline: none; width: 100%; resize: vertical; }
.input:focus { border-color: #6366f1; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.btn-sm { padding: 6px 14px; font-size: 0.78rem; }
.w-100 { width: 100%; justify-content: center; }
.mt-2 { margin-top: 10px; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
