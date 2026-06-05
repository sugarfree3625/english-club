<template>
  <div class="wb-canvas-wrap" ref="wrapRef"
    @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp"
    @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend.prevent="onTouchEnd"
    @wheel.prevent="onWheel"
    @dragover.prevent @drop.prevent="onDrop"
    @paste="onPaste"
    @keydown="onKeydown"
    tabindex="0"
>
    <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>
    
    <!-- Стикеры -->
    <div v-for="s in stickers" :key="s.id" class="sticker-item" :style="{ left: s.x + 'px', top: s.y + 'px', fontSize: s.size + 'px' }" @mousedown.stop>{{ s.emoji }}</div>
    
    <!-- Лазерная указка -->
    <div v-if="laserPos" class="laser-dot" :style="{ left: laserPos.x + 'px', top: laserPos.y + 'px' }"></div>
    
    <!-- Курсоры других пользователей -->
    <div v-for="u in otherUsers" :key="u.id" class="remote-cursor" :style="{ left: u.x + 'px', top: u.y + 'px' }">
      <span class="cursor-name" :style="{ background: u.color }">{{ u.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';

const props = defineProps({
  activeTool: String, color: String, lineWidth: Number,
  darkMode: Boolean, showGrid: Boolean, zoom: Number
});

const emit = defineEmits(['update:zoom', 'update:history', 'update:historyIndex', 'update:objects']);

// ========== ХОЛСТ ==========
const wrapRef = ref(null);
const canvasRef = ref(null);
const canvasWidth = ref(1920);
const canvasHeight = ref(1080);
let ctx = null;

// ========== ИСТОРИЯ ==========
let history = [];
let historyIndex = -1;
const maxHistory = 50;

function saveState() {
  history = history.slice(0, historyIndex + 1);
  const state = canvasRef.value?.toDataURL();
  history.push(state);
  if (history.length > maxHistory) history.shift();
  historyIndex = history.length - 1;
  emit('update:history', history.length);
  emit('update:historyIndex', historyIndex);
}

function undo() { if (historyIndex <= 0) return; historyIndex--; restoreState(); }
function redo() { if (historyIndex >= history.length - 1) return; historyIndex++; restoreState(); }

function restoreState() {
  const img = new Image();
  img.onload = () => { ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value); ctx.drawImage(img, 0, 0); };
  img.src = history[historyIndex];
}

// ========== РИСОВАНИЕ ==========
let isDrawing = false;
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;
let objects = [];
let selectedObject = null;
let isDragging = false;
let dragOffsetX = 0, dragOffsetY = 0;

const stickers = ref([]);
const laserPos = ref(null);
const otherUsers = ref([]);

function getPos(e) {
  const rect = canvasRef.value.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (canvasWidth.value / rect.width), y: (e.clientY - rect.top) * (canvasHeight.value / rect.height) };
}
function getTouchPos(e) {
  const t = e.touches[0] || e.changedTouches[0];
  const rect = canvasRef.value.getBoundingClientRect();
  return { x: (t.clientX - rect.left) * (canvasWidth.value / rect.width), y: (t.clientY - rect.top) * (canvasHeight.value / rect.height) };
}

function onMouseDown(e) { startDraw(getPos(e)); }
function onMouseMove(e) { draw(getPos(e)); }
function onMouseUp() { stopDraw(); }
function onTouchStart(e) { startDraw(getTouchPos(e)); }
function onTouchMove(e) { draw(getTouchPos(e)); }
function onTouchEnd() { stopDraw(); }

function startDraw(pos) {
  if (props.activeTool === 'laser') { laserPos.value = pos; return; }
  isDrawing = true; startX = pos.x; startY = pos.y;
  if (props.activeTool === 'select') {
    const clicked = findObjectAt(pos.x, pos.y);
    if (clicked) { selectedObject = clicked; isDragging = true; dragOffsetX = pos.x - clicked.x; dragOffsetY = pos.y - clicked.y; return; }
    selectedObject = null;
  }
  if (props.activeTool === 'text') {
    const text = prompt('Введите текст:');
    if (text) { objects.push({ type: 'text', x: pos.x, y: pos.y, text, color: props.color, size: 20 }); redrawAll(); saveState(); }
    isDrawing = false; return;
  }
  if (props.activeTool === 'sticker') { stickers.value.push({ id: Date.now(), emoji: '😊', x: pos.x - 20, y: pos.y - 20, size: 40 }); return; }
  if (['pen','brush','highlighter','eraser'].includes(props.activeTool)) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }
}

function draw(pos) {
  currentX = pos.x; currentY = pos.y;
  if (props.activeTool === 'laser') { laserPos.value = pos; setTimeout(() => { laserPos.value = null; }, 200); return; }
  if (!isDrawing) return;
  if (isDragging && selectedObject) { selectedObject.x = pos.x - dragOffsetX; selectedObject.y = pos.y - dragOffsetY; redrawAll(); return; }
  if (['pen','brush','highlighter'].includes(props.activeTool)) {
    ctx.strokeStyle = props.activeTool === 'highlighter' ? props.color + '40' : props.color;
    ctx.lineWidth = props.activeTool === 'brush' ? props.lineWidth * 2 : props.lineWidth;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'source-over';
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  }
  if (props.activeTool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = props.lineWidth * 3; ctx.lineCap = 'round'; ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
  if (['rect','circle','line','arrow','triangle','star'].includes(props.activeTool)) { redrawAll(); drawShapePreview(ctx, props.activeTool, startX, startY, pos.x, pos.y, props.color, props.lineWidth); }
}

function stopDraw() {
  if (['rect','circle','line','arrow','triangle','star'].includes(props.activeTool) && isDrawing) {
    objects.push({ type: props.activeTool, x: Math.min(startX, currentX), y: Math.min(startY, currentY), w: Math.abs(currentX - startX), h: Math.abs(currentY - startY), color: props.color, lineWidth: props.lineWidth });
    redrawAll(); saveState();
  }
  if (['pen','brush','highlighter','eraser'].includes(props.activeTool) && isDrawing) saveState();
  isDrawing = false; isDragging = false; laserPos.value = null;
}

function drawShapePreview(ctx, type, x, y, x2, y2, color, lw) {
  ctx.strokeStyle = color; ctx.fillStyle = color + '20'; ctx.lineWidth = lw;
  switch(type) {
    case 'rect': ctx.strokeRect(x, y, x2 - x, y2 - y); break;
    case 'circle': ctx.beginPath(); ctx.ellipse(x + (x2-x)/2, y + (y2-y)/2, Math.abs(x2-x)/2, Math.abs(y2-y)/2, 0, 0, Math.PI*2); ctx.stroke(); break;
    case 'line': ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); break;
    case 'arrow': drawArrow(ctx, x, y, x2, y2); break;
    case 'triangle': ctx.beginPath(); ctx.moveTo(x + (x2-x)/2, y); ctx.lineTo(x, y2); ctx.lineTo(x2, y2); ctx.closePath(); ctx.stroke(); break;
    case 'star': drawStar(ctx, x + (x2-x)/2, y + (y2-y)/2, 5, Math.abs(x2-x)/2, Math.abs(x2-x)/4); break;
  }
}

function drawArrow(ctx, x1, y1, x2, y2) {
  const head = 10, angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(angle - Math.PI/6), y2 - head * Math.sin(angle - Math.PI/6));
  ctx.lineTo(x2 - head * Math.cos(angle + Math.PI/6), y2 - head * Math.sin(angle + Math.PI/6));
  ctx.closePath(); ctx.fill();
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = Math.PI / 2 * 3, step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) { ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step; ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step; }
  ctx.closePath(); ctx.stroke();
}

function findObjectAt(x, y) {
  return [...objects].reverse().find(o => {
    if (o.type === 'rect' || o.type === 'circle') return x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h;
    if (o.type === 'text') return Math.abs(x - o.x) < 100 && Math.abs(y - o.y) < 30;
    return false;
  });
}

function redrawAll() {
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  drawGrid();
  objects.forEach(o => {
    if (o.type === 'text') { ctx.fillStyle = o.color; ctx.font = `${o.size}px Inter`; ctx.fillText(o.text, o.x, o.y); }
    else if (o.type === 'image') { const img = new Image(); img.src = o.src; ctx.drawImage(img, o.x, o.y, o.w, o.h); }
    else { drawShapePreview(ctx, o.type, o.x, o.y, o.x + (o.w||0), o.y + (o.h||0), o.color, o.lineWidth); }
  });
  if (selectedObject) { ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2; ctx.setLineDash([5,5]); ctx.strokeRect(selectedObject.x-5, selectedObject.y-5, (selectedObject.w||100)+10, (selectedObject.h||30)+10); ctx.setLineDash([]); }
}

function drawGrid() {
  if (!props.showGrid) return;
  ctx.strokeStyle = props.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i < canvasWidth.value; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvasHeight.value); ctx.stroke(); }
  for (let i = 0; i < canvasHeight.value; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvasWidth.value, i); ctx.stroke(); }
}

function onWheel(e) { emit('update:zoom', Math.min(300, Math.max(10, props.zoom + (e.deltaY > 0 ? -10 : 10)))); }

function onDrop(e) {
  const file = e.dataTransfer.files[0];
  if (file?.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (ev) => { const img = new Image(); img.onload = () => { objects.push({ type:'image', x:currentX, y:currentY, w:img.width, h:img.height, src:ev.target.result }); redrawAll(); saveState(); }; img.src = ev.target.result; };
    reader.readAsDataURL(file);
  }
}

function onPaste(e) {
  for (const item of e.clipboardData?.items||[]) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile(), reader = new FileReader();
      reader.onload = (ev) => { const img = new Image(); img.onload = () => { objects.push({ type:'image', x:currentX, y:currentY, w:img.width, h:img.height, src:ev.target.result }); redrawAll(); saveState(); }; img.src = ev.target.result; };
      reader.readAsDataURL(blob);
    }
  }
}

function onKeydown(e) {
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
  if (e.ctrlKey && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
  if (e.key === 'Delete') { e.preventDefault(); deleteSelected(); }
}

function deleteSelected() { if (selectedObject) { objects = objects.filter(o => o !== selectedObject); selectedObject = null; redrawAll(); saveState(); } }
function duplicateSelected() { if (selectedObject) { objects.push({...selectedObject, x:selectedObject.x+20, y:selectedObject.y+20}); redrawAll(); saveState(); } }
function clearAll() { objects = []; stickers.value = []; ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value); saveState(); }
function getBoardData() { return { objects, stickers: stickers.value, width: canvasWidth.value, height: canvasHeight.value }; }
function exportPNG() { const link = document.createElement('a'); link.download = 'whiteboard.png'; link.href = canvasRef.value.toDataURL(); link.click(); }

onMounted(() => {
  ctx = canvasRef.value.getContext('2d');
  ctx.fillStyle = props.darkMode ? '#0b1120' : '#f8fafc';
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
  drawGrid(); saveState();
});

watch(() => props.darkMode, () => { ctx.fillStyle = props.darkMode ? '#0b1120' : '#f8fafc'; ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value); redrawAll(); });

defineExpose({ undo, redo, clearAll, getBoardData, exportPNG, deleteSelected, duplicateSelected, objects, stickers });
</script>

<style scoped>
.wb-canvas-wrap { flex: 1; overflow: hidden; position: relative; cursor: crosshair; outline: none; background: v-bind("darkMode ? '#0b1120' : '#f8fafc'"); }
canvas { display: block; }
.sticker-item { position: absolute; cursor: move; user-select: none; pointer-events: auto; transition: transform 0.1s; }
.sticker-item:hover { transform: scale(1.2); }
.laser-dot { position: absolute; width: 8px; height: 8px; background: red; border-radius: 50%; box-shadow: 0 0 20px red; pointer-events: none; animation: laserFade 0.5s forwards; transform: translate(-50%, -50%); }
@keyframes laserFade { to { opacity: 0; transform: translate(-50%, -50%) scale(2); } }
.remote-cursor { position: absolute; pointer-events: none; z-index: 10; transition: all 0.1s; }
.cursor-name { padding: 2px 8px; border-radius: 8px; color: #fff; font-size: 0.7rem; white-space: nowrap; }
</style>
