<template>
  <div class="notebook-app fade-in">
    <!-- Заголовок -->
    <div class="nb-header">
      <h2>📝 Блокнот</h2>
      <div class="nb-stats">
        <span class="nb-stat"><i class="fas fa-file-alt"></i> {{ notes.length }} заметок</span>
        <span class="nb-stat"><i class="fas fa-folder"></i> {{ folders.length }} папок</span>
        <span class="nb-stat" v-if="lastSaved"><i class="fas fa-check-circle"></i> Сохранено {{ lastSaved }}</span>
      </div>
    </div>

    <!-- Панель инструментов -->
    <div class="nb-toolbar">
      <button class="tool-btn" @click="addNote" title="Новая заметка">
        <i class="fas fa-plus"></i> Новая
      </button>
      <button class="tool-btn" @click="showFolders = !showFolders" :class="{ active: showFolders }">
        <i class="fas fa-folder"></i> Папки
      </button>
      <div class="search-wrap">
        <i class="fas fa-search search-icon"></i>
        <input class="search-input" v-model="searchQuery" placeholder="Поиск по заметкам..." />
      </div>
      <button class="tool-btn" @click="exportNotes" title="Экспорт">
        <i class="fas fa-download"></i>
      </button>
    </div>

    <!-- Панель папок -->
    <div class="folders-panel" v-if="showFolders">
      <button 
        v-for="folder in folders" :key="folder"
        class="folder-btn" :class="{ active: activeFolder === folder }"
        @click="activeFolder = activeFolder === folder ? null : folder"
      >
        <i class="fas fa-folder" :style="{ color: folderColors[folder] || '#94a3b8' }"></i>
        {{ folder }}
        <span class="folder-count">{{ getFolderCount(folder) }}</span>
      </button>
      <button class="folder-btn add-folder" @click="addFolder">
        <i class="fas fa-plus"></i> Новая папка
      </button>
    </div>

    <!-- Сетка заметок -->
    <div class="notes-grid" v-if="!editingNote">
      <div v-for="note in filteredNotes" :key="note.id" 
        class="note-card" :style="{ borderLeftColor: note.color || '#6366f1' }"
        @click="editNote(note)">
        <div class="note-card-header">
          <h4>{{ note.title || 'Без названия' }}</h4>
          <span class="note-date">{{ formatDate(note.updated_at || note.created_at) }}</span>
        </div>
        <p class="note-preview">{{ getPreview(note.content) }}</p>
        <div class="note-card-footer">
          <div class="note-tags">
            <span v-for="tag in note.tags" :key="tag" class="note-tag">#{{ tag }}</span>
          </div>
          <span class="note-folder" v-if="note.folder">
            <i class="fas fa-folder"></i> {{ note.folder }}
          </span>
        </div>
        <button class="note-delete" @click.stop="deleteNote(note.id)" title="Удалить">
          <i class="fas fa-trash"></i>
        </button>
      </div>

      <div v-if="!filteredNotes.length" class="empty-notes">
        <div class="empty-icon">📝</div>
        <p>{{ searchQuery ? 'Ничего не найдено' : 'Нет заметок. Создайте первую!' }}</p>
        <button class="btn btn-p" @click="addNote" v-if="!searchQuery">+ Новая заметка</button>
      </div>
    </div>

    <!-- Редактор заметки -->
    <div class="note-editor" v-else>
      <div class="editor-header">
        <button class="back-btn" @click="saveAndClose">
          <i class="fas fa-arrow-left"></i> Назад
        </button>
        <div class="editor-actions">
          <select class="folder-select" v-model="currentNote.folder">
            <option value="">Без папки</option>
            <option v-for="f in folders" :key="f" :value="f">{{ f }}</option>
          </select>
          <div class="color-picker">
            <button v-for="c in colors" :key="c" class="color-dot" :style="{ background: c }"
              :class="{ active: currentNote.color === c }" @click="currentNote.color = c"></button>
          </div>
          <button class="tool-btn" @click="saveAndClose">
            <i class="fas fa-save"></i> Сохранить
          </button>
        </div>
      </div>

      <input class="title-input" v-model="currentNote.title" placeholder="Название заметки..." />
      
      <div class="tags-input-wrap">
        <i class="fas fa-tags"></i>
        <input class="tags-input" v-model="tagInput" @keydown.enter="addTag" placeholder="Добавить тег (Enter)..." />
        <span v-for="tag in currentNote.tags" :key="tag" class="tag-badge">
          #{{ tag }} <button class="tag-remove" @click="removeTag(tag)">×</button>
        </span>
      </div>

      <textarea 
        class="editor-textarea" 
        v-model="currentNote.content" 
        placeholder="Пишите здесь... Поддерживается Markdown: **жирный**, *курсив*, - списки"
        rows="15"
        @keydown.tab="insertTab"
      ></textarea>

      <div class="editor-footer">
        <span class="auto-save" v-if="saving">💾 Сохраняю...</span>
        <span class="auto-save saved" v-else-if="lastSaved">✅ Сохранено {{ lastSaved }}</span>
        <span class="word-count">{{ wordCount }} слов</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabNotes',
  props: {
    note: { type: String, default: '' }
  },
  emits: ['update-note'],
  data() {
    return {
      notes: [],
      editingNote: false,
      currentNote: { id: null, title: '', content: '', tags: [], folder: '', color: '#6366f1' },
      tagInput: '',
      searchQuery: '',
      activeFolder: null,
      showFolders: false,
      saving: false,
      lastSaved: null,
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'],
      folderColors: {}
    };
  },
  computed: {
    folders() {
      const f = new Set();
      this.notes.forEach(n => { if (n.folder) f.add(n.folder); });
      return [...f].sort();
    },
    filteredNotes() {
      let list = this.notes;
      if (this.activeFolder) list = list.filter(n => n.folder === this.activeFolder);
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(n => 
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q) ||
          (n.tags || []).some(t => t.toLowerCase().includes(q))
        );
      }
      return list.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    },
    wordCount() {
      return this.currentNote.content ? this.currentNote.content.trim().split(/\s+/).filter(w => w).length : 0;
    }
  },
  watch: {
    'currentNote.content': function() {
      this.autoSave();
    },
    'currentNote.title': function() {
      this.autoSave();
    }
  },
  mounted() {
    this.loadNotes();
    // Загружаем старую заметку если есть
    if (this.note) {
      this.currentNote.content = this.note;
    }
  },
  methods: {
    loadNotes() {
      const saved = localStorage.getItem('notebook_notes');
      if (saved) {
        try {
          this.notes = JSON.parse(saved);
        } catch(e) {
          this.notes = [];
        }
      }
      const colors = localStorage.getItem('notebook_colors');
      if (colors) {
        try { this.folderColors = JSON.parse(colors); } catch(e) {}
      }
    },

    saveNotes() {
      localStorage.setItem('notebook_notes', JSON.stringify(this.notes));
      localStorage.setItem('notebook_colors', JSON.stringify(this.folderColors));
    },

    addNote() {
      const note = {
        id: Date.now(),
        title: 'Новая заметка',
        content: '',
        tags: [],
        folder: this.activeFolder || '',
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.notes.push(note);
      this.saveNotes();
      this.editNote(note);
    },

    editNote(note) {
      this.currentNote = { ...note, tags: [...note.tags] };
      this.editingNote = true;
    },

    async saveAndClose() {
      this.saving = true;
      
      // Сохраняем в localStorage
      const idx = this.notes.findIndex(n => n.id === this.currentNote.id);
      if (idx >= 0) {
        this.currentNote.updated_at = new Date().toISOString();
        this.notes[idx] = { ...this.currentNote };
      }
      this.saveNotes();

      // Отправляем на сервер (автосохранение)
      try {
        const axios = (await import('axios')).default;
        await axios.put('/api/notes', { note: this.currentNote.content });
      } catch(e) {}

      const now = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
      this.lastSaved = `в ${now}`;
      this.editingNote = false;
      this.saving = false;
    },

    autoSave() {
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(async () => {
        const idx = this.notes.findIndex(n => n.id === this.currentNote.id);
        if (idx >= 0) {
          this.currentNote.updated_at = new Date().toISOString();
          this.notes[idx] = { ...this.currentNote };
          this.saveNotes();
        }
        try {
          const axios = (await import('axios')).default;
          await axios.put('/api/notes', { note: this.currentNote.content });
          const now = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
          this.lastSaved = `в ${now}`;
        } catch(e) {}
      }, 2000);
    },

    deleteNote(id) {
      if (!confirm('Удалить заметку?')) return;
      this.notes = this.notes.filter(n => n.id !== id);
      this.saveNotes();
    },

    addTag() {
      const tag = this.tagInput.trim().toLowerCase().replace(/\s+/g, '_');
      if (tag && !this.currentNote.tags.includes(tag)) {
        this.currentNote.tags.push(tag);
      }
      this.tagInput = '';
    },

    removeTag(tag) {
      this.currentNote.tags = this.currentNote.tags.filter(t => t !== tag);
    },

    addFolder() {
      const name = prompt('Название папки:');
      if (name) {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];
        this.folderColors[name] = colors[Math.floor(Math.random() * colors.length)];
        this.saveNotes();
      }
    },

    getFolderCount(folder) {
      return this.notes.filter(n => n.folder === folder).length;
    },

    getPreview(content) {
      if (!content) return 'Пустая заметка';
      return content.substring(0, 100) + (content.length > 100 ? '...' : '');
    },

    insertTab(e) {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      this.currentNote.content = this.currentNote.content.substring(0, start) + '  ' + this.currentNote.content.substring(end);
      this.$nextTick(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      });
    },

    exportNotes() {
      const text = this.notes.map(n => 
        `# ${n.title}\n${n.folder ? `📁 ${n.folder}\n` : ''}${n.tags.length ? n.tags.map(t => '#'+t).join(' ') + '\n' : ''}\n${n.content}\n---`
      ).join('\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'заметки.txt'; a.click();
      URL.revokeObjectURL(url);
    },

    formatDate(ts) {
      if (!ts) return '';
      return new Date(ts).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  },
  beforeUnmount() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
  }
};
</script>

<style scoped>
.notebook-app { display: flex; flex-direction: column; gap: 16px; color: #e2e8f0; }

/* Заголовок */
.nb-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.nb-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; }
.nb-stats { display: flex; gap: 14px; flex-wrap: wrap; }
.nb-stat { font-size: 0.8rem; color: #94a3b8; display: flex; align-items: center; gap: 4px; }

/* Туулбар */
.nb-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tool-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  background: rgba(255,255,255,0.04); color: #cbd5e1; cursor: pointer;
  font-size: 0.8rem; font-weight: 500; transition: all 0.2s; font-family: inherit;
}
.tool-btn:hover, .tool-btn.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #fff; }
.tool-btn i { font-size: 0.85rem; }

.search-wrap { flex: 1; min-width: 150px; position: relative; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 0.8rem; }
.search-input { width: 100%; padding: 8px 14px 8px 34px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.04); color: #fff; font-size: 0.82rem; outline: none; font-family: inherit; }
.search-input:focus { border-color: #6366f1; }

/* Папки */
.folders-panel { display: flex; gap: 6px; flex-wrap: wrap; }
.folder-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer;
  font-size: 0.78rem; transition: all 0.2s; font-family: inherit;
}
.folder-btn:hover, .folder-btn.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #fff; }
.folder-count { padding: 1px 6px; background: rgba(255,255,255,0.08); border-radius: 6px; font-size: 0.7rem; }

/* Сетка */
.notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
@media (max-width: 640px) { .notes-grid { grid-template-columns: 1fr; } }

.note-card {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 18px; cursor: pointer; transition: all 0.25s;
  border-left: 4px solid #6366f1; position: relative;
}
.note-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
.note-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
.note-card-header h4 { color: #fff; font-size: 0.9rem; margin: 0; font-weight: 600; }
.note-date { font-size: 0.65rem; color: #64748b; flex-shrink: 0; }
.note-preview { color: #94a3b8; font-size: 0.8rem; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.note-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.note-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.note-tag { font-size: 0.65rem; color: #818cf8; background: rgba(99,102,241,0.1); padding: 2px 6px; border-radius: 4px; }
.note-folder { font-size: 0.7rem; color: #64748b; display: flex; align-items: center; gap: 4px; }
.note-delete { position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ef4444; cursor: pointer; opacity: 0; transition: opacity 0.2s; font-size: 0.8rem; }
.note-card:hover .note-delete { opacity: 0.7; }
.note-delete:hover { opacity: 1; }

/* Пусто */
.empty-notes { text-align: center; padding: 60px 20px; grid-column: 1 / -1; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-notes p { color: #94a3b8; margin-bottom: 16px; }

/* Редактор */
.note-editor { display: flex; flex-direction: column; gap: 14px; }
.editor-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.back-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  background: rgba(255,255,255,0.04); color: #cbd5e1; cursor: pointer; font-size: 0.85rem; font-family: inherit;
}
.back-btn:hover { background: rgba(255,255,255,0.08); }
.editor-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.folder-select {
  padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  background: rgba(255,255,255,0.04); color: #fff; font-size: 0.8rem; cursor: pointer; font-family: inherit;
}

.color-picker { display: flex; gap: 4px; }
.color-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
.color-dot.active { border-color: #fff; transform: scale(1.2); }

.title-input {
  padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
  background: rgba(255,255,255,0.04); color: #fff; font-size: 1.1rem; font-weight: 600;
  outline: none; font-family: 'Space Grotesk', sans-serif;
}
.title-input:focus { border-color: #6366f1; }

.tags-input-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tags-input-wrap i { color: #64748b; font-size: 0.8rem; }
.tags-input { flex: 1; min-width: 120px; padding: 6px 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; background: rgba(255,255,255,0.03); color: #fff; font-size: 0.8rem; outline: none; font-family: inherit; }
.tag-badge { display: flex; align-items: center; gap: 4px; padding: 3px 8px; background: rgba(99,102,241,0.15); color: #818cf8; border-radius: 6px; font-size: 0.75rem; }
.tag-remove { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; padding: 0; }

.editor-textarea {
  width: 100%; padding: 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
  background: rgba(255,255,255,0.04); color: #fff; font-size: 0.9rem; line-height: 1.7;
  outline: none; resize: vertical; min-height: 200px; font-family: 'Inter', sans-serif;
}
.editor-textarea:focus { border-color: #6366f1; }

.editor-footer { display: flex; justify-content: space-between; align-items: center; }
.auto-save { font-size: 0.75rem; color: #94a3b8; }
.auto-save.saved { color: #10b981; }
.word-count { font-size: 0.75rem; color: #64748b; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }

.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
