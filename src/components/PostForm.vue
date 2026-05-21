<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal" style="max-width:800px">
      <h3>{{ editId ? '✏️ Редактировать' : '📰 Новая публикация' }}</h3>
      
      <input class="input" v-model="form.title" placeholder="Заголовок">
      
      <!-- Визуальный редактор GrapesJS -->
      <div ref="gjsEditor" class="gjs-editor"></div>
      
      <button class="btn btn-p w-100 mt-3" @click="submit">
        {{ editId ? '💾 Сохранить' : '📰 Опубликовать' }}
      </button>
      <button class="btn btn-o w-100 mt-2" @click="$emit('close')">Отмена</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

export default {
  props: ['show', 'editId'],
  emits: ['close', 'saved'],
  data() {
    return {
      form: { title: '', content: '' },
      editor: null
    };
  },
  watch: {
    show(val) {
      if (val) {
        this.$nextTick(() => {
          if (this.editId) this.loadPost();
          else this.form = { title: '', content: '' };
          this.initEditor();
        });
      } else {
        this.destroyEditor();
      }
    }
  },
  methods: {
    initEditor() {
      if (this.editor) this.destroyEditor();
      
      this.editor = grapesjs.init({
        container: this.$refs.gjsEditor,
        height: '400px',
        width: 'auto',
        storageManager: false,
        blockManager: {
          appendTo: '#blocks',
          blocks: [
            { id: 'text', label: '📝 Текст', content: '<p>Введите текст...</p>' },
            { id: 'header', label: '📌 Заголовок', content: '<h2>Заголовок</h2>' },
            { id: 'image', label: '🖼️ Картинка', content: '<img src="https://via.placeholder.com/400x200" style="max-width:100%">' },
            { id: 'quote', label: '💬 Цитата', content: '<blockquote style="border-left:3px solid #6366f1;padding-left:10px;color:#64748b">Цитата...</blockquote>' },
            { id: 'list', label: '📋 Список', content: '<ul><li>Пункт 1</li><li>Пункт 2</li></ul>' },
            { id: 'video', label: '🎬 Видео', content: '<video src="" controls style="max-width:100%">Видео</video>' }
          ]
        },
        styleManager: {
          sectors: [
            { name: 'Общее', properties: ['width', 'height', 'padding', 'margin', 'text-align', 'color', 'background-color'] },
            { name: 'Типографика', properties: ['font-size', 'font-weight', 'line-height', 'letter-spacing'] }
          ]
        },
        plugins: [],
        canvas: {
          styles: ['https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'],
          scripts: []
        }
      });
      
      // Загружаем контент если редактируем
      if (this.form.content) {
        this.editor.setComponents(this.form.content);
      }
    },
    destroyEditor() {
      if (this.editor) {
        this.editor.destroy();
        this.editor = null;
      }
    },
    async loadPost() {
      try {
        const r = await axios.get('/api/posts');
        const p = r.data.find(p => p.id === this.editId);
        if (p) {
          this.form = {
            title: p.title || '',
            content: p.content || ''
          };
        }
      } catch(e) {}
    },
    async submit() {
      if (!this.form.title) return alert('Введите заголовок');
      
      // Получаем HTML из редактора
      const html = this.editor ? this.editor.getHtml() : '';
      const css = this.editor ? this.editor.getCss() : '';
      const content = `<style>${css}</style>${html}`;
      
      try {
        const url = this.editId ? `/api/posts/${this.editId}` : '/api/posts';
        const method = this.editId ? 'put' : 'post';
        await axios[method](url, {
          title: this.form.title,
          content: content,
          items: '[]'
        });
        this.$emit('saved');
        this.$emit('close');
      } catch(e) { alert('Ошибка публикации'); }
    }
  },
  beforeUnmount() {
    this.destroyEditor();
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.modal { background: #fff; border-radius: 16px; padding: 24px; width: 100%; max-height: 90vh; overflow-y: auto; }
.input { width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 0.9rem; margin-bottom: 12px; }
.gjs-editor { border: 2px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; }
.btn-p { background: #6366f1; color: #fff; }
.btn-o { border: 2px solid #6366f1; color: #6366f1; background: transparent; }
.w-100 { width: 100%; }
</style>
