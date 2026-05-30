<template>
  <div class="calendar-container">
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
            <span class="legend-dot" :style="{ background: l.color }"></span> {{ l.label }}
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

    <div v-if="viewMode === 'month'" class="month-grid">
      <div class="day-header" v-for="day in weekDays" :key="day">{{ day }}</div>
      <div v-for="(day, idx) in monthDays" :key="idx" class="day-cell" :class="{ today: day.isToday, otherMonth: day.isOtherMonth }" @click="selectDay(day)">
        <span class="day-number" :class="{ 'today-num': day.isToday }">{{ day.day }}</span>
        <div class="day-bars" v-if="getEventsForDate(day.date).length">
          <div v-for="ev in getEventsForDate(day.date).slice(0, 3)" :key="ev._key" class="day-bar" :style="{ background: ev.color }" @click.stop="editSlot(ev)" :title="ev.title"></div>
          <span v-if="getEventsForDate(day.date).length > 3" class="day-bar-more">+{{ getEventsForDate(day.date).length - 3 }}</span>
        </div>
      </div>
    </div>

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
          <div v-for="ev in positionedWeekEvents" :key="ev._key" class="slot-block" :data-key="ev._key" :style="{ background: ev.color, ...ev._style }" @mousedown="startDrag($event, ev)" @click.stop="editSlot(ev)">
            <div class="slot-time-label">{{ ev._time }}</div>
            <div class="slot-block-title">{{ ev.title }}</div>
            <div class="slot-block-student">{{ ev._student || '—' }}</div>
            <div class="resize-handle" @mousedown.stop="startResize($event, ev)"></div>
          </div>
        </div>
      </div>
    </div>

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
            <select v-if="!isGroupType" class="input" v-model="slotForm.student_id"><option value="">Выберите</option><option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.username }}</option></select>
            <label>Название</label><input class="input" v-model="slotForm.title" placeholder="Например: Speaking Practice">
            <div class="form-row"><div style="flex:1"><label>Дата</label><input class="input" type="date" v-model="slotForm.date"></div><div style="flex:1"><label>Время</label><input class="input" type="time" v-model="slotForm.time"></div></div>
            <label>Длительность (мин)</label><input class="input" type="number" v-model="slotForm.duration" placeholder="30">
            <label>Цвет</label>
            <div class="color-picker">
              <button v-for="c in slotColors" :key="c" class="color-dot" :style="{ background: c, boxShadow: slotForm.color === c ? `0 0 10px ${c}` : 'none' }" :class="{ active: slotForm.color === c }" @click="slotForm.color = c"></button>
            </div>
            <label>Повторять</label>
            <select class="input" v-model="slotForm.repeat"><option value="none">Не повторять</option><option value="weekly">Каждую неделю</option><option value="biweekly">Каждые 2 недели</option><option value="monthly">Каждый месяц</option></select>
            <div v-if="slotForm.repeat !== 'none'" class="form-row"><div style="flex:1"><label>Повторений</label><input class="input" type="number" v-model="slotForm.repeat_count" placeholder="4" min="1" max="52"></div></div>
            <label>Заметки</label><textarea class="input note-area" v-model="slotForm.notes" rows="2" placeholder="Заметки..."></textarea>
            <div class="modal-actions"><button class="btn btn-p btn-sm" @click="saveSlot">💾 Сохранить</button><button v-if="editingSlot" class="btn btn-o btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,0.3)" @click="deleteSlot(editingSlot.id)">🗑</button><button class="btn btn-o btn-sm" @click="closeModal">Отмена</button></div>
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
      hours: Array.from({ length: 14 }, (_, i) => i + 8), slots: [], allStudents: [],
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
      dragging: null, resizing: null, dragStartX: 0, dragStartY: 0, dragSlotOriginal: null
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
    weekSlots() {
      const ws=this.weekDaysList[0]?.date, we=this.weekDaysList[6]?.date; if(!ws||!we) return [];
      return this.slots.filter(s=>{const sd=new Date(s.start_time).toISOString().split('T')[0];return sd>=ws&&sd<=we;}).sort((a,b)=>new Date(a.start_time)-new Date(b.start_time));
    },
    positionedWeekEvents() {
      const events = this.weekSlots.map(s => ({ ...s, _key:'slot_'+s.id, _time:this.formatTime(s.start_time), _student:s.users?.username||'', color:s.color||this.getDefaultColor(s.lesson_type) }));
      if (!events.length) return [];
      const byDay = {}; events.forEach(e => { const d=new Date(e.start_time).toISOString().split('T')[0]; if(!byDay[d])byDay[d]=[]; byDay[d].push(e); });
      const result = [];
      Object.values(byDay).forEach(dayEvents => {
        dayEvents.sort((a,b)=>new Date(a.start_time)-new Date(b.start_time));
        const columns = [];
        dayEvents.forEach(ev => {
          let placed=false;
          for(const col of columns) { if(new Date(ev.start_time)>=new Date(col[col.length-1].end_time)){col.push(ev);placed=true;break;} }
          if(!placed) columns.push([ev]);
        });
        const total=columns.length;
        columns.forEach((col,ci)=>{col.forEach(ev=>{const sd=new Date(ev.start_time),ed=new Date(ev.end_time),di=this.weekDaysList.findIndex(d=>d.date===sd.toISOString().split('T')[0]);if(di===-1)return;const sh=8,tm=14*60;ev._style={top:((sd.getHours()-sh)*60+sd.getMinutes())/tm*100+'%',height:Math.max((ed-sd)/60000,30)/tm*100+'%',left:`calc(60px + ${di}*(100% - 60px)/7 + ${ci}*(100% - 60px)/7/${total} + 2px)`,width:`calc((100% - 60px)/7/${total} - 3px)`,minHeight:'20px'};result.push(ev);});});
      });
      return result;
    }
  },
  async mounted() { await Promise.all([this.loadSlots(), this.loadStudents()]); document.addEventListener('mousemove',this.onDragMove); document.addEventListener('mouseup',this.onDragEnd); },
  beforeUnmount() { document.removeEventListener('mousemove',this.onDragMove); document.removeEventListener('mouseup',this.onDragEnd); },
  methods: {
    async loadSlots() { try { const r=await axios.get('/api/slots'); this.slots=r.data||[]; } catch(e) {} },
    async loadStudents() { try { const r=await axios.get('/api/users'); this.allStudents=(r.data||[]).filter(u=>u.role!=='admin'&&u.role!=='parent'); } catch(e) {} },
    getEventsForDate(d) { return this.slots.filter(s=>new Date(s.start_time).toISOString().split('T')[0]===d); },
    getDefaultColor(t) { const c={online:'#10b981',offline:'#6366f1','group-online':'#f59e0b','group-offline':'#ef4444'}; return c[t]||'#6366f1'; },
    formatDate(ts) { return ts?new Date(ts).toLocaleDateString('ru',{day:'numeric',month:'short'}):''; },
    formatTime(ts) { return ts?new Date(ts).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}):''; },
    selectDay(day) { if (!day.isOtherMonth && this.isTutor) { this.slotForm.date = day.date; this.openAddSlot(); } },

    // 🔥 ПЛАВНЫЙ ДРАГ
    startDrag(e, slot) { if(!this.isTutor)return; e.preventDefault(); this.dragging=slot; this.dragStartX=e.clientX; this.dragStartY=e.clientY; this.dragSlotOriginal={...slot}; },
    startResize(e, slot) { if(!this.isTutor)return; e.preventDefault(); this.resizing=slot; this.dragStartY=e.clientY; this.dragSlotOriginal={...slot}; },
    onDragMove(e) {
      if(!this.dragging&&!this.resizing)return;
      const grid=this.$refs.weekGrid; if(!grid)return;
      const rect=grid.getBoundingClientRect();
      const totalMin=14*60, gridH=rect.height-44, minPerPixel=totalMin/gridH, dayWidth=(rect.width-60)/7;
      if(this.dragging){
        const dy=e.clientY-this.dragStartY, dx=e.clientX-this.dragStartX;
        const deltaMin=Math.round(dy*minPerPixel/15)*15, deltaDays=Math.round(dx/dayWidth);
        const origStart=new Date(this.dragSlotOriginal.start_time), dur=Math.max((new Date(this.dragSlotOriginal.end_time)-origStart)/60000,30);
        let ns=new Date(origStart.getTime()+deltaMin*60000); ns.setDate(ns.getDate()+deltaDays);
        this.dragging.start_time=ns.toISOString(); this.dragging.end_time=new Date(ns.getTime()+dur*60000).toISOString();
        const el=document.querySelector(`.slot-block[data-key="${this.dragging._key}"]`);
        if(el){el.style.transform=`translate(${dx}px, ${dy}px)`;el.style.zIndex='100';el.style.transition='none';el.style.opacity='0.85';el.style.boxShadow='0 8px 25px rgba(0,0,0,0.5)';}
      }
      if(this.resizing){
        const dy=e.clientY-this.dragStartY, deltaMin=Math.round(dy*minPerPixel/15)*15;
        const origEnd=new Date(this.dragSlotOriginal.end_time); let ne=new Date(origEnd.getTime()+deltaMin*60000);
        const minEnd=new Date(this.dragSlotOriginal.start_time).getTime()+30*60000; if(ne.getTime()<minEnd)ne.setTime(minEnd);
        this.resizing.end_time=ne.toISOString();
      }
    },
    async onDragEnd() {
      const ev=this.dragging||this.resizing; if(!ev)return;
      const el=document.querySelector(`.slot-block[data-key="${ev._key}"]`);
      if(el){el.style.transition='all 0.3s cubic-bezier(0.4,0,0.2,1)';el.style.transform='translate(0,0)';el.style.zIndex='10';el.style.opacity='1';el.style.boxShadow='';}
      try{if(this.dragging)await axios.put(`/api/slots/${ev.id}/move`,{start_time:ev.start_time,end_time:ev.end_time});else await axios.put(`/api/slots/${ev.id}`,{start_time:ev.start_time,end_time:ev.end_time});}catch(e){}
      this.dragging=null; this.resizing=null; this.dragSlotOriginal=null;
      setTimeout(()=>this.loadSlots(),300);
    },

    prevMonth() { this.currentMonth===0?(this.currentMonth=11,this.currentYear--):this.currentMonth--; },
    nextMonth() { this.currentMonth===11?(this.currentMonth=0,this.currentYear++):this.currentMonth++; },
    goToday() { this.currentWeek=0; this.currentMonth=new Date().getMonth(); this.currentYear=new Date().getFullYear(); },
    openSlot(date,hour,min=0){if(!this.isTutor)return;this.slotForm={student_id:'',lesson_type:'online',title:'',date,time:`${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`,duration:30,notes:'',group_students:[],color:'#6366f1',repeat:'none',repeat_count:4};this.editingSlot=null;this.showAddSlot=true;},
    openAddSlot(){this.editingSlot=null;this.slotForm={student_id:'',lesson_type:'online',title:'',date:'',time:'',duration:30,notes:'',group_students:[],color:'#6366f1',repeat:'none',repeat_count:4};this.showAddSlot=true;},
    editSlot(slot){this.editingSlot=slot;const sd=new Date(slot.start_time);this.slotForm={student_id:slot.student_id||'',lesson_type:slot.lesson_type||'online',title:slot.title||'',date:sd.toISOString().split('T')[0],time:sd.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}),duration:Math.round((new Date(slot.end_time)-sd)/60000)||30,notes:slot.notes||'',group_students:slot.group_students||[],color:slot.color||'#6366f1',repeat:slot.repeat||'none',repeat_count:slot.repeat_count||4};this.showAddSlot=true;},
    closeModal(){this.showAddSlot=false;this.editingSlot=null;},
    async saveSlot(){try{const[h,m]=this.slotForm.time.split(':');const start=new Date(this.slotForm.date);start.setHours(+h,+m,0,0);const dur=Math.max(+this.slotForm.duration||30,30);const end=new Date(start.getTime()+dur*60000);const data={...this.slotForm,start_time:start.toISOString(),end_time:end.toISOString()};if(!this.isGroupType){data.group_students=[];}if(this.isGroupType)data.student_id=null;if(this.editingSlot)await axios.put(`/api/slots/${this.editingSlot.id}`,data);else await axios.post('/api/slots',data);this.closeModal();this.addToast('Сохранено!','success');this.loadSlots();}catch(e){this.addToast(e.response?.data?.error||'Ошибка','error');}},
    async deleteSlot(id){if(!confirm('Удалить?'))return;try{await axios.delete(`/api/slots/${id}`);this.closeModal();this.loadSlots();this.addToast('Удалено!','info');}catch(e){this.addToast('Ошибка','error');}},
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
.legend-dot { width: 9px; height: 9px; border-radius: 50%; }
.view-btns { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 3px; }
.view-btn { padding: 7px 12px; border: none; background: transparent; color: #94a3b8; cursor: pointer; border-radius: 8px; font-size: 0.9rem; transition: all 0.2s; }
.view-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1)); color: #fff; }
.btn-today { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); color: #fff; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; font-family: inherit; }
.month-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; background: rgba(255,255,255,0.02); }
.day-header { background: rgba(255,255,255,0.03); font-weight: 700; text-align: center; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.8rem; color: #94a3b8; }
.day-cell { min-height: 90px; padding: 6px; border-right: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: all 0.2s; position: relative; }
.day-cell:nth-child(7n) { border-right: none; }
.day-cell:hover { background: rgba(99,102,241,0.05); }
.day-cell.today { background: rgba(99,102,241,0.06); }
.day-cell.otherMonth { opacity: 0.3; }
.day-number { font-weight: 600; font-size: 0.85rem; color: #cbd5e1; }
.today-num { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
.day-bars { display: flex; gap: 2px; margin-top: 4px; }
.day-bar { height: 5px; border-radius: 3px; cursor: pointer; transition: all 0.2s; flex: 1; }
.day-bar:hover { filter: brightness(1.3); transform: scaleY(1.6); }
.day-bar-more { font-size: 0.6rem; color: #94a3b8; cursor: pointer; }
.week-wrapper { overflow-x: auto; }
.week-grid { display: grid; grid-template-columns: 60px repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; min-width: 750px; position: relative; user-select: none; }
.week-header-cell { background: rgba(255,255,255,0.03); font-weight: 700; text-align: center; padding: 8px 4px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.75rem; color: #94a3b8; }
.week-header-cell.today { background: rgba(99,102,241,0.06); }
.week-time-cell { background: rgba(255,255,255,0.02); font-weight: 600; text-align: center; padding: 6px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.7rem; color: #64748b; }
.week-time-half { font-size: 0.6rem; }
.week-bg-cell { min-height: 42px; border-bottom: 1px solid rgba(255,255,255,0.04); border-right: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.2s; }
.week-bg-half { border-bottom: 1px dashed rgba(255,255,255,0.03); }
.week-bg-cell:hover { background: rgba(99,102,241,0.04); }
.slots-layer { position: absolute; top: 40px; left: 0; right: 0; bottom: 0; pointer-events: none; }
.slot-block {
  position: absolute; padding: 4px 6px; border-radius: 5px; color: #fff; font-size: 0.65rem;
  cursor: grab; pointer-events: auto; overflow: hidden;
  transition: left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1), top 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1);
}
.slot-block:hover { box-shadow: 0 0 0 2px rgba(255,255,255,0.5); z-index: 10; }
.slot-time-label { font-size: 0.55rem; opacity: 0.9; }
.slot-block-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-block-student { font-size: 0.55rem; opacity: 0.8; }
.resize-handle { position: absolute; bottom: 0; left: 0; right: 0; height: 5px; cursor: ns-resize; }
.resize-handle:hover { background: rgba(255,255,255,0.2); }
.modal-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; }
.modal-card { background: rgba(15,15,30,0.97); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 28px; max-width: 520px; width: 90%; max-height: 85vh; overflow-y: auto; color: #e2e8f0; box-shadow: 0 25px 60px rgba(0,0,0,0.5); animation: modalPop 0.3s ease; }
@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; margin: 0 0 16px; color: #fff; }
.modal-card label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px; margin-top: 10px; }
.modal-actions { display: flex; gap: 8px; margin-top: 16px; }
.form-row { display: flex; gap: 8px; }
.type-btns { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.type-btn { padding: 8px 14px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); cursor: pointer; font-weight: 600; font-size: 0.82rem; color: #cbd5e1; transition: all 0.2s; font-family: inherit; }
.type-btn.active { background: rgba(255,255,255,0.06); color: #fff; }
.color-picker { display: flex; gap: 6px; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
.color-dot.active { border-color: #fff; transform: scale(1.2); }
.input { width: 100%; padding: 10px 14px; border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; font-family: inherit; font-size: 0.9rem; background: rgba(255,255,255,0.04); color: #fff; outline: none; margin-bottom: 6px; }
.input:focus { border-color: #6366f1; }
.note-area { resize: vertical; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 2px solid rgba(255,255,255,0.1); color: #cbd5e1; background: transparent; }
.btn-sm { padding: 6px 14px; font-size: 0.78rem; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
