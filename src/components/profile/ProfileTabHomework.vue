<template>
  <div class="card fade-in">
    <h3>📋 Создать задание</h3>

    <!-- Поиск ученика -->
    <div class="form-group">
      <label class="form-label">Ученик</label>
      <div class="student-search">
        <input
          class="input"
          v-model="studentSearch"
          @input="searchStudents"
          placeholder="🔍 Поиск ученика..."
        />
        <div class="search-dropdown" v-if="studentResults.length && !selectedStudent">
          <div
            v-for="s in studentResults"
            :key="s.id"
            class="search-item"
            @click="selectStudent(s)"
          >
            <AppAvatar :src="s.avatar_url" :name="s.username" :size="32" />
            <span>{{ s.username }}</span>
          </div>
        </div>
      </div>
      <div v-if="selectedStudent" class="selected-student">
        <AppAvatar :src="selectedStudent.avatar_url" :name="selectedStudent.username" :size="32" />
        <span>{{ selectedStudent.username }}</span>
        <button class="remove-student" @click="selectedStudent = null; studentSearch = ''">✕</button>
      </div>
    </div>

    <!-- Тип задания -->
    <div class="form-group">
      <label class="form-label">Тип задания</label>
      <div class="type-selector">
        <button v-for="t in types" :key="t.value" 
          class="type-btn" :class="{ active: hwType === t.value }"
          @click="hwType = t.value">
          <span class="type-icon">{{ t.icon }}</span>
          <span class="type-label">{{ t.label }}</span>
        </button>
      </div>
    </div>

    <!-- Название -->
    <div class="form-group">
      <label class="form-label">Название</label>
      <input class="input" v-model="hwTitle" placeholder="Например: Прочитать текст и ответить на вопросы">
    </div>

    <!-- Описание -->
    <div class="form-group">
      <label class="form-label">Описание</label>
      <textarea class="input note-area" v-model="hwDesc" rows="3" placeholder="Подробное описание задания..."></textarea>
    </div>

    <!-- Прикрепить медиа -->
    <div class="form-group">
      <label class="form-label">📎 Прикрепить файлы</label>
      <div class="file-upload-area" @click="$refs.fileInput.click()">
        <input
          type="file"
          ref="fileInput"
          @change="onFileSelected"
          class="file-input-hidden"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.mp4,.webm,.doc,.docx"
        />
        <div class="upload-placeholder" v-if="!selectedFile">
          <i class="fas fa-cloud-upload-alt"></i>
          <span>Нажмите, чтобы выбрать файл</span>
          <small>PDF, JPG, PNG, MP3, MP4, DOC до 10MB</small>
        </div>
        <div v-else class="file-preview">
          <span class="file-icon">{{ fileIcon }}</span>
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
          <button class="remove-file" @click.stop="selectedFile = null">✕</button>
        </div>
      </div>
    </div>

    <!-- Дедлайн + Оценка -->
    <div class="form-row">
      <div class="form-group" style="flex:1">
        <label class="form-label">📅 Дедлайн</label>
        <input class="input" v-model="hwDueDate" type="date">
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label">⭐ Макс. оценка</label>
        <select class="input" v-model="hwMaxGrade">
          <option :value="5">5</option>
          <option :value="10" selected>10</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <!-- Опыт -->
    <div class="form-group">
      <label class="form-label">🎯 Опыт за выполнение</label>
      <select class="input" v-model="hwExperience">
        <option :value="10">10 XP (лёгкое)</option>
        <option :value="50" selected>50 XP (среднее)</option>
        <option :value="100">100 XP (сложное)</option>
        <option :value="200">200 XP (очень сложное)</option>
      </select>
      <small class="form-hint">⚠️ При просрочке дедлайна ученик получит только 50% XP</small>
    </div>

    <!-- Кнопка -->
    <button class="btn btn-p w-100" @click="createHomework" :disabled="!selectedStudent || !hwTitle || loading">
      {{ loading ? '⏳ Создание...' : '✅ Создать задание' }}
    </button>
  </div>
</template>

<script>
import axios from 'axios';
import AppAvatar from '../AppAvatar.vue';

export default {
  name: 'ProfileTabHomework',
  components: { AppAvatar },
  props: {
    students: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  emits: ['create-homework'],
  data() {
    return { 
      studentSearch: '',
      selectedStudent: null,
      studentResults: [],
      hwTitle: '', hwDesc: '', hwDueDate: '',
      hwType: 'homework', hwMaxGrade: 10, hwExperience: 50,
      selectedFile: null
    };
  },
  computed: {
    types() {
      return [
        { value: 'homework', icon: '📝', label: 'Домашка' },
        { value: 'test', icon: '🎯', label: 'Тест' },
        { value: 'essay', icon: '📄', label: 'Эссе' },
        { value: 'audio', icon: '🎤', label: 'Аудио' }
      ];
    },
    fileIcon() {
      const name = this.selectedFile?.name || '';
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return '🖼️';
      if (/\.(mp3|wav|ogg)$/i.test(name)) return '🎵';
      if (/\.(mp4|webm)$/i.test(name)) return '🎬';
      if (/\.pdf$/i.test(name)) return '📄';
      return '📎';
    }
  },
  methods: {
    async searchStudents() {
      if (this.studentSearch.length < 2) { this.studentResults = []; return; }
      try {
        const r = await axios.get(`/api/users?q=${this.studentSearch}`);
        this.studentResults = (r.data || []).filter(u => 
          u.role !== 'admin' && u.role !== 'host' && u.role !== 'parent'
        );
      } catch(e) { this.studentResults = []; }
    },
    selectStudent(s) {
      this.selectedStudent = s;
      this.studentSearch = s.username;
      this.studentResults = [];
    },
    onFileSelected(e) {
      this.selectedFile = e.target.files[0] || null;
    },
    formatSize(bytes) {
      if (!bytes) return '';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },
    async createHomework() {
      if (!this.selectedStudent || !this.hwTitle) return;

      const formData = new FormData();
      formData.append('student_id', this.selectedStudent.id);
      formData.append('title', this.hwTitle);
      formData.append('description', this.hwDesc);
      formData.append('due_date', this.hwDueDate);
      formData.append('type', this.hwType);
      formData.append('max_grade', this.hwMaxGrade);
      formData.append('experience', this.hwExperience);
      
      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
      }

      this.$emit('create-homework', formData);
      
      // Сброс
      this.selectedStudent = null; this.studentSearch = '';
      this.hwTitle = ''; this.hwDesc = ''; this.hwDueDate = '';
      this.hwType = 'homework'; this.hwMaxGrade = 10; this.hwExperience = 50;
      this.selectedFile = null;
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 20px; color: #fff; font-family: 'Space Grotesk', sans-serif; }

.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; margin-bottom: 6px; }
.form-row { display: flex; gap: 12px; }
.form-hint { display: block; font-size: 0.7rem; color: #f59e0b; margin-top: 4px; }

.input { padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-family: inherit; font-size: 0.85rem; background: rgba(255,255,255,0.05); color: #fff; outline: none; width: 100%; }
.input:focus { border-color: #6366f1; }
select.input { cursor: pointer; }
.note-area { resize: vertical; min-height: 80px; }

/* Поиск ученика */
.student-search { position: relative; }
.search-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 100; max-height: 200px; overflow-y: auto; background: rgba(15,15,30,0.98); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-top: 4px; }
.search-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; color: #cbd5e1; transition: background 0.2s; }
.search-item:hover { background: rgba(99,102,241,0.15); }
.selected-student { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(99,102,241,0.15); border-radius: 10px; margin-top: 8px; color: #fff; }
.remove-student { margin-left: auto; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; }

/* Типы */
.type-selector { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.type-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.type-btn:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.05); }
.type-btn.active { border-color: #6366f1; background: rgba(99,102,241,0.15); color: #fff; }
.type-icon { font-size: 1.3rem; }
.type-label { font-size: 0.7rem; font-weight: 500; }

/* Загрузка файла */
.file-upload-area { border: 2px dashed rgba(255,255,255,0.15); border-radius: 14px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s; }
.file-upload-area:hover { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.05); }
.file-input-hidden { display: none; }
.upload-placeholder { color: #94a3b8; }
.upload-placeholder i { font-size: 1.5rem; display: block; margin-bottom: 8px; }
.upload-placeholder span { display: block; font-size: 0.85rem; }
.upload-placeholder small { display: block; font-size: 0.7rem; color: #64748b; margin-top: 4px; }
.file-preview { display: flex; align-items: center; gap: 10px; color: #cbd5e1; }
.file-icon { font-size: 1.5rem; }
.file-name { flex: 1; font-size: 0.85rem; text-align: left; }
.file-size { font-size: 0.75rem; color: #94a3b8; }
.remove-file { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.w-100 { width: 100%; justify-content: center; }

@media (max-width: 500px) { .type-selector { grid-template-columns: repeat(2, 1fr); } .form-row { flex-direction: column; gap: 0; } }
</style>
