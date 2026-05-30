<template>
  <div class="calendar-container">
    <!-- ХЕДЕР -->
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="btn btn-o btn-sm" @click="prevMonth">←</button>
        <h2 class="calendar-title">{{ monthLabel }}</h2>
        <button class="btn btn-o btn-sm" @click="nextMonth">→</button>
        <button class="btn btn-today btn-sm" @click="goToday">● Сегодня</button>
      </div>
      <div class="calendar-actions">
        <div class="legend">
          <span v-for="l in legendItems" :key="l.type" class="legend-item">
            <span class="legend-dot" :style="{ background: l.color }"></span>
            {{ l.label }}
          </span>
        </div>
        <div class="view-btns">
          <button class="view-btn" :class="{ active: viewMode === 'month' }" @click="viewMode = 'month'">📅</button>
          <button class="view-btn" :class="{ active: viewMode === 'week' }" @click="viewMode = 'week'">📆</button>
        </div>
        <button class="btn btn-o btn-sm" @click="exportICS">📤 ICS</button>
        <button class="btn btn-p btn-sm" @click="openAddSlot" v-if="isTutor">+ Занятие</button>
      </div>
    </div>

    <!-- МИНИ-ГРАФИК -->
    <div class="week-load" v-if="viewMode === 'month'">
      <div v-for="(day, i) in weekDays" :key="i" class="load-bar-col">
        <div class="load-bar-wrap">
          <div class="load-bar" :style="{ height: getLoadPercent(i) + '%' }"></div>
        </div>
        <span class="load-day">{{ day }}</span>
      </div>
    </div>

    <!-- МЕСЯЦ -->
    <div v-if="viewMode === 'month'" class="month-grid">
      <div class="day-header" v-for="day in weekDays" :key="day">{{ day }}</div>
      <div 
        class="day-cell" 
        v-for="(day, idx) in monthDays" :key="idx" 
        :class="{ today: day.isToday, otherMonth: day.isOtherMonth }"
        @click="selectDay(day)"
      >
        <span class="day-number" :class="{ 'today-num': day.isToday }">{{ day.day }}</span>
        
        <div class="day-dots" v-if="getEventsForDate(day.date).length">
          <span v-for="(dot, di) in getEventsForDate(day.date).slice(0, 5)" :key="di" class="day-dot" :style="{ background: dot.color }"></span>
          <span v-if="getEventsForDate(day.date).length > 5" class="day-dot-more">+{{ getEventsForDate(day.date).length - 5 }}</span>
        </div>

        <div class="day-bars" v-if="getEventsForDate(day.date).length">
          <div 
            v-for="(ev, si) in getEventsForDate(day.date).slice(0, 3)" :key="ev._key"
            class="day-bar" 
            :style="{ background: ev.color, width: getBarWidth(day.date, si) }"
            @click.stop="editSlot(ev)"
            :title="`${ev.title} (${ev._time})`"
          >
            <span class="bar-dot"></span>
          </div>
          <span v-if="getEventsForDate(day.date).length > 3" class="day-bar-more" @click.stop="viewMode = 'week'">+{{ getEventsForDate(day.date).length - 3 }}</span>
        </div>

        <div v-if="quickCreate.date === day.date" class="quick-create" @click.stop>
          <select class="quick-select" v-model="quickCreate.student_id">
            <option value="">Ученик</option>
            <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.username }}</option>
          </select>
          <div class="quick-types">
            <button v-for="t in slotTypes" :key="t.value" class="quick-type-dot" :style="{ background: quickCreate.lesson_type === t.value ? t.color : 'rgba(255,255,255,0.1)', boxShadow: quickCreate.lesson_type === t.value ? `0 0 8px ${t.color}` : 'none' }" @click="quickCreate.lesson_type = t.value" :title="t.label"></button>
          </div>
          <input class="quick-input" v-model="quickCreate.title" placeholder="Название" @keydown.enter="saveQuickSlot" />
          <div class="quick-actions">
            <button class="btn btn-p btn-sm" @click="saveQuickSlot" :disabled="!quickCreate.title">✓</button>
            <button class="btn btn-o btn-sm" @click="quickCreate.date = null">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- НЕДЕЛЯ -->
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
            v-for="ev in positionedWeekEvents" :key="ev._key" 
            class="slot-block" 
            :style="{ background: ev.color, ...getSlotStyle(ev) }"
            @mousedown="startDrag($event, ev)" 
            @click.stop="editSlot(ev)"
          >
            <div class="slot-time-label">{{ ev._time }}</div>
            <div class="slot-block-title">{{ ev.title }}</div>
            <div class="slot-block-student">{{ ev._student || '—' }}</div>
            <a v-if="ev.meeting_link" :href="ev.meeting_link" target="_blank" class="slot-join-btn" @click.stop>📹</a>
            <div class="resize-handle" @mousedown.stop="startResize($event, ev)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛКА -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div class="modal-overlay" v-if="showAddSlot || editingSlot" @click.self="closeModal">
          <div class="modal-card">
            <h3>{{ editingSlot ? '✏️ Редактировать' : '➕ Новое занятие' }}</h3>
            
            <label>Тип</label>
            <div class="type-btns">
              <button v-for="t in slotTypes" :key="t.value" class="type-btn" :class="{ active: slotForm.lesson_type === t.value }" :style="{ borderColor: slotForm.lesson_type === t.value ? t.color : 'rgba(255,255,255,0.1)', boxShadow: slotForm.lesson_type === t.value ? `0 0 12px ${t.color}40` : 'none' }" @click="slotForm.lesson_type = t.value">{{ t.emoji }} {{ t.label }}</button>
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
            <input class="input" v-model="slotForm.title" placeholder="Например: Speaking Practice">

            <div class="form-row">
              <div style="flex:1"><label>Дата</label><input class="input" type="date" v-model="slotForm.date"></div>
              <div style="flex:1"><label>Время</label><input class="input" type="time" v-model="slotForm.time"></div>
            </div>

            <label>Длительность (мин)</label>
            <input class="input" type="number" v-model="slotForm.duration" placeholder="30">

            <label>Цвет</label>
            <div class="color-picker">
              <button v-for="c in slotColors" :key="c" class="color-dot" :style="{ background: c, boxShadow: slotForm.color === c ? `0 0 10px ${c}` : 'none' }" :class="{ active: slotForm.color === c }" @click="slotForm.color = c"></button>
            </div>

            <label>Повторять</label>
            <select class="input" v-model="slotForm.repeat">
              <option value="none">Не повторять</option>
              <option value="weekly">Каждую неделю</option>
              <option value="biweekly">Каждые 2 недели</option>
              <option value="monthly">Каждый месяц</option>
            </select>

            <div v-if="slotForm.repeat !== 'none'" class="form-row">
              <div style="flex:1"><label>Повторений</label><input class="input" type="number" v-model="slotForm.repeat_count" placeholder="4" min="1" max="52"></div>
            </div>

            <label>Заметки</label>
            <textarea class="input note-area" v-model="slotForm.notes" rows="2" placeholder="Домашнее задание, материалы..."></textarea>

            <div class="modal-actions">
              <button class="btn btn-p btn-sm" @click="saveSlot">💾 Сохранить</button>
              <button v-if="editingSlot" class="btn btn-o btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,0.3)" @click="deleteSlot(editingSlot.id)">🗑 Удалить</button>
              <button class="btn btn-o btn-sm" @click="closeModal">Отмена</button>
            </div>
            <a v-if="editingSlot?.meeting_link" :href="editingSlot.meeting_link" target="_blank" class="btn btn-p btn-sm w-100 mt-2">📹 Подключиться</a>
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
      viewMode: 'month', currentMonth: new Date().getMonth(), currentYear: new Date().getFullYear(), currentWeek: 0,
      hours: Array.from({ length: 14 }, (_, i) => i + 8), slots: [], sessions: [], allStudents: [],
      showAddSlot: false, editingSlot: null,
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
      slotColors: ['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4','#84cc16','#f97316','#14b8a6'],
      quickCreate: { date: null, student_id: '', lesson_type: 'online', title: '' },
      dragging: null, resizing: null, dragStartX: 0, dragStartY: 0, dragSlotOriginal: null,
      _cache: { events: null, ts: 0 }
    };
  },
  computed: {
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; },
    isGroupType() { return this.slotForm.lesson_type?.includes('group'); },
    weekDays() { return ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС']; },
    monthLabel() { return new Date(this.currentYear, this.currentMonth).toLocaleDateString('ru', { month:'long', year:'numeric' }); },
    monthDays() {
      const days = []; const fd = new Date(this.currentYear, this.currentMonth, 1); const ld = new Date(this.currentYear, this.currentMonth+1, 0); const sd = fd.getDay() || 7;
      for (let i=1; i<sd; i++) { const d=new Date(this.currentYear, this.currentMonth, 1-(sd-i)); days.push({ day:d.getDate(), date:d.toISOString().split('T')[0], isOtherMonth:true, isToday:false }); }
      for (let i=1; i<=ld.getDate(); i++) { const d=new Date(this.currentYear, this.currentMonth, i); days.push({ day:i, date:d.toISOString().split('T')[0], isOtherMonth:false, isToday:d.toDateString()===new Date().toDateString() }); }
      return days;
    },
    weekDaysList() {
      const today=new Date(); const monday=new Date(today); monday.setDate(today.getDate()-(today.getDay()||7)+1+this.currentWeek*7);
      return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return{date:d.toISOString().split('T')[0],name:this.weekDays[i],dateStr:d.toLocaleDateString('ru',{day:'numeric',month:'short'}),isToday:d.toDateString()===today.toDateString()};});
    },
    weekLabel() { return this.weekDaysList.length?`${this.weekDaysList[0].dateStr} — ${this.weekDaysList[6].dateStr}`:''; },
    
    // 🔥 ОПТИМИЗИРОВАННЫЙ allEvents с кэшем
    allEvents() {
      const now = Date.now();
      if (this._cache.events && (now - this._cache.ts) < 3000) return this._cache.events;
      
      const events = [];
      this.slots.forEach(s => {
        events.push({
          _key: 'slot_' + s.id, _source: 'slot',
          _time: this.formatTime(s.start_time),
          _student: s.users?.username || '',
          ...s,
          color: s.color || this.getDefaultColor(s.lesson_type)
        });
      });
      
      this.sessions.forEach(s => {
        const startTime = s.date;
        const duration = s.duration || 60;
        events.push({
          _key: 'ses_' + s.id, _source: 'session',
          _time: this.formatTime(startTime),
          _student: s.users?.username || 'Группа',
          start_time: startTime,
          end_time: new Date(new Date(startTime).getTime() + duration * 60000).toISOString(),
          color: '#8b5cf6',
          lesson_type: 'workshop',
          meeting_link: s.meeting_link,
          title: s.title,
          description: s.description,
          id: s.id
        });
      });
      
      const sorted = events.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      this._cache = { events: sorted, ts: now };
      return sorted;
    },
    
    weekEvents() {
      const ws = this.weekDaysList[0]?.date, we = this.weekDaysList[6]?.date;
      if (!ws || !we) return [];
      return this.allEvents.filter(e => {
        const d = new Date(e.start_time).toISOString().split('T')[0];
        return d >= ws && d <= we;
      });
    },
    
    // 🔥 ПРАВИЛЬНАЯ ЛОГИКА ПЕРЕСЕЧЕНИЙ
    positionedWeekEvents() {
      const events = this.weekEvents;
      if (!events.length) return [];
      
      // Группируем по времени начала и считаем пересечения
      for (let i = 0; i < events.length; i++) {
        const a = events[i];
        a._overlapGroup = a._overlapGroup || [];
        a._overlapGroup.push(i);
        
        for (let j = i + 1; j < events.length; j++) {
          const b = events[j];
          const aStart = new Date(a.start_time).getTime();
          const aEnd = new Date(a.end_time).getTime();
          const bStart = new Date(b.start_time).getTime();
          const bEnd = new Date(b.end_time).getTime();
          
          // Пересекаются?
          if (aStart < bEnd && bStart < aEnd && 
              new Date(a.start_time).toISOString().split('T')[0] === new Date(b.start_time).toISOString().split('T')[0]) {
            if (!b._overlapGroup) b._overlapGroup = [];
            a._overlapGroup.forEach(idx => {
              if (!b._overlapGroup.includes(idx)) b._overlapGroup.push(idx);
            });
            if (!a._overlapGroup.includes(j)) a._overlapGroup.push(j);
          }
        }
      }
      
      // Считаем позиции для параллельных событий
      const result = [];
      const processed = new Set();
      
      events.forEach((ev, i) => {
        if (processed.has(i)) return;
        
        const group = ev._overlapGroup || [i];
        const groupEvents = group.map(idx => events[idx]).filter(e => e);
        
        // Сортируем группу по времени начала
        groupEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
        groupEvents.forEach((ge, gi) => {
          const idx = events.indexOf(ge);
          if (processed.has(idx)) return;
          processed.add(idx);
          
          const sd = new Date(ge.start_time);
          const ed = new Date(ge.end_time);
          const dayIdx = this.weekDaysList.findIndex(d => d.date === sd.toISOString().split('T')[0]);
          if (dayIdx === -1) return;
          
          const startHour = 8, totalMin = 14 * 60;
          const top = ((sd.getHours() - startHour) * 60 + sd.getMinutes()) / totalMin * 100;
          const h = Math.max(((ed - sd) / 60000), 30) / totalMin * 100;
          const total = groupEvents.length;
          
          ge._parallelIndex = gi;
          ge._parallelTotal = total;
          ge._style = {
            top: top + '%',
            height: h + '%',
            left: `calc(60px + ${dayIdx} * (100% - 60px) / 7 + ${gi} * (100% - 60px) / 7 / ${total} + 2px)`,
            width: `calc((100% - 60px) / 7 / ${total} - 3px)`,
            minHeight: '20px'
          };
          result.push(ge);
        });
      });
      
      return result;
    },
    pastSlots() { return this.slots.filter(s=>new Date(s.start_time)<new Date()); }
  },
  async mounted() { await Promise.all([this.loadSlots(), this.loadSessions(), this.loadStudents()]); document.addEventListener('mousemove',this.onDragMove); document.addEventListener('mouseup',this.onDragEnd); },
  beforeUnmount() { document.removeEventListener('mousemove',this.onDragMove); document.removeEventListener('mouseup',this.onDragEnd); },
  methods: {
    async loadSlots() { try { const r=await axios.get('/api/slots'); this.slots=r.data||[]; this._cache.ts = 0; } catch(e) {} },
    async loadSessions() { try { const r=await axios.get('/api/ses'); this.sessions=r.data||[]; this._cache.ts = 0; } catch(e) {} },
    async loadStudents() { try { const r=await axios.get('/api/users'); this.allStudents=(r.data||[]).filter(u=>u.role!=='admin'&&u.role!=='parent'); } catch(e) {} },

    getEventsForDate(d) { return this.allEvents.filter(e => new Date(e.start_time).toISOString().split('T')[0] === d); },
    getDefaultColor(t) { const c={online:'#10b981',offline:'#6366f1','group-online':'#f59e0b','group-offline':'#ef4444'}; return c[t]||'#6366f1'; },
    formatDate(ts) { return ts?new Date(ts).toLocaleDateString('ru',{day:'numeric',month:'short'}):''; },
    formatTime(ts) { return ts?new Date(ts).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}):''; },

    getDotsForDate(d) { return this.getEventsForDate(d).slice(0,5).map(e => ({ color: e.color })); },
    getBarWidth(d,i) { return (100/Math.min(this.getEventsForDate(d).length,3))+'%'; },
    getLoadPercent(dayIdx) {
      const weekDays = this.monthDays.filter(d => { const dw = new Date(d.date).getDay()||7; return dw===dayIdx+1&&!d.isOtherMonth; });
      const max = Math.max(...weekDays.map(d => this.getEventsForDate(d.date).length), 1);
      const total = weekDays.reduce((sum,d) => sum+this.getEventsForDate(d.date).length, 0);
      return Math.round((total/(max*weekDays.length||1))*100);
    },

    selectDay(day) {
      if (day.isOtherMonth) return;
      if (this.getEventsForDate(day.date).length > 0) this.viewMode = 'week';
      else if (this.isTutor) this.quickCreate = { date:day.date, student_id:'', lesson_type:'online', title:'' };
    },

    async saveQuickSlot() {
      if (!this.quickCreate.title||!this.quickCreate.date) return;
      try {
        const start=new Date(this.quickCreate.date+'T10:00:00');
        await axios.post('/api/slots',{student_id:this.quickCreate.student_id||null,lesson_type:this.quickCreate.lesson_type,title:this.quickCreate.title,start_time:start.toISOString(),end_time:new Date(start.getTime()+30*60000).toISOString(),color:this.getDefaultColor(this.quickCreate.lesson_type),group_students:[]});
        this.quickCreate.date=null; this.addToast('Создано! ✅','success'); this.loadSlots();
      } catch(e) { this.addToast('Ошибка','error'); }
    },

    getSlotStyle(ev) { return ev._style || {}; },

    startDrag(e,slot) { if(!this.isTutor||slot._source!=='slot')return; e.preventDefault(); this.dragging=slot; this.dragStartX=e.clientX; this.dragStartY=e.clientY; this.dragSlotOriginal={...slot}; },
    startResize(e,slot) { if(!this.isTutor||slot._source!=='slot')return; e.preventDefault(); this.resizing=slot; this.dragStartY=e.clientY; this.dragSlotOriginal={...slot}; },
    onDragMove(e) {
      if(!this.dragging&&!this.resizing)return; const grid=this.$refs.weekGrid; if(!grid)return; const rect=grid.getBoundingClientRect(); const tm=14*60,gh=rect.height-44,mp=gh/tm,dw=(rect.width-60)/7;
      if(this.dragging){const dy=e.clientY-this.dragStartY,dx=e.clientX-this.dragStartX,dm=Math.round(dy/mp/30)*30,dd=Math.round(dx/dw);const os=new Date(this.dragSlotOriginal.start_time),dur=Math.max((new Date(this.dragSlotOriginal.end_time)-os)/60000,30);let ns=new Date(os.getTime()+dm*60000);ns.setDate(ns.getDate()+dd);this.dragging.start_time=ns.toISOString();this.dragging.end_time=new Date(ns.getTime()+dur*60000).toISOString();this.dragging._time=this.formatTime(ns);}
      if(this.resizing){const dy=e.clientY-this.dragStartY,dm=Math.round(dy/mp/30)*30;const oe=new Date(this.dragSlotOriginal.end_time);let ne=new Date(oe.getTime()+dm*60000);if(ne-new Date(this.dragSlotOriginal.start_time)<30*60000)ne=new Date(new Date(this.dragSlotOriginal.start_time).getTime()+30*60000);this.resizing.end_time=ne.toISOString();}
    },
    async onDragEnd() {
      const ev=this.dragging||this.resizing; if(!ev||ev._source!=='slot'){this.dragging=null;this.resizing=null;return;}
      try{if(this.dragging)await axios.put(`/api/slots/${ev.id}/move`,{start_time:ev.start_time,end_time:ev.end_time});else await axios.put(`/api/slots/${ev.id}`,{start_time:ev.start_time,end_time:ev.end_time,lesson_type:ev.lesson_type,title:ev.title,notes:ev.notes,color:ev.color});this.addToast('Сохранено!','success');}catch(e){this.addToast('Ошибка','error');}
      this.dragging=null; this.resizing=null; this.loadSlots();
    },

    prevMonth() { this.currentMonth===0?(this.currentMonth=11,this.currentYear--):this.currentMonth--; },
    nextMonth() { this.currentMonth===11?(this.currentMonth=0,this.currentYear++):this.currentMonth++; },
    prevWeek() { this.currentWeek--; },
    nextWeek() { this.currentWeek++; },
    goToday() { this.currentWeek=0; this.currentMonth=new Date().getMonth(); this.currentYear=new Date().getFullYear(); },
    openSlot(date,hour,min=0){if(!this.isTutor)return;this.slotForm={student_id:'',lesson_type:'online',title:'',date,time:`${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,duration:30,notes:'',group_students:[],color:'#6366f1',repeat:'none',repeat_count:4};this.editingSlot=null;this.showAddSlot=true;},
    openAddSlot(){this.editingSlot=null;this.slotForm={student_id:'',lesson_type:'online',title:'',date:'',time:'',duration:30,notes:'',group_students:[],color:'#6366f1',repeat:'none',repeat_count:4};this.showAddSlot=true;},
    editSlot(ev){if(this.dragging||this.resizing)return;const slot=ev._source==='slot'?ev:{...ev,lesson_type:ev.lesson_type||'workshop',student_id:null,group_students:[],notes:ev.description||'',repeat:'none',repeat_count:4,color:ev.color||'#8b5cf6'};this.editingSlot=slot;if(!slot.meeting_link&&(slot.lesson_type==='online'||slot.lesson_type==='group-online'))slot.meeting_link='https://meet.jit.si/english-club-'+slot.id;const sd=new Date(slot.start_time);this.slotForm={student_id:slot.student_id||'',lesson_type:slot.lesson_type||'online',title:slot.title||'',date:sd.toISOString().split('T')[0],time:sd.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}),duration:Math.round((new Date(slot.end_time)-sd)/60000)||30,notes:slot.notes||'',group_students:slot.group_students||[],color:slot.color||'#6366f1',repeat:slot.repeat||'none',repeat_count:slot.repeat_count||4};this.showAddSlot=true;},
    closeModal(){this.showAddSlot=false;this.editingSlot=null;this.slotForm.group_students=[];},
    toggleGroupStudent(id){const i=this.slotForm.group_students.indexOf(id);i===-1?this.slotForm.group_students.push(id):this.slotForm.group_students.splice(i,1);},
    async saveSlot(){try{const[h,m]=this.slotForm.time.split(':');const start=new Date(this.slotForm.date);start.setHours(+h,+m,0,0);const dur=Math.max(+this.slotForm.duration||30,30);const end=new Date(start.getTime()+dur*60000);const data={...this.slotForm,start_time:start.toISOString(),end_time:end.toISOString()};if(!this.isGroupType){data.group_students=[];if(!data.student_id)return this.addToast('Выберите ученика','error');}if(this.isGroupType)data.student_id=null;if(this.editingSlot?.id&&this.editingSlot._source==='slot')await axios.put(`/api/slots/${this.editingSlot.id}`,data);else await axios.post('/api/slots',data);this.closeModal();this.addToast('Сохранено!','success');this.loadSlots();this.loadSessions();}catch(e){this.addToast(e.response?.data?.error||'Ошибка','error');}},
    async deleteSlot(id){if(!confirm('Удалить?'))return;try{await axios.delete(`/api/slots/${id}`);this.closeModal();this.loadSlots();this.loadSessions();this.addToast('Удалено!','info');}catch(e){this.addToast('Ошибка','error');}},
    exportICS(){window.open('/api/slots/export','_blank');}
  }
};
</script>

<style scoped>
.calendar-container { max-width: 1280px; margin: 0 auto; padding: 24px; color: #e2e8f0; }

.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
.calendar-nav { display: flex; align-items: center; gap: 10px; }
.calendar-title { font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 1.5rem; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
.calendar-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.legend { display: flex; gap: 14px; margin-right: 8px; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; color: #94a3b8; }
.legend-dot { width: 9px; height: 9px; border-radius: 50%; box-shadow: 0 0 6px currentColor; }

.view-btns { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 3px; }
.view-btn { padding: 7px 12px; border: none; background: transparent; color: #94a3b8; cursor: pointer; border-radius: 8px; font-size: 0.9rem; transition: all 0.2s; }
.view-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1)); color: #fff; box-shadow: 0 0 12px rgba(99,102,241,0.2); }

.btn-today { background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(45,212,191,0.08)); border: 1px solid rgba(99,102,241,0.3); color: #fff; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; font-family: inherit; animation: todayPulse 2s ease-in-out infinite; }
@keyframes todayPulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.3)} 50%{box-shadow:0 0 15px 3px rgba(99,102,241,0.15)} }

.week-load { display: flex; gap: 4px; margin-bottom: 14px; align-items: flex-end; height: 40px; padding: 0 4px; }
.load-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
.load-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.load-bar { width: 100%; background: linear-gradient(180deg, #6366f1, #2dd4bf); border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.5s ease; }
.load-day { font-size: 0.6rem; color: #64748b; }

.month-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; background: rgba(255,255,255,0.02); }
.day-header { background: rgba(255,255,255,0.03); font-weight: 700; text-align: center; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.8rem; color: #94a3b8; }
.day-cell { min-height: 95px; padding: 7px; border-right: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: all 0.25s; position: relative; }
.day-cell:nth-child(7n) { border-right: none; }
.day-cell:hover { background: rgba(99,102,241,0.05); transform: translateY(-1px); }
.day-cell.today { background: rgba(99,102,241,0.06); box-shadow: inset 0 0 30px rgba(99,102,241,0.05); }
.day-cell.otherMonth { opacity: 0.3; }
.day-number { font-weight: 600; font-size: 0.85rem; color: #cbd5e1; }
.today-num { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 1rem; }

.day-dots { display: flex; gap: 3px; margin-top: 3px; }
.day-dot { width: 5px; height: 5px; border-radius: 50%; animation: dotPulse 2s ease-in-out infinite; }
@keyframes dotPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
.day-dot-more { font-size: 0.55rem; color: #94a3b8; margin-left: 2px; }

.day-bars { display: flex; gap: 2px; margin-top: 5px; }
.day-bar { height: 5px; border-radius: 3px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; padding-left: 2px; }
.day-bar:hover { filter: brightness(1.3); transform: scaleY(1.6); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.bar-dot { width: 4px; height: 4px; border-radius: 50%; background: #fff; opacity: 0.8; }
.day-bar-more { font-size: 0.6rem; color: #94a3b8; cursor: pointer; }
.day-bar-more:hover { color: #fff; }

.quick-create { position: absolute; bottom: 4px; left: 4px; right: 4px; background: rgba(15,15,30,0.97); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 7px; z-index: 10; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.quick-select { padding: 5px 7px; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.7rem; font-family: inherit; }
.quick-input { padding: 5px 7px; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.7rem; font-family: inherit; }
.quick-types { display: flex; gap: 5px; }
.quick-type-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
.quick-type-dot:hover { transform: scale(1.2); }
.quick-actions { display: flex; gap: 5px; }

.week-wrapper { overflow-x: auto; }
.week-grid { display: grid; grid-template-columns: 60px repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; min-width: 750px; position: relative; user-select: none; }
.week-header-cell { background: rgba(255,255,255,0.03); font-weight: 700; text-align: center; padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.75rem; color: #94a3b8; }
.week-header-cell.today { background: rgba(99,102,241,0.06); color: #818cf8; }
.week-time-cell { background: rgba(255,255,255,0.02); font-weight: 600; text-align: center; padding: 6px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.7rem; color: #64748b; }
.week-time-half { font-size: 0.6rem; }
.week-bg-cell { min-height: 42px; border-bottom: 1px solid rgba(255,255,255,0.04); border-right: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.2s; }
.week-bg-half { border-bottom: 1px dashed rgba(255,255,255,0.03); }
.week-bg-cell:hover { background: rgba(99,102,241,0.04); }
.week-bg-cell.today { background: rgba(99,102,241,0.03); }

.slots-layer { position: absolute; top: 40px; left: 0; right: 0; bottom: 0; pointer-events: none; }
.slot-block { position: absolute; padding: 5px 7px; border-radius: 7px; color: #fff; font-size: 0.7rem; cursor: grab; pointer-events: auto; overflow: hidden; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.slot-block:active { cursor: grabbing; }
.slot-block:hover { box-shadow: 0 0 0 2px rgba(255,255,255,0.5), 0 8px 20px rgba(0,0,0,0.4); z-index: 10; transform: scale(1.02); }
.slot-time-label { font-size: 0.6rem; opacity: 0.9; }
.slot-block-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-block-student { font-size: 0.6rem; opacity: 0.8; }
.slot-join-btn { position: absolute; top: 3px; right: 3px; font-size: 0.7rem; text-decoration: none; opacity: 0.7; }
.slot-join-btn:hover { opacity: 1; }
.resize-handle { position: absolute; bottom: 0; left: 0; right: 0; height: 7px; cursor: ns-resize; }
.resize-handle:hover { background: rgba(255,255,255,0.25); }

.modal-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; }
.modal-card { background: rgba(15,15,30,0.97); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 28px; max-width: 520px; width: 90%; max-height: 85vh; overflow-y: auto; color: #e2e8f0; box-shadow: 0 25px 60px rgba(0,0,0,0.5); animation: modalPop 0.3s ease; }
@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; margin: 0 0 16px; color: #fff; }
.modal-card label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px; margin-top: 10px; }
.modal-actions { display: flex; gap: 8px; margin-top: 16px; }
.form-row { display: flex; gap: 8px; }
.type-btns { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.type-btn { padding: 8px 14px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); cursor: pointer; font-weight: 600; font-size: 0.82rem; color: #cbd5e1; transition: all 0.2s; }
.type-btn.active { background: rgba(255,255,255,0.05); color: #fff; }
.color-picker { display: flex; gap: 6px; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
.color-dot.active { border-color: #fff; transform: scale(1.2); }
.student-checkbox { display: flex; align-items: center; gap: 8px; padding: 6px; cursor: pointer; border-radius: 6px; font-size: 0.85rem; }
.student-checkbox:hover { background: rgba(99,102,241,0.05); }
.input { width: 100%; padding: 10px 14px; border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; font-family: inherit; font-size: 0.9rem; background: rgba(255,255,255,0.04); color: #fff; outline: none; margin-bottom: 6px; }
.input:focus { border-color: #6366f1; }
.note-area { resize: vertical; }

.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-p:hover { box-shadow: 0 6px 20px rgba(99,102,241,0.3); transform: translateY(-1px); }
.btn-o { border: 2px solid rgba(255,255,255,0.1); color: #cbd5e1; background: transparent; }
.btn-o:hover { background: rgba(255,255,255,0.05); }
.btn-sm { padding: 6px 14px; font-size: 0.78rem; }
.w-100 { width: 100%; justify-content: center; }
.mt-2 { margin-top: 12px; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
