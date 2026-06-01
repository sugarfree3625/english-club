<template>
  <div class="cm-card">
    <div class="cm-card-header" @click="open = !open">
      <h3>📦 Услуги</h3>
      <div class="cm-card-header-right">
        <span class="tab-count">{{ services.length }}</span>
        <i :class="open ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </div>
    </div>
    <div v-show="open" class="cm-card-body">
      <draggable v-model="services" handle=".drag-handle" @end="$emit('change')">
        <div class="service-item" v-for="(s, i) in services" :key="i">
          <div class="drag-handle" title="Перетащить">⋮⋮</div>
          <div class="service-fields">
            <input class="input" v-model="s.title" placeholder="Название услуги" @input="$emit('change')">
            <input class="input" v-model="s.desc" placeholder="Описание" @input="$emit('change')">
            <div class="row-fields">
              <input class="input" v-model="s.price" placeholder="Цена" @input="$emit('change')">
              <input class="input" v-model="s.duration" placeholder="Длительность" @input="$emit('change')">
              <input class="input" v-model="s.icon" placeholder="Иконка" style="max-width:80px" @input="$emit('change')">
            </div>
            <label class="checkbox-label">
              <input type="checkbox" v-model="s.popular" @change="$emit('change')">
              <span>Популярный выбор</span>
            </label>
          </div>
          <button class="btn btn-o btn-sm" style="color:#ef4444" @click="removeService(i)">🗑</button>
        </div>
      </draggable>
      <button class="btn btn-p btn-sm w-100" @click="addService">+ Добавить услугу</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ services: Array });
const emit = defineEmits(['change', 'add', 'remove']);

const open = ref(true);

const addService = () => {
  props.services.push({ title: '', desc: '', price: '', duration: '60 минут', icon: '📦', popular: false });
  emit('change');
};

const removeService = (i) => {
  props.services.splice(i, 1);
  emit('change');
};
</script>

<style scoped>
.cm-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; margin-bottom: 16px; overflow: hidden; }
.cm-card-header { padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.cm-card-header:hover { background: rgba(255,255,255,0.02); }
.cm-card-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #fff; }
.cm-card-header-right { display: flex; align-items: center; gap: 12px; }
.cm-card-body { padding: 24px; }
.tab-count { padding: 2px 10px; background: rgba(99,102,241,0.2); border-radius: 10px; font-size: 0.75rem; font-weight: 700; color: #818cf8; }
.service-item { display: flex; gap: 12px; padding: 14px; background: rgba(255,255,255,0.02); border-radius: 14px; margin-bottom: 10px; align-items: flex-start; }
.drag-handle { cursor: grab; color: #64748b; font-size: 1.2rem; padding: 4px; margin-top: 6px; }
.service-fields { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.row-fields { display: flex; gap: 8px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #cbd5e1; cursor: pointer; }
.checkbox-label input { width: 18px; height: 18px; accent-color: #6366f1; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 50px; font-weight: 600; font-size: 0.8rem; cursor: pointer; border: none; font-family: inherit; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; width: 100%; justify-content: center; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.03); }
.input { width: 100%; padding: 10px 14px; border: 2px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
.input:focus { border-color: #6366f1; }
@media (max-width: 768px) { .row-fields { flex-direction: column; } }
</style>
