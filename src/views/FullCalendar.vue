<template>
  <div class="calendar-app">
    <!-- ХЕДЕР-ГОЛОГРАММА -->
    <div class="cal-header">
      <div class="cal-nav">
        <button class="nav-btn" @click="prevMonth">
          <span class="nav-arrow">◀</span>
        </button>
        <h1 class="cal-title">{{ monthLabel }}</h1>
        <button class="nav-btn" @click="nextMonth">
          <span class="nav-arrow">▶</span>
        </button>
        <button class="today-btn" @click="goToday">
          <span class="today-dot"></span>
          Сегодня
        </button>
      </div>

      <div class="cal-toolbar">
        <div class="legend-compact">
          <span v-for="l in legendItems" :key="l.type" class="legend-dot" :style="{ background: l.color }" :title="l.label"></span>
        </div>
        <div class="view-switcher">
          <button class="view-btn" :class="{ active: viewMode === 'month' }" @click="viewMode = 'month'">Месяц</button>
          <button class="view-btn" :class="{ active: viewMode === 'week' }" @click="viewMode = 'week'">Неделя</button>
        </div>
        <button class="action-btn" @click="exportICS" title="Экспорт">📤</button>
        <button class="add-btn" @click="openQuickCreate" v-if="isTutor">
          <span class="add-plus">+</span>
        </button>
      </div>
    </div>

    <!-- МЕСЯЦ -->
    <div v-if="viewMode === 'month'" class="month-view">
      <div class="month-grid">
        <div class="month-day-header" v-for="day in weekDays" :key="day">{{ day }}</div>
        <div 
          v-for="(day, idx) in monthDays" :key="idx"
          class="month-day-cell"
          :class="{ today: day.isToday, other: day.isOtherMonth, weekend: idx % 7 >= 5 }"
          @click="handleDayClick(day)"
        >
          <div class="day-top">
            <span class="day-num" :class="{ 'today-num': day.isToday }">{{ day.day }}</span>
            <div class="day-dots-row" v-if="getEventsForDate(day.date).length">
              <span v-for="(dot, di) in getEventsForDate(day.date).slice(0, 5)" :key="di" class="day-dot" :style="{ background: dot.color }"></span>
            </div>
          </div>
          
          <div class="day-events" v-if="getEventsForDate(day.date).length">
            <div 
              v-for="(ev, ei) in getEventsForDate(day.date).slice(0, 3)" :key="ev._key"
              class="day-event-bar"
              :style="{ background: ev.color, width: (100 / Math.min(getEventsForDate(day.date).length, 3)) + '%' }"
              @click.stop="openEvent(ev)"
              :title="`${ev.title} (${ev._time})`"
            ></div>
            <span v-if="getEventsForDate(day.date).length > 3" class="day-more" @click.stop="goToDay(day.date)">
              +{{ getEventsForDate(day.date).length - 3 }}
            </span>
          </div>

          <!-- Быстрое создание -->
          <div v-if="quickCreate.date === day.date" class="quick-popup" @click.stop>
            <input class="quick-input" v-model="quickCreate.title" placeholder="Название встречи" ref="quickInput" @keydown.enter="saveQuickEvent" />
            <div class="quick-row">
              <select class="quick-select" v-model="quickCreate.type">
                <option value="online">🟢 Онлайн</option>
                <option value="offline">🔵 Очно</option>
              </select>
              <button class="quick-save" @click="saveQuickEvent">✓</button>
              <button class="quick-cancel" @click="quickCreate.date = null">✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- НЕДЕЛЯ -->
    <div v-if="viewMode === 'week'" class="week-view">
      <div class="week-scroll">
        <div class="week-grid" ref="weekGrid">
          <div class="week-corner">Время</div>
          <div class="week-day-header" v-for="day in weekDaysList" :key="day.date" :class="{ today: day.isToday, weekend: day.dayIndex >= 5 }">
            <span class="wd-name">{{ day.name }}</span>
            <span class="wd-date">{{ day.dateStr }}</span>
          </div>
          
          <template v-for="hour in hours" :key="hour">
            <div class="week-time">{{ hour }}:00</div>
            <div class="week-cell" v-for="day in weekDaysList" :key="'c'+day.date+hour" :class="{ today: day.isToday }" @click="openSlotAt(day.date, hour, 0)"></div>
            <div class="week-time week-time-half">30</div>
            <div class="week-cell week-cell-half" v-for="day in weekDaysList" :key="'ch'+day.date+hour" :class="{ today: day.isToday }" @click="openSlotAt(day.date, hour, 30)"></div>
          </template>

          <div class="events-layer">
            <div 
              v-for="ev in positionedWeekEvents" :key="ev._key"
              class="week-event"
              :style="{ ...ev._style, background: ev.color }"
              @mousedown="startDrag($event, ev)"
              @click.stop="openEvent(ev)"
            >
              <div class="we-time">{{ ev._time }}</div>
              <div class="we-title">{{ ev.title }}</div>
              <div class="we-student" v-if="ev._student">{{ ev._student }}</div>
              <div class="we-resize" @mousedown.stop="startResize($event, ev)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛКА СОБЫТИЯ -->
    <Teleport to="body">
      <transition name="modal-pop">
        <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
          <div class="modal-glass">
            <div class="modal-glow" :style="{ background: modalEvent?.color || '#6366f1' }"></div>
            <button class="modal-close" @click="closeModal">✕</button>
            
            <div class="modal-type-badge" :style="{ background: modalEvent?.color || '#6366f1' }">
              {{ getTypeLabel(modalEvent?._type) }}
            </div>
            
            <h2 class="modal-title">{{ modalEvent?.title }}</h2>
            
            <div class="modal-info-grid">
              <div class="modal-info-item">
                <span class="mi-icon">📅</span>
                <span>{{ formatDate(modalEvent?.start_time || modalEvent?.date) }}</span>
              </div>
              <div class="modal-info-item" v-if="modalEvent?.start_time">
                <span class="mi-icon">🕐</span>
                <span>{{ formatTime(modalEvent.start_time) }} - {{ formatTime(modalEvent.end_time) }}</span>
              </div>
              <div class="modal-info-item" v-if="modalEvent?._student">
                <span class="mi-icon">👤</span>
                <span>{{ modalEvent._student }}</span>
              </div>
              <div class="modal-info-item" v-if="modalEvent?.notes">
                <span class="mi-icon">📝</span>
                <span>{{ modalEvent.notes }}</span>
              </div>
            </div>

            <div class="modal-actions">
              <a v-if="modalEvent?.meeting_link" :href="modalEvent.meeting_link" target="_blank" class="modal-btn primary pulse">
                📹 Войти в класс
              </a>
              <button v-if="isTutor" class="modal-btn secondary" @click="editEvent(modalEvent)">✏️</button>
              <button v-if="isTutor" class="modal-btn danger" @click="deleteEvent(modalEvent)">🗑</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- МОДАЛКА РЕДАКТИРОВАНИЯ -->
    <Teleport to="body">
      <transition name="modal-pop">
        <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
          <div class="modal-glass">
            <h3>{{ editingEvent?._isNew ? '➕ Новая встреча' : '✏️ Редактировать' }}</h3>
            
            <label>Тип</label>
            <div class="type-row">
              <button v-for="t in eventTypes" :key="t.value" class="type-chip" :class="{ active: editForm.type === t.value }" :style="{ borderColor: editForm.type === t.value ? t.color : 'transparent', boxShadow: editForm.type === t.value ? `0 0 12px ${t.color}40` : 'none' }" @click="editForm.type = t.value; editForm.color = t.color">{{ t.emoji }} {{ t.label }}</button>
            </div>

            <label>Название</label>
            <input class="glass-input" v-model="editForm.title" placeholder="Введите название" />

            <div class="form-row-2">
              <div><label>Дата</label><input class="glass-input" type="date" v-model="editForm.date" /></div>
              <div><label>Время</label><input class="glass-input" type="time" v-model="editForm.time" /></div>
            </div>

            <label>Длительность (мин)</label>
            <input class="glass-input" type="number" v-model="editForm.duration" placeholder="30" />

            <label>Заметки</label>
            <textarea class="glass-input" v-model="editForm.notes" rows="2" placeholder="Заметки..."></textarea>

            <div class="modal-actions">
              <button class="modal-btn primary" @click="saveEvent">💾 Сохранить</button>
              <button class="modal-btn secondary" @click="closeEditModal">Отмена</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
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
      hours: Array.from({ length: 15 }, (_, i) => i + 8),
      slots: [],
      sessions: [],
      allStudents: [],
      
      showModal: false,
      modalEvent: null,
      showEditModal: false,
      editingEvent: null,
      editForm: { type:'online', color:'#10b981', title:'', date:'', time:'10:00', duration:30, notes:'' },
      
      quickCreate: { date: null, title: '', type: 'online' },
      
      eventTypes: [
        { value:'online', emoji:'🟢', label:'Онлайн', color:'#10b981' },
        { value:'offline', emoji:'🔵', label:'Очно', color:'#6366f1' },
        { value:'group', emoji:'🟠', label:'Группа', color:'#f59e0b' },
        { value:'workshop', emoji:'🟣', label:'Воркшоп', color:'#8b5cf6' }
      ],
      legendItems: [
        { type:'online', color:'#10b981' },
        { type:'offline', color:'#6366f1' },
        { type:'group', color:'#f59e0b' },
        { type:'workshop', color:'#8b5cf6' }
      ],
      
      dragging: null, resizing: null, dragStartY: 0, dragOriginal: null
    };
  },
  computed: {
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; },
    weekDays() { return ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']; },
    monthLabel() { const d = new Date(this.currentYear, this.currentMonth); return d.toLocaleDateString('ru', { month:'long', year:'numeric' }); },
    
    monthDays() {
      const days = [];
      const firstDay = new Date(this.currentYear, this.currentMonth, 1);
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
      const startDow = firstDay.getDay() || 7;
      
      for (let i = 1; i < startDow; i++) {
        const d = new Date(this.currentYear, this.currentMonth, 1 - (startDow - i));
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
        return { date: d.toISOString().split('T')[0], name: this.weekDays[i], dateStr: d.getDate().toString(), dayIndex: i, isToday: d.toDateString() === today.toDateString() };
      });
    },

    allEvents() {
      const events = [];
      
      // Слоты (занятия)
      this.slots.forEach(s => {
        events.push({
          _key: 'slot_' + s.id,
          _type: s.lesson_type || 'online',
          _time: this.formatTime(s.start_time),
          _student: s.users?.username || '',
          _source: 'slot',
          ...s,
          color: s.color || this.getDefaultColor(s.lesson_type)
        });
      });
      
      // Сессии (групповые встречи)
      this.sessions.forEach(s => {
        events.push({
          _key: 'ses_' + s.id,
          _type: 'workshop',
          _time: this.formatTime(s.date),
          _student: s.users?.username || 'Группа',
          _source: 'session',
          start_time: s.date,
          end_time: new Date(new Date(s.date).getTime() + (s.duration || 60) * 60000).toISOString(),
          ...s,
          color: '#8b5cf6'
        });
      });
      
      return events.sort((a, b) => new Date(a.start_time || a.date) - new Date(b.start_time || b.date));
    },

    weekEvents() {
      const ws = this.weekDaysList[0]?.date, we = this.weekDaysList[6]?.date;
      if (!ws || !we) return [];
      return this.allEvents.filter(e => {
        const d = new Date(e.start_time || e.date).toISOString().split('T')[0];
        return d >= ws && d <= we;
      });
    },

    positionedWeekEvents() {
      const grouped = {};
      this.weekEvents.forEach(e => {
        const key = `${e.start_time || e.date}_${new Date(e.start_time || e.date).toISOString().split('T')[0]}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(e);
      });
      
      const result = [];
      Object.values(grouped).forEach(g => {
        g.forEach((e, i) => {
          const sd = new Date(e.start_time || e.date);
          const ed = new Date(e.end_time || new Date(sd).getTime() + 3600000);
          const dayIdx = this.weekDaysList.findIndex(d => d.date === sd.toISOString().split('T')[0]);
          if (dayIdx === -1) return;
          
          const startHour = 8, totalMin = 15 * 60;
          const top = ((sd.getHours() - startHour) * 60 + sd.getMinutes()) / totalMin * 100;
          const h = Math.max(((ed - sd) / 60000), 30) / totalMin * 100;
          const total = g.length;
          
          e._style = {
            top: top + '%',
            height: h + '%',
            left: `calc(60px + ${dayIdx} * (100% - 60px) / 7 + ${i} * (100% - 60px) / 7 / ${total} + 2px)`,
            width: `calc((100% - 60px) / 7 / ${total} - 3px)`
          };
          result.push(e);
        });
      });
      return result;
    }
  },

  async mounted() {
    await Promise.all([this.loadSlots(), this.loadSessions(), this.loadStudents()]);
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  },

  methods: {
    async loadSlots() { try { const r = await axios.get('/api/slots'); this.slots = r.data || []; } catch(e) {} },
    async loadSessions() { try { const r = await axios.get('/api/ses'); this.sessions = r.data || []; } catch(e) {} },
    async loadStudents() { try { const r = await axios.get('/api/users'); this.allStudents = (r.data || []).filter(u => u.role !== 'admin' && u.role !== 'parent'); } catch(e) {} },

    getEventsForDate(d) {
      return this.allEvents.filter(e => {
        const ed = new Date(e.start_time || e.date).toISOString().split('T')[0];
        return ed === d;
      });
    },

    getDefaultColor(t) {
      const c = { online:'#10b981', offline:'#6366f1', group:'#f59e0b', 'group-online':'#f59e0b', 'group-offline':'#ef4444' };
      return c[t] || '#6366f1';
    },
    getTypeLabel(t) {
      const l = { online:'Онлайн', offline:'Очно', group:'Группа', 'group-online':'Группа онлайн', 'group-offline':'Группа очно', workshop:'Воркшоп' };
      return l[t] || t;
    },
    formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('ru', { day:'numeric', month:'long', weekday:'short' }) : ''; },
    formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' }) : ''; },

    handleDayClick(day) {
      if (day.isOtherMonth) return;
      if (this.getEventsForDate(day.date).length > 0) {
        this.viewMode = 'week';
        this.currentWeek = 0;
        const today = new Date();
        const clicked = new Date(day.date);
        const diff = Math.floor((clicked - new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() || 7) + 1)) / (7 * 86400000));
        this.currentWeek = diff;
      } else if (this.isTutor) {
        this.quickCreate = { date: day.date, title: '', type: 'online' };
        this.$nextTick(() => this.$refs.quickInput?.focus());
      }
    },

    async saveQuickEvent() {
      if (!this.quickCreate.title) return;
      try {
        const start = new Date(this.quickCreate.date + 'T10:00:00');
        await axios.post('/api/slots', {
          title: this.quickCreate.title,
          lesson_type: this.quickCreate.type,
          start_time: start.toISOString(),
          end_time: new Date(start.getTime() + 30*60000).toISOString(),
          student_id: null,
          color: this.getDefaultColor(this.quickCreate.type),
          group_students: []
        });
        this.quickCreate.date = null;
        this.addToast('✅ Создано!', 'success');
        this.loadSlots();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },

    openEvent(ev) { this.modalEvent = ev; this.showModal = true; },
    closeModal() { this.showModal = false; this.modalEvent = null; },

    editEvent(ev) {
      this.closeModal();
      const sd = new Date(ev.start_time || ev.date);
      this.editingEvent = ev;
      this.editForm = {
        type: ev._type || ev.lesson_type || 'online',
        color: ev.color || '#6366f1',
        title: ev.title || '',
        date: sd.toISOString().split('T')[0],
        time: sd.toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' }),
        duration: Math.round(((new Date(ev.end_time || sd.getTime() + 3600000)) - sd) / 60000) || 30,
        notes: ev.notes || ''
      };
      this.showEditModal = true;
    },

    openSlotAt(date, hour, min) {
      if (!this.isTutor) return;
      this.editingEvent = { _isNew: true };
      this.editForm = {
        type: 'online', color: '#10b981', title: '',
        date, time: `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
        duration: 30, notes: ''
      };
      this.showEditModal = true;
    },
    openQuickCreate() {
      this.editingEvent = { _isNew: true };
      this.editForm = { type:'online', color:'#10b981', title:'', date: new Date().toISOString().split('T')[0], time:'10:00', duration:30, notes:'' };
      this.showEditModal = true;
    },

    async saveEvent() {
      try {
        const [h, m] = this.editForm.time.split(':');
        const start = new Date(this.editForm.date);
        start.setHours(+h, +m, 0, 0);
        const dur = Math.max(+this.editForm.duration || 30, 30);
        const end = new Date(start.getTime() + dur * 60000);
        
        const data = {
          title: this.editForm.title,
          lesson_type: this.editForm.type,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          color: this.editForm.color,
          notes: this.editForm.notes,
          group_students: []
        };
        
        if (this.editingEvent?._source === 'slot' && this.editingEvent.id) {
          await axios.put(`/api/slots/${this.editingEvent.id}`, data);
        } else {
          await axios.post('/api/slots', data);
        }
        
        this.closeEditModal();
        this.addToast('✅ Сохранено!', 'success');
        this.loadSlots();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },

    async deleteEvent(ev) {
      if (!confirm('Удалить?')) return;
      try {
        if (ev._source === 'slot') await axios.delete(`/api/slots/${ev.id}`);
        else await axios.delete(`/api/ses/${ev.id}`);
        this.closeModal();
        this.addToast('🗑 Удалено', 'info');
        this.loadSlots();
        this.loadSessions();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },

    closeEditModal() { this.showEditModal = false; this.editingEvent = null; },
    goToDay(date) { this.viewMode = 'week'; },

    startDrag(e, ev) { if (!this.isTutor) return; e.preventDefault(); this.dragging = ev; this.dragStartY = e.clientY; this.dragOriginal = { start: ev.start_time, end: ev.end_time }; },
    startResize(e, ev) { if (!this.isTutor) return; e.preventDefault(); this.resizing = ev; this.dragStartY = e.clientY; this.dragOriginal = { start: ev.start_time, end: ev.end_time }; },
    onDragMove(e) {
      if (!this.dragging && !this.resizing) return;
      const grid = this.$refs.weekGrid; if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const totalMin = 15 * 60;
      const gridH = rect.height - 40;
      const minPerPixel = totalMin / gridH;
      const dy = e.clientY - this.dragStartY;
      const deltaMin = Math.round(dy * minPerPixel / 15) * 15;
      
      if (this.dragging) {
        const origStart = new Date(this.dragOriginal.start);
        const dur = Math.max((new Date(this.dragOriginal.end) - origStart) / 60000, 30);
        let ns = new Date(origStart.getTime() + deltaMin * 60000);
        this.dragging.start_time = ns.toISOString();
        this.dragging.end_time = new Date(ns.getTime() + dur * 60000).toISOString();
        this.dragging._time = this.formatTime(ns);
      }
      if (this.resizing) {
        const origEnd = new Date(this.dragOriginal.end);
        let ne = new Date(origEnd.getTime() + deltaMin * 60000);
        if (ne - new Date(this.dragOriginal.start) < 30 * 60000) ne = new Date(new Date(this.dragOriginal.start).getTime() + 30 * 60000);
        this.resizing.end_time = ne.toISOString();
      }
    },
    async onDragEnd() {
      const ev = this.dragging || this.resizing;
      if (!ev || ev._source !== 'slot') { this.dragging = null; this.resizing = null; return; }
      try {
        await axios.put(`/api/slots/${ev.id}/move`, { start_time: ev.start_time, end_time: ev.end_time });
        this.addToast('✅ Перемещено', 'success');
      } catch(e) { this.addToast('Ошибка', 'error'); }
      this.dragging = null; this.resizing = null;
      this.loadSlots();
    },

    prevMonth() { this.currentMonth === 0 ? (this.currentMonth = 11, this.currentYear--) : this.currentMonth--; },
    nextMonth() { this.currentMonth === 11 ? (this.currentMonth = 0, this.currentYear++) : this.currentMonth++; },
    prevWeek() { this.currentWeek--; },
    nextWeek() { this.currentWeek++; },
    goToday() { this.currentMonth = new Date().getMonth(); this.currentYear = new Date().getFullYear(); this.currentWeek = 0; },
    exportICS() { window.open('/api/slots/export', '_blank'); }
  }
};
</script>

<style scoped>
.calendar-app { max-width: 1200px; margin: 0 auto; padding: 20px; color: #e2e8f0; font-family: 'Inter', sans-serif; }

/* ХЕДЕР */
.cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.cal-nav { display: flex; align-items: center; gap: 12px; }
.cal-title { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; animation: titleShine 3s ease-in-out infinite; }
@keyframes titleShine { 0%,100%{ filter: brightness(1); } 50%{ filter: brightness(1.3); } }
.nav-btn { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; backdrop-filter: blur(10px); }
.nav-btn:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); transform: scale(1.1); }
.today-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(99,102,241,0.3); background: rgba(99,102,241,0.1); color: #fff; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; }
.today-btn:hover { background: rgba(99,102,241,0.2); box-shadow: 0 0 15px rgba(99,102,241,0.3); }
.today-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: dotPulse 2s infinite; }
@keyframes dotPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }

.cal-toolbar { display: flex; align-items: center; gap: 10px; }
.legend-compact { display: flex; gap: 6px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
.view-switcher { display: flex; background: rgba(255,255,255,0.04); border-radius: 12px; padding: 3px; }
.view-btn { padding: 7px 16px; border: none; background: transparent; color: #94a3b8; cursor: pointer; border-radius: 10px; font-weight: 600; font-size: 0.82rem; transition: all 0.2s; }
.view-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(45,212,191,0.15)); color: #fff; box-shadow: 0 0 15px rgba(99,102,241,0.25); }
.action-btn { width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #fff; cursor: pointer; font-size: 1rem; }
.add-btn { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #2dd4bf); border: none; color: #fff; cursor: pointer; font-size: 1.3rem; font-weight: 700; transition: all 0.2s; box-shadow: 0 4px 15px rgba(99,102,241,0.4); }
.add-btn:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(99,102,241,0.6); }

/* МЕСЯЦ */
.month-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); }
.month-day-header { text-align: center; padding: 12px 4px; font-weight: 700; font-size: 0.8rem; color: #94a3b8; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
.month-day-cell { min-height: 100px; padding: 6px; border-right: 1px solid rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: all 0.25s; position: relative; }
.month-day-cell:nth-child(7n+1) { border-right: none; }
.month-day-cell:hover { background: rgba(99,102,241,0.06); transform: translateY(-2px); z-index: 1; box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
.month-day-cell.today { background: rgba(99,102,241,0.08); box-shadow: inset 0 0 40px rgba(99,102,241,0.06); }
.month-day-cell.other { opacity: 0.3; }
.month-day-cell.weekend { background: rgba(255,255,255,0.01); }

.day-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.day-num { font-weight: 600; font-size: 0.85rem; color: #cbd5e1; }
.today-num { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 1rem; }
.day-dots-row { display: flex; gap: 2px; }
.day-dot { width: 4px; height: 4px; border-radius: 50%; }

.day-events { display: flex; gap: 2px; margin-top: 4px; align-items: center; }
.day-event-bar { height: 5px; border-radius: 3px; cursor: pointer; transition: all 0.2s; }
.day-event-bar:hover { filter: brightness(1.4); transform: scaleY(1.8); }
.day-more { font-size: 0.6rem; color: #94a3b8; cursor: pointer; margin-left: 2px; }
.day-more:hover { color: #fff; }

/* Быстрое создание */
.quick-popup { position: absolute; bottom: 2px; left: 2px; right: 2px; background: rgba(10,10,30,0.97); backdrop-filter: blur(20px); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; padding: 6px; z-index: 10; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
.quick-input { padding: 5px 7px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.7rem; font-family: inherit; }
.quick-row { display: flex; gap: 4px; }
.quick-select { flex:1; padding: 4px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.65rem; }
.quick-save, .quick-cancel { padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.7rem; }
.quick-save { background: #10b981; color: #fff; }
.quick-cancel { background: rgba(239,68,68,0.3); color: #fff; }

/* НЕДЕЛЯ */
.week-scroll { overflow-x: auto; }
.week-grid { display: grid; grid-template-columns: 60px repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; min-width: 750px; position: relative; background: rgba(255,255,255,0.02); }
.week-corner { background: rgba(255,255,255,0.03); padding: 8px; text-align: center; font-size: 0.7rem; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05); }
.week-day-header { text-align: center; padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem; }
.week-day-header.today { background: rgba(99,102,241,0.08); }
.wd-name { font-weight: 700; color: #94a3b8; display: block; }
.wd-date { font-size: 0.7rem; color: #64748b; }
.week-time { padding: 4px; text-align: center; font-size: 0.65rem; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.03); }
.week-time-half { font-size: 0.55rem; border-bottom: 1px dashed rgba(255,255,255,0.02); }
.week-cell { min-height: 25px; border-bottom: 1px solid rgba(255,255,255,0.03); border-right: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: background 0.15s; }
.week-cell:hover { background: rgba(99,102,241,0.05); }
.week-cell.today { background: rgba(99,102,241,0.03); }
.week-cell-half { border-bottom: 1px dashed rgba(255,255,255,0.02); }

.events-layer { position: absolute; top: 60px; left: 0; right: 0; bottom: 0; pointer-events: none; }
.week-event { position: absolute; padding: 3px 5px; border-radius: 5px; color: #fff; font-size: 0.65rem; cursor: grab; pointer-events: auto; overflow: hidden; transition: box-shadow 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
.week-event:hover { box-shadow: 0 0 0 2px rgba(255,255,255,0.6), 0 6px 16px rgba(0,0,0,0.5); z-index: 10; }
.we-time { font-size: 0.55rem; opacity: 0.8; }
.we-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.we-student { font-size: 0.55rem; opacity: 0.7; }
.we-resize { position: absolute; bottom: 0; left: 0; right: 0; height: 5px; cursor: ns-resize; }

/* МОДАЛКА */
.modal-backdrop { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,0.7); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; }
.modal-glass { background: rgba(12,12,35,0.95); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 28px; max-width: 440px; width: 90%; position: relative; overflow: hidden; box-shadow: 0 30px 70px rgba(0,0,0,0.6); }
.modal-glow { position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%; opacity: 0.12; filter: blur(30px); }
.modal-close { position: absolute; top: 14px; right: 14px; background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
.modal-close:hover { color: #fff; }
.modal-type-badge { display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; color: #fff; margin-bottom: 10px; }
.modal-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; font-weight: 700; color: #fff; margin: 0 0 16px; }
.modal-info-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.modal-info-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #cbd5e1; }
.mi-icon { font-size: 1rem; }
.modal-actions { display: flex; gap: 8px; }
.modal-btn { padding: 10px 18px; border-radius: 12px; border: none; font-weight: 600; font-size: 0.85rem; cursor: pointer; color: #fff; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
.modal-btn.primary { background: linear-gradient(135deg, #6366f1, #2dd4bf); }
.modal-btn.primary:hover { box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
.modal-btn.secondary { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); }
.modal-btn.danger { background: rgba(239,68,68,0.15); color: #ef4444; }
.pulse { animation: btnPulse 2s infinite; }
@keyframes btnPulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)} 50%{box-shadow:0 0 20px 4px rgba(99,102,241,0.3)} }

.type-row { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
.type-chip { padding: 6px 12px; border-radius: 10px; border: 2px solid transparent; background: rgba(255,255,255,0.03); color: #cbd5e1; cursor: pointer; font-weight: 600; font-size: 0.78rem; transition: all 0.2s; }
.type-chip.active { background: rgba(255,255,255,0.06); color: #fff; }
.glass-input { width: 100%; padding: 10px 14px; border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.04); color: #fff; font-size: 0.9rem; outline: none; margin-bottom: 8px; font-family: inherit; }
.glass-input:focus { border-color: #6366f1; }
.form-row-2 { display: flex; gap: 8px; }
.form-row-2 > div { flex: 1; }
label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px; margin-top: 8px; }

.modal-pop-enter-active, .modal-pop-leave-active { transition: all 0.3s ease; }
.modal-pop-enter-from, .modal-pop-leave-to { opacity: 0; }
.modal-pop-enter-from .modal-glass, .modal-pop-leave-to .modal-glass { transform: scale(0.85); }
</style>
