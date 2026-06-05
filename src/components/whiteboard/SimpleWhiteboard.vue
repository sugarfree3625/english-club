<template>
  <div class="whiteboard-wrapper">
    <!-- Панель инструментов -->
    <div class="toolbar">
      <button @click="tool = 'pen'" :class="{ active: tool === 'pen' }">✏️ Карандаш</button>
      <button @click="tool = 'eraser'" :class="{ active: tool === 'eraser' }">🧹 Ластик</button>
      <button @click="clearCanvas">🗑️ Очистить</button>
      
      <span class="spacer"></span>
      
      <label>Цвет:</label>
      <input type="color" v-model="color" />
      
      <label>Размер:</label>
      <input type="range" v-model="size" min="1" max="20" />
    </div>
    
    <!-- Сам холст -->
    <canvas
      ref="canvasRef"
      class="drawing-canvas"
      @mousedown="startDraw"
      @mousemove="draw"
      @mouseup="stopDraw"
      @mouseleave="stopDraw"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

// ====== ПЕРЕМЕННЫЕ ======
const canvasRef = ref(null)  // ссылка на canvas
let ctx = null               // контекст для рисования
let drawing = false          // рисуем ли сейчас

// Настройки инструментов
const tool = ref('pen')      // 'pen' или 'eraser'
const color = ref('#000000') // цвет кисти
const size = ref(3)          // размер кисти

// ====== ИНИЦИАЛИЗАЦИЯ ======
onMounted(async () => {
  await nextTick() // ждём, пока canvas появится
  
  const canvas = canvasRef.value
  
  // Подгоняем размер canvas под размер экрана
  canvas.width = canvas.parentElement.clientWidth
  canvas.height = canvas.parentElement.clientHeight
  
  // Получаем контекст — это "кисточка", которой мы будем рисовать
  ctx = canvas.getContext('2d')
  
  // Заливаем белым фоном
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
})

// ====== РИСОВАНИЕ ======
function startDraw(e) {
  drawing = true
  
  // Получаем координаты мыши относительно canvas
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // Начинаем новый путь
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function draw(e) {
  if (!drawing) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  // Настройки кисти
  ctx.lineWidth = size.value
  ctx.lineCap = 'round'  // скруглённые концы линий
  ctx.lineJoin = 'round' // скруглённые стыки
  
  if (tool.value === 'eraser') {
    // Ластик — рисуем белым цветом
    ctx.strokeStyle = '#ffffff'
  } else {
    // Карандаш — рисуем выбранным цветом
    ctx.strokeStyle = color.value
  }
  
  // Рисуем линию
  ctx.lineTo(x, y)
  ctx.stroke()
}

function stopDraw() {
  drawing = false
}

// ====== ОЧИСТКА ======
function clearCanvas() {
  const canvas = canvasRef.value
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}
</script>

<style scoped>
.whiteboard-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: white;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
}

.toolbar button {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.toolbar button:hover {
  background: #f0f0f0;
}

.toolbar button.active {
  border-color: #4285f4;
  background: #e8f0fe;
  color: #4285f4;
  font-weight: bold;
}

.spacer {
  flex-grow: 1;
}

.toolbar label {
  font-size: 13px;
  color: #666;
}

.toolbar input[type="color"] {
  width: 30px;
  height: 30px;
  border: none;
  cursor: pointer;
  padding: 0;
}

.toolbar input[type="range"] {
  width: 80px;
}

.drawing-canvas {
  flex-grow: 1;
  display: block;
  cursor: crosshair;
  background: white;
}
</style>
