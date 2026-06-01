<template>
  <div class="cm-card">
    <div class="cm-card-header" @click="open = !open">
      <h3>📞 Контакты</h3>
      <i :class="open ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
    </div>
    <div v-show="open" class="cm-card-body">
      <div class="field-group">
        <label><i class="fab fa-telegram"></i> Telegram</label>
        <input class="input" :value="form.tg" @input="update('tg', $event.target.value)" placeholder="https://t.me/username">
      </div>
      <div class="field-group">
        <label><i class="fab fa-whatsapp"></i> WhatsApp</label>
        <input class="input" :value="form.wa" @input="update('wa', $event.target.value)" placeholder="https://wa.me/79161234567">
      </div>
      <div class="field-group">
        <label><i class="fab fa-vk"></i> VK</label>
        <input class="input" :value="form.vk" @input="update('vk', $event.target.value)" placeholder="https://vk.com/username">
      </div>
      <div class="field-group">
        <label><i class="fas fa-envelope"></i> Email</label>
        <input class="input" :value="form.email" @input="update('email', $event.target.value)" placeholder="anna@english-club.ru">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ form: Object });
const emit = defineEmits(['change']);

const open = ref(true);

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
.input { width: 100%; padding: 10px 14px; border: 2px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
.input:focus { border-color: #6366f1; }
</style>
