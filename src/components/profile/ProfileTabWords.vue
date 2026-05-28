<template>
  <div class="dictionary-app fade-in">
    <!-- ХЕДЕР СО СТАТИСТИКОЙ -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-value">{{ words.length }}</div>
        <div class="stat-label">Всего слов</div>
      </div>
      <div class="stat-card learned">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{ learnedCount }}</div>
        <div class="stat-label">Выучено</div>
      </div>
      <div class="stat-card studying">
        <div class="stat-icon">📖</div>
        <div class="stat-value">{{ studyingCount }}</div>
        <div class="stat-label">Изучается</div>
      </div>
      <div class="stat-card new-words">
        <div class="stat-icon">🆕</div>
        <div class="stat-value">{{ newCount }}</div>
        <div class="stat-label">Новых</div>
      </div>
    </div>

    <!-- ПРОГРЕСС-БАР -->
    <div class="progress-section">
      <div class="progress-header">
        <span>Прогресс изучения</span>
        <span>{{ progressPercent }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- КНОПКИ ДЕЙСТВИЙ -->
    <div class="actions-row">
      <button class="btn btn-p btn-sm" @click="showAddForm = !showAddForm">
        {{ showAddForm ? '✕ Закрыть' : '➕ Добавить слово' }}
      </button>
      <button class="btn btn-o btn-sm" @click="startReview" :disabled="!reviewCount">
        🔄 Повторить ({{ reviewCount }})
      </button>
      <button class="btn btn-o btn-sm" @click="startQuiz" :disabled="!words.length">
        🎯 Тест
      </button>
    </div>

    <!-- ФОРМА ДОБАВЛЕНИЯ (расширенная) -->
    <transition name="slide-fade">
      <div v-if="showAddForm" class="add-form">
        <div class="form-row">
          <input class="input" v-model="wordEn" placeholder="Слово на английском" @keyup.enter="addWord" :disabled="loading" />
          <input class="input" v-model="wordRu" placeholder="Перевод" @keyup.enter="addWord" :disabled="loading" />
        </div>
        <div class="form-row">
          <input class="input" v-model="wordTranscription" placeholder="Транскрипция (необязательно)" />
          <select class="input" v-model="wordPartOfSpeech">
            <option value="">Часть речи</option>
            <option value="noun">Существительное</option>
            <option value="verb">Глагол</option>
            <option value="adjective">Прилагательное</option>
            <option value="adverb">Наречие</option>
            <option value="phrase">Фраза</option>
          </select>
        </div>
        <div class="form-row">
          <input class="input" v-model="wordCategory" placeholder="Категория (еда, путешествия...)" />
        </div>
        <div class="form-row">
          <input class="input" v-model="wordExample" placeholder="Пример использования" />
        </div>
        <button class="btn btn-p btn-sm w-100" @click="addWord" :disabled="!wordEn || !wordRu || loading">
          {{ loading ? 'Добавляю...' : '✅ Добавить' }}
        </button>
      </div>
    </transition>

    <!-- ВКЛАДКИ: Список / Карточки / Тест -->
    <div class="tabs">
      <button class="tab" :class="{ active: currentTab === 'list' }" @click="currentTab = 'list'">📋 Список</button>
      <button class="tab" :class="{ active: currentTab === 'flashcards' }" @click="startFlashcards" :disabled="!words.length">🃏 Карточки</button>
      <button class="tab" :class="{ active: currentTab === 'quiz' }" @click="startQuiz" :disabled="!words.length">🎯 Тест</button>
    </div>

    <!-- СПИСОК СЛОВ -->
    <div v-if="currentTab === 'list' && !loading">
      <!-- Фильтры -->
      <div class="filter-row">
        <button class="filter-btn" :class="{ active: filterStatus === 'all' }" @click="filterStatus = 'all'">Все</button>
        <button class="filter-btn" :class="{ active: filterStatus === 'new' }" @click="filterStatus = 'new'">🆕 Новые</button>
        <button class="filter-btn" :class="{ active: filterStatus === 'studying' }" @click="filterStatus = 'studying'">📖 Изучаю</button>
        <button class="filter-btn" :class="{ active: filterStatus === 'learned' }" @click="filterStatus = 'learned'">✅ Выучено</button>
        <select class="filter-select" v-model="filterCategory">
          <option value="">Все категории</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <TransitionGroup name="word-list" tag="div">
        <div class="word-card" v-for="w in filteredWords" :key="w.id" @click="selectedWord = w">
          <div class="word-status-dot" :class="w.status || 'new'"></div>
          <div class="word-info">
            <div class="word-main">
              <strong>{{ w.en }}</strong>
              <span v-if="w.transcription" class="transcription">{{ w.transcription }}</span>
            </div>
            <div class="word-translation">{{ w.ru }}</div>
            <div class="word-meta" v-if="w.part_of_speech || w.category">
              <span v-if="w.part_of_speech" class="pos-badge">{{ posLabel(w.part_of_speech) }}</span>
              <span v-if="w.category" class="cat-badge">{{ w.category }}</span>
            </div>
            <div class="word-stats">
              <span class="stat-good">✅ {{ w.correct_count || 0 }}</span>
              <span class="stat-bad">❌ {{ w.wrong_count || 0 }}</span>
            </div>
          </div>
          <div class="word-actions">
            <button class="action-btn" @click.stop="updateStatus(w, 'studying')" v-if="w.status === 'new'" title="В изучение">📖</button>
            <button class="action-btn" @click.stop="updateStatus(w, 'learned')" v-if="w.status !== 'learned'" title="Выучено">✅</button>
            <button class="action-btn" @click.stop="updateStatus(w, 'new')" v-if="w.status === 'learned'" title="Вернуть">🔄</button>
            <button class="remove-btn" @click.stop="$emit('delete-word', w.id)" title="Удалить">✕</button>
          </div>
        </div>
      </TransitionGroup>
      <p v-if="!filteredWords.length" class="empty-text">
        {{ filterStatus === 'all' ? 'Словарь пуст. Добавьте первое слово!' : 'Нет слов с таким статусом' }}
      </p>
    </div>

    <!-- КАРТОЧКИ (FLASHCARDS) -->
    <div v-if="currentTab === 'flashcards'" class="flashcards-area">
      <div class="flashcard-counter">{{ currentFlashcard + 1 }} / {{ reviewWords.length }}</div>
      <div class="flashcard" :class="{ flipped: isFlipped }" @click="flipCard">
        <div class="flashcard-front">
          <div class="flashcard-word">{{ reviewWords[currentFlashcard]?.en }}</div>
          <div v-if="reviewWords[currentFlashcard]?.transcription" class="flashcard-transcription">
            {{ reviewWords[currentFlashcard]?.transcription }}
          </div>
          <div class="flashcard-hint">Нажми, чтобы увидеть перевод</div>
        </div>
        <div class="flashcard-back">
          <div class="flashcard-word">{{ reviewWords[currentFlashcard]?.ru }}</div>
          <div v-if="reviewWords[currentFlashcard]?.example" class="flashcard-example">
            💬 {{ reviewWords[currentFlashcard]?.example }}
          </div>
        </div>
      </div>
      <div class="flashcard-actions">
        <button class="flashcard-btn wrong" @click="cardResult('wrong')" :disabled="!isFlipped">❌ Не знаю</button>
        <button class="flashcard-btn hard" @click="cardResult('hard')" :disabled="!isFlipped">🤔 Сложно</button>
        <button class="flashcard-btn good" @click="cardResult('good')" :disabled="!isFlipped">😊 Хорошо</button>
        <button class="flashcard-btn easy" @click="cardResult('easy')" :disabled="!isFlipped">🚀 Легко</button>
      </div>
      <button class="btn btn-o btn-sm w-100 mt-2" @click="currentTab = 'list'">Вернуться к списку</button>
    </div>

    <!-- ТЕСТ (QUIZ) -->
    <div v-if="currentTab === 'quiz'" class="quiz-area">
      <div class="quiz-progress">
        <div class="quiz-counter">Вопрос {{ quizCurrent + 1 }} / {{ quizQuestions.length }}</div>
        <div class="quiz-score">🏆 {{ quizScore }} / {{ quizTotal }}</div>
      </div>
      <div class="quiz-card" v-if="quizQuestions[quizCurrent]">
        <div class="quiz-question">Как переводится: <strong>{{ quizQuestions[quizCurrent].en }}</strong>?</div>
        <div class="quiz-options">
          <button
            v-for="(opt, i) in quizQuestions[quizCurrent].options"
            :key="i"
            class="quiz-option"
            :class="{
              correct: quizAnswered && opt === quizQuestions[quizCurrent].ru,
              wrong: quizAnswered && opt === quizSelected && opt !== quizQuestions[quizCurrent].ru,
              selected: opt === quizSelected
            }"
            @click="answerQuiz(opt)"
            :disabled="quizAnswered"
          >
            {{ opt }}
          </button>
        </div>
        <button v-if="quizAnswered" class="btn btn-p btn-sm w-100 mt-2" @click="nextQuiz">
          {{ quizCurrent + 1 < quizQuestions.length ? 'Далее →' : 'Завершить' }}
        </button>
      </div>
      <div v-if="quizFinished" class="quiz-result">
        <div class="quiz-result-icon">🎉</div>
        <div class="quiz-result-text">Твой результат: {{ quizScore }} / {{ quizTotal }}</div>
        <div class="quiz-result-percent">{{ Math.round(quizScore / quizTotal * 100) }}%</div>
        <button class="btn btn-p btn-sm mt-2" @click="startQuiz">Пройти ещё раз</button>
        <button class="btn btn-o btn-sm mt-2" @click="currentTab = 'list'">Вернуться к списку</button>
      </div>
      <button v-if="!quizFinished" class="btn btn-o btn-sm w-100 mt-2" @click="currentTab = 'list'">Выйти из теста</button>
    </div>

    <!-- МОДАЛКА ДЕТАЛЕЙ СЛОВА -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="selectedWord" class="modal-overlay" @click.self="selectedWord = null">
          <div class="modal-card">
            <h2>{{ selectedWord.en }}</h2>
            <p class="modal-translation">{{ selectedWord.ru }}</p>
            <div v-if="selectedWord.transcription" class="modal-detail">🔊 {{ selectedWord.transcription }}</div>
            <div v-if="selectedWord.part_of_speech" class="modal-detail">📌 {{ posLabel(selectedWord.part_of_speech) }}</div>
            <div v-if="selectedWord.category" class="modal-detail">📂 {{ selectedWord.category }}</div>
            <div v-if="selectedWord.example" class="modal-detail">💬 {{ selectedWord.example }}</div>
            <div class="modal-stats">
              <span>✅ {{ selectedWord.correct_count || 0 }}</span>
              <span>❌ {{ selectedWord.wrong_count || 0 }}</span>
              <span>🔄 {{ selectedWord.repeat_count || 0 }} повт.</span>
            </div>
            <button class="btn btn-o w-100 mt-2" @click="selectedWord = null">Закрыть</button>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabWords',
  props: {
    words: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  emits: ['add-word', 'delete-word', 'update-word-status'],
  data() {
    return {
      wordEn: '', wordRu: '', wordTranscription: '', wordPartOfSpeech: '', wordCategory: '', wordExample: '',
      showAddForm: false,
      currentTab: 'list',
      filterStatus: 'all',
      filterCategory: '',
      selectedWord: null,
      // Flashcards
      reviewWords: [],
      currentFlashcard: 0,
      isFlipped: false,
      // Quiz
      quizQuestions: [],
      quizCurrent: 0,
      quizSelected: null,
      quizAnswered: false,
      quizScore: 0,
      quizTotal: 0,
      quizFinished: false
    };
  },
  computed: {
    learnedCount() { return this.words.filter(w => w.status === 'learned').length; },
    studyingCount() { return this.words.filter(w => w.status === 'studying').length; },
    newCount() { return this.words.filter(w => !w.status || w.status === 'new').length; },
    reviewCount() { return this.words.filter(w => !w.next_review || new Date(w.next_review) <= new Date()).length; },
    progressPercent() { return this.words.length > 0 ? Math.round((this.learnedCount / this.words.length) * 100) : 0; },
    categories() { return [...new Set(this.words.filter(w => w.category).map(w => w.category))]; },
    filteredWords() {
      let list = this.words;
      if (this.filterStatus !== 'all') list = list.filter(w => (w.status || 'new') === this.filterStatus);
      if (this.filterCategory) list = list.filter(w => w.category === this.filterCategory);
      return list;
    }
  },
  methods: {
    posLabel(pos) {
      const map = { noun: 'Сущ.', verb: 'Глаг.', adjective: 'Прил.', adverb: 'Нар.', phrase: 'Фраза' };
      return map[pos] || pos;
    },
    
    addWord() {
      if (!this.wordEn.trim() || !this.wordRu.trim()) return;
      this.$emit('add-word', {
        en: this.wordEn.trim(),
        ru: this.wordRu.trim(),
        transcription: this.wordTranscription.trim(),
        part_of_speech: this.wordPartOfSpeech,
        category: this.wordCategory.trim(),
        example: this.wordExample.trim()
      });
      this.wordEn = ''; this.wordRu = ''; this.wordTranscription = '';
      this.wordPartOfSpeech = ''; this.wordCategory = ''; this.wordExample = '';
      this.showAddForm = false;
    },
    
    updateStatus(word, status) {
      this.$emit('update-word-status', { id: word.id, status });
    },
    
    startFlashcards() {
      this.reviewWords = [...this.words].filter(w => w.status !== 'learned').sort(() => Math.random() - 0.5);
      if (!this.reviewWords.length) {
        this.reviewWords = [...this.words].sort(() => Math.random() - 0.5);
      }
      this.currentFlashcard = 0;
      this.isFlipped = false;
      this.currentTab = 'flashcards';
    },
    
    startReview() {
      this.reviewWords = [...this.words].filter(w => !w.next_review || new Date(w.next_review) <= new Date()).sort(() => Math.random() - 0.5);
      if (!this.reviewWords.length) {
        this.reviewWords = [...this.words].sort(() => Math.random() - 0.5);
      }
      this.currentFlashcard = 0;
      this.isFlipped = false;
      this.currentTab = 'flashcards';
    },
    
    flipCard() { this.isFlipped = !this.isFlipped; },
    
    cardResult(type) {
      const word = this.reviewWords[this.currentFlashcard];
      const intervals = { wrong: 1, hard: 3, good: 7, easy: 30 };
      const days = intervals[type];
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + days);
      
      let newStatus = word.status || 'new';
      if (type === 'easy' || type === 'good') {
        newStatus = word.repeat_count >= 3 ? 'learned' : 'studying';
      } else {
        newStatus = 'studying';
      }
      
      this.$emit('update-word-status', {
        id: word.id,
        status: newStatus,
        next_review: nextReview.toISOString(),
        repeat_count: (word.repeat_count || 0) + 1,
        correct_count: (word.correct_count || 0) + (type === 'easy' || type === 'good' ? 1 : 0),
        wrong_count: (word.wrong_count || 0) + (type === 'wrong' || type === 'hard' ? 1 : 0)
      });
      
      if (this.currentFlashcard < this.reviewWords.length - 1) {
        this.currentFlashcard++;
        this.isFlipped = false;
      } else {
        this.currentTab = 'list';
        this.$emit('add-word', { toast: '🎉 Все карточки просмотрены!' });
      }
    },
    
    startQuiz() {
      const pool = [...this.words].sort(() => Math.random() - 0.5).slice(0, 10);
      this.quizQuestions = pool.map(w => {
        const wrong = this.words.filter(x => x.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 3).map(x => x.ru);
        const options = [...wrong, w.ru].sort(() => Math.random() - 0.5);
        return { ...w, options };
      });
      this.quizCurrent = 0;
      this.quizScore = 0;
      this.quizTotal = this.quizQuestions.length;
      this.quizAnswered = false;
      this.quizSelected = null;
      this.quizFinished = false;
      this.currentTab = 'quiz';
    },
    
    answerQuiz(opt) {
      if (this.quizAnswered) return;
      this.quizSelected = opt;
      this.quizAnswered = true;
      if (opt === this.quizQuestions[this.quizCurrent].ru) {
        this.quizScore++;
      }
    },
    
    nextQuiz() {
      if (this.quizCurrent + 1 < this.quizQuestions.length) {
        this.quizCurrent++;
        this.quizAnswered = false;
        this.quizSelected = null;
      } else {
        this.quizFinished = true;
      }
    }
  }
};
</script>

<style scoped>
.dictionary-app { display: flex; flex-direction: column; gap: 16px; }

/* Статистика */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
.stat-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; text-align: center; }
.stat-card.learned { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.06); }
.stat-card.studying { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.06); }
.stat-card.new-words { border-color: rgba(251,191,36,0.3); background: rgba(251,191,36,0.06); }
.stat-icon { font-size: 1.3rem; margin-bottom: 4px; }
.stat-value { font-size: 1.4rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.stat-label { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }

/* Прогресс */
.progress-section { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 16px; }
.progress-header { display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; }
.progress-bar { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 4px; transition: width 0.6s ease; }

/* Кнопки */
.actions-row { display: flex; gap: 8px; flex-wrap: wrap; }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.8rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.btn-sm { padding: 6px 14px; font-size: 0.78rem; }
.w-100 { width: 100%; justify-content: center; }
.mt-2 { margin-top: 10px; }

/* Форма */
.add-form { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.form-row { display: flex; gap: 8px; }
.input { padding: 9px 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; font-family: inherit; font-size: 0.82rem; background: rgba(255,255,255,0.04); color: #fff; outline: none; flex: 1; }
.input:focus { border-color: #6366f1; }
select.input { cursor: pointer; }

/* Вкладки */
.tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.03); border-radius: 12px; padding: 4px; }
.tab { flex: 1; padding: 8px; border: none; background: transparent; color: #94a3b8; cursor: pointer; border-radius: 10px; font-size: 0.8rem; font-weight: 500; transition: all 0.2s; font-family: inherit; }
.tab.active { background: rgba(99,102,241,0.2); color: #fff; }
.tab:disabled { opacity: 0.4; cursor: not-allowed; }

/* Фильтры */
.filter-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.filter-btn { padding: 4px 10px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: transparent; color: #94a3b8; cursor: pointer; font-size: 0.7rem; font-family: inherit; transition: all 0.2s; }
.filter-btn.active { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.5); color: #fff; }
.filter-select { padding: 4px 8px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.04); color: #fff; font-size: 0.7rem; cursor: pointer; font-family: inherit; }

/* Список слов */
.word-card { display: flex; align-items: center; gap: 10px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 12px; margin-bottom: 4px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
.word-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
.word-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.word-status-dot.new { background: #fbbf24; }
.word-status-dot.studying { background: #6366f1; }
.word-status-dot.learned { background: #10b981; }
.word-info { flex: 1; min-width: 0; }
.word-main { display: flex; align-items: center; gap: 8px; }
.word-main strong { color: #fff; font-size: 0.9rem; }
.transcription { color: #94a3b8; font-size: 0.75rem; font-style: italic; }
.word-translation { color: #cbd5e1; font-size: 0.8rem; margin-top: 2px; }
.word-meta { display: flex; gap: 4px; margin-top: 4px; }
.pos-badge, .cat-badge { font-size: 0.6rem; padding: 1px 6px; border-radius: 6px; }
.pos-badge { background: rgba(99,102,241,0.15); color: #818cf8; }
.cat-badge { background: rgba(16,185,129,0.1); color: #10b981; }
.word-stats { display: flex; gap: 8px; font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }
.word-actions { display: flex; gap: 4px; }
.action-btn { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 4px; border-radius: 6px; }
.action-btn:hover { background: rgba(255,255,255,0.08); }
.remove-btn { color: #ef4444; background: none; border: none; cursor: pointer; font-size: 1rem; padding: 4px 6px; border-radius: 6px; }
.remove-btn:hover { background: rgba(239,68,68,0.15); }

/* Карточки */
.flashcards-area { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.flashcard-counter { color: #94a3b8; font-size: 0.8rem; }
.flashcard { width: 100%; max-width: 400px; height: 220px; perspective: 1000px; cursor: pointer; }
.flashcard-front, .flashcard-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 20px; padding: 24px; text-align: center; transition: transform 0.6s; }
.flashcard-front { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1)); border: 1px solid rgba(99,102,241,0.3); transform: rotateY(0deg); }
.flashcard-back { background: linear-gradient(135deg, rgba(45,212,191,0.2), rgba(99,102,241,0.1)); border: 1px solid rgba(45,212,191,0.3); transform: rotateY(180deg); }
.flashcard.flipped .flashcard-front { transform: rotateY(180deg); }
.flashcard.flipped .flashcard-back { transform: rotateY(0deg); }
.flashcard-word { font-size: 1.8rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.flashcard-transcription { color: #94a3b8; font-size: 0.9rem; margin-top: 8px; }
.flashcard-hint { color: #64748b; font-size: 0.75rem; margin-top: 12px; }
.flashcard-example { color: #cbd5e1; font-size: 0.85rem; margin-top: 12px; font-style: italic; }
.flashcard-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.flashcard-btn { padding: 8px 14px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; font-size: 0.78rem; transition: all 0.2s; font-family: inherit; }
.flashcard-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.flashcard-btn.wrong { background: rgba(239,68,68,0.15); color: #ef4444; }
.flashcard-btn.hard { background: rgba(251,191,36,0.15); color: #fbbf24; }
.flashcard-btn.good { background: rgba(99,102,241,0.15); color: #818cf8; }
.flashcard-btn.easy { background: rgba(16,185,129,0.15); color: #10b981; }

/* Тест */
.quiz-area { display: flex; flex-direction: column; gap: 14px; }
.quiz-progress { display: flex; justify-content: space-between; align-items: center; }
.quiz-counter, .quiz-score { font-size: 0.85rem; color: #94a3b8; }
.quiz-score { font-weight: 700; color: #fbbf24; }
.quiz-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 24px; text-align: center; }
.quiz-question { color: #fff; font-size: 1.1rem; margin-bottom: 16px; }
.quiz-question strong { color: #818cf8; }
.quiz-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
@media (max-width: 500px) { .quiz-options { grid-template-columns: 1fr; } }
.quiz-option { padding: 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.03); color: #cbd5e1; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; font-family: inherit; }
.quiz-option:hover:not(:disabled) { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); }
.quiz-option.selected { border-color: #6366f1; background: rgba(99,102,241,0.15); }
.quiz-option.correct { border-color: #10b981 !important; background: rgba(16,185,129,0.2) !important; color: #10b981 !important; }
.quiz-option.wrong { border-color: #ef4444 !important; background: rgba(239,68,68,0.15) !important; color: #ef4444 !important; }
.quiz-option:disabled { cursor: default; }
.quiz-result { text-align: center; padding: 20px; }
.quiz-result-icon { font-size: 3rem; }
.quiz-result-text { font-size: 1.1rem; color: #fff; margin-top: 8px; }
.quiz-result-percent { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-family: 'Space Grotesk', sans-serif; }

/* Модалка */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.modal-card { background: rgba(20,20,40,0.95); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 32px; max-width: 400px; width: 90%; color: #fff; animation: modalPop 0.3s ease; }
@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-card h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; margin: 0 0 4px; }
.modal-translation { font-size: 1.1rem; color: #cbd5e1; margin: 0 0 12px; }
.modal-detail { color: #94a3b8; font-size: 0.85rem; margin-bottom: 6px; }
.modal-stats { display: flex; gap: 12px; margin-top: 12px; font-size: 0.8rem; color: #94a3b8; }

.empty-text { text-align: center; color: #64748b; padding: 40px; }

/* Анимации */
.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(-10px); max-height: 0; }
.word-list-enter-active, .word-list-leave-active { transition: all 0.3s ease; }
.word-list-enter-from { opacity: 0; transform: translateX(-20px); }
.word-list-leave-to { opacity: 0; transform: translateX(20px); }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
