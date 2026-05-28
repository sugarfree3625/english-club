<template>
  <div class="homework-tab fade-in">
    <h3 class="tab-title">{{ title }}</h3>
    <div v-if="loading" class="empty-text">Загрузка...</div>
    <template v-else>
      <div class="homework-list">
        <div v-for="h in homeworks" :key="h.id" class="homework-card"
          :class="{ overdue: isOverdue(h), completed: h.status === 'completed' }"
          @click="$emit('select', h)">
          <div class="hw-left">
            <div class="hw-type-icon">{{ typeIcon(h.type) }}</div>
            <div class="hw-info">
              <div class="hw-title">{{ h.title }}</div>
              <div class="hw-meta">
                <span v-if="h.student_name" class="hw-student">👨‍🎓 {{ h.student_name }}</span>
                <span v-if="h.due_date" class="hw-due" :class="{ 'text-red': isOverdue(h) }">📅 {{ fmtDate(h.due_date) }}</span>
                <span class="hw-status" :class="h.status">{{ statusLabel(h.status) }}</span>
              </div>
            </div>
          </div>
          <div class="hw-right">
            <div v-if="h.grade" class="hw-grade">⭐ {{ h.grade }}/{{ h.max_grade || 10 }}</div>
            <div v-else class="hw-xp">🎯 {{ h.experience || 50 }} XP</div>
          </div>
        </div>
      </div>
      <p v-if="!homeworks.length" class="empty-text">Нет заданий</p>
    </template>
  </div>
</template>

<script>
export default {
  name: 'HomeworkList',
  props: { homeworks: Array, loading: Boolean, title: String },
  emits: ['select'],
  methods: {
    typeIcon(t) { const i = { homework:'📝', test:'🎯', essay:'📄', audio:'🎤' }; return i[t]||'📝'; },
    statusLabel(s) { const l = { assigned:'Назначено', in_progress:'В работе', submitted:'На проверке', completed:'Выполнено' }; return l[s]||s; },
    isOverdue(h) { return h.due_date && new Date(h.due_date) < new Date() && h.status !== 'completed'; },
    fmtDate(d) { return d ? new Date(d).toLocaleDateString('ru',{day:'numeric',month:'short'}) : ''; }
  }
};
</script>

<style scoped>
.homework-tab {}
.tab-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 18px; }
.homework-list { display: flex; flex-direction: column; gap: 8px; }
.homework-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; cursor: pointer; transition: all 0.2s; }
.homework-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.3); transform: translateY(-1px); }
.homework-card.overdue { border-left: 3px solid #ef4444; }
.homework-card.completed { opacity: 0.7; border-left: 3px solid #10b981; }
.hw-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.hw-type-icon { font-size: 1.3rem; flex-shrink: 0; }
.hw-info { flex: 1; min-width: 0; }
.hw-title { color: #fff; font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hw-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; font-size: 0.75rem; color: #94a3b8; }
.hw-student { color: #818cf8; }
.hw-due.text-red { color: #ef4444; font-weight: 600; }
.hw-status { padding: 2px 8px; border-radius: 6px; font-weight: 600; }
.hw-status.assigned { background: rgba(251,191,36,0.1); color: #fbbf24; }
.hw-status.in_progress { background: rgba(99,102,241,0.1); color: #818cf8; }
.hw-status.submitted { background: rgba(16,185,129,0.1); color: #10b981; }
.hw-status.completed { background: rgba(16,185,129,0.15); color: #34d399; }
.hw-right { flex-shrink: 0; text-align: right; }
.hw-grade { color: #fbbf24; font-weight: 700; font-size: 0.9rem; }
.hw-xp { color: #94a3b8; font-size: 0.8rem; }
.empty-text { text-align: center; color: #64748b; padding: 30px; }
.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
