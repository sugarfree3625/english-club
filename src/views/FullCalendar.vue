<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="btn btn-o btn-sm" @click="prevWeek">←</button>
        <h2 class="calendar-title">{{ weekLabel }}</h2>
        <button class="btn btn-o btn-sm" @click="nextWeek">→</button>
        <button class="btn btn-o btn-sm" @click="goToday">Сегодня</button>
      </div>
      <div class="calendar-actions">
        <button class="btn btn-o btn-sm" @click="viewMode = 'month'">📅 Месяц</button>
        <button class="btn btn-o btn-sm" @click="viewMode = 'week'">📆 Неделя</button>
        <button class="btn btn-o btn-sm" @click="exportICS">📤 Экспорт</button>
        <button class="btn btn-p btn-sm" @click="openAddSlot" v-if="isTutor">+ Занятие</button>
      </div>
    </div>

    <div v-if="viewMode === 'month'" class="month-grid">
      <div class="day-header" v-for="day in weekDays" :key="day">{{ day }}</div>
      <div class="day-cell" v-for="(day, idx) in monthDays" :key="idx" :class="{ today: day.isToday, otherMonth: day.isOtherMonth }" @click="openDay(day.date)">
        <span class="day-number">{{ day.day }}</span>
        <div class="day-slots">
          <div v-for="slot in getSlotsForDate(day.date)" :key="slot.id" class="slot-mini" :class="getSlotColor(slot.lesson_type)" @click.stop="editSlot(slot)">{{ slot.title }}</div>
        </div>
      </div>
    </div>

    <div v-if="viewMode === 'week'" class="week-wrapper">
      <div class="week-grid" ref="weekGrid">
        <div class="week-header-cell">Время</div>
        <div class="week-header-cell" v-for="day in weekDaysList" :key="day.date" :class="{ today: day.isToday }">{{ day.name }}<br>{{ day.dateStr }}</div>
        <template v-for="hour in hours" :key="hour">
          <div class="week-time-cell">{{ hour }}:00</div>
          <div class="week-bg-cell" v-for="day in weekDaysList" :key="'bg'+day.date+hour+':00'" :class="{ today: day.isToday }"></div>
          <div class="week-time-cell week-time-half">:30</div>
          <div class="week-bg-cell week-bg-half" v-for="day in weekDaysList" :key="'bg'+day.date+hour+':30'" :class="{ today: day.isToday }"></div>
        </template>
        <div class="slots-layer" ref="slotsLayer">
          <div v-for="slot in weekSlots" :key="slot.id" class="slot-block" :class="getSlotColor(slot.lesson_type)" :style="getSlotStyle(slot)" @mousedown="startDrag($event, slot)" @click.stop="editSlot(slot)">
            <div class="slot-time-label">{{ formatTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}</div>
            <div class="slot-block-title">{{ slot.title }}</div>
            <div class="slot-block-student">{{ slot.users?.username || (slot.group_students?.length ? '👥 Группа' : '—') }}</div>
            <div class="resize-handle" @mousedown.stop="startResize($event, slot)"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pastSlots.length" class="history-section">
      <h3>📋 История занятий</h3>
      <div class="history-item" v-for="s in pastSlots.slice(0, 10)" :key="s.id">
        <span>{{ getTypeEmoji(s.lesson_type) }}</span>
        <strong>{{ s.title }}</strong>
        <small>{{ formatDate(s.start_time) }}</small>
        <small>{{ formatTime(s.start_time) }} - {{ formatTime(s.end_time) }}</small>
      </div>
    </div>

    <div class="modal-overlay" v-if="showAddSlot || editingSlot" @click.self="closeModal">
      <div class="modal">
        <h3>{{ editingSlot ? '✏️ Редактировать' : '➕ Новое занятие' }}</h3>
        <label>Тип</label>
        <div class="type-btns">
          <button class="type-btn" :class="{ active: slotForm.lesson_type === 'online' }" @click="slotForm.lesson_type = 'online'">🟢 Онлайн</button>
          <button class="type-btn" :class="{ active: slotForm.lesson_type === 'offline' }" @click="slotForm.lesson_type = 'offline'">🔵 Очно</button>
          <button class="type-btn" :class="{ active: slotForm.lesson_type === 'group-online' }" @click="slotForm.lesson_type = 'group-online'">👥 Группа онлайн</button>
          <button class="type-btn" :class="{ active: slotForm.lesson_type === 'group-offline' }" @click="slotForm.lesson_type = 'group-offline'">👥 Группа очно</button>
        </div>
        <label v-if="!isGroupType">Ученик</label>
        <select v-if="!isGroupType" class="input" v-model="slotForm.student_id">
          <option value="">Выберите</option>
          <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.username }}</option>
        </select>
        <div v-if="isGroupType">
          <label>Ученики</label>
          <div v-for="s in allStudents" :key="s.id" class="student-checkbox" @click="toggleGroupStudent(s.id)"><input type="checkbox" :checked="slotForm.group_students.includes(s.id)" /><span>{{ s.username }}</span></div>
        </div>
        <label>Название</label>
        <input class="input" v-model="slotForm.title">
        <div style="display:flex;gap:8px">
          <div style="flex:1"><label>Дата</label><input class="input" type="date" v-model="slotForm.date"></div>
          <div style="flex:1"><label>Время</label><input class="input" type="time" v-model="slotForm.time"></div>
        </div>
        <label>Длительность (мин)</label>
        <input class="input" type="number" v-model="slotForm.duration" placeholder="30">
        <label>Заметки</label>
        <textarea class="input note-area" v-model="slotForm.notes" rows="2"></textarea>
        <div class="modal-actions">
          <button class="btn btn-p btn-sm" @click="saveSlot">💾 Сохранить</button>
          <button v-if="editingSlot" class="btn btn-o btn-sm" style="color:#ef4444" @click="deleteSlot(editingSlot.id)">🗑</button>
          <button class="btn btn-o btn-sm" @click="closeModal">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'FullCalendar',
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      viewMode: 'week',
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      currentWeek: 0,
      hours: Array.from({ length: 14 }, (_, i) => i + 8),
      slots: [],
      allStudents: [],
      showAddSlot: false,
      editingSlot: null,
      slotForm: { student_id: '', lesson_type: 'online', title: '', date: '', time: '', duration: 30, notes: '', group_students: [] },
      dragging: null,
      resizing: null,
      dragStartX: 0,
      dragStartY: 0,
      dragSlotOriginal: null,
    };
  },
  computed: {
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; },
    isGroupType() { return this.slotForm.lesson_type === 'group-online' || this.slotForm.lesson_type === 'group-offline'; },
    weekDays() { return ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']; },
    currentMonthName() { return new Date(this.currentYear, this.currentMonth).toLocaleDateString('ru', { month: 'long' }); },
    monthDays() {
      const days = [];
      const firstDay = new Date(this.currentYear, this.currentMonth, 1);
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
      const startDay = firstDay.getDay() || 7;
      for (let i = 1; i < startDay; i++) {
        const d = new Date(this.currentYear, this.currentMonth, 1 - (startDay - i));
        days.push({ day: d.getDate(), date: d.toISOString().split('T')[0], isOtherMonth: true, isToday: false });
      }
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(this.currentYear, this.currentMonth, i);
        days.push({ day: i, date: d.toISOString().split('T')[0], isOtherMonth: false, isToday: d.toDateString() === new Date().toDateString() });
      }
      return days;
    },
    weekDaysList() {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (today.getDay() || 7) + 1 + this.currentWeek * 7);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        return { date: d.toISOString().split('T')[0], name: ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'][i], dateStr: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }), isToday: d.toDateString() === today.toDateString(), dayIndex: i };
      });
    },
    weekLabel() { return this.weekDaysList.length ? `${this.weekDaysList[0].dateStr} — ${this.weekDaysList[6].dateStr}` : ''; },
    weekSlots() {
      const weekStart = this.weekDaysList[0]?.date;
      const weekEnd = this.weekDaysList[6]?.date;
      if (!weekStart || !weekEnd) return [];
      return this.slots.filter(s => { const sd = new Date(s.start_time).toISOString().split('T')[0]; return sd >= weekStart && sd <= weekEnd; }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    },
    pastSlots() { return this.slots.filter(s => new Date(s.start_time) < new Date()); },
  },
  async mounted() {
    await Promise.all([this.loadSlots(), this.loadStudents()]);
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  },
  methods: {
    async loadSlots() { try { const r = await axios.get('/api/slots'); this.slots = r.data || []; } catch(e) {} },
    async loadStudents() { try { const r = await axios.get('/api/users'); this.allStudents = (r.data || []).filter(u => u.role !== 'admin' && u.role !== 'parent'); } catch(e) {} },
    getSlotsForDate(date) { return this.slots.filter(s => new Date(s.start_time).toISOString().split('T')[0] === date); },
    getSlotColor(t) { if (t === 'online') return 'slot-online'; if (t === 'offline') return 'slot-offline'; if (t === 'group-online') return 'slot-group-online'; if (t === 'group-offline') return 'slot-group-offline'; return 'slot-online'; },
    getTypeEmoji(t) { if (t === 'online') return '🟢'; if (t === 'offline') return '🔵'; if (t === 'group-online') return '🟠'; if (t === 'group-offline') return '🔴'; return '🟢'; },
    getSlotStyle(slot) {
      const sd = new Date(slot.start_time), ed = new Date(slot.end_time);
      const dayIndex = this.weekDaysList.findIndex(d => d.date === sd.toISOString().split('T')[0]);
      if (dayIndex === -1) return { display: 'none' };
      const startHour = 8, totalMinutes = 14 * 60;
      const slotStart = (sd.getHours() - startHour) * 60 + sd.getMinutes();
      const slotEnd = (ed.getHours() - startHour) * 60 + ed.getMinutes();
      return { top: (slotStart / totalMinutes * 100) + '%', height: (Math.max(slotEnd - slotStart, 30) / totalMinutes * 100) + '%', left: ((dayIndex + 1) / 8 * 100 + 0.3) + '%', width: (1 / 8 * 100 - 0.6) + '%' };
    },
    formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'short' }) : ''; },
    formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ''; },
    startDrag(e, slot) { if (!this.isTutor) return; e.preventDefault(); this.dragging = slot; this.dragStartX = e.clientX; this.dragStartY = e.clientY; this.dragSlotOriginal = { ...slot, start_time: slot.start_time, end_time: slot.end_time }; },
    startResize(e, slot) { if (!this.isTutor) return; e.preventDefault(); this.resizing = slot; this.dragStartY = e.clientY; this.dragSlotOriginal = { ...slot, start_time: slot.start_time, end_time: slot.end_time }; },
    onDragMove(e) {
      if (!this.dragging && !this.resizing) return;
      const grid = this.$refs.weekGrid;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const totalMinutes = 14 * 60;
      const gridHeight = rect.height - 44;
      const minutesPerPixel = totalMinutes / gridHeight;
      const dayWidth = (rect.width - 70) / 7;
      
      if (this.dragging) {
        const dy = e.clientY - this.dragStartY;
        const dx = e.clientX - this.dragStartX;
        const deltaMinutes = Math.round(dy * minutesPerPixel / 30) * 30;
        const deltaDays = Math.round(dx / dayWidth);
        
        const originalStart = new Date(this.dragSlotOriginal.start_time);
        const duration = (new Date(this.dragSlotOriginal.end_time) - originalStart) / 60000;
        
        let newStart = new Date(originalStart.getTime() + deltaMinutes * 60000);
        newStart.setDate(newStart.getDate() + deltaDays);
        
        if (newStart.getHours() < 8) newStart.setHours(8, 0, 0, 0);
        if (newStart.getHours() >= 22) { newStart.setHours(21, 30, 0, 0); duration > 30 ? null : null; }
        
        this.dragging.start_time = newStart.toISOString();
        this.dragging.end_time = new Date(newStart.getTime() + duration * 60000).toISOString();
      }
      
      if (this.resizing) {
        const dy = e.clientY - this.dragStartY;
        const deltaMinutes = Math.round(dy * minutesPerPixel / 30) * 30;
        const originalEnd = new Date(this.dragSlotOriginal.end_time);
        let newEnd = new Date(originalEnd.getTime() + deltaMinutes * 60000);
        const minEnd = new Date(this.dragSlotOriginal.start_time).getTime() + 30 * 60000;
        if (newEnd.getTime() < minEnd) newEnd.setTime(minEnd);
        if (newEnd.getHours() >= 22) newEnd.setHours(21, 30, 0, 0);
        this.resizing.end_time = newEnd.toISOString();
      }
    },
    async onDragEnd() {
      const slot = this.dragging || this.resizing;
      if (!slot) return;
      try {
        await axios.put(`/api/slots/${slot.id}`, { start_time: slot.start_time, end_time: slot.end_time, lesson_type: slot.lesson_type, title: slot.title, student_id: slot.student_id, notes: slot.notes, group_students: slot.group_students });
        this.addToast(this.dragging ? 'Перемещено! 📅' : 'Длительность изменена! ⏱️', 'success');
      } catch(e) { this.addToast(e.response?.data?.error || 'Ошибка', 'error'); }
      this.dragging = null; this.resizing = null; this.dragSlotOriginal = null; this.loadSlots();
    },
    toggleGroupStudent(id) { const idx = this.slotForm.group_students.indexOf(id); idx === -1 ? this.slotForm.group_students.push(id) : this.slotForm.group_students.splice(idx, 1); },
    prevWeek() { this.currentWeek--; this.loadSlots(); },
    nextWeek() { this.currentWeek++; this.loadSlots(); },
    goToday() { this.currentWeek = 0; this.loadSlots(); },
    prevMonth() { this.currentMonth === 0 ? (this.currentMonth = 11, this.currentYear--) : this.currentMonth--; },
    nextMonth() { this.currentMonth === 11 ? (this.currentMonth = 0, this.currentYear++) : this.currentMonth++; },
    openDay(date) { this.slotForm.date = date; this.slotForm.group_students = []; this.showAddSlot = true; },
    openAddSlot() { this.editingSlot = null; this.slotForm = { student_id: '', lesson_type: 'online', title: '', date: '', time: '', duration: 30, notes: '', group_students: [] }; this.showAddSlot = true; },
    editSlot(slot) { this.editingSlot = slot; const sd = new Date(slot.start_time); this.slotForm = { student_id: slot.student_id || '', lesson_type: slot.lesson_type || 'online', title: slot.title || '', date: sd.toISOString().split('T')[0], time: sd.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }), duration: Math.round((new Date(slot.end_time) - sd) / 60000) || 30, notes: slot.notes || '', group_students: slot.group_students || [] }; this.showAddSlot = true; },
    closeModal() { this.showAddSlot = false; this.editingSlot = null; this.slotForm.group_students = []; },
    async saveSlot() {
      try {
        const st = `${this.slotForm.date}T${this.slotForm.time}:00`;
        const et = new Date(new Date(st).getTime() + (this.slotForm.duration || 30) * 60000).toISOString();
        const data = { ...this.slotForm, start_time: st, end_time: et };
        if (!this.isGroupType) data.group_students = [];
        if (this.isGroupType) data.student_id = null;
        if (this.editingSlot) { await axios.put(`/api/slots/${this.editingSlot.id}`, data); }
        else { await axios.post('/api/slots', data); }
        this.closeModal();
        this.addToast('Сохранено! 🎉', 'success');
        setTimeout(() => this.loadSlots(), 500);
      } catch(e) { this.addToast(e.response?.data?.error || 'Ошибка', 'error'); }
    },
    async deleteSlot(id) { if (confirm('Удалить занятие?')) { await axios.delete(`/api/slots/${id}`); this.closeModal(); this.loadSlots(); } },
    exportICS() { window.open('/api/slots/export', '_blank'); },
  }
};
</script>

<style scoped>
.calendar-container { max-width: 1280px; margin: 0 auto; padding: 24px; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.calendar-nav { display: flex; align-items: center; gap: 12px; }
.calendar-title { font-weight: 800; font-size: 1.5rem; }
.calendar-actions { display: flex; gap: 8px; }
.month-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid var(--b); border-radius: 12px; overflow: hidden; }
.day-header { background: var(--bg); font-weight: 700; text-align: center; padding: 10px; border-bottom: 1px solid var(--b); }
.day-cell { min-height: 100px; padding: 6px; border-right: 1px solid var(--b); border-bottom: 1px solid var(--b); cursor: pointer; transition: background 0.2s; }
.day-cell:nth-child(7n) { border-right: none; }
.day-cell:hover { background: rgba(99,102,241,0.03); }
.day-cell.today { background: rgba(99,102,241,0.05); }
.day-cell.otherMonth { opacity: 0.4; }
.day-number { font-weight: 600; font-size: 0.85rem; }
.day-slots { margin-top: 4px; }
.slot-mini { padding: 2px 6px; border-radius: 4px; color: #fff; font-size: 0.7rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.slot-online { background: #10b981; }
.slot-offline { background: #6366f1; }
.slot-group-online { background: #f59e0b; }
.slot-group-offline { background: #ef4444; }
.week-wrapper { overflow-x: auto; }
.week-grid { display: grid; grid-template-columns: 70px repeat(7, 1fr); border: 1px solid var(--b); border-radius: 12px; overflow: hidden; min-width: 800px; position: relative; user-select: none; }
.week-header-cell { background: var(--bg); font-weight: 700; text-align: center; padding: 10px 4px; border-bottom: 1px solid var(--b); font-size: 0.8rem; }
.week-header-cell.today { background: rgba(99,102,241,0.08); }
.week-time-cell { background: var(--bg); font-weight: 600; text-align: center; padding: 8px; border-bottom: 1px solid var(--b); font-size: 0.75rem; }
.week-time-half { font-size: 0.65rem; color: var(--t2); }
.week-bg-cell { min-height: 50px; border-bottom: 1px solid var(--b); border-right: 1px solid var(--b); }
.week-bg-half { border-bottom: 1px dashed rgba(0,0,0,0.05); }
.week-bg-cell.today { background: rgba(99,102,241,0.02); }
body.dark .week-bg-half { border-bottom: 1px dashed rgba(255,255,255,0.05); }
.slots-layer { position: absolute; top: 0; left: 0; right: 0; bottom: 0; padding-top: 44px; padding-left: 70px; pointer-events: none; }
.slot-block { position: absolute; padding: 6px 8px; border-radius: 6px; color: #fff; font-size: 0.75rem; cursor: grab; pointer-events: auto; overflow: hidden; transition: box-shadow 0.2s; }
.slot-block:active { cursor: grabbing; }
.slot-block:hover { box-shadow: 0 0 0 2px rgba(255,255,255,0.5); z-index: 10; }
.slot-time-label { font-size: 0.65rem; opacity: 0.9; margin-bottom: 2px; }
.slot-block-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-block-student { font-size: 0.65rem; opacity: 0.8; }
.resize-handle { position: absolute; bottom: 0; left: 0; right: 0; height: 8px; cursor: ns-resize; background: transparent; }
.resize-handle:hover { background: rgba(255,255,255,0.3); }
.history-section { margin-top: 32px; }
.history-item { display: flex; gap: 10px; align-items: center; padding: 10px; background: var(--surface); border-radius: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.history-item small { color: var(--t2); }
.modal-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.modal { background: var(--surface); border-radius: 24px; padding: 28px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
.modal h3 { font-weight: 700; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 8px; margin-top: 16px; }
.type-btns { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.type-btn { padding: 8px 14px; border-radius: 12px; border: 2px solid var(--b); background: var(--bg); cursor: pointer; font-weight: 600; font-size: 0.85rem; }
.type-btn.active { border-color: var(--p); background: rgba(99,102,241,0.06); }
.student-checkbox { display: flex; align-items: center; gap: 8px; padding: 6px; cursor: pointer; border-radius: 6px; }
.student-checkbox:hover { background: rgba(99,102,241,0.05); }
.student-checkbox input { accent-color: #6366f1; }
.input { width: 100%; padding: 10px 14px; border: 2px solid var(--b); border-radius: 12px; font-family: inherit; font-size: 0.9rem; background: var(--bg); color: var(--t); outline: none; margin-bottom: 8px; }
.note-area { resize: vertical; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, var(--p), var(--p2)); color: #fff; }
.btn-o { border: 2px solid var(--b); color: var(--t); background: transparent; }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
</style>
