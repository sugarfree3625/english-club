<template>
  <div class="notebook-app fade-in">
    <!-- ХЕДЕР -->
    <div class="nb-header">
      <h2>📝 Блокнот</h2>
      <div class="nb-stats">
        <span class="nb-stat"><i class="fas fa-file-alt"></i> {{ notes.length }} заметок</span>
        <span class="nb-stat"><i class="fas fa-folder"></i> {{ folders.length }} папок</span>
        <span class="nb-stat"><i class="fas fa-paperclip"></i> {{ totalFiles }} файлов</span>
        <span class="nb-stat" v-if="lastSaved"><i class="fas fa-check-circle"></i> Сохранено {{ lastSaved }}</span>
      </div>
    </div>

    <!-- ТУЛБАР -->
    <div class="nb-toolbar">
      <button class="tool-btn" @click="addNote" title="Новая заметка"><i class="fas fa-plus"></i> Новая</button>
      <button class="tool-btn" @click="showFolders = !showFolders" :class="{ active: showFolders }"><i class="fas fa-folder"></i> Папки</button>
      <div class="search-wrap">
        <i class="fas fa-search search-icon"></i>
        <input class="search-input" v-model="searchQuery" placeholder="Поиск по заметкам..." />
      </div>
      <button class="tool-btn" @click="exportNotes" title="Экспорт"><i class="fas fa-download"></i></button>
    </div>

    <!-- ПАПКИ -->
    <div class="folders-panel" v-if="showFolders">
      <button v-for="folder in folders" :key="folder" class="folder-btn" :class="{ active: activeFolder === folder, 'drag-over': dragOverFolder === folder }" @click="activeFolder = activeFolder === folder ? null : folder" @dragover.prevent="dragOverFolder = folder" @dragleave="dragOverFolder = null" @drop="dropToFolder(folder)">
        <i class="fas fa-folder" :style="{ color: folderColors[folder] || '#94a3b8' }"></i> {{ folder }}
        <span class="folder-count">{{ getFolderCount(folder) }}</span>
        <span class="folder-delete" @click.stop="deleteFolder(folder)" title="Удалить папку"><i class="fas fa-times"></i></span>
      </button>
      <button class="folder-btn add-folder" @click="addFolder"><i class="fas fa-plus"></i> Новая папка</button>
    </div>

    <!-- СПИСОК ЗАМЕТОК -->
    <div class="notes-grid" v-if="!editingNote">
      <div v-for="note in filteredNotes" :key="note.id" class="note-card" :style="{ borderLeftColor: note.color || '#6366f1' }" :draggable="true" @dragstart="dragNote = note" @dragend="dragNote = null; dragOverFolder = null" @click="editNote(note)">
        <div class="note-card-header">
          <h4>{{ note.title || 'Без названия' }}</h4>
          <span class="note-date">{{ formatDate(note.updated_at || note.created_at) }}</span>
        </div>
        <p class="note-preview">{{ getPreview(note.content) }}</p>
        <div class="note-card-footer">
          <div class="note-tags"><span v-for="tag in note.tags" :key="tag" class="note-tag">#{{ tag }}</span></div>
          <div class="note-meta-right">
            <span class="note-attachments" v-if="note.attachments?.length"><i class="fas fa-paperclip"></i> {{ note.attachments.length }}</span>
            <span class="note-folder" v-if="note.folder"><i class="fas fa-folder"></i> {{ note.folder }}</span>
          </div>
        </div>
        <button class="note-delete" @click.stop="deleteNote(note.id)" title="Удалить"><i class="fas fa-trash"></i></button>
      </div>
      <div v-if="!filteredNotes.length" class="empty-notes">
        <div class="empty-icon">📝</div>
        <p>{{ searchQuery ? 'Ничего не найдено' : 'Нет заметок. Создайте первую!' }}</p>
        <button class="btn btn-p" @click="addNote" v-if="!searchQuery">+ Новая заметка</button>
      </div>
    </div>

    <!-- РЕДАКТОР -->
    <div class="note-editor" v-else>
      <div class="editor-header">
        <button class="back-btn" @click="saveAndClose"><i class="fas fa-arrow-left"></i> Назад</button>
        <div class="editor-actions">
          <select class="folder-select" v-model="currentNote.folder"><option value="">Без папки</option><option v-for="f in folders" :key="f" :value="f">{{ f }}</option></select>
          <div class="color-picker"><button v-for="c in colors" :key="c" class="color-dot" :style="{ background: c }" :class="{ active: currentNote.color === c }" @click="currentNote.color = c"></button></div>
          <button class="tool-btn" @click="saveAndClose"><i class="fas fa-save"></i> Сохранить</button>
        </div>
      </div>
      <input class="title-input" v-model="currentNote.title" placeholder="Название заметки..." />
      <div class="tags-input-wrap">
        <i class="fas fa-tags"></i>
        <input class="tags-input" v-model="tagInput" @keydown.enter="addTag" placeholder="Добавить тег (Enter)..." />
        <span v-for="tag in currentNote.tags" :key="tag" class="tag-badge">#{{ tag }} <button class="tag-remove" @click="removeTag(tag)">×</button></span>
      </div>

      <div class="attachments-section" v-if="currentNote.attachments?.length">
        <div class="attachments-label">📎 Прикреплённые файлы ({{ currentNote.attachments.length }})</div>
        <div class="attachments-grid">
          <div v-for="(file, fi) in currentNote.attachments" :key="fi" class="attachment-item">
            <img v-if="isImage(file.url)" :src="file.url" class="attachment-image" @click="openFullscreen(file.url)" />
            <div v-else class="attachment-file">
              <span class="file-icon">{{ getFileIcon(file.type) }}</span>
              <span class="file-name" :title="file.name">{{ file.name }}</span>
              <a :href="file.url" target="_blank" class="file-download"><i class="fas fa-download"></i></a>
            </div>
            <button class="attachment-remove" @click="removeAttachment(fi)">×</button>
          </div>
        </div>
      </div>

      <div class="upload-section">
        <input type="file" ref="fileInput" @change="uploadFile" class="file-input-hidden" accept="image/*,.pdf,.doc,.docx,.mp3,.mp4,.zip" multiple />
        <button class="upload-btn" @click="$refs.fileInput.click()" :disabled="uploading">
          <i class="fas fa-cloud-upload-alt"></i> {{ uploading ? 'Загрузка...' : 'Прикрепить файл' }}
        </button>
      </div>

      <div ref="quillEditor" class="quill-editor-wrapper"></div>

      <div class="editor-footer">
        <span class="auto-save" v-if="saving">💾 Сохраняю...</span>
        <span class="auto-save saved" v-else-if="lastSaved">✅ Сохранено {{ lastSaved }}</span>
        <span class="word-count">{{ wordCount }} слов</span>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="fullscreenImage" class="fullscreen-overlay" @click="fullscreenImage = null">
        <img :src="fullscreenImage" class="fullscreen-image" />
        <button class="fullscreen-close">✕</button>
      </div>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios';
const Quill = window.Quill;

export default {
  name: 'ProfileTabNotes',
  props: { note: { type: String, default: '' } },
  emits: ['update-note'],
  data() {
    return {
      notes: [], editingNote: false,
      currentNote: { id: null, title: '', content: '', tags: [], folder: '', color: '#6366f1', attachments: [] },
      tagInput: '', searchQuery: '', activeFolder: null, showFolders: true,
      saving: false, lastSaved: null, uploading: false,
      colors: ['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4','#84cc16'],
      folderColors: {}, dragNote: null, dragOverFolder: null, fullscreenImage: null,
      quillInstance: null
    };
  },
  computed: {
    folders() { return Object.keys(this.folderColors).sort(); },
    totalFiles() { return this.notes.reduce((sum, n) => sum + (n.attachments?.length || 0), 0); },
    filteredNotes() {
      let list = this.notes;
      if (this.activeFolder) list = list.filter(n => n.folder === this.activeFolder);
      else list = list.filter(n => !n.folder);
      if (this.searchQuery) { const q = this.searchQuery.toLowerCase(); list = list.filter(n => (n.title||'').toLowerCase().includes(q) || (n.content||'').toLowerCase().includes(q) || (n.tags||[]).some(t => t.toLowerCase().includes(q))); }
      return list.sort((a,b) => new Date(b.updated_at||b.created_at) - new Date(a.updated_at||a.created_at));
    },
    wordCount() {
      if (this.quillInstance) return this.quillInstance.getText().trim().split(/\s+/).filter(w => w).length;
      return 0;
    }
  },
  mounted() { this.loadNotes(); if (this.note) this.currentNote.content = this.note; },
  methods: {
    // ==================== ЗАМЕТКИ ====================
    loadNotes() { const s = localStorage.getItem('notebook_notes'); if (s) { try { this.notes = JSON.parse(s); } catch(e) { this.notes = []; } } const c = localStorage.getItem('notebook_colors'); if (c) { try { this.folderColors = JSON.parse(c); } catch(e) {} } },
    saveNotes() { localStorage.setItem('notebook_notes', JSON.stringify(this.notes)); localStorage.setItem('notebook_colors', JSON.stringify(this.folderColors)); },
    addNote() { const n = { id: Date.now(), title: 'Новая заметка', content: '', tags: [], folder: this.activeFolder || '', color: this.colors[Math.floor(Math.random()*this.colors.length)], attachments: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; this.notes.push(n); this.saveNotes(); this.editNote(n); },
    editNote(note) { this.currentNote = { ...note, tags: [...note.tags], attachments: [...(note.attachments||[])] }; this.editingNote = true; this.$nextTick(() => this.initQuill()); },
    deleteNote(id) { if (!confirm('Удалить заметку?')) return; this.notes = this.notes.filter(n => n.id !== id); this.saveNotes(); },

    // ==================== QUILL ====================
    initQuill() {
      if (this.quillInstance) { this.quillInstance.off('text-change'); this.quillInstance = null; }
      if (this.$refs.quillEditor) this.$refs.quillEditor.innerHTML = '';
      this.$nextTick(() => {
        this.quillInstance = new Quill(this.$refs.quillEditor, {
          theme: 'snow',
          modules: { toolbar: [ [{'header':[1,2,3,false]}], ['bold','italic','underline','strike'], [{'color':[]},{'background':[]}], [{'list':'ordered'},{'list':'bullet'},{'list':'check'}], [{'indent':'-1'},{'indent':'+1'}], ['blockquote','code-block'], ['link','image','video'], ['clean'] ] },
          placeholder: 'Пишите здесь...'
        });
        if (this.currentNote.content) this.quillInstance.root.innerHTML = this.currentNote.content;
        this.quillInstance.on('text-change', () => { this.currentNote.content = this.quillInstance.root.innerHTML; this.autoSave(); });
        this.setupQuillDragDrop();
        setTimeout(() => this.setupImageControls(), 300);
      });
    },

    // ==================== DRAG & DROP ====================
    setupQuillDragDrop() {
      if (!this.quillInstance) return;
      const el = this.quillInstance.root;
      el.addEventListener('dragover', e => { e.preventDefault(); el.style.borderColor = '#6366f1'; });
      el.addEventListener('dragleave', () => { el.style.borderColor = ''; });
      el.addEventListener('drop', async e => { e.preventDefault(); el.style.borderColor = ''; for (const f of e.dataTransfer.files) await this.uploadFileToNote(f); });
      el.addEventListener('paste', async e => { for (const item of e.clipboardData?.items||[]) { if (item.type.startsWith('image/')) { e.preventDefault(); await this.uploadFileToNote(item.getAsFile()); } } });
    },

    // ==================== КАРТИНКИ ====================
    setupImageControls() {
      if (!this.quillInstance) return;
      this.quillInstance.root.addEventListener('click', e => {
        if (e.target.tagName === 'IMG') {
          this.quillInstance.root.querySelectorAll('img.selected').forEach(img => { if (img !== e.target) { img.classList.remove('selected'); this.removeDeleteBtn(img); this.removeResize(img); } });
          e.target.classList.add('selected');
          this.addDeleteBtn(e.target);
          this.makeResizable(e.target);
          e.stopPropagation();
        } else {
          this.quillInstance.root.querySelectorAll('img.selected').forEach(img => { img.classList.remove('selected'); this.removeDeleteBtn(img); this.removeResize(img); });
        }
      });
      this.quillInstance.root.querySelectorAll('img').forEach(img => this.makeResizable(img));
    },

    addDeleteBtn(img) {
      if (!img?.parentNode) return;
      this.removeDeleteBtn(img);
      const btn = document.createElement('button'); btn.innerHTML = '×'; btn.className = 'img-delete-btn';
      btn.onclick = (e) => { e.stopPropagation(); this.removeResize(img); img.remove(); this.currentNote.content = this.quillInstance.root.innerHTML; this.autoSave(); };
      (img.parentNode.closest('.img-resize-wrapper') || img.parentNode).appendChild(btn);
    },
    removeDeleteBtn(img) { const btn = (img?.parentNode?.closest('.img-resize-wrapper') || img?.parentNode)?.querySelector('.img-delete-btn'); if (btn) btn.remove(); },

    makeResizable(img) {
      if (!img?.parentNode || !document.body.contains(img) || img._resizeHandler) return;
      this.removeResize(img);
      const wrapper = document.createElement('div'); wrapper.className = 'img-resize-wrapper';
      img.parentNode.insertBefore(wrapper, img); wrapper.appendChild(img);
      const handle = document.createElement('div'); handle.className = 'img-resize-handle'; handle.innerHTML = '◢'; wrapper.appendChild(handle);
      let sx, sy, sw, sh;
      const onDown = (e) => { e.preventDefault(); e.stopPropagation(); sx = e.clientX; sy = e.clientY; sw = img.offsetWidth; sh = img.offsetHeight; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); };
      const onMove = (e) => { let w = sw + (e.clientX - sx); if (w < 50) w = 50; const max = (this.quillInstance?.root?.offsetWidth || 500) - 40; if (w > max) w = max; img.style.width = w + 'px'; img.style.height = 'auto'; };
      const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); if (this.quillInstance) { this.currentNote.content = this.quillInstance.root.innerHTML; this.autoSave(); } };
      handle.addEventListener('mousedown', onDown);
      img._resizeHandler = { handle, onDown, onUp, onMove, wrapper };
    },

    removeResize(img) {
      if (!img?._resizeHandler) return;
      const { handle, wrapper, onDown } = img._resizeHandler;
      if (handle) handle.removeEventListener('mousedown', onDown);
      if (wrapper?.parentNode && img.parentNode === wrapper) { wrapper.parentNode.insertBefore(img, wrapper); wrapper.remove(); }
      delete img._resizeHandler;
    },

    // ==================== ФАЙЛЫ ====================
    async uploadFileToNote(file) {
      if (file.size > 10*1024*1024) { alert('Файл больше 10MB'); return; }
      this.uploading = true;
      try {
        const fd = new FormData(); fd.append('file', file);
        const { data } = await axios.post('/api/notes/upload', fd, { headers: {'Content-Type':'multipart/form-data'} });
        if (!this.currentNote.attachments) this.currentNote.attachments = [];
        this.currentNote.attachments.push({ url: data.url, name: data.name, type: data.type, size: data.size });
        if (data.type.startsWith('image/')) { this.quillInstance.insertEmbed(this.quillInstance.getSelection(true).index, 'image', data.url); this.$nextTick(() => setTimeout(() => { const imgs = this.quillInstance.root.querySelectorAll('img'); if (imgs.length) this.makeResizable(imgs[imgs.length-1]); }, 200)); }
        const idx = this.notes.findIndex(n => n.id === this.currentNote.id);
        if (idx >= 0) { this.currentNote.updated_at = new Date().toISOString(); this.notes[idx] = { ...this.currentNote }; this.saveNotes(); }
      } catch(e) {} finally { this.uploading = false; }
    },
    uploadFile(e) { if (e.target.files[0]) { this.uploadFileToNote(e.target.files[0]); e.target.value = ''; } },
    removeAttachment(i) { this.currentNote.attachments.splice(i, 1); const idx = this.notes.findIndex(n => n.id === this.currentNote.id); if (idx >= 0) { this.currentNote.updated_at = new Date().toISOString(); this.notes[idx] = { ...this.currentNote }; this.saveNotes(); } },

    // ==================== СОХРАНЕНИЕ ====================
    async saveAndClose() {
      this.saving = true;
      if (this.quillInstance) { this.quillInstance.root.querySelectorAll('img.selected').forEach(img => { img.classList.remove('selected'); this.removeDeleteBtn(img); }); this.currentNote.content = this.quillInstance.root.innerHTML; }
      const idx = this.notes.findIndex(n => n.id === this.currentNote.id);
      if (idx >= 0) { this.currentNote.updated_at = new Date().toISOString(); this.notes[idx] = { ...this.currentNote }; }
      this.saveNotes();
      try { await axios.put('/api/notes', { note: this.currentNote.content, attachments: this.currentNote.attachments }); } catch(e) {}
      this.lastSaved = `в ${new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}`;
      this.editingNote = false; this.saving = false; this.quillInstance = null;
    },
    autoSave() { clearTimeout(this._t); this._t = setTimeout(async () => { if (this.quillInstance) this.currentNote.content = this.quillInstance.root.innerHTML; const idx = this.notes.findIndex(n => n.id === this.currentNote.id); if (idx >= 0) { this.currentNote.updated_at = new Date().toISOString(); this.notes[idx] = { ...this.currentNote }; this.saveNotes(); } try { await axios.put('/api/notes', { note: this.currentNote.content, attachments: this.currentNote.attachments }); } catch(e) {} }, 2000); },

    // ==================== ТЕГИ / ПАПКИ ====================
    addTag() { const t = this.tagInput.trim().toLowerCase().replace(/\s+/g,'_'); if (t && !this.currentNote.tags.includes(t)) this.currentNote.tags.push(t); this.tagInput = ''; },
    removeTag(t) { this.currentNote.tags = this.currentNote.tags.filter(x => x !== t); },
    addFolder() { const n = prompt('Название папки:'); if (n?.trim()) { this.folderColors[n.trim()] = this.colors[Math.floor(Math.random()*this.colors.length)]; this.saveNotes(); this.$forceUpdate(); } },
    deleteFolder(f) { if (!confirm(`Удалить "${f}"?`)) return; this.notes.forEach(n => { if (n.folder === f) n.folder = ''; }); delete this.folderColors[f]; if (this.activeFolder === f) this.activeFolder = null; this.saveNotes(); },
    dropToFolder(f) { if (this.dragNote) { this.dragNote.folder = f; this.saveNotes(); } this.dragNote = null; this.dragOverFolder = null; },
    getFolderCount(f) { return this.notes.filter(n => n.folder === f).length; },

    // ==================== УТИЛИТЫ ====================
    getPreview(c) { const t = c ? c.replace(/<[^>]*>/g,'') : ''; return t ? t.substring(0,100) + (t.length>100?'...':'') : 'Пустая заметка'; },
    exportNotes() { const t = this.notes.map(n => `# ${n.title}\n${n.folder?`📁 ${n.folder}\n`:''}${n.tags.length?n.tags.map(t=>'#'+t).join(' ')+'\n':''}\n${n.content.replace(/<[^>]*>/g,'')}\n---`).join('\n\n'); const b = new Blob([t]); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'заметки.txt'; a.click(); URL.revokeObjectURL(u); },
    formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''; },
    isImage(u) { return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(u); },
    getFileIcon(t) { if (/image/.test(t)) return '🖼️'; if (/video/.test(t)) return '🎬'; if (/audio/.test(t)) return '🎵'; if (/pdf/.test(t)) return '📄'; if (/zip/.test(t)) return '📦'; return '📎'; },
    openFullscreen(u) { this.fullscreenImage = u; }
  },
  beforeUnmount() { clearTimeout(this._t); if (this.quillInstance) { this.quillInstance.root.querySelectorAll('img').forEach(img => { this.removeDeleteBtn(img); this.removeResize(img); }); this.quillInstance.off('text-change'); } }
};
</script>

<style scoped>
.notebook-app { display: flex; flex-direction: column; gap: 16px; color: #e2e8f0; }
.nb-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.nb-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; }
.nb-stats { display: flex; gap: 14px; flex-wrap: wrap; }
.nb-stat { font-size: 0.8rem; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
.nb-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tool-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.04); color: #cbd5e1; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.2s; font-family: inherit; }
.tool-btn:hover, .tool-btn.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #fff; }
.search-wrap { flex: 1; min-width: 150px; position: relative; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.8rem; }
.search-input { width: 100%; padding: 8px 14px 8px 34px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.04); color: #fff; font-size: 0.82rem; outline: none; font-family: inherit; }
.search-input:focus { border-color: #6366f1; }
.folders-panel { display: flex; gap: 6px; flex-wrap: wrap; }
.folder-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; font-size: 0.78rem; transition: all 0.2s; font-family: inherit; position: relative; }
.folder-btn:hover, .folder-btn.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #fff; }
.folder-btn.drag-over { background: rgba(16,185,129,0.2); border-color: rgba(16,185,129,0.5); color: #10b981; transform: scale(1.05); }
.folder-count { padding: 1px 6px; background: rgba(255,255,255,0.08); border-radius: 6px; font-size: 0.7rem; }
.folder-delete { margin-left: auto; padding: 2px 6px; border-radius: 4px; color: #ef4444; cursor: pointer; opacity: 0; transition: opacity 0.2s; font-size: 0.7rem; }
.folder-btn:hover .folder-delete { opacity: 0.7; }
.notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
@media (max-width: 640px) { .notes-grid { grid-template-columns: 1fr; } }
.note-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px; cursor: grab; transition: all 0.25s; border-left: 4px solid #6366f1; position: relative; }
.note-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
.note-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
.note-card-header h4 { color: #fff; font-size: 0.9rem; margin: 0; font-weight: 600; }
.note-date { font-size: 0.65rem; color: #64748b; flex-shrink: 0; }
.note-preview { color: #94a3b8; font-size: 0.8rem; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.note-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.note-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.note-tag { font-size: 0.65rem; color: #818cf8; background: rgba(99,102,241,0.1); padding: 2px 6px; border-radius: 4px; }
.note-meta-right { display: flex; gap: 8px; align-items: center; }
.note-attachments { font-size: 0.65rem; color: #94a3b8; }
.note-folder { font-size: 0.7rem; color: #64748b; display: flex; align-items: center; gap: 4px; }
.note-delete { position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ef4444; cursor: pointer; opacity: 0; transition: opacity 0.2s; font-size: 0.8rem; }
.note-card:hover .note-delete { opacity: 0.7; }
.empty-notes { text-align: center; padding: 60px 20px; grid-column: 1 / -1; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-notes p { color: #94a3b8; margin-bottom: 16px; }
.note-editor { display: flex; flex-direction: column; gap: 14px; }
.editor-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.back-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.04); color: #cbd5e1; cursor: pointer; font-size: 0.85rem; font-family: inherit; }
.editor-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.folder-select { padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.04); color: #fff; font-size: 0.8rem; cursor: pointer; font-family: inherit; }
.color-picker { display: flex; gap: 4px; }
.color-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.color-dot.active { border-color: #fff; transform: scale(1.2); }
.title-input { padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.04); color: #fff; font-size: 1.1rem; font-weight: 600; outline: none; font-family: 'Space Grotesk', sans-serif; }
.title-input:focus { border-color: #6366f1; }
.tags-input-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tags-input { flex: 1; min-width: 120px; padding: 6px 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.8rem; outline: none; font-family: inherit; }
.tag-badge { display: flex; align-items: center; gap: 4px; padding: 3px 8px; background: rgba(99,102,241,0.15); color: #818cf8; border-radius: 6px; font-size: 0.75rem; }
.tag-remove { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; padding: 0; }
.attachments-section { margin-bottom: 4px; }
.attachments-label { font-size: 0.75rem; color: #94a3b8; margin-bottom: 6px; font-weight: 600; }
.attachments-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.attachment-item { position: relative; display: inline-flex; }
.attachment-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); }
.attachment-file { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; font-size: 0.75rem; max-width: 250px; }
.file-icon { font-size: 1.2rem; }
.file-name { color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
.file-download { color: #818cf8; text-decoration: none; }
.attachment-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; color: #fff; border: none; cursor: pointer; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
.attachment-item:hover .attachment-remove { opacity: 1; }
.file-input-hidden { display: none; }
.upload-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px dashed rgba(255,255,255,0.2); border-radius: 10px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.2s; font-family: inherit; width: 100%; justify-content: center; }
.upload-btn:hover { border-color: #6366f1; color: #fff; background: rgba(99,102,241,0.08); }
.upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.quill-editor-wrapper { border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
.quill-editor-wrapper :deep(.ql-toolbar) { border: none; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); }
.quill-editor-wrapper :deep(.ql-container) { border: none; font-family: 'Inter', sans-serif; font-size: 0.9rem; color: #e2e8f0; min-height: 300px; }
.quill-editor-wrapper :deep(.ql-editor) { padding: 14px; line-height: 1.7; min-height: 300px; }
.quill-editor-wrapper :deep(.ql-editor.ql-blank::before) { color: #64748b; font-style: normal; }
:deep(.img-delete-btn) { position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; border-radius: 50%; background: #ef4444; color: #fff; border: 2px solid #1e1e1e; cursor: pointer; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; z-index: 100; transition: all 0.2s; line-height: 1; padding: 0; }
:deep(.img-delete-btn:hover) { background: #dc2626; transform: scale(1.15); }
:deep(.img-resize-wrapper) { display: inline-block; position: relative; max-width: 100%; }
:deep(.img-resize-wrapper img) { display: block; max-width: 100%; height: auto; cursor: pointer; border-radius: 8px; border: 2px solid transparent; transition: border-color 0.2s; }
:deep(.img-resize-wrapper img.selected) { border-color: #6366f1; box-shadow: 0 0 15px rgba(99,102,241,0.3); }
:deep(.img-resize-handle) { position: absolute; bottom: 4px; right: 4px; width: 16px; height: 16px; background: #6366f1; color: #fff; font-size: 10px; border-radius: 4px; cursor: nwse-resize; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; z-index: 50; }
:deep(.img-resize-wrapper:hover .img-resize-handle), :deep(.img-resize-wrapper img.selected ~ .img-resize-handle) { opacity: 1; }
.editor-footer { display: flex; justify-content: space-between; align-items: center; }
.auto-save { font-size: 0.75rem; color: #94a3b8; }
.auto-save.saved { color: #10b981; }
.word-count { font-size: 0.75rem; color: #64748b; }
.fullscreen-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.fullscreen-image { max-width: 95%; max-height: 95%; border-radius: 12px; }
.fullscreen-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border: none; color: #fff; font-size: 2rem; cursor: pointer; padding: 10px 16px; border-radius: 50%; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
