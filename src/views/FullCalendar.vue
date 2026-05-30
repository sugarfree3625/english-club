<template>
  <div class="calendar-app">
    <div class="cal-header">
      <div class="cal-nav">
        <button class="nav-arrow" @click="prevMonth">‹</button>
        <h1 class="cal-month">{{ monthLabel }}</h1>
        <button class="nav-arrow" @click="nextMonth">›</button>
        <button class="today-btn" @click="goToday">Сегодня</button>
      </div>
      <div class="cal-tools">
        <div class="legend-dots">
          <span v-for="l in legendItems" :key="l.type" class="ldot" :style="{background:l.color}" :title="l.label"></span>
        </div>
        <div class="view-switch">
          <button :class="{active:view==='month'}" @click="view='month'">Месяц</button>
          <button :class="{active:view==='week'}" @click="view='week'">Неделя</button>
        </div>
        <button class="tool-btn" @click="exportICS">📤</button>
        <button class="add-btn" @click="openAddSlot" v-if="isTutor">+</button>
      </div>
    </div>

    <div v-if="view==='month'" class="month-view">
      <div class="month-grid">
        <div class="mh" v-for="d in weekDays" :key="d">{{d}}</div>
        <div v-for="(day,i) in monthDays" :key="i" class="mc" :class="{today:day.isToday, other:day.isOtherMonth}" @click="onDayClick(day)">
          <span class="mnum" :class="{tnum:day.isToday}">{{day.day}}</span>
          <div class="mbars" v-if="getDayEvents(day.date).length">
            <div v-for="(ev,ei) in getDayEvents(day.date).slice(0,3)" :key="ei" class="mbar" :style="{background:ev.color}" @click.stop="openEvent(ev)"></div>
            <span v-if="getDayEvents(day.date).length>3" class="mmore" @click.stop="view='week'">+{{getDayEvents(day.date).length-3}}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="view==='week'" class="week-view">
      <div class="week-scroll">
        <div class="week-grid" ref="weekGrid">
          <div class="wcorner"></div>
          <div class="whead" v-for="d in weekDaysList" :key="d.date" :class="{today:d.isToday}">{{d.name}} {{d.dateStr}}</div>
          <template v-for="h in hours" :key="h">
            <div class="wtime">{{h}}:00</div>
            <div class="wcell" v-for="d in weekDaysList" :key="d.date+h" :class="{today:d.isToday}" @click="createAt(d.date,h,0)"></div>
            <div class="wtime whalf">30</div>
            <div class="wcell whalf" v-for="d in weekDaysList" :key="d.date+h+'.5'" :class="{today:d.isToday}" @click="createAt(d.date,h,30)"></div>
          </template>
          <div class="events-canvas">
            <div v-for="ev in positionedEvents" :key="ev._key" class="event-chip" :data-key="ev._key" :style="{background:ev.color,...ev._style}" @mousedown="startDrag($event,ev)" @click.stop="openEvent(ev)">
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
        <div v-if="showModal" class="modal-back" @click.self="closeModal">
          <div class="modal-card">
            <button class="modal-x" @click="closeModal">✕</button>
            <h3>{{ editingSlot ? '✏️ Редактировать' : '➕ Новое занятие' }}</h3>
            <label>Тип</label>
            <div class="type-row">
              <button v-for="t in slotTypes" :key="t.value" class="type-chip" :class="{active:form.type===t.value}" :style="{borderColor:form.type===t.value?t.color:'transparent',boxShadow:form.type===t.value?`0 0 10px ${t.color}40`:'none'}" @click="form.type=t.value;form.color=t.color">{{t.emoji}} {{t.label}}</button>
            </div>
            <label>Ученик</label>
            <select class="input" v-model="form.student_id"><option value="">Выберите</option><option v-for="s in allStudents" :key="s.id" :value="s.id">{{s.username}}</option></select>
            <label>Название</label><input class="input" v-model="form.title">
            <div class="row2"><div><label>Дата</label><input class="input" type="date" v-model="form.date"></div><div><label>Время</label><input class="input" type="time" v-model="form.time"></div></div>
            <label>Длительность (мин)</label><input class="input" type="number" v-model="form.duration" placeholder="30">
            <label>Цвет</label>
            <div class="color-row"><button v-for="c in slotColors" :key="c" class="color-dot" :style="{background:c,boxShadow:form.color===c?`0 0 10px ${c}`:'none'}" :class="{active:form.color===c}" @click="form.color=c"></button></div>
            <label>Повторять</label>
            <select class="input" v-model="form.repeat"><option value="none">Не повторять</option><option value="weekly">Каждую неделю</option><option value="biweekly">Каждые 2 недели</option><option value="monthly">Каждый месяц</option></select>
            <div v-if="form.repeat!=='none'" class="row2"><div><label>Повторений</label><input class="input" type="number" v-model="form.repeat_count" placeholder="4"></div></div>
            <label>Заметки</label><textarea class="input" v-model="form.notes" rows="2"></textarea>
            <div class="modal-btns"><button class="btn-p" @click="saveSlot">💾 Сохранить</button><button v-if="editingSlot" class="btn-d" @click="deleteSlot(editingSlot.id)">🗑</button><button class="btn-o" @click="closeModal">Отмена</button></div>
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
      view: 'month', curMonth: new Date().getMonth(), curYear: new Date().getFullYear(), curWeek: 0,
      HEADER_H: 30,
      hours: Array.from({length:15},(_,i)=>i+8), slots: [], allStudents: [],
      showModal: false, editingSlot: null,
      form: { student_id:'', type:'online', title:'', date:'', time:'10:00', duration:30, notes:'', color:'#10b981', repeat:'none', repeat_count:4 },
      slotTypes: [
        {value:'online',emoji:'🟢',label:'Онлайн',color:'#10b981'},
        {value:'offline',emoji:'🔵',label:'Очно',color:'#6366f1'},
        {value:'group',emoji:'🟠',label:'Группа',color:'#f59e0b'}
      ],
      legendItems: [{type:'online',color:'#10b981'},{type:'offline',color:'#6366f1'},{type:'group',color:'#f59e0b'}],
      slotColors: ['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4','#84cc16'],
      dragging: null, resizing: null, dsX:0, dsY:0, dsOrig:null
    };
  },
  computed: {
    isTutor() { return this.user?.role==='admin'||this.user?.role==='host'; },
    weekDays() { return ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']; },
    monthLabel() { return new Date(this.curYear,this.curMonth).toLocaleDateString('ru',{month:'long',year:'numeric'}); },
    monthDays() {
      const d=[]; const fd=new Date(this.curYear,this.curMonth,1); const ld=new Date(this.curYear,this.curMonth+1,0); const sd=fd.getDay()||7;
      for(let i=1;i<sd;i++){const x=new Date(this.curYear,this.curMonth,1-(sd-i));d.push({day:x.getDate(),date:x.toISOString().split('T')[0],isOtherMonth:true,isToday:false});}
      for(let i=1;i<=ld.getDate();i++){const x=new Date(this.curYear,this.curMonth,i);d.push({day:i,date:x.toISOString().split('T')[0],isOtherMonth:false,isToday:x.toDateString()===new Date().toDateString()});}
      return d;
    },
    weekDaysList() {
      const t=new Date(); const m=new Date(t); m.setDate(t.getDate()-(t.getDay()||7)+1+this.curWeek*7);
      return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return{date:d.toISOString().split('T')[0],name:this.weekDays[i],dateStr:d.getDate(),isToday:d.toDateString()===t.toDateString()};});
    },
    weekSlots() {
      const ws=this.weekDaysList[0]?.date, we=this.weekDaysList[6]?.date; if(!ws||!we)return[];
      return this.slots.filter(s=>{const d=new Date(s.start_time).toISOString().split('T')[0];return d>=ws&&d<=we;}).sort((a,b)=>new Date(a.start_time)-new Date(b.start_time));
    },
    positionedEvents() {
      const evs = this.weekSlots.map(s=>({...s,_key:'s'+s.id,_time:this.fmtTime(s.start_time),_student:s.users?.username||'',color:s.color||this.defColor(s.lesson_type)}));
      if(!evs.length)return[];
      const res=[], sh=8, tm=15*60;
      const byDay={}; evs.forEach(e=>{const d=new Date(e.start_time).toISOString().split('T')[0];if(!byDay[d])byDay[d]=[];byDay[d].push(e);});
      Object.values(byDay).forEach(dayEvs=>{
        dayEvs.sort((a,b)=>new Date(a.start_time)-new Date(b.start_time));
        const cols=[];
        dayEvs.forEach(ev=>{
          const es=new Date(ev.start_time).getTime(), ee=new Date(ev.end_time).getTime();
          let placed=false;
          for(const col of cols){
            if(!col.some(ce=>{const cs=new Date(ce.start_time).getTime(),ce2=new Date(ce.end_time).getTime();return es<ce2&&ee>cs;})){
              col.push(ev); placed=true; break;
            }
          }
          if(!placed) cols.push([ev]);
        });
        const total=cols.length;
        cols.forEach((col,ci)=>{col.forEach(ev=>{
          const sd=new Date(ev.start_time), ed=new Date(ev.end_time);
          const di=this.weekDaysList.findIndex(d=>d.date===sd.toISOString().split('T')[0]);
          if(di===-1)return;
          const gridEl=this.$refs.weekGrid;
          let headerOff=0;
          if(gridEl){headerOff=(this.HEADER_H/gridEl.clientHeight)*100;}
          const top=((sd.getHours()-sh)*60+sd.getMinutes())/tm*100+(headerOff||1.5);
          const h=Math.max((ed-sd)/60000,30)/tm*100;
          ev._style={top:top+'%',height:h+'%',left:(di*100/7+ci*100/7/total)+'%',width:(100/7/total)+'%',minHeight:'18px'};
          res.push(ev);
        });});
      });
      return res;
    }
  },
  async mounted() { await Promise.all([this.loadSlots(),this.loadStudents()]); document.addEventListener('mousemove',this.onDrag); document.addEventListener('mouseup',this.onDrop); },
  beforeUnmount() { document.removeEventListener('mousemove',this.onDrag); document.removeEventListener('mouseup',this.onDrop); },
  methods: {
    async loadSlots(){try{const r=await axios.get('/api/slots');this.slots=r.data||[];}catch(e){} },
    async loadStudents(){try{const r=await axios.get('/api/users');this.allStudents=(r.data||[]).filter(u=>u.role!=='admin'&&u.role!=='parent');}catch(e){} },
    getDayEvents(d){return this.slots.filter(s=>new Date(s.start_time).toISOString().split('T')[0]===d);},
    defColor(t){const c={online:'#10b981',offline:'#6366f1',group:'#f59e0b'};return c[t]||'#6366f1';},
    fmtTime(ts){return ts?new Date(ts).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}):'';},
    onDayClick(day){if(day.isOtherMonth)return;if(this.getDayEvents(day.date).length){this.view='week';}else if(this.isTutor){this.form.date=day.date;this.openAddSlot();}},
    openEvent(ev){this.editingSlot=ev;const sd=new Date(ev.start_time);this.form={student_id:ev.student_id||'',type:ev.lesson_type||'online',title:ev.title||'',date:sd.toISOString().split('T')[0],time:this.fmtTime(sd),duration:Math.round((new Date(ev.end_time)-sd)/60000)||30,notes:ev.notes||'',color:ev.color||'#6366f1',repeat:ev.repeat||'none',repeat_count:ev.repeat_count||4};this.showModal=true;},
    createAt(date,h,m){if(!this.isTutor)return;this.editingSlot=null;this.form={student_id:'',type:'online',title:'',date,time:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,duration:30,notes:'',color:'#10b981',repeat:'none',repeat_count:4};this.showModal=true;},
    openAddSlot(){this.editingSlot=null;this.form={student_id:'',type:'online',title:'',date:new Date().toISOString().split('T')[0],time:'10:00',duration:30,notes:'',color:'#10b981',repeat:'none',repeat_count:4};this.showModal=true;},
    closeModal(){this.showModal=false;this.editingSlot=null;},
    async saveSlot(){try{const[h,m]=this.form.time.split(':');const s=new Date(this.form.date);s.setHours(+h,+m,0,0);const d=Math.max(+this.form.duration||30,30);const e=new Date(s.getTime()+d*60000);const data={title:this.form.title,lesson_type:this.form.type,student_id:this.form.student_id||null,start_time:s.toISOString(),end_time:e.toISOString(),notes:this.form.notes,color:this.form.color};if(this.editingSlot)await axios.put(`/api/slots/${this.editingSlot.id}`,data);else await axios.post('/api/slots',data);this.closeModal();this.addToast('✅ Сохранено','success');this.loadSlots();}catch(e){this.addToast('Ошибка','error');}},
    async deleteSlot(id){if(!confirm('Удалить?'))return;try{await axios.delete(`/api/slots/${id}`);this.closeModal();this.loadSlots();}catch(e){}},
    startDrag(e,ev){if(!this.isTutor)return;e.preventDefault();this.dragging=ev;this.dsX=e.clientX;this.dsY=e.clientY;this.dsOrig={...ev};},
    startResize(e,ev){if(!this.isTutor)return;e.preventDefault();this.resizing=ev;this.dsY=e.clientY;this.dsOrig={...ev};},
    onDrag(e){
      if(!this.dragging&&!this.resizing)return;
      const g=this.$refs.weekGrid;if(!g)return;
      const r=g.getBoundingClientRect(),tm=15*60,gh=r.height-this.HEADER_H,mp=gh/tm,dw=r.width/7;
      if(this.dragging){const dy=e.clientY-this.dsY,dx=e.clientX-this.dsX,dm=Math.round(dy/mp/15)*15,dd=Math.round(dx/dw);const os=new Date(this.dsOrig.start_time),dur=Math.max((new Date(this.dsOrig.end_time)-os)/60000,30);let ns=new Date(os.getTime()+dm*60000);ns.setDate(ns.getDate()+dd);this.dragging.start_time=ns.toISOString();this.dragging.end_time=new Date(ns.getTime()+dur*60000).toISOString();const el=document.querySelector(`[data-key="${this.dragging._key}"]`);if(el){el.style.transform=`translate(${dx}px,${dy}px)`;el.style.zIndex='100';el.style.transition='none';el.style.opacity='0.85';}}
      if(this.resizing){const dy=e.clientY-this.dsY,dm=Math.round(dy/mp/15)*15;const oe=new Date(this.dsOrig.end_time);let ne=new Date(oe.getTime()+dm*60000);if(ne-new Date(this.dsOrig.start_time)<30*60000)ne=new Date(new Date(this.dsOrig.start_time).getTime()+30*60000);this.resizing.end_time=ne.toISOString();}
    },
    async onDrop(){
      const ev=this.dragging||this.resizing;if(!ev)return;
      const el=document.querySelector(`[data-key="${ev._key}"]`);if(el){el.style.transition='all 0.3s ease';el.style.transform='';el.style.zIndex='';el.style.opacity='';}
      try{if(this.dragging)await axios.put(`/api/slots/${ev.id}/move`,{start_time:ev.start_time,end_time:ev.end_time});else await axios.put(`/api/slots/${ev.id}`,{start_time:ev.start_time,end_time:ev.end_time});}catch(e){}
      this.dragging=null;this.resizing=null;this.dsOrig=null;
    },
    prevMonth(){this.curMonth===0?(this.curMonth=11,this.curYear--):this.curMonth--;},
    nextMonth(){this.curMonth===11?(this.curMonth=0,this.curYear++):this.curMonth++;},
    goToday(){this.curMonth=new Date().getMonth();this.curYear=new Date().getFullYear();this.curWeek=0;},
    exportICS(){window.open('/api/slots/export','_blank');}
  }
};
</script>

<style scoped>
.calendar-app { max-width: 1200px; margin: 0 auto; padding: 20px; color: #e2e8f0; font-family: 'Inter', sans-serif; }
.cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.cal-nav { display: flex; align-items: center; gap: 8px; }
.cal-month { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; min-width: 180px; text-align: center; }
.nav-arrow { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #fff; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; }
.nav-arrow:hover { background: rgba(99,102,241,0.15); }
.today-btn { padding: 6px 14px; border-radius: 16px; border: 1px solid rgba(99,102,241,0.3); background: rgba(99,102,241,0.1); color: #fff; cursor: pointer; font-weight: 600; font-size: 0.8rem; }
.cal-tools { display: flex; align-items: center; gap: 8px; }
.legend-dots { display: flex; gap: 5px; }
.ldot { width: 7px; height: 7px; border-radius: 50%; }
.view-switch { display: flex; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 2px; }
.view-switch button { padding: 6px 14px; border: none; background: transparent; color: #94a3b8; cursor: pointer; font-weight: 600; font-size: 0.78rem; border-radius: 6px; transition: all 0.2s; }
.view-switch button.active { background: rgba(99,102,241,0.2); color: #fff; }
.tool-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #fff; cursor: pointer; font-size: 0.9rem; }
.add-btn { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #2dd4bf); border: none; color: #fff; cursor: pointer; font-size: 1.2rem; font-weight: 700; }

.month-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; }
.mh { text-align: center; padding: 8px; font-weight: 700; font-size: 0.75rem; color: #94a3b8; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
.mc { min-height: 85px; padding: 5px; border-right: 1px solid rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: all 0.2s; }
.mc:nth-child(7n+1) { border-right: none; }
.mc:hover { background: rgba(99,102,241,0.04); }
.mc.today { background: rgba(99,102,241,0.06); }
.mc.other { opacity: 0.3; }
.mnum { font-weight: 600; font-size: 0.8rem; color: #cbd5e1; }
.tnum { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
.mbars { display: flex; gap: 2px; margin-top: 3px; }
.mbar { height: 4px; border-radius: 2px; flex: 1; cursor: pointer; transition: all 0.2s; }
.mbar:hover { transform: scaleY(2); }
.mmore { font-size: 0.55rem; color: #94a3b8; cursor: pointer; }

.week-scroll { overflow-x: auto; }
.week-grid { display: grid; grid-template-columns: 45px repeat(7, 1fr); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; min-width: 650px; position: relative; }
.wcorner { background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
.whead { text-align: center; padding: 6px 2px; font-weight: 700; font-size: 0.7rem; color: #94a3b8; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
.whead.today { color: #818cf8; }
.wtime { text-align: center; font-size: 0.6rem; color: #64748b; height: 28px; line-height: 28px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.whalf { font-size: 0.5rem; border-bottom: 1px dashed rgba(255,255,255,0.02); }
.wcell { min-height: 28px; border-bottom: 1px solid rgba(255,255,255,0.03); border-right: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: background 0.15s; }
.wcell:hover { background: rgba(99,102,241,0.04); }
.events-canvas { position: absolute; top: 30px; left: 0; right: 0; bottom: 0; pointer-events: none; }
.event-chip { position: absolute; padding: 2px 4px; border-radius: 3px; color: #fff; font-size: 0.6rem; cursor: grab; pointer-events: auto; overflow: hidden; box-sizing: border-box; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s ease; }
.event-chip:hover { z-index: 10; box-shadow: 0 0 0 2px rgba(255,255,255,0.4); }
.ev-time { font-size: 0.5rem; opacity: 0.8; display: block; }
.ev-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.ev-student { font-size: 0.5rem; opacity: 0.7; }
.ev-resize { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; cursor: ns-resize; }

.modal-back { position: fixed; inset: 0; z-index: 3000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.modal-card { background: rgba(12,12,35,0.97); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; max-width: 460px; width: 90%; max-height: 85vh; overflow-y: auto; position: relative; }
.modal-x { position: absolute; top: 12px; right: 12px; background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
.modal-card h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; margin: 0 0 14px; color: #fff; }
.modal-card label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; display: block; margin: 8px 0 3px; }
.type-row { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 6px; }
.type-chip { padding: 6px 12px; border-radius: 8px; border: 2px solid transparent; background: rgba(255,255,255,0.03); color: #cbd5e1; cursor: pointer; font-weight: 600; font-size: 0.75rem; transition: all 0.2s; }
.type-chip.active { background: rgba(255,255,255,0.06); color: #fff; }
.color-row { display: flex; gap: 5px; }
.color-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.color-dot.active { border-color: #fff; transform: scale(1.2); }
.row2 { display: flex; gap: 8px; }
.row2>div { flex: 1; }
.input { width: 100%; padding: 8px 12px; border: 2px solid rgba(255,255,255,0.08); border-radius: 10px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.85rem; outline: none; margin-bottom: 4px; font-family: inherit; }
.input:focus { border-color: #6366f1; }
.modal-btns { display: flex; gap: 6px; margin-top: 14px; }
.btn-p { padding: 8px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; font-weight: 600; cursor: pointer; font-size: 0.85rem; flex: 1; }
.btn-d { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.3); background: rgba(239,68,68,0.1); color: #ef4444; cursor: pointer; font-size: 0.85rem; }
.btn-o { padding: 8px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #cbd5e1; cursor: pointer; font-size: 0.85rem; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
