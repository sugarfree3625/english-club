<template>
  <div class="card">
    <h3 class="card-title">📅 Расписание на неделю</h3>
    <div class="week-grid">
      <div v-for="(day, i) in weekDays" :key="i" class="week-day" :class="{ today: day.isToday, hasLesson: day.hasLesson }" @click="$emit('dayClick', day)">
        <div class="week-day-name">{{ day.name }}</div>
        <div class="week-day-num">{{ day.num }}</div>
        <div class="week-day-dot" :class="{ green: day.hasLesson }"></div>
        <div v-if="day.hasLesson" class="week-day-time">{{ day.time }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WeeklySchedule',
  props: ['slots'],
  emits: ['dayClick'],
  computed: {
    weekDays() {
      const days = [];
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const daySlots = this.slots?.filter(s => s.start_time?.startsWith(dateStr)) || [];
        days.push({
          name: d.toLocaleDateString('ru', { weekday: 'short' }),
          num: d.getDate(),
          isToday: i === 0,
          hasLesson: daySlots.length > 0,
          time: daySlots[0] ? new Date(daySlots[0].start_time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ''
        });
      }
      return days;
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 14px; }
.week-grid { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.week-day { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 10px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); cursor: pointer; min-width: 60px; transition: all 0.2s; }
.week-day:hover { border-color: rgba(99,102,241,0.3); }
.week-day.today { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); }
.week-day-name { font-size: 0.7rem; color: #94a3b8; text-transform: capitalize; }
.week-day-num { font-size: 1.1rem; font-weight: 700; color: #fff; }
.week-day-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.1); }
.week-day-dot.green { background: #10b981; }
.week-day-time { font-size: 0.6rem; color: #10b981; }
</style>
