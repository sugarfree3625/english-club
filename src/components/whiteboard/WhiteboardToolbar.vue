<template>
  <div class="wb-toolbar">
    <!-- Инструменты -->
    <div class="tool-group">
      <button v-for="tool in mainTools" :key="tool.id" class="tool-btn" :class="{ active: activeTool === tool.id }" @click="$emit('select-tool', tool.id)" :title="tool.name">
        <span>{{ tool.icon }}</span>
      </button>
    </div>
    
    <span class="tool-sep"></span>
    
    <!-- Цвет -->
    <div class="tool-group">
      <input type="color" :value="color" @input="$emit('update:color', $event.target.value)" class="color-picker" title="Цвет" />
      <div class="color-presets">
        <button v-for="c in colorPresets" :key="c" class="color-dot" :style="{ background: c }" @click="$emit('update:color', c)"></button>
      </div>
    </div>
    
    <span class="tool-sep"></span>
    
    <!-- Размер -->
    <div class="tool-group">
      <input type="range" :value="lineWidth" @input="$emit('update:lineWidth', +$event.target.value)" min="1" max="20" class="size-slider" title="Размер" />
      <span class="size-value">{{ lineWidth }}px</span>
    </div>
    
    <span class="tool-sep"></span>
    
    <!-- Фигуры -->
    <div class="tool-group">
      <button v-for="shape in shapes" :key="shape.id" class="tool-btn" :class="{ active: activeTool === shape.id }" @click="$emit('select-tool', shape.id)" :title="shape.name">
        <span>{{ shape.icon }}</span>
      </button>
    </div>
    
    <span class="tool-sep"></span>
    
    <!-- Действия -->
    <div class="tool-group">
      <button class="tool-btn" @click="$emit('undo')" :disabled="!canUndo" title="Отменить (Ctrl+Z)">↩️</button>
      <button class="tool-btn" @click="$emit('redo')" :disabled="!canRedo" title="Повторить (Ctrl+Y)">↪️</button>
      <button class="tool-btn" @click="$emit('duplicate')" title="Дублировать (Ctrl+D)">📋</button>
      <button class="tool-btn" @click="$emit('delete-selected')" title="Удалить (Delete)">🗑</button>
    </div>
    
    <span class="tool-sep"></span>
    
    <!-- Дополнительно -->
    <div class="tool-group">
      <button class="tool-btn" :class="{ active: showGrid }" @click="$emit('toggle-grid')" title="Сетка">📏</button>
      <button class="tool-btn" :class="{ active: darkMode }" @click="$emit('toggle-theme')" title="Тёмная тема">{{ darkMode ? '☀️' : '🌙' }}</button>
      <button class="tool-btn" @click="$emit('clear-all')" title="Очистить всё">🧹</button>
      <button class="tool-btn" @click="$emit('save-board')" title="Сохранить (Ctrl+S)">💾</button>
      <button class="tool-btn" @click="$emit('export-png')" title="Экспорт PNG">📥</button>
    </div>
    
    <span class="tool-sep"></span>
    
    <!-- Масштаб -->
    <div class="tool-group">
      <button class="tool-btn" @click="$emit('zoom-in')" title="Приблизить">🔍+</button>
      <span class="zoom-value">{{ zoom }}%</span>
      <button class="tool-btn" @click="$emit('zoom-out')" title="Отдалить">🔍-</button>
      <button class="tool-btn" @click="$emit('zoom-reset')" title="Сбросить">↺</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeTool: String,
  color: String,
  lineWidth: Number,
  canUndo: Boolean,
  canRedo: Boolean,
  showGrid: Boolean,
  darkMode: Boolean,
  zoom: Number
});

defineEmits([
  'select-tool', 'update:color', 'update:lineWidth',
  'undo', 'redo', 'duplicate', 'delete-selected',
  'toggle-grid', 'toggle-theme', 'clear-all', 'save-board', 'export-png',
  'zoom-in', 'zoom-out', 'zoom-reset'
]);

const colorPresets = ['#6366f1','#2dd4bf','#f59e0b','#ef4444','#ec4899','#10b981','#8b5cf6','#ffffff','#000000'];

const mainTools = [
  { id: 'select', icon: '🖱️', name: 'Выделение' },
  { id: 'pen', icon: '✏️', name: 'Карандаш' },
  { id: 'brush', icon: '🖌️', name: 'Кисть' },
  { id: 'highlighter', icon: '🖍️', name: 'Маркер' },
  { id: 'eraser', icon: '🧹', name: 'Ластик' },
  { id: 'text', icon: '📝', name: 'Текст' },
  { id: 'image', icon: '🖼️', name: 'Картинка' },
  { id: 'sticker', icon: '😊', name: 'Стикер' },
  { id: 'laser', icon: '🎯', name: 'Указка' },
];

const shapes = [
  { id: 'rect', icon: '⬜', name: 'Прямоугольник' },
  { id: 'circle', icon: '🔵', name: 'Круг' },
  { id: 'line', icon: '📏', name: 'Линия' },
  { id: 'arrow', icon: '➡️', name: 'Стрелка' },
  { id: 'triangle', icon: '🔺', name: 'Треугольник' },
  { id: 'star', icon: '⭐', name: 'Звезда' },
];
</script>

<style scoped>
.wb-toolbar {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 12px; background: rgba(15,15,30,0.97);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-wrap: wrap; overflow-x: auto;
}
.tool-group { display: flex; align-items: center; gap: 2px; }
.tool-btn {
  width: 34px; height: 34px; border-radius: 8px;
  border: none; background: transparent; cursor: pointer;
  font-size: 1rem; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; color: #cbd5e1;
}
.tool-btn:hover { background: rgba(255,255,255,0.06); }
.tool-btn.active { background: rgba(99,102,241,0.2); color: #fff; }
.tool-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.tool-sep { width: 1px; height: 24px; background: rgba(255,255,255,0.08); margin: 0 4px; flex-shrink: 0; }
.color-picker { width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; background: transparent; padding: 2px; }
.color-presets { display: flex; gap: 2px; }
.color-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
.color-dot:hover { transform: scale(1.2); border-color: #fff; }
.size-slider { width: 60px; accent-color: #6366f1; }
.size-value { font-size: 0.7rem; color: #94a3b8; min-width: 30px; }
.zoom-value { font-size: 0.7rem; color: #94a3b8; min-width: 40px; text-align: center; }
</style>
