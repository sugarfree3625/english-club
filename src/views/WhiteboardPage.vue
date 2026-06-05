<template>
  <div class="whiteboard-page" :class="{ dark: darkMode }">
    <!-- ШАПКА -->
    <div class="wb-header">
      <button class="btn btn-o btn-sm" @click="$router.back()">← Назад</button>
      <h3>🎨 Интерактивная доска</h3>
      <div class="wb-header-right">
        <span class="wb-users" v-if="usersOnline > 1">👥 {{ usersOnline }}</span>
        <button class="btn btn-o btn-sm" @click="jitsiActive = !jitsiActive">📹 {{ jitsiActive ? 'Скрыть звонок' : 'Видеозвонок' }}</button>
        <button class="btn btn-o btn-sm" @click="shareLink">🔗 Поделиться</button>
      </div>
    </div>

    <!-- ПАНЕЛЬ ИНСТРУМЕНТОВ -->
    <WhiteboardToolbar
      :activeTool="activeTool" :color="color" :lineWidth="lineWidth"
      :canUndo="historyIndex > 0" :canRedo="historyIndex < historyLength - 1"
      :showGrid="showGrid" :darkMode="darkMode" :zoom="zoom"
      @select-tool="activeTool = $event"
      @update:color="color = $event" @update:lineWidth="lineWidth = $event"
      @undo="canvasRef?.undo()" @redo="canvasRef?.redo()"
      @duplicate="canvasRef?.duplicateSelected()"
      @delete-selected="canvasRef?.deleteSelected()"
      @toggle-grid="showGrid = !showGrid"
      @toggle-theme="darkMode = !darkMode"
      @clear-all="canvasRef?.clearAll()"
      @save-board="saveBoard"
      @export-png="canvasRef?.exportPNG()"
      @zoom-in="zoom = Math.min(300, zoom + 10)"
      @zoom-out="zoom = Math.max(10, zoom - 10)"
      @zoom-reset="zoom = 100"
    />

    <!-- ХОЛСТ + ВИДЕО -->
    <div class="wb-main">
      <WhiteboardCanvas
        ref="canvasRef"
        :activeTool="activeTool" :color="color" :lineWidth="lineWidth"
        :darkMode="darkMode" :showGrid="showGrid" :zoom="zoom"
        @update:zoom="zoom = $event"
        @save-board="saveBoard"
        style="flex:1"
      />
      
      <div v-if="jitsiActive" class="wb-jitsi">
        <button class="jitsi-close" @click="jitsiActive = false">✕</button>
        <iframe :src="jitsiUrl" allow="camera; microphone; fullscreen" class="jitsi-frame"></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import WhiteboardToolbar from '../components/whiteboard/WhiteboardToolbar.vue';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas.vue';

const activeTool = ref('pen');
const color = ref('#6366f1');
const lineWidth = ref(3);
const darkMode = ref(true);
const showGrid = ref(false);
const zoom = ref(100);
const jitsiActive = ref(false);
const usersOnline = ref(1);
const historyLength = ref(1);
const historyIndex = ref(0);
const canvasRef = ref(null);

const jitsiUrl = ref(`https://meet.jit.si/english-club-whiteboard-${Date.now()}`);

const shareLink = () => {
  navigator.clipboard?.writeText(window.location.href);
};

const saveBoard = async () => {
  const data = canvasRef.value?.getBoardData();
  console.log('💾 Сохраняем:', data);
  // Тут сохранение в Supabase
};
</script>

<style scoped>
.whiteboard-page { height: 100vh; display: flex; flex-direction: column; background: #0b1120; }
.dark { background: #0b1120; }
.wb-header { display: flex; align-items: center; gap: 16px; padding: 10px 20px; background: rgba(15,15,30,0.97); border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.wb-header h3 { flex: 1; color: #fff; font-family: 'Space Grotesk', sans-serif; margin: 0; font-size: 1.1rem; }
.wb-header-right { display: flex; align-items: center; gap: 8px; }
.wb-users { font-size: 0.8rem; color: #94a3b8; }
.wb-main { flex: 1; display: flex; overflow: hidden; }
.wb-jitsi { width: 320px; flex-shrink: 0; position: relative; border-left: 1px solid rgba(255,255,255,0.06); }
@media (max-width: 768px) { .wb-jitsi { position: fixed; inset: 0; z-index: 100; width: 100%; } }
.jitsi-frame { width: 100%; height: 100%; border: none; }
.jitsi-close { position: absolute; top: 8px; right: 8px; z-index: 10; padding: 6px 12px; background: #ef4444; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 50px; font-weight: 600; font-size: 0.8rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.03); }
.btn-o:hover { background: rgba(99,102,241,0.1); }
.btn-sm { padding: 6px 12px; font-size: 0.75rem; }
</style>
