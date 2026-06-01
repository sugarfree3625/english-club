<template>
  <div class="cm-card">
    <div class="cm-card-header" @click="open = !open">
      <h3>🏠 Главный экран (Hero)</h3>
      <i :class="open ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
    </div>
    <div v-show="open" class="cm-card-body">
      <div class="field-group">
        <label>Заголовок</label>
        <input class="input" :value="form.hero_title" @input="update('hero_title', $event.target.value)" placeholder="Анна Петрова">
      </div>
      <div class="field-group">
        <label>Подзаголовок</label>
        <textarea class="input note-area" :value="form.hero_subtitle" @input="update('hero_subtitle', $event.target.value)" rows="2" placeholder="Разговорный клуб..."></textarea>
      </div>
      <div class="field-group">
        <label>Фото репетитора</label>
        <div 
          class="photo-upload drop-zone"
          :class="{ 'drop-active': dragOver }"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
        >
          <img v-if="form.tutor_photo" :src="form.tutor_photo" class="photo-preview">
          <div v-else class="photo-placeholder">
            <span v-if="dragOver">📥 Отпустите</span>
            <span v-else>📷</span>
          </div>
          <div class="photo-actions">
            <input class="input" :value="form.tutor_photo" @input="update('tutor_photo', $event.target.value)" placeholder="URL фото">
            <button class="btn btn-o btn-sm" @click="$refs.photoInput.click()">
              <i class="fas fa-upload"></i> Загрузить с компьютера
            </button>
            <input type="file" ref="photoInput" @change="onFileSelect" hidden accept="image/*">
          </div>
        </div>
      </div>
      <div class="field-group">
        <label>Имя репетитора</label>
        <input class="input" :value="form.tutor_name" @input="update('tutor_name', $event.target.value)" placeholder="Анна Иванова">
      </div>
      <div class="field-group">
        <label>О себе</label>
        <textarea class="input note-area" :value="form.tutor_bio" @input="update('tutor_bio', $event.target.value)" rows="3" placeholder="Расскажите о себе..."></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ form: Object });
const emit = defineEmits(['change', 'upload-photo']);

const open = ref(true);
const dragOver = ref(false);

const update = (key, value) => {
  props.form[key] = value;
  emit('change');
};

const onDrop = (e) => {
  dragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file) emit('upload-photo', file);
};

const onFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) emit('upload-photo', file);
};
</script>

<style scoped>
.cm-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; margin-bottom: 16px; overflow: hidden; }
.cm-card-header { padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; }
.cm-card-header:hover { background: rgba(255,255,255,0.02); }
.cm-card-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #fff; }
.cm-card-body { padding: 24px; }
.field-group { margin-bottom: 18px; }
.field-group label { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; }
.drop-zone { border: 2px dashed rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; transition: all 0.3s; }
.drop-zone.drop-active { border-color: #6366f1; background: rgba(99,102,241,0.05); }
.photo-upload { display: flex; gap: 16px; align-items: center; }
.photo-preview { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(99,102,241,0.3); flex-shrink: 0; }
.photo-placeholder { width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; border: 3px dashed rgba(255,255,255,0.1); }
.photo-actions { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 50px; font-weight: 600; font-size: 0.8rem; cursor: pointer; border: none; font-family: inherit; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.03); }
.btn-o:hover { background: rgba(99,102,241,0.1); }
.input { width: 100%; padding: 10px 14px; border: 2px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
.input:focus { border-color: #6366f1; }
.note-area { resize: vertical; min-height: 60px; }
@media (max-width: 768px) { .photo-upload { flex-direction: column; align-items: flex-start; } }
</style>
