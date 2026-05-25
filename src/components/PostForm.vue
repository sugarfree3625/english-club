<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal" style="max-width:650px">
      <h3>{{ editId ? '✏️ Редактировать' : '📰 Новая публикация' }}</h3>
      <input class="input" v-model="form.title" placeholder="Заголовок">
      <textarea class="input" v-model="form.content" placeholder="Текст..." rows="4"></textarea>
      <div class="items-section">
        <div v-for="(item, i) in form.items" :key="i" class="item-row">
          <select class="input" v-model="item.type" style="width:120px">
            <option value="image">🖼️ Картинки</option>
            <option value="audio">🎵 Аудио</option>
            <option value="video">🎬 Видео</option>
            <option value="file">📄 Файл</option>
            <option value="link">🔗 Ссылка</option>
          </select>
          <div v-if="item.type === 'image'">
            <input type="file" multiple accept="image/*" @change="e => uploadFiles(e, i, 'image')">
            <div class="thumb-grid">
              <img v-for="(url, j) in item.urls" :key="j" :src="url" class="thumb" @click="removeItemUrl(i, j)">
            </div>
          </div>
          <div v-if="item.type === 'audio'">
            <input type="file" multiple accept="audio/*" @change="e => uploadFiles(e, i, 'audio')">
            <audio v-for="(url, j) in item.urls" :key="j" :src="url" controls></audio>
          </div>
          <div v-if="item.type === 'video'">
            <input type="file" multiple accept="video/*" @change="e => uploadFiles(e, i, 'video')">
            <video v-for="(url, j) in item.urls" :key="j" :src="url" controls></video>
          </div>
          <div v-if="item.type === 'file'">
            <input type="file" multiple @change="e => uploadFiles(e, i, 'file')">
            <div v-for="(f, j) in item.files" :key="j" class="file-box">
              📎 <a :href="f.url" target="_blank">{{ f.name }}</a>
            </div>
          </div>
          <div v-if="item.type === 'link'">
            <input class="input" v-model="item.urls[0]" placeholder="https://...">
          </div>
          <button class="btn btn-o btn-sm" @click="removeItem(i)">✕</button>
        </div>
        <button class="btn btn-o btn-sm" @click="addItem">+ Добавить вложение</button>
      </div>
      <button class="btn btn-p w-100 mt-3" @click="submit" :disabled="uploading">
        {{ uploading ? '⏳ Загрузка...' : (editId ? '💾 Сохранить' : 'Опубликовать') }}
      </button>
      <button class="btn btn-o w-100 mt-2" @click="$emit('close')" :disabled="uploading">Отмена</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['show', 'editId'],
  emits: ['close', 'saved'],
  inject: ['addToast'],
  data() {
    return { 
      form: { title: '', content: '', items: [] },
      uploading: false
    };
  },
  watch: {
    show(val) {
      if (val) {
        if (this.editId) this.loadPost();
        else this.form = { title: '', content: '', items: [] };
        this.uploading = false;
      }
    }
  },
  methods: {
    addItem() { 
      this.form.items.push({ type: 'image', urls: [], files: [] }); 
    },
    removeItem(i) { 
      this.form.items.splice(i, 1); 
    },
    removeItemUrl(i, j) { 
      this.form.items[i].urls.splice(j, 1); 
    },
    async uploadFiles(e, i, type) {
      const files = e.target.files;
      if (!files.length) return;
      this.uploading = true;
      let uploadedCount = 0;
      for (let f of files) {
        if (this.form.items[i].urls.length >= 20) {
          this.addToast('Максимум 20 файлов 📁', 'info');
          break;
        }
        const fd = new FormData(); 
        fd.append('img', f);
        try {
          const r = await axios.post('/api/nimg', fd);
          if (r.data.success) {
            this.form.items[i].urls.push(r.data.url);
            if (type === 'file') this.form.items[i].files.push({ url: r.data.url, name: f.name });
            uploadedCount++;
          }
        } catch(e) {
          this.addToast(`Ошибка загрузки: ${f.name} ❌`, 'error');
        }
      }
      this.uploading = false;
      if (uploadedCount > 0) {
        this.addToast(`Загружено файлов: ${uploadedCount} ✅`, 'success');
      }
    },
    async loadPost() {
      try {
        const r = await axios.get('/api/posts');
        const p = r.data.find(p => p.id === this.editId);
        if (p) {
          this.form = { 
            title: p.title || '', 
            content: p.content || '', 
            items: p.items ? JSON.parse(p.items) : [] 
          };
        } else {
          this.addToast('Пост не найден 🤷', 'error');
          this.$emit('close');
        }
      } catch(e) {
        this.addToast('Ошибка загрузки поста 📡', 'error');
      }
    },
    async submit() {
      if (!this.form.title || !this.form.content) {
        this.addToast('Заполните заголовок и текст ✍️', 'error');
        return;
      }
      try {
        const url = this.editId ? `/api/posts/${this.editId}` : '/api/posts';
        const method = this.editId ? 'put' : 'post';
        await axios[method](url, { 
          title: this.form.title, 
          content: this.form.content, 
          items: JSON.stringify(this.form.items) 
        });
        this.addToast(
          this.editId ? 'Пост обновлён! ✏️' : 'Пост опубликован! 📰', 
          'success'
        );
        this.$emit('saved'); 
        this.$emit('close');
      } catch(e) {
        const errorMsg = e.response?.data?.error || 'Ошибка публикации';
        this.addToast(errorMsg, 'error');
      }
    }
  }
};
</script>
