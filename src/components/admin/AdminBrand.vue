<template>
  <div>
    <div class="cm-card">
      <div class="cm-card-header" @click="openBrand = !openBrand">
        <h3>🎨 Бренд</h3>
        <i :class="openBrand ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </div>
      <div v-show="openBrand" class="cm-card-body">
        <div class="field-group">
          <label>Название клуба</label>
          <input class="input" :value="form.club_name" @input="update('club_name', $event.target.value)" placeholder="English Club">
        </div>
        <div class="field-group">
          <label>Основной цвет</label>
          <div class="color-picker-row">
            <input class="input" :value="form.primary_color" type="color" style="width:60px;height:40px;padding:2px" @input="update('primary_color', $event.target.value)">
            <input class="input" :value="form.primary_color" @input="update('primary_color', $event.target.value)" placeholder="#6366f1">
          </div>
        </div>
      </div>
    </div>

    <div class="cm-card">
      <div class="cm-card-header" @click="openStats = !openStats">
        <h3>📊 Статистика сайта</h3>
        <i :class="openStats ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </div>
      <div v-show="openStats" class="cm-card-body">
        <div class="stats-grid">
          <div class="stat-card" v-for="s in statsList" :key="s.label">
            <span class="stat-icon">{{ s.icon }}</span>
            <span class="stat-value">{{ s.value }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ form: Object, stats: Object });
const emit = defineEmits(['change']);

const openBrand = ref(true);
const openStats = ref(true);

const statsList = computed(() => [
  { icon: '👥', value: props.stats?.users || '-', label: 'Пользователей' },
  { icon: '📅', value: props.stats?.sessions || '-', label: 'Занятий' },
  { icon: '💬', value: props.stats?.messages || '-', label: 'Сообщений' },
  { icon: '👁️', value: props.stats?.views || 0, label: 'Просмотров' }
]);

const update = (key, value) => {
  props.form[key] = value;
  emit('change');
};
</script>

<style scoped>
.cm-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; margin-bottom: 16px; overflow: hidden; }
.cm-card-header { padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.cm-card-header:hover { background: rgba(255,255,255,0.02); }
.cm-card-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #fff; }
.cm-card-body { padding: 24px; }
.field-group { margin-bottom: 18px; }
.field-group label { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; }
.color-picker-row { display: flex; gap: 12px; align-items: center; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { text-align: center; padding: 24px 16px; background: rgba(255,255,255,0.02); border-radius: 14px; border: 1px solid rgba(255,255,255,0.05); }
.stat-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
.stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: block; }
.stat-label { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; display: block; }
.input { width: 100%; padding: 10px 14px; border: 2px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
.input:focus { border-color: #6366f1; }
@media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
