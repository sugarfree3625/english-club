<template>
  <div class="card fade-in">
    <h3>📅 Моё расписание</h3>
    <button class="btn btn-o btn-sm mb-3" @click="$emit('export')">📅 Экспорт в календарь</button>
    <h4>🟢 Предстоящие</h4>
    <div class="schedule-list">
      <div v-for="s in upcoming" :key="s.id" class="schedule-list-item" :class="s.lesson_type === 'online' ? 'slot-online' : 'slot-offline'">
        <div class="schedule-list-left">
          <span>{{ s.lesson_type === 'online' ? '🟢' : '🔵' }}</span>
          <div><strong>{{ s.title }}</strong><small>{{ formatDate(s.start_time) }} · {{ formatTime(s.start_time) }} — {{ formatTime(s.end_time) }}</small></div>
        </div>
        <div class="schedule-list-right">
          <span v-if="showStudent">{{ s.users?.username || '—' }}</span>
          <a v-if="s.meeting_link" :href="s.meeting_link" target="_blank" class="btn btn-p btn-sm">📹</a>
        </div>
      </div>
      <p v-if="!upcoming.length" class="empty-text">Нет предстоящих занятий</p>
    </div>
    <h4 style="margin:24px 0 12px">⚫ Прошедшие</h4>
    <div class="schedule-list">
      <div v-for="s in past" :key="s.id" class="schedule-list-item past">
        <div class="schedule-list-left">
          <span>{{ s.lesson_type === 'online' ? '🟢' : '🔵' }}</span>
          <div><strong>{{ s.title }}</strong><small>{{ formatDate(s.start_time) }} · {{ formatTime(s.start_time) }}</small></div>
        </div>
        <div class="schedule-list-right">
          <span v-if="showStudent">{{ s.users?.username || '—' }}</span>
          <span>✅</span>
        </div>
      </div>
      <p v-if="!past.length" class="empty-text">Нет прошедших занятий</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabSchedule',
  props: ['upcoming', 'past', 'showStudent'],
  methods: {
    formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; },
    formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ''; }
  },
  emits: ['export']
};
</script>
<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; }
.schedule-list { display: flex; flex-direction: column; gap: 10px; }
.schedule-list-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 14px; background: rgba(255,255,255,0.03); border-left: 4px solid; }
.schedule-list-item.slot-online { border-color: #10b981; }
.schedule-list-item.slot-offline { border-color: #6366f1; }
.schedule-list-item.past { opacity: 0.5; }
.schedule-list-left { display: flex; gap: 10px; align-items: center; }
.schedule-list-left strong { display: block; font-size: 0.9rem; color: #fff; }
.schedule-list-left small { color: #94a3b8; font-size: 0.75rem; }
.schedule-list-right { display: flex; gap: 8px; align-items: center; }
.empty-text { text-align: center; color: #64748b; padding: 30px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.mb-3 { margin-bottom: 16px; }
.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
