<template>
  <div class="calendar-container">
    <FullCalendar
      ref="calendarRef"
      :options="calendarOptions"
    />
    
    <!-- Модалка создания/редактирования -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card">
            <h3>{{ editingEvent ? '✏️ Редактировать' : '➕ Новое занятие' }}</h3>
            
            <label>Тип</label>
            <div class="type-btns">
              <button v-for="t in eventTypes" :key="t.value" class="type-btn" :class="{ active: formData.type === t.value }" :style="{ borderColor: formData.type === t.value ? t.color : 'rgba(255,255,255,0.1)', boxShadow: formData.type === t.value ? `0 0 12px ${t.color}40` : 'none' }" @click="formData.type = t.value; formData.color = t.color">{{ t.emoji }} {{ t.label }}</button>
            </div>
            
            <label>Ученик</label>
            <select class="input" v-model="formData.student_id">
              <option value="">Выберите</option>
              <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.username }}</option>
            </select>
            
            <label>Название</label>
            <input class="input" v-model="formData.title" placeholder="Например: Speaking Practice" />
            
            <div class="row">
              <div><label>Дата</label><input class="input" type="date" v-model="formData.date" /></div>
              <div><label>Время</label><input class="input" type="time" v-model="formData.time" /></div>
            </div>
            
            <label>Длительность (мин)</label>
            <input class="input" type="number" v-model="formData.duration" placeholder="30" />
            
            <label>Цвет</label>
            <div class="color-row">
              <button v-for="c in eventColors" :key="c" class="color-dot" :style="{ background: c, boxShadow: formData.color === c ? `0 0 10px ${c}` : 'none' }" :class="{ active: formData.color === c }" @click="formData.color = c"></button>
            </div>
            
            <label>Повторять</label>
            <select class="input" v-model="formData.repeat">
              <option value="none">Не повторять</option>
              <option value="weekly">Каждую неделю</option>
              <option value="biweekly">Каждые 2 недели</option>
              <option value="monthly">Каждый месяц</option>
            </select>
            
            <div v-if="formData.repeat !== 'none'" class="row">
              <div><label>Повторений</label><input class="input" type="number" v-model="formData.repeat_count" placeholder="4" /></div>
            </div>
            
            <label>Заметки</label>
            <textarea class="input" v-model="formData.notes" rows="2" placeholder="Заметки..."></textarea>
            
            <div class="modal-actions">
              <button class="btn-p" @click="saveEvent">💾 Сохранить</button>
              <button v-if="editingEvent" class="btn-d" @click="deleteEvent">🗑 Удалить</button>
              <button class="btn-o" @click="closeModal">Отмена</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export default {
  name: 'FullCalendarPage',
  components: { FullCalendar },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      showModal: false,
      editingEvent: null,
      formData: { student_id: '', type: 'online', title: '', date: '', time: '10:00', duration: 30, notes: '', color: '#6366f1', repeat: 'none', repeat_count: 4 },
      allStudents: [],
      eventTypes: [
        { value: 'online', emoji: '🟢', label: 'Онлайн', color: '#10b981' },
        { value: 'offline', emoji: '🔵', label: 'Очно', color: '#6366f1' },
        { value: 'group', emoji: '🟠', label: 'Группа', color: '#f59e0b' }
      ],
      eventColors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'],
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
        initialView: 'timeGridWeek',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listWeek'
        },
        buttonText: { today: 'Сегодня', month: 'Месяц', week: 'Неделя', list: 'Список' },
        firstDay: 1,
        locale: 'ru',
        height: 'auto',
        slotMinTime: '08:00:00',
        slotMaxTime: '22:00:00',
        allDaySlot: false,
        nowIndicator: true,
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: 3,
        weekends: true,
        events: [],
        eventClick: this.handleEventClick,
        select: this.handleSelect,
        eventDrop: this.handleEventDrop,
        eventResize: this.handleEventResize,
        eventDidMount: this.handleEventMount
      }
    };
  },
  async mounted() {
    await this.loadEvents();
    await this.loadStudents();
  },
  methods: {
    async loadEvents() {
      try {
        const { data } = await axios.get('/api/slots');
        const events = (data || []).map(s => ({
          id: s.id.toString(),
          title: s.title || 'Занятие',
          start: s.start_time,
          end: s.end_time,
          backgroundColor: s.color || '#6366f1',
          borderColor: s.color || '#6366f1',
          extendedProps: {
            student_id: s.student_id,
            lesson_type: s.lesson_type,
            notes: s.notes,
            student_name: s.users?.username || ''
          }
        }));
        this.calendarOptions.events = events;
      } catch(e) { console.error('Ошибка загрузки слотов:', e); }
    },
    
    async loadStudents() {
      try {
        const { data } = await axios.get('/api/users');
        this.allStudents = (data || []).filter(u => u.role !== 'admin' && u.role !== 'parent');
      } catch(e) {}
    },
    
    handleEventClick(info) {
      const ev = info.event;
      const sd = ev.start;
      this.editingEvent = ev;
      this.formData = {
        student_id: ev.extendedProps.student_id || '',
        type: ev.extendedProps.lesson_type || 'online',
        title: ev.title || '',
        date: sd.toISOString().split('T')[0],
        time: sd.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
        duration: Math.round((ev.end - sd) / 60000) || 30,
        notes: ev.extendedProps.notes || '',
        color: ev.backgroundColor || '#6366f1',
        repeat: 'none',
        repeat_count: 4
      };
      this.showModal = true;
    },
    
    handleSelect(info) {
      if (!this.isTutor) return;
      const sd = info.start;
      this.editingEvent = null;
      this.formData = {
        student_id: '', type: 'online', title: '',
        date: sd.toISOString().split('T')[0],
        time: sd.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
        duration: 30, notes: '', color: '#6366f1', repeat: 'none', repeat_count: 4
      };
      this.showModal = true;
    },
    
    async saveEvent() {
      try {
        const [h, m] = this.formData.time.split(':');
        const start = new Date(this.formData.date);
        start.setHours(+h, +m, 0, 0);
        const dur = Math.max(+this.formData.duration || 30, 30);
        const end = new Date(start.getTime() + dur * 60000);
        
        const data = {
          title: this.formData.title,
          lesson_type: this.formData.type,
          student_id: this.formData.student_id || null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          notes: this.formData.notes,
          color: this.formData.color,
          repeat: this.formData.repeat,
          repeat_count: this.formData.repeat_count
        };
        
        if (this.editingEvent) {
          await axios.put(`/api/slots/${this.editingEvent.id}`, data);
        } else {
          await axios.post('/api/slots', data);
        }
        
        this.closeModal();
        this.addToast('✅ Сохранено', 'success');
        await this.loadEvents();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },
    
    async deleteEvent() {
      if (!confirm('Удалить?')) return;
      try {
        await axios.delete(`/api/slots/${this.editingEvent.id}`);
        this.closeModal();
        this.addToast('🗑 Удалено', 'info');
        await this.loadEvents();
      } catch(e) { this.addToast('Ошибка', 'error'); }
    },
    
    async handleEventDrop(info) {
      try {
        await axios.put(`/api/slots/${info.event.id}/move`, {
          start_time: info.event.start.toISOString(),
          end_time: info.event.end.toISOString()
        });
        this.addToast('✅ Перемещено', 'success');
      } catch(e) {
        info.revert();
        this.addToast('Ошибка перемещения', 'error');
      }
    },
    
    async handleEventResize(info) {
      try {
        await axios.put(`/api/slots/${info.event.id}`, {
          start_time: info.event.start.toISOString(),
          end_time: info.event.end.toISOString()
        });
        this.addToast('✅ Изменено', 'success');
      } catch(e) {
        info.revert();
        this.addToast('Ошибка', 'error');
      }
    },
    
    handleEventMount(info) {
      if (info.event.extendedProps.student_name) {
        info.el.title = `${info.event.title}\n${info.event.extendedProps.student_name}`;
      }
    },
    
    closeModal() { this.showModal = false; this.editingEvent = null; }
  },
  computed: {
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; }
  }
};
</script>

<style scoped>
.calendar-container { padding: 20px; }

/* Стилизация FullCalendar под тёмную тему */
:deep(.fc) { color: #e2e8f0; font-family: 'Inter', sans-serif; }
:deep(.fc-header-toolbar) { margin-bottom: 16px !important; }
:deep(.fc-toolbar-title) { font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 1.5rem !important; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
:deep(.fc-button) { background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important; padding: 6px 14px !important; font-weight: 600 !important; font-size: 0.8rem !important; transition: all 0.2s !important; text-transform: capitalize !important; }
:deep(.fc-button:hover) { background: rgba(99,102,241,0.2) !important; }
:deep(.fc-button-active) { background: rgba(99,102,241,0.3) !important; border-color: rgba(99,102,241,0.5) !important; color: #fff !important; box-shadow: 0 0 12px rgba(99,102,241,0.2) !important; }
:deep(.fc-today-button) { background: rgba(99,102,241,0.15) !important; border-color: rgba(99,102,241,0.3) !important; }
:deep(.fc-daygrid-day) { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05) !important; }
:deep(.fc-daygrid-day:hover) { background: rgba(99,102,241,0.04); }
:deep(.fc-day-today) { background: rgba(99,102,241,0.08) !important; }
:deep(.fc-daygrid-day-number) { color: #cbd5e1; font-weight: 600; padding: 8px !important; }
:deep(.fc-timegrid-slot) { border-color: rgba(255,255,255,0.03) !important; }
:deep(.fc-timegrid-slot-label) { color: #64748b; font-size: 0.75rem; }
:deep(.fc-timegrid-axis) { color: #64748b; font-size: 0.75rem; border-color: rgba(255,255,255,0.03) !important; }
:deep(.fc-col-header-cell) { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05) !important; padding: 8px !important; font-weight: 700; color: #94a3b8; font-size: 0.8rem; }
:deep(.fc-event) { border-radius: 6px !important; border: 1px solid rgba(255,255,255,0.15) !important; padding: 2px 4px !important; font-size: 0.75rem !important; cursor: grab !important; transition: all 0.2s !important; }
:deep(.fc-event:hover) { box-shadow: 0 0 0 2px rgba(255,255,255,0.4); z-index: 10 !important; }
:deep(.fc-list-day) { background: rgba(255,255,255,0.02) !important; }
:deep(.fc-list-event) { background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.05) !important; }
:deep(.fc-list-event:hover) { background: rgba(99,102,241,0.1) !important; }

/* Модалка */
.modal-overlay { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; }
.modal-card { background: rgba(15,15,30,0.97); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 28px; max-width: 480px; width: 90%; max-height: 85vh; overflow-y: auto; color: #e2e8f0; box-shadow: 0 25px 60px rgba(0,0,0,0.5); }
.modal-card h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; margin: 0 0 16px; color: #fff; }
.modal-card label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block; margin: 10px 0 4px; }
.modal-actions { display: flex; gap: 8px; margin-top: 16px; }
.row { display: flex; gap: 8px; }
.row > div { flex: 1; }
.type-btns { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.type-btn { padding: 8px 14px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); cursor: pointer; font-weight: 600; font-size: 0.82rem; color: #cbd5e1; transition: all 0.2s; font-family: inherit; }
.type-btn.active { background: rgba(255,255,255,0.06); color: #fff; }
.color-row { display: flex; gap: 6px; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
.color-dot.active { border-color: #fff; transform: scale(1.2); }
.input { width: 100%; padding: 10px 14px; border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; font-family: inherit; font-size: 0.9rem; background: rgba(255,255,255,0.04); color: #fff; outline: none; margin-bottom: 4px; }
.input:focus { border-color: #6366f1; }
textarea.input { resize: vertical; }
.btn-p { padding: 10px 20px; border-radius: 12px; border: none; background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; font-weight: 600; cursor: pointer; font-size: 0.85rem; flex: 1; }
.btn-p:hover { box-shadow: 0 6px 20px rgba(99,102,241,0.3); }
.btn-d { padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(239,68,68,0.3); background: rgba(239,68,68,0.1); color: #ef4444; cursor: pointer; font-size: 0.85rem; }
.btn-o { padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #cbd5e1; cursor: pointer; font-size: 0.85rem; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
