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
