<template>
  <div class="design-editor">
    <div class="editor-toolbar">
      <h3>🎨 Редактор дизайна</h3>
      <div>
        <button class="btn btn-p btn-sm" @click="saveDesign">💾 Сохранить</button>
        <button class="btn btn-o btn-sm" @click="loadDesign">📂 Загрузить</button>
        <button class="btn btn-o btn-sm" @click="$router.push('/dashboard')">← Назад</button>
      </div>
    </div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import axios from 'axios';

export default {
  name: 'DesignEditor',
  props: ['user'],
  data() {
    return { editor: null };
  },
  mounted() {
    if (this.user?.role !== 'admin') {
      this.$router.push('/dashboard');
      return;
    }
    this.initEditor();
  },
  methods: {
    initEditor() {
      this.editor = grapesjs.init({
        container: this.$refs.editorContainer,
        height: 'calc(100vh - 60px)',
        width: 'auto',
        storageManager: false,
        blockManager: {
          blocks: [
            { id: 'text', label: '📝 Текст', content: '<p style="padding:10px">Введите текст...</p>' },
            { id: 'header', label: '📌 Заголовок', content: '<h1 style="padding:10px">Заголовок</h1>' },
            { id: 'image', label: '🖼️ Картинка', content: '<img src="https://via.placeholder.com/400x200" style="max-width:100%;border-radius:12px">' },
            { id: 'button', label: '🔘 Кнопка', content: '<a href="#" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:50px;text-decoration:none;font-weight:600">Кнопка</a>' },
            { id: 'card', label: '🃏 Карточка', content: '<div style="padding:20px;background:#fff;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.06)"><h3>Заголовок</h3><p>Описание</p></div>' },
            { id: 'section', label: '📦 Секция', content: '<section style="padding:40px 20px;text-align:center"><h2>Название секции</h2><p>Описание секции</p></section>' }
          ]
        },
        styleManager: {
          sectors: [
            { name: 'Размеры', properties: ['width', 'height', 'max-width', 'min-height'] },
            { name: 'Отступы', properties: ['padding', 'margin'] },
            { name: 'Текст', properties: ['font-size', 'font-weight', 'text-align', 'color', 'line-height'] },
            { name: 'Фон', properties: ['background-color', 'background'] },
            { name: 'Границы', properties: ['border-radius', 'border', 'box-shadow'] }
          ]
        },
        canvas: { styles: ['https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap'] }
      });
    },
    async saveDesign() {
      const html = this.editor.getHtml();
      const css = this.editor.getCss();
      try {
        await axios.put('/api/settings', { custom_html: html, custom_css: css });
        alert('✅ Дизайн сохранён!');
      } catch(e) { alert('Ошибка сохранения'); }
    },
    async loadDesign() {
      try {
        const r = await axios.get('/api/settings');
        if (r.data.custom_html) {
          this.editor.setComponents(r.data.custom_html);
        }
        if (r.data.custom_css) {
          this.editor.setStyle(r.data.custom_css);
        }
      } catch(e) {}
    }
  },
  beforeUnmount() {
    if (this.editor) this.editor.destroy();
  }
};
</script>

<style scoped>
.design-editor { display: flex; flex-direction: column; height: 100vh; }
.editor-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: #fff; border-bottom: 1px solid #e2e8f0; z-index: 10; }
.editor-toolbar h3 { font-weight: 700; }
.editor-container { flex: 1; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; }
.btn-p { background: #6366f1; color: #fff; }
.btn-o { border: 2px solid #6366f1; color: #6366f1; background: transparent; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
</style>
