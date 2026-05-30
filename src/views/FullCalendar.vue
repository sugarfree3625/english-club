<template>
  <div class="calendar-container">
    <!-- ХЕДЕР -->
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="btn btn-o btn-sm" @click="prevMonth">←</button>
        <h2 class="calendar-title">{{ monthLabel }}</h2>
        <button class="btn btn-o btn-sm" @click="nextMonth">→</button>
        <button class="btn btn-o btn-sm" @click="goToday">Сегодня</button>
      </div>
      <div class="calendar-actions">
        <!-- Легенда -->
        <div class="legend">
          <span v-for="l in legendItems" :key="l.type" class="legend-item">
            <span class="legend-dot" :style="{ background: l.color }"></span>
            {{ l.label }}
          </span>
        </div>
        <button class="btn btn-o btn-sm" @click="viewMode = 'month'">📅 Месяц</button>
        <button class="btn btn-o btn-sm" @click="viewMode = 'week'">📆 Неделя</button>
        <button class="btn btn-o btn-sm" @click="exportICS">📤 ICS</button>
        <button class="btn btn-p btn-sm" @click="openAddSlot" v-if="isTutor">+ Занятие</button>
      </div>
    </div>

    <!-- МЕСЯЦ (с параллельными событиями и точками загрузки) -->
    <div v-if="viewMode === 'month'" class="month-grid">
      <div class="day-header" v-for="day in weekDays" :key="day">{{ day }}</div>
      <div 
        class="day-cell" 
        v-for="(day, idx) in monthDays" :key="idx" 
        :class="{ today: day.isToday, otherMonth: day.isOtherMonth, selected: selectedDate === day.date }"
        @click="selectDay(day)"
      >
        <span class="day-number">{{ day.day }}</span>
        
        <!-- Индикатор загрузки дня -->
        <div class="day-dots" v-if="getSlotsForDate(day.date).length">
          <span 
            v-for="(dot, di) in getDotsForDate(day.date)" :key="di"
            class="day-dot" 
            :style="{ background: dot.color || 'var(--t2)' }"
          ></span>
          <span v-if="getSlotsForDate(day.date).length > 5" class="day-dot-more">+{{ getSlotsForDate(day.date).length - 5 }}</span>
        </div>

        <!-- Параллельные полоски событий (до 3, +N если больше) -->
        <div class="day-bars" v-if="getSlotsForDate(day.date).length">
          <div 
            v-for="(slot, si) in getSlotsForDate(day.date).slice(0, 3)" :key="slot.id"
            class="day-bar" 
            :style="{ background: slot.color || getDefaultColor(slot.lesson_type), width: getBarWidth(day.date, si) }"
            @click.stop="showSlotTooltip($event, slot)"
            @mouseleave="tooltipSlot = null"
            :title="`${slot.title} (${formatTime(slot.start_time)})`"
          ></div>
          <span 
            v-if="getSlotsForDate(day.date).length > 3" 
            class="day-bar-more"
            @click.stop="selectedDate = day.date; viewMode = 'day'"
          >+{{ getSlotsForDate(day.date).length - 3 }}</span>
        </div>

        <!-- Мини-форма создания (при клике на пустую область) -->
        <div v-if="quickCreate.date === day.date" class="quick-create" @click.stop>
          <select class="quick-select" v-model="quickCreate.student_id">
            <option value="">Ученик</option>
            <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.username }}</option>
          </select>
          <div class="quick-types">
            <button v-for="t in slotTypes" :key="t.value" class="quick-type-dot" :style="{ background: quickCreate.lesson_type === t.value ? t.color : 'rgba(255,255,255,0.1)' }" @click="quickCreate.lesson_type = t.value" :title="t.label"></button>
          </div>
          <input class="quick-input" v-model="quickCreate.title" placeholder="Название" @keydown.enter="saveQuickSlot" />
          <div class="quick-actions">
            <button class="btn btn-p btn-sm" @click="saveQuickSlot" :disabled="!quickCreate.title">✓</button>
            <button class="btn btn-o btn-sm" @click="quickCreate.date = null">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- НЕДЕЛЯ (с параллельными слотами) -->
    <div v-if="viewMode === 'week'" class="week-wrapper">
      <div class="week-grid" ref="weekGrid">
        <div class="week-header-cell">Время</div>
        <div class="week-header-cell" v-for="day in weekDaysList" :key="day.date" :class="{ today: day.isToday }">{{ day.name }}<br>{{ day.dateStr }}</div>
        <template v-for="hour in hours" :key="hour">
          <div class="week-time-cell">{{ hour }}:00</div>
          <div class="week-bg-cell" v-for="day in weekDaysList" :key="'bg'+day.date+hour+':00'" :class="{ today: day.isToday }" @click="openSlot(day.date, hour, 0)"></div>
          <div class="week-time-cell week-time-half">:30</div>
          <div class="week-bg-cell week-bg-half" v-for="day in weekDaysList" :key="'bg'+day.date+hour+':30'" :class="{ today: day.isToday }" @click="openSlot(day.date, hour, 30)"></div>
        </template>
        <div class="slots-layer">
          <div 
            v-for="slot in parallelWeekSlots" :key="slot.id" 
            class="slot-block" 
            :style="{ background: slot.color || getDefaultColor(slot.lesson_type), ...getSlotStyle(slot) }"
            @mousedown="startDrag($event, slot)" 
            @click.stop="editSlot(slot)"
          >
            <div class="slot-time-label">{{ formatTime(slot.start_time) }}</div>
            <div class="slot-block-title">{{ slot.title }}</div>
            <div class="slot-block-student">{{ slot.users?.username || (slot.group_students?.length ? '👥' : '') }}</div>
            <a v-if="slot.meeting_link" :href="slot.meeting_link" target="_blank" class="slot-join-btn" @click.stop title="Подключиться">📹</a>
            <div class="resize-handle" @mousedown.stop="startResize($event, slot)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛКА (уже есть, без изменений) -->
    <div class="modal-overlay" v-if="showAddSlot || editingSlot" @click.self="closeModal">
      <!-- ... существующая модалка ... -->
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
      viewMode: 'month',
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      currentWeek: 0,
      selectedDate: new Date().toISOString().split('T')[0],
      hours: Array.from({ length: 14 }, (_, i) => i + 8),
      slots: [],
      allStudents: [],
      showAddSlot: false,
      editingSlot: null,
      slotForm: { student_id:'', lesson_type:'online', title:'', date:'', time:'', duration:30, notes:'', group_students:[], color:'#6366f1', repeat:'none', repeat_count:4 },
      slotTypes: [
        { value:'online', emoji:'🟢', label:'Онлайн', color:'#10b981' },
        { value:'offline', emoji:'🔵', label:'Очно', color:'#6366f1' },
        { value:'group-online', emoji:'🟠', label:'Группа онлайн', color:'#f59e0b' },
        { value:'group-offline', emoji:'🔴', label:'Группа очно', color:'#ef4444' }
      ],
      legendItems: [
        { type:'online', label:'Онлайн', color:'#10b981' },
        { type:'offline', label:'Очно', color:'#6366f1' },
        { type:'group-online', label:'Группа', color:'#f59e0b' },
        { type:'group-offline', label:'Очно-группа', color:'#ef4444' }
      ],
      quickCreate: { date: null, student_id: '', lesson_type: 'online', title: '' },
      tooltipSlot: null,
      dragging: null, resizing: null, dragStartX: 0, dragStartY: 0, dragSlotOriginal: null
    };
  },
  computed: {
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; },
    weekDays() { return ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС']; },
    monthLabel() { return new Date(this.currentYear, this.currentMonth).toLocaleDateString('ru', { month:'long', year:'numeric' }); },
    monthDays() {
      const days = []; const firstDay = new Date(this.currentYear, this.currentMonth, 1); const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0); const startDay = firstDay.getDay() || 7;
      for (let i = 1; i < startDay; i++) { const d = new Date(this.currentYear, this.currentMonth, 1 - (startDay - i)); days.push({ day:d.getDate(), date:d.toISOString().split('T')[0], isOtherMonth:true, isToday:false }); }
      for (let i = 1; i <= lastDay.getDate(); i++) { const d = new Date(this.currentYear, this.currentMonth, i); days.push({ day:i, date:d.toISOString().split('T')[0], isOtherMonth:false, isToday:d.toDateString()===new Date().toDateString() }); }
      return days;
    },
    weekDaysList() {
      const today = new Date(); const monday = new Date(today); monday.setDate(today.getDate() - (today.getDay()||7) + 1 + this.currentWeek * 7);
      return Array.from({ length:7 }, (_,i) => { const d=new Date(monday); d.setDate(monday.getDate()+i); return { date:d.toISOString().split('T')[0], name:this.weekDays[i], dateStr:d.toLocaleDateString('ru',{day:'numeric',month:'short'}), isToday:d.toDateString()===today.toDateString() }; });
    },
    weekLabel() { return this.weekDaysList.length ? `${this.weekDaysList[0].dateStr} — ${this.weekDaysList[6].dateStr}` : ''; },
    weekSlots() { const ws=this.weekDaysList[0]?.date, we=this.weekDaysList[6]?.date; if(!ws||!we) return []; return this.slots.filter(s=>{const sd=new Date(s.start_time).toISOString().split('T')[0]; return sd>=ws && sd<=we;}).sort((a,b)=>new Date(a.start_time)-new Date(b.start_time)); },
    parallelWeekSlots() {
      // Группируем слоты по времени для параллельного отображения
      const grouped = {};
      this.weekSlots.forEach(s => {
        const key = `${s.start_time}_${new Date(s.start_time).toISOString().split('T')[0]}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
      });
      // Если есть наложение — сдвигаем
      const result = [];
      Object.values(grouped).forEach(group => {
        if (group.length > 1) {
          group.forEach((s, i) => {
            s._parallelIndex = i;
            s._parallelTotal = group.length;
            result.push(s);
          });
        } else {
          result.push(group[0]);
        }
      });
      return result;
    },
    pastSlots() { return this.slots.filter(s => new Date(s.start_time) < new Date()); }
  },
  async mounted() { await Promise.all([this.loadSlots(), this.loadStudents()]); document.addEventListener('mousemove', this.onDragMove); document.addEventListener('mouseup', this.onDragEnd); },
  beforeUnmount() { document.removeEventListener('mousemove', this.onDragMove); document.removeEventListener('mouseup', this.onDragEnd); },
  methods: {
    async loadSlots() { try { const r = await axios.get('/api/slots'); this.slots = r.data || []; } catch(e) {} },
    async loadStudents() { try { const r = await axios.get('/api/users'); this.allStudents = (r.data||[]).filter(u => u.role!=='admin' && u.role!=='parent'); } catch(e) {} },

    getSlotsForDate(date) { return this.slots.filter(s => new Date(s.start_time).toISOString().split('T')[0] === date); },
    getDefaultColor(t) { const c = { online:'#10b981', offline:'#6366f1', 'group-online':'#f59e0b', 'group-offline':'#ef4444' }; return c[t] || '#6366f1'; },
    getTypeEmoji(t) { const e = { online:'🟢', offline:'🔵', 'group-online':'🟠', 'group-offline':'🔴' }; return e[t] || '🟢'; },
    formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('ru',{day:'numeric',month:'short'}) : ''; },
    formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}) : ''; },

    // 🔥 НОВЫЕ МЕТОДЫ

    // Индикатор загрузки — точки
    getDotsForDate(date) {
      const slots = this.getSlotsForDate(date);
      return slots.slice(0, 5).map(s => ({
        color: s.color || this.getDefaultColor(s.lesson_type)
      }));
    },

    // Ширина параллельных полосок
    getBarWidth(date, index) {
      const count = Math.min(this.getSlotsForDate(date).length, 3);
      return (100 / count) + '%';
    },

    // Тултип при наведении на полоску
    showSlotTooltip(event, slot) {
      this.tooltipSlot = slot;
      // Простой тултип через title (уже в шаблоне)
    },

    // Выбор дня
    selectDay(day) {
      if (day.isOtherMonth) return;
      this.selectedDate = day.date;
      
      // Если есть события — открываем просмотр дня
      if (this.getSlotsForDate(day.date).length > 0) {
        this.viewMode = 'day';
      } else if (this.isTutor) {
        // Пустой день — мини-форма
        this.quickCreate = { date: day.date, student_id: '', lesson_type: 'online', title: '' };
      }
    },

    // Быстрое создание
    async saveQuickSlot() {
      if (!this.quickCreate.title || !this.quickCreate.date) return;
      try {
        const start = new Date(this.quickCreate.date + 'T10:00:00');
        const end = new Date(start.getTime() + 30 * 60000);
        await axios.post('/api/slots', {
          student_id: this.quickCreate.student_id || null,
          lesson_type: this.quickCreate.lesson_type,
          title: this.quickCreate.title,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          color: this.getDefaultColor(this.quickCreate.lesson_type),
          group_students: []
        });
        this.quickCreate.date = null;
        this.addToast('Создано! ✅', 'success');
        this.loadSlots();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },

    getSlotStyle(slot) {
      const sd = new Date(slot.start_time), ed = new Date(slot.end_time);
      if (ed <= sd) return { display:'none' };
      const dayIndex = this.weekDaysList.findIndex(d => d.date === sd.toISOString().split('T')[0]);
      if (dayIndex === -1) return { display:'none' };
      const startHour = 8, totalMinutes = 14 * 60;
      const slotStart = (sd.getHours() - startHour) * 60 + sd.getMinutes();
      const slotEnd = (ed.getHours() - startHour) * 60 + ed.getMinutes();
      const duration = Math.max(slotEnd - slotStart, 30);
      
      // Параллельные слоты — сужаем ширину
      const parallelTotal = slot._parallelTotal || 1;
      const parallelIndex = slot._parallelIndex || 0;
      const slotWidth = `calc((100% - 70px) / 7 / ${parallelTotal} - 2px)`;
      const slotLeft = `calc(70px + ${dayIndex} * (100% - 70px) / 7 + ${parallelIndex} * (100% - 70px) / 7 / ${parallelTotal} + 1px)`;
      
      return {
        top: (slotStart / totalMinutes * 100) + '%',
        height: (duration / totalMinutes * 100) + '%',
        left: slotLeft,
        width: slotWidth,
        minHeight: '20px'
      };
    },

    // Существующие методы (без изменений)
    startDrag(e, slot) { if (!this.isTutor) return; e.preventDefault(); this.dragging = slot; this.dragStartX = e.clientX; this.dragStartY = e.clientY; this.dragSlotOriginal = { ...slot }; },
    startResize(e, slot) { if (!this.isTutor) return; e.preventDefault(); this.resizing = slot; this.dragStartY = e.clientY; this.dragSlotOriginal = { ...slot }; },
    onDragMove(e) {
      if (!this.dragging && !this.resizing) return;
      const grid = this.$refs.weekGrid; if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const totalMinutes = 14 * 60; const gridHeight = rect.height - 44;
      const minutesPerPixel = totalMinutes / gridHeight; const dayWidth = (rect.width - 70) / 7;
      if (this.dragging) {
        const dy = e.clientY - this.dragStartY, dx = e.clientX - this.dragStartX;
        const deltaMin = Math.round(dy * minutesPerPixel / 30) * 30;
        const deltaDays = Math.round(dx / dayWidth);
        const origStart = new Date(this.dragSlotOriginal.start_time);
        const dur = Math.max((new Date(this.dragSlotOriginal.end_time) - origStart) / 60000, 30);
        let ns = new Date(origStart.getTime() + deltaMin * 60000); ns.setDate(ns.getDate() + deltaDays);
        const nsMin = (ns.getHours() - 8) * 60 + ns.getMinutes();
        if (nsMin < 0) ns.setHours(8,0,0,0);
        if (nsMin + dur > totalMinutes) { ns.setHours(8,0,0,0); ns.setMinutes(totalMinutes - dur); }
        this.dragging.start_time = ns.toISOString();
        this.dragging.end_time = new Date(ns.getTime() + dur * 60000).toISOString();
      }
      if (this.resizing) {
        const dy = e.clientY - this.dragStartY;
        const deltaMin = Math.round(dy * minutesPerPixel / 30) * 30;
        const origEnd = new Date(this.dragSlotOriginal.end_time);
        let ne = new Date(origEnd.getTime() + deltaMin * 60000);
        const minEnd = new Date(this.dragSlotOriginal.start_time).getTime() + 30 * 60000;
        if (ne.getTime() < minEnd) ne.setTime(minEnd);
        this.resizing.end_time = ne.toISOString();
      }
    },
    async onDragEnd() {
      const slot = this.dragging || this.resizing; if (!slot) return;
      try {
        if (this.dragging) await axios.put(`/api/slots/${slot.id}/move`, { start_time:slot.start_time, end_time:slot.end_time });
        else await axios.put(`/api/slots/${slot.id}`, { start_time:slot.start_time, end_time:slot.end_time, lesson_type:slot.lesson_type, title:slot.title, student_id:slot.student_id, notes:slot.notes, group_students:slot.group_students, color:slot.color });
        this.addToast('Сохранено! 📅', 'success');
      } catch(e) { this.addToast('Ошибка', 'error'); }
      this.dragging = null; this.resizing = null; this.dragSlotOriginal = null; this.loadSlots();
    },

    prevMonth() { this.currentMonth === 0 ? (this.currentMonth = 11, this.currentYear--) : this.currentMonth--; },
    nextMonth() { this.currentMonth === 11 ? (this.currentMonth = 0, this.currentYear++) : this.currentMonth++; },
    prevWeek() { this.currentWeek--; this.loadSlots(); },
    nextWeek() { this.currentWeek++; this.loadSlots(); },
    goToday() { this.currentWeek = 0; this.currentMonth = new Date().getMonth(); this.currentYear = new Date().getFullYear(); this.loadSlots(); },
    openSlot(date, hour, min = 0) { if (!this.isTutor) return; this.slotForm = { student_id:'', lesson_type:'online', title:'', date, time:`${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`, duration:30, notes:'', group_students:[], color:'#6366f1', repeat:'none', repeat_count:4 }; this.editingSlot = null; this.showAddSlot = true; },
    openAddSlot() { this.editingSlot = null; this.slotForm = { student_id:'', lesson_type:'online', title:'', date:'', time:'', duration:30, notes:'', group_students:[], color:'#6366f1', repeat:'none', repeat_count:4 }; this.showAddSlot = true; },
    editSlot(slot) {
      if (this.dragging || this.resizing) return;
      this.editingSlot = slot;
      if (!slot.meeting_link && (slot.lesson_type==='online'||slot.lesson_type==='group-online')) slot.meeting_link = 'https://meet.jit.si/english-club-' + slot.id;
      const sd = new Date(slot.start_time);
      this.slotForm = { student_id:slot.student_id||'', lesson_type:slot.lesson_type||'online', title:slot.title||'', date:sd.toISOString().split('T')[0], time:sd.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}), duration:Math.round((new Date(slot.end_time)-sd)/60000)||30, notes:slot.notes||'', group_students:slot.group_students||[], color:slot.color||'#6366f1', repeat:slot.repeat||'none', repeat_count:slot.repeat_count||4 };
      this.showAddSlot = true;
    },
    closeModal() { this.showAddSlot = false; this.editingSlot = null; this.slotForm.group_students = []; },
    toggleGroupStudent(id) { const idx = this.slotForm.group_students.indexOf(id); idx===-1 ? this.slotForm.group_students.push(id) : this.slotForm.group_students.splice(idx,1); },
    async saveSlot() {
      try {
        const [h,m] = this.slotForm.time.split(':');
        const start = new Date(this.slotForm.date); start.setHours(+h,+m,0,0);
        const dur = Math.max(+this.slotForm.duration||30,30);
        const end = new Date(start.getTime() + dur*60000);
        const data = { ...this.slotForm, start_time:start.toISOString(), end_time:end.toISOString() };
        if (this.editingSlot) await axios.put(`/api/slots/${this.editingSlot.id}`, data);
        else await axios.post('/api/slots', data);
        this.closeModal(); this.addToast('Сохранено! 🎉', 'success'); this.loadSlots();
      } catch(e) { this.addToast(e.response?.data?.error||'Ошибка', 'error'); }
    },
    async deleteSlot(id) { if(!confirm('Удалить занятие?')) return; try { await axios.delete(`/api/slots/${id}`); this.closeModal(); this.loadSlots(); this.addToast('Удалено! 🗑', 'info'); } catch(e) { this.addToast('Ошибка', 'error'); } },
    exportICS() { window.open('/api/slots/export', '_blank'); }
  }
};
</script>

<style scoped>
.calendar-container { max-width: 1280px; margin: 0 auto; padding: 24px; color: #e2e8f0; }

.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.calendar-nav { display: flex; align-items: center; gap: 10px; }
.calendar-title { font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 1.4rem; color: #fff; margin: 0; }
.calendar-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* Легенда */
.legend { display: flex; gap: 12px; margin-right: 8px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: #94a3b8; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

/* Месяц */
.month-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; }
.day-header { background: rgba(255,255,255,0.03); font-weight: 700; text-align: center; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.8rem; color: #94a3b8; }
.day-cell { min-height: 90px; padding: 6px; border-right: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: all 0.2s; position: relative; }
.day-cell:nth-child(7n) { border-right: none; }
.day-cell:hover { background: rgba(99,102,241,0.04); }
.day-cell.today { background: rgba(99,102,241,0.06); }
.day-cell.otherMonth { opacity: 0.35; }
.day-cell.selected { box-shadow: inset 0 0 0 2px rgba(99,102,241,0.5); }
.day-number { font-weight: 600; font-size: 0.85rem; color: #cbd5e1; }

/* Индикатор загрузки */
.day-dots { display: flex; gap: 3px; margin-top: 2px; }
.day-dot { width: 5px; height: 5px; border-radius: 50%; }
.day-dot-more { font-size: 0.55rem; color: #94a3b8; margin-left: 2px; }

/* Параллельные полоски */
.day-bars { display: flex; gap: 2px; margin-top: 4px; }
.day-bar { height: 5px; border-radius: 3px; cursor: pointer; transition: all 0.2s; }
.day-bar:hover { filter: brightness(1.3); transform: scaleY(1.5); }
.day-bar-more { font-size: 0.6rem; color: #94a3b8; cursor: pointer; margin-left: 4px; }
.day-bar-more:hover { color: #fff; }

/* Быстрое создание */
.quick-create { position: absolute; bottom: 4px; left: 4px; right: 4px; background: rgba(15,15,30,0.95); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 6px; z-index: 10; backdrop-filter: blur(10px); display: flex; flex-direction: column; gap: 4px; }
.quick-select { padding: 4px 6px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.7rem; font-family: inherit; }
.quick-input { padding: 4px 6px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.7rem; font-family: inherit; }
.quick-types { display: flex; gap: 4px; }
.quick-type-dot { width: 16px; height: 16px; border-radius: 50%; border: none; cursor: pointer; transition: all 0.2s; }
.quick-actions { display: flex; gap: 4px; }

/* Неделя */
.week-wrapper { overflow-x: auto; }
.week-grid { display: grid; grid-template-columns: 60px repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; min-width: 750px; position: relative; user-select: none; }
.week-header-cell { background: rgba(255,255,255,0.03); font-weight: 700; text-align: center; padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.75rem; color: #94a3b8; }
.week-header-cell.today { background: rgba(99,102,241,0.06); }
.week-time-cell { background: rgba(255,255,255,0.02); font-weight: 600; text-align: center; padding: 6px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.7rem; color: #64748b; }
.week-time-half { font-size: 0.6rem; }
.week-bg-cell { min-height: 42px; border-bottom: 1px solid rgba(255,255,255,0.04); border-right: 1px solid rgba(255,255,255,0.04); cursor: pointer; }
.week-bg-half { border-bottom: 1px dashed rgba(255,255,255,0.03); }
.week-bg-cell:hover { background: rgba(99,102,241,0.03); }
.week-bg-cell.today { background: rgba(99,102,241,0.02); }

.slots-layer { position: absolute; top: 40px; left: 0; right: 0; bottom: 0; pointer-events: none; }
.slot-block { position: absolute; padding: 4px 6px; border-radius: 6px; color: #fff; font-size: 0.7rem; cursor: grab; pointer-events: auto; overflow: hidden; transition: box-shadow 0.2s; }
.slot-block:active { cursor: grabbing; }
.slot-block:hover { box-shadow: 0 0 0 2px rgba(255,255,255,0.4); z-index: 10; }
.slot-time-label { font-size: 0.6rem; opacity: 0.9; }
.slot-block-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-block-student { font-size: 0.6rem; opacity: 0.8; }
.slot-join-btn { position: absolute; top: 2px; right: 2px; font-size: 0.7rem; text-decoration: none; opacity: 0.7; }
.slot-join-btn:hover { opacity: 1; }
.resize-handle { position: absolute; bottom: 0; left: 0; right: 0; height: 6px; cursor: ns-resize; }
.resize-handle:hover { background: rgba(255,255,255,0.2); }

/* Кнопки */
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 2px solid rgba(255,255,255,0.1); color: #cbd5e1; background: transparent; }
.btn-sm { padding: 5px 12px; font-size: 0.75rem; }
</style>
