<template>
  <div class="yandex-calendar">
    <div class="cal-header">
      <div class="cal-nav">
        <button class="nav-btn" @click="prev">‹</button>
        <h1 class="cal-title">{{ headerTitle }}</h1>
        <button class="nav-btn" @click="next">›</button>
        <button class="today-btn" @click="goToday">Сегодня</button>
      </div>
      <div class="cal-tools">
        <div class="legend">
          <span v-for="t in eventTypes" :key="t.value" class="legend-item">
            <span class="legend-dot" :style="{background:t.color}"></span>{{t.label}}
          </span>
        </div>
        <div class="view-switch">
          <button :class="{active:view==='month'}" @click="view='month'">Месяц</button>
          <button :class="{active:view==='week'}" @click="view='week'">Неделя</button>
        </div>
        <button class="add-btn" @click="openModal()">+</button>
      </div>
    </div>

    <div v-if="view==='month'" class="month-view">
      <div class="month-grid">
        <div class="mhead" v-for="d in weekDays" :key="d">{{d}}</div>
        <div v-for="day in monthDays" :key="day.date" class="mcell" :class="{today:day.isToday, other:day.isOtherMonth}" @click="onDayClick(day)">
          <span class="mnum" :class="{tnum:day.isToday}">{{day.day}}</span>
          <div class="mdots" v-if="getDayEvents(day.date).length && getDayEvents(day.date).length <= 3">
            <span v-for="(ev,i) in getDayEvents(day.date)" :key="i" class="mdot" :style="{background:ev.color}" @click.stop="openPopover($event,ev)"></span>
          </div>
          <div class="mbars" v-if="getDayEvents(day.date).length > 3">
            <div v-for="(ev,i) in getDayEvents(day.date).slice(0,3)" :key="i" class="mbar" :style="{background:ev.color}" @click.stop="openPopover($event,ev)"></div>
            <span class="mmore">+{{getDayEvents(day.date).length-3}}</span>
          </div>
          <div v-if="quickForm.date===day.date" class="quick-form" @click.stop>
            <input class="qf-input" v-model="quickForm.title" placeholder="Название" @keyup.enter="saveQuick" />
            <button class="qf-ok" @click="saveQuick">OK</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ПОПОВЕР — прямо у курсора -->
    <div v-if="popover.event" class="popover" :style="{top:popover.y+'px',left:popover.x+'px'}" @click.stop>
      <div class="pop-time">{{fmtTime(popover.event.start_time)}} - {{fmtTime(popover.event.end_time)}}</div>
      <div class="pop-title">{{popover.event.title}}</div>
      <div class="pop-student" v-if="popover.event._student">{{popover.event._student}}</div>
      <div class="pop-actions">
        <button class="pop-btn" @click="openModal(popover.event);popover.event=null">✏️</button>
        <button class="pop-btn del" @click="deleteEvent(popover.event);popover.event=null">✕</button>
      </div>
    </div>

    <div v-if="view==='week'" class="week-view">
      <div class="week-scroll">
        <div class="week-grid" ref="weekGrid">
          <div class="wcorner"></div>
          <div class="whead" v-for="d in weekDaysList" :key="d.date" :class="{today:d.isToday}"><span>{{d.name}}</span><span class="wdate">{{d.dateStr}}</span></div>
          <template v-for="h in hours" :key="h">
            <div class="wtime">{{h}}:00</div>
            <div class="wcell" v-for="d in weekDaysList" :key="d.date+h" @click="createAt(d.date,h,0)"></div>
            <div class="wtime whalf">30</div>
            <div class="wcell whalf" v-for="d in weekDaysList" :key="d.date+h+'.5'" @click="createAt(d.date,h,30)"></div>
          </template>
          <div class="events-layer">
            <div v-for="ev in positionedEvents" :key="ev.id" class="event-chip" :data-eid="ev.id" :style="{background:ev.color,...ev._style}" @mousedown="startDrag($event,ev)" @click.stop="openPopover($event,ev)">
              <span class="ev-time">{{ev._time}}</span>
              <span class="ev-title">{{ev.title}}</span>
              <span class="ev-student">{{ev._student}}</span>
              <div class="ev-resize" @mousedown.stop="startResize($event,ev)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition name="modal">
        <div v-if="modal.show" class="modal-back" @click.self="closeModal">
          <div class="modal-card">
            <h3>{{modal.event?'✏️ Редактировать':'➕ Новое занятие'}}</h3>
            <label>Тип</label>
            <div class="type-row">
              <button v-for="t in eventTypes" :key="t.value" class="type-chip" :class="{active:modal.form.type===t.value}" :style="{borderColor:modal.form.type===t.value?t.color:'transparent',boxShadow:modal.form.type===t.value?`0 0 10px ${t.color}40`:'none'}" @click="modal.form.type=t.value;modal.form.color=t.color">{{t.emoji}} {{t.label}}</button>
            </div>
            <label>Ученик</label>
            <select class="input" v-model="modal.form.student_id"><option value="">Выберите</option><option v-for="s in allStudents" :key="s.id" :value="s.id">{{s.username}}</option></select>
            <label>Название</label><input class="input" v-model="modal.form.title">
            <div class="row2"><div><label>Дата</label><input class="input" type="date" v-model="modal.form.date"></div><div><label>Время</label><input class="input" type="time" v-model="modal.form.time"></div></div>
            <label>Длительность (мин)</label><input class="input" type="number" v-model="modal.form.duration" placeholder="30">
            <label>Цвет</label>
            <div class="color-row"><button v-for="c in slotColors" :key="c" class="color-dot" :style="{background:c,boxShadow:modal.form.color===c?`0 0 10px ${c}`:'none'}" :class="{active:modal.form.color===c}" @click="modal.form.color=c"></button></div>
            <label>Повторять</label>
            <select class="input" v-model="modal.form.repeat"><option value="none">Не повторять</option><option value="weekly">Каждую неделю</option><option value="biweekly">Каждые 2 недели</option><option value="monthly">Каждый месяц</option></select>
            <div v-if="modal.form.repeat!=='none'" class="row2"><div><label>Повторений</label><input class="input" type="number" v-model="modal.form.repeat_count" placeholder="4"></div></div>
            <label>Заметки</label><textarea class="input" v-model="modal.form.notes" rows="2"></textarea>
            <div class="modal-btns"><button class="btn-p" @click="saveEvent">💾 Сохранить</button><button v-if="modal.event" class="btn-d" @click="deleteEvent(modal.event);closeModal()">🗑</button><button class="btn-o" @click="closeModal">Отмена</button></div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'YandexCalendar',
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      view: 'month', curDate: new Date(), curWeek: 0,
      hours: Array.from({length:15},(_,i)=>i+8), events: [], allStudents: [],
      popover: { event: null, x: 0, y: 0 },
      modal: { show: false, event: null, form: { student_id:'',type:'online',title:'',date:'',time:'10:00',duration:30,notes:'',color:'#10b981',repeat:'none',repeat_count:4 } },
      quickForm: { date: null, title: '' },
      eventTypes: [
        {value:'online',emoji:'🟢',label:'Онлайн',color:'#10b981'},
        {value:'offline',emoji:'🔵',label:'Очно',color:'#6366f1'},
        {value:'group',emoji:'🟠',label:'Группа',color:'#f59e0b'}
      ],
      slotColors: ['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4','#84cc16'],
      dragEv: null, resizeEv: null, dragSY:0, dragSX:0, dragOrig:null, wasDragged: false
    };
  },
  computed: {
    isTutor() { return this.user?.role==='admin'||this.user?.role==='host'; },
    weekDays() { return ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']; },
    headerTitle() {
      if (this.view==='month') return this.curDate.toLocaleDateString('ru',{month:'long',year:'numeric'});
      const wd = this.weekDaysList;
      return wd.length ? `${wd[0].dateStr} ${this.monthName(wd[0].date)} — ${wd[6].dateStr} ${this.monthName(wd[6].date)}` : '';
    },
    monthDays() {
      const y=this.curDate.getFullYear(), m=this.curDate.getMonth(), fd=new Date(y,m,1), ld=new Date(y,m+1,0), sd=fd.getDay()||7, days=[];
      for(let i=1;i<sd;i++){const d=new Date(y,m,1-(sd-i));days.push({day:d.getDate(),date:d.toISOString().split('T')[0],isOtherMonth:true,isToday:false});}
      for(let i=1;i<=ld.getDate();i++){const d=new Date(y,m,i);days.push({day:i,date:d.toISOString().split('T')[0],isOtherMonth:false,isToday:d.toDateString()===new Date().toDateString()});}
      return days;
    },
    weekDaysList() {
      const t=new Date(), m=new Date(t); m.setDate(t.getDate()-(t.getDay()||7)+1+this.curWeek*7);
      return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return{date:d.toISOString().split('T')[0],name:this.weekDays[i],dateStr:d.getDate(),isToday:d.toDateString()===t.toDateString()};});
    },
    weekEvents() {
      const wd=this.weekDaysList; if(!wd.length)return[];
      return this.events.filter(e=>{const d=new Date(e.start_time).toISOString().split('T')[0];return d>=wd[0].date&&d<=wd[6].date;}).sort((a,b)=>new Date(a.start_time)-new Date(b.start_time));
    },
    // 🔥 ИСПРАВЛЕНО: без наложений, не выходят за границы
    positionedEvents() {
  const evs = this.weekEvents;
  if (!evs.length) return [];
  
  const res = [], sh = 8, tm = 15 * 60;
  
  // Группируем по дням
  const byDay = {};
  evs.forEach(e => {
    const d = new Date(e.start_time).toISOString().split('T')[0];
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(e);
  });
  
  Object.values(byDay).forEach(dayEvs => {
    dayEvs.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    
    // Для каждого события находим все пересекающиеся с ним
    dayEvs.forEach(ev => {
      const evStart = new Date(ev.start_time).getTime();
      const evEnd = new Date(ev.end_time).getTime();
      
      // Считаем сколько событий пересекаются с этим
      let overlapping = 1; // само с собой
      let position = 0;    // позиция среди пересекающихся
      
      dayEvs.forEach(other => {
        if (other === ev) return;
        const oStart = new Date(other.start_time).getTime();
        const oEnd = new Date(other.end_time).getTime();
        
        // Пересекаются?
        if (evStart < oEnd && oStart < evEnd) {
          overlapping++;
          // Если другое событие начинается раньше — сдвигаем позицию
          if (oStart < evStart || (oStart === evStart && other.id < ev.id)) {
            position++;
          }
        }
      });
      
      const sd = new Date(ev.start_time);
      const ed = new Date(ev.end_time);
      const di = this.weekDaysList.findIndex(d => d.date === sd.toISOString().split('T')[0]);
      if (di === -1) return;
      
      const startMin = (sd.getHours() - sh) * 60 + sd.getMinutes();
      const endMin = (ed.getHours() - sh) * 60 + ed.getMinutes();
      const cs = Math.max(0, startMin);
      const ce = Math.min(tm, endMin);
      const dur = Math.max(ce - cs, 30);
      
      const cellWidth = 100 / 7;
      const slotWidth = (cellWidth / overlapping) - 0.5;
      const slotLeft = di * cellWidth + position * (cellWidth / overlapping);
      
      ev._style = {
        top: (cs / tm * 100) + '%',
        height: (dur / tm * 100) + '%',
        left: slotLeft + '%',
        width: slotWidth + '%',
        minHeight: '18px',
        overflow: 'hidden'
      };
      res.push(ev);
    });
  });
  
  return res;
},
  mounted() { this.loadEvents(); this.loadStudents(); document.addEventListener('mousemove',this.onDrag); document.addEventListener('mouseup',this.onDrop); document.addEventListener('click',this.onClickOutside); },
  beforeUnmount() { document.removeEventListener('mousemove',this.onDrag); document.removeEventListener('mouseup',this.onDrop); document.removeEventListener('click',this.onClickOutside); },
  methods: {
    async loadEvents() { try { const {data}=await axios.get('/api/slots'); this.events=(data||[]).map(s=>({...s,_time:this.fmtTime(s.start_time),_student:s.users?.username||'',color:s.color||this.defColor(s.lesson_type)})); } catch(e) { this.loadMockEvents(); } },
    loadMockEvents() { const now=new Date(), y=now.getFullYear(), m=now.getMonth(), mock=[]; for(let i=0;i<15;i++){const d=new Date(y,m,1+Math.floor(Math.random()*28)),h=8+Math.floor(Math.random()*12),start=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,Math.random()>0.5?30:0),end=new Date(start.getTime()+(30+Math.floor(Math.random()*4)*30)*60000),types=['online','offline','group'],type=types[Math.floor(Math.random()*3)];mock.push({id:i+1,title:`Занятие ${i+1}`,start_time:start.toISOString(),end_time:end.toISOString(),lesson_type:type,color:this.defColor(type),notes:'',student_id:null,_time:this.fmtTime(start.toISOString()),_student:'Ученик'});} this.events=mock; },
    async loadStudents() { try { const {data}=await axios.get('/api/users'); this.allStudents=(data||[]).filter(u=>u.role!=='admin'&&u.role!=='parent'); } catch(e) {} },
    getDayEvents(date) { return this.events.filter(e=>new Date(e.start_time).toISOString().split('T')[0]===date); },
    defColor(t) { const c={online:'#10b981',offline:'#6366f1',group:'#f59e0b'}; return c[t]||'#6366f1'; },
    fmtTime(ts) { return ts?new Date(ts).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}):''; },
    monthName(date) { return new Date(date).toLocaleDateString('ru',{month:'long'}); },
    onDayClick(day) { if (day.isOtherMonth) return; this.popover.event = null; if (this.getDayEvents(day.date).length === 0 && this.isTutor) { this.quickForm = { date: day.date, title: '' }; } },
    async saveQuick() { if (!this.quickForm.title) return; const start = new Date(this.quickForm.date+'T10:00:00'), end = new Date(start.getTime()+30*60000); try { await axios.post('/api/slots',{title:this.quickForm.title,lesson_type:'online',start_time:start.toISOString(),end_time:end.toISOString(),color:'#10b981',notes:'',student_id:null}); this.quickForm.date = null; this.addToast?.('✅ Создано','success'); this.loadEvents(); } catch(e) { this.addToast?.('Ошибка','error'); } },

    // 🔥 ПОПОВЕР ПРЯМО У КУРСОРА
    openPopover(e, ev) {
      if (this.wasDragged) { this.wasDragged = false; return; }
      const x = Math.min(e.clientX + 10, window.innerWidth - 200);
      const y = Math.min(e.clientY + 10, window.innerHeight - 150);
      this.popover = { event: ev, x, y };
    },
    onClickOutside() { if (this.popover.event) this.popover.event = null; },

    createAt(date, h, m) { if (!this.isTutor) return; this.modal = { show: true, event: null, form: { student_id:'',type:'online',title:'',date,time:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,duration:30,notes:'',color:'#10b981',repeat:'none',repeat_count:4 } }; },
    openModal(ev) { if (ev) { const sd = new Date(ev.start_time); this.modal = { show: true, event: ev, form: { student_id:ev.student_id||'',type:ev.lesson_type||'online',title:ev.title||'',date:sd.toISOString().split('T')[0],time:this.fmtTime(ev.start_time),duration:Math.round((new Date(ev.end_time)-sd)/60000)||30,notes:ev.notes||'',color:ev.color||'#6366f1',repeat:ev.repeat||'none',repeat_count:ev.repeat_count||4 } }; } else { this.modal = { show: true, event: null, form: { student_id:'',type:'online',title:'',date:new Date().toISOString().split('T')[0],time:'10:00',duration:30,notes:'',color:'#10b981',repeat:'none',repeat_count:4 } }; } },
    closeModal() { this.modal.show = false; this.modal.event = null; },
    async saveEvent() { try { const [h,m] = this.modal.form.time.split(':'); const s = new Date(this.modal.form.date); s.setHours(+h,+m,0,0); const dur = Math.max(+this.modal.form.duration||30,30), e = new Date(s.getTime()+dur*60000); const data = { title:this.modal.form.title, lesson_type:this.modal.form.type, student_id:this.modal.form.student_id||null, start_time:s.toISOString(), end_time:e.toISOString(), notes:this.modal.form.notes, color:this.modal.form.color, repeat:this.modal.form.repeat, repeat_count:this.modal.form.repeat_count }; if (this.modal.event) await axios.put(`/api/slots/${this.modal.event.id}`,data); else await axios.post('/api/slots',data); this.closeModal(); this.addToast?.('✅ Сохранено','success'); this.loadEvents(); } catch(e) { this.addToast?.('Ошибка','error'); } },
    async deleteEvent(ev) { if (!confirm('Удалить?')) return; try { await axios.delete(`/api/slots/${ev.id}`); this.loadEvents(); this.addToast?.('🗑 Удалено','info'); } catch(e) { this.addToast?.('Ошибка','error'); } },
    startDrag(e, ev) { if(!this.isTutor)return; e.preventDefault(); this.wasDragged = false; this.dragEv=ev; this.dragSX=e.clientX; this.dragSY=e.clientY; this.dragOrig={...ev}; },
    startResize(e, ev) { if(!this.isTutor)return; e.preventDefault(); this.wasDragged = false; this.resizeEv=ev; this.dragSY=e.clientY; this.dragOrig={...ev}; },
    onDrag(e) {
      if(!this.dragEv&&!this.resizeEv)return;
      const g=this.$refs.weekGrid; if(!g)return;
      const r=g.getBoundingClientRect(), tm=15*60, gh=r.height-28, mp=gh/tm, dw=r.width/7;
      if(this.dragEv){const dy=e.clientY-this.dragSY, dx=e.clientX-this.dragSX, dm=Math.round(dy/mp/15)*15, dd=Math.round(dx/dw); if(Math.abs(dx)>2||Math.abs(dy)>2)this.wasDragged=true; const os=new Date(this.dragOrig.start_time), dur=Math.max((new Date(this.dragOrig.end_time)-os)/60000,30); let ns=new Date(os.getTime()+dm*60000); ns.setDate(ns.getDate()+dd); this.dragEv.start_time=ns.toISOString(); this.dragEv.end_time=new Date(ns.getTime()+dur*60000).toISOString(); const el=document.querySelector(`[data-eid="${this.dragEv.id}"]`); if(el){el.style.transform=`translate(${dx}px,${dy}px)`;el.style.zIndex='100';el.style.transition='none';el.style.opacity='0.85';}}
      if(this.resizeEv){const dy=e.clientY-this.dragSY, dm=Math.round(dy/mp/15)*15; if(Math.abs(dy)>2)this.wasDragged=true; const oe=new Date(this.dragOrig.end_time); let ne=new Date(oe.getTime()+dm*60000); if(ne-new Date(this.dragOrig.start_time)<30*60000)ne=new Date(new Date(this.dragOrig.start_time).getTime()+30*60000); this.resizeEv.end_time=ne.toISOString();}
    },
    async onDrop() {
      const ev=this.dragEv||this.resizeEv; if(!ev)return;
      const el=document.querySelector(`[data-eid="${ev.id}"]`); if(el){el.style.transition='all 0.3s ease';el.style.transform='';el.style.zIndex='';el.style.opacity='';}
      try { if(this.dragEv) await axios.put(`/api/slots/${ev.id}/move`,{start_time:ev.start_time,end_time:ev.end_time}); else await axios.put(`/api/slots/${ev.id}`,{start_time:ev.start_time,end_time:ev.end_time}); } catch(e) {}
      this.dragEv=null; this.resizeEv=null; this.dragOrig=null;
    },
    prev() { if(this.view==='month') this.curDate=new Date(this.curDate.getFullYear(),this.curDate.getMonth()-1); else this.curWeek--; },
    next() { if(this.view==='month') this.curDate=new Date(this.curDate.getFullYear(),this.curDate.getMonth()+1); else this.curWeek++; },
    goToday() { this.curDate=new Date(); this.curWeek=0; }
  }
};
</script>

<style scoped>
.yandex-calendar { max-width: 1200px; margin: 0 auto; padding: 20px; color: #e2e8f0; font-family: 'Inter', sans-serif; }
.cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.cal-nav { display: flex; align-items: center; gap: 8px; }
.cal-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; min-width: 200px; text-align: center; }
.nav-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #fff; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; }
.nav-btn:hover { background: rgba(99,102,241,0.15); }
.today-btn { padding: 6px 14px; border-radius: 16px; border: 1px solid rgba(99,102,241,0.3); background: rgba(99,102,241,0.1); color: #fff; cursor: pointer; font-weight: 600; font-size: 0.8rem; }
.cal-tools { display: flex; align-items: center; gap: 10px; }
.legend { display: flex; gap: 12px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: #94a3b8; }
.legend-dot { width: 7px; height: 7px; border-radius: 50%; }
.view-switch { display: flex; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 2px; }
.view-switch button { padding: 6px 14px; border: none; background: transparent; color: #94a3b8; cursor: pointer; font-weight: 600; font-size: 0.78rem; border-radius: 6px; }
.view-switch button.active { background: rgba(99,102,241,0.2); color: #fff; }
.add-btn { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #2dd4bf); border: none; color: #fff; cursor: pointer; font-size: 1.2rem; font-weight: 700; }
.month-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; }
.mhead { text-align: center; padding: 8px; font-weight: 700; font-size: 0.75rem; color: #94a3b8; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
.mcell { min-height: 90px; padding: 5px; border-right: 1px solid rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: all 0.2s; position: relative; }
.mcell:nth-child(7n+1) { border-right: none; }
.mcell:hover { background: rgba(99,102,241,0.04); }
.mcell.today { background: rgba(99,102,241,0.06); }
.mcell.other { opacity: 0.3; }
.mnum { font-weight: 600; font-size: 0.8rem; color: #cbd5e1; }
.tnum { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
.mdots { display: flex; gap: 3px; margin-top: 4px; }
.mdot { width: 6px; height: 6px; border-radius: 50%; cursor: pointer; }
.mdot:hover { transform: scale(1.5); }
.mbars { display: flex; gap: 2px; margin-top: 4px; flex-wrap: wrap; align-items: center; }
.mbar { height: 4px; border-radius: 2px; flex: 1; min-width: 20%; cursor: pointer; }
.mbar:hover { transform: scaleY(2); }
.mmore { font-size: 0.55rem; color: #94a3b8; margin-left: 2px; }
.quick-form { position: absolute; bottom: 2px; left: 2px; right: 2px; background: rgba(10,10,30,0.95); border: 1px solid rgba(99,102,241,0.3); border-radius: 6px; padding: 4px; display: flex; gap: 4px; z-index: 10; }
.qf-input { flex: 1; padding: 4px 6px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.7rem; }
.qf-ok { padding: 4px 8px; background: #10b981; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-size: 0.7rem; }
.popover { position: fixed; z-index: 1500; background: rgba(15,15,30,0.97); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; min-width: 180px; box-shadow: 0 15px 40px rgba(0,0,0,0.5); }
.pop-time { font-size: 0.7rem; color: #94a3b8; }
.pop-title { font-weight: 700; color: #fff; margin: 4px 0; }
.pop-student { font-size: 0.7rem; color: #94a3b8; }
.pop-actions { display: flex; gap: 6px; margin-top: 8px; }
.pop-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #cbd5e1; cursor: pointer; font-size: 0.8rem; }
.pop-btn.del { color: #ef4444; border-color: rgba(239,68,68,0.3); }
.pop-btn:hover { background: rgba(255,255,255,0.08); }
.week-scroll { overflow-x: auto; }
.week-grid { display: grid; grid-template-columns: 45px repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; min-width: 650px; position: relative; }
.wcorner { background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
.whead { text-align: center; padding: 6px 2px; font-weight: 700; font-size: 0.7rem; color: #94a3b8; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
.whead.today { color: #818cf8; }
.whead span { display: block; }
.wdate { font-size: 0.6rem; opacity: 0.7; }
.wtime { text-align: center; font-size: 0.6rem; color: #64748b; height: 28px; line-height: 28px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.whalf { font-size: 0.5rem; border-bottom: 1px dashed rgba(255,255,255,0.02); }
.wcell { min-height: 28px; border-bottom: 1px solid rgba(255,255,255,0.03); border-right: 1px solid rgba(255,255,255,0.03); cursor: pointer; }
.wcell:hover { background: rgba(99,102,241,0.04); }
.events-layer { position: absolute; top: 28px; left: 45px; right: 0; bottom: 0; pointer-events: none; }
.event-chip { position: absolute; padding: 2px 4px; border-radius: 3px; color: #fff; font-size: 0.6rem; cursor: grab; pointer-events: auto; overflow: hidden; box-sizing: border-box; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s ease; max-width: calc(100% - 2px); z-index: 1; }
.event-chip:hover { z-index: 10; box-shadow: 0 0 0 2px rgba(255,255,255,0.4); }
.ev-time { font-size: 0.5rem; opacity: 0.8; display: block; }
.ev-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.ev-student { font-size: 0.5rem; opacity: 0.7; }
.ev-resize { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; cursor: ns-resize; }
.modal-back { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.modal-card { background: rgba(12,12,35,0.97); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; max-width: 460px; width: 90%; max-height: 85vh; overflow-y: auto; color: #e2e8f0; }
.modal-card h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; margin: 0 0 14px; color: #fff; }
.modal-card label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block; margin: 8px 0 3px; }
.modal-btns { display: flex; gap: 6px; margin-top: 14px; }
.btn-p { padding: 8px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; font-weight: 600; cursor: pointer; font-size: 0.85rem; flex: 1; }
.btn-d { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.3); background: rgba(239,68,68,0.1); color: #ef4444; cursor: pointer; font-size: 0.85rem; }
.btn-o { padding: 8px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #cbd5e1; cursor: pointer; font-size: 0.85rem; }
.type-row { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 6px; }
.type-chip { padding: 6px 12px; border-radius: 8px; border: 2px solid transparent; background: rgba(255,255,255,0.03); color: #cbd5e1; cursor: pointer; font-weight: 600; font-size: 0.75rem; }
.type-chip.active { background: rgba(255,255,255,0.06); color: #fff; }
.color-row { display: flex; gap: 5px; }
.color-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.color-dot.active { border-color: #fff; transform: scale(1.2); }
.row2 { display: flex; gap: 8px; }
.row2>div { flex: 1; }
.input { width: 100%; padding: 8px 12px; border: 2px solid rgba(255,255,255,0.08); border-radius: 10px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.85rem; outline: none; margin-bottom: 4px; font-family: inherit; }
.input:focus { border-color: #6366f1; }
textarea.input { resize: vertical; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
