<template>
  <div class="games-hub">
    <!-- Заголовок -->
    <div class="page-header">
      <h2>🎮 Игры</h2>
      <div class="header-line"></div>
      <p class="header-subtitle">Тренируй английский играючи!</p>
    </div>

    <!-- Статистика игр -->
    <div class="game-stats">
      <div class="game-stat">
        <span class="stat-icon">🏆</span>
        <span class="stat-value">{{ totalXP }}</span>
        <span class="stat-label">XP заработано</span>
      </div>
      <div class="game-stat">
        <span class="stat-icon">🎯</span>
        <span class="stat-value">{{ totalPlayed }}</span>
        <span class="stat-label">Игр сыграно</span>
      </div>
      <div class="game-stat">
        <span class="stat-icon">✅</span>
        <span class="stat-value">{{ correctPercent }}%</span>
        <span class="stat-label">Правильных</span>
      </div>
    </div>

    <!-- Вкладки игр -->
    <div class="game-tabs">
      <button 
        v-for="game in games" 
        :key="game.id"
        class="game-tab"
        :class="{ active: activeGame === game.id }"
        @click="activeGame = game.id"
      >
        <span class="tab-icon">{{ game.icon }}</span>
        <span class="tab-name">{{ game.name }}</span>
        <span class="tab-badge">{{ game.xp }} XP</span>
      </button>
    </div>

    <!-- Игровая зона -->
    <div class="game-area">
      <!-- Игра 1: Составь слово -->
      <div v-if="activeGame === 'scramble'" class="game-card">
        <div class="game-header">
          <h3>🧩 Составь слово</h3>
          <span class="game-xp">+{{ games[0].xp }} XP</span>
        </div>
        
        <div class="scramble-area">
          <div class="scramble-hint" v-if="currentWord">
            <span class="hint-label">Перевод:</span>
            <span class="hint-word">{{ currentWord.ru }}</span>
          </div>
          
          <div class="scramble-letters">
            <span 
              v-for="(letter, i) in scrambledLetters" 
              :key="i"
              class="scramble-letter"
              :class="{ selected: selectedIndexes.includes(i) }"
              @click="toggleLetter(i)"
            >
              {{ letter }}
            </span>
          </div>
          
          <div class="answer-area">
            <div 
              v-for="(letter, i) in selectedLetters" 
              :key="i"
              class="answer-letter"
              @click="removeLetter(i)"
            >
              {{ letter }}
            </div>
            <div v-if="!selectedLetters.length" class="answer-placeholder">
              Нажимай на буквы, чтобы составить слово
            </div>
          </div>

          <div class="game-actions">
            <button class="btn btn-p btn-sm" @click="checkScramble" :disabled="!selectedLetters.length">
              Проверить
            </button>
            <button class="btn btn-o btn-sm" @click="skipScramble">
              Пропустить
            </button>
          </div>

          <div v-if="scrambleResult" class="game-result" :class="scrambleResult">
            <span v-if="scrambleResult === 'correct'">🎉 Правильно! +{{ games[0].xp }} XP</span>
            <span v-else>❌ Неправильно. Правильный ответ: {{ currentWord?.en }}</span>
          </div>
        </div>
      </div>

      <!-- Игра 2: Скоростной перевод -->
      <div v-if="activeGame === 'speed'" class="game-card">
        <div class="game-header">
          <h3>⏱ Скоростной перевод</h3>
          <span class="game-xp">+{{ games[1].xp }} XP</span>
        </div>

        <div class="speed-area">
          <div class="timer-bar" v-if="speedActive">
            <div class="timer-fill" :style="{ width: (speedTime / 30 * 100) + '%' }"></div>
            <span class="timer-text">{{ speedTime }}с</span>
          </div>

          <div class="speed-word" v-if="speedWord && speedActive">
            {{ speedWord.ru }}
          </div>

          <div class="speed-input-row" v-if="speedActive">
            <input 
              class="speed-input" 
              v-model="speedAnswer" 
              @keyup.enter="checkSpeed"
              placeholder="Введи перевод..."
              ref="speedInput"
            />
            <button class="btn btn-p btn-sm" @click="checkSpeed">OK</button>
          </div>

          <div v-if="!speedActive && !speedFinished" class="speed-start">
            <p>Переведи как можно больше слов за 30 секунд!</p>
            <button class="btn btn-p" @click="startSpeed">▶️ Начать</button>
          </div>

          <div v-if="speedFinished" class="speed-result">
            <div class="result-score">🎯 {{ speedScore }} слов</div>
            <div class="result-xp">+{{ speedScore * games[1].xp }} XP</div>
            <button class="btn btn-p btn-sm mt-2" @click="startSpeed">🔄 Ещё раз</button>
          </div>

          <div class="speed-progress" v-if="speedActive">
            ✅ {{ speedScore }} | ❌ {{ speedErrors }}
          </div>
        </div>
      </div>

      <!-- Игра 3: Правда или ложь -->
      <div v-if="activeGame === 'truefalse'" class="game-card">
        <div class="game-header">
          <h3>🎲 Правда или ложь</h3>
          <span class="game-xp">+{{ games[2].xp }} XP</span>
        </div>

        <div class="truefalse-area">
          <div class="tf-lives" v-if="tfActive">
            <span v-for="i in tfLives" :key="i">❤️</span>
            <span v-for="i in (3 - tfLives)" :key="i">🖤</span>
          </div>

          <div class="tf-card" v-if="tfWord && tfActive">
            <div class="tf-word-en">{{ tfWord.en }}</div>
            <div class="tf-equals">=</div>
            <div class="tf-word-ru">{{ tfShownTranslation }}</div>
          </div>

          <div class="tf-actions" v-if="tfActive">
            <button class="btn btn-true" @click="answerTF(true)">✅ Правда</button>
            <button class="btn btn-false" @click="answerTF(false)">❌ Ложь</button>
          </div>

          <div v-if="!tfActive && !tfFinished" class="tf-start">
            <p>Угадай, правильный ли перевод показан? 3 жизни!</p>
            <button class="btn btn-p" @click="startTF">▶️ Начать</button>
          </div>

          <div v-if="tfFinished" class="tf-result">
            <div class="result-score">🎯 {{ tfScore }} правильных</div>
            <div class="result-xp">+{{ tfScore * games[2].xp }} XP</div>
            <button class="btn btn-p btn-sm mt-2" @click="startTF">🔄 Ещё раз</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'GamesHub',
  inject: ['addToast'],
  data() {
    return {
      activeGame: 'scramble',
      words: [],
      totalXP: 0,
      totalPlayed: 0,
      correctAnswers: 0,
      
      // Scramble
      currentWord: null,
      scrambledLetters: [],
      selectedIndexes: [],
      scrambleResult: null,
      
      // Speed
      speedActive: false,
      speedFinished: false,
      speedWord: null,
      speedAnswer: '',
      speedScore: 0,
      speedErrors: 0,
      speedTime: 30,
      speedTimer: null,
      usedWords: [],
      
      // True/False
      tfActive: false,
      tfFinished: false,
      tfWord: null,
      tfShownTranslation: '',
      tfIsCorrect: false,
      tfScore: 0,
      tfLives: 3
    };
  },
  computed: {
    games() {
      return [
        { id: 'scramble', name: 'Составь слово', icon: '🧩', xp: 15 },
        { id: 'speed', name: 'Скоростной перевод', icon: '⏱', xp: 5 },
        { id: 'truefalse', name: 'Правда/Ложь', icon: '🎲', xp: 10 }
      ];
    },
    selectedLetters() {
      return this.selectedIndexes.map(i => this.scrambledLetters[i]);
    },
    correctPercent() {
      return this.totalPlayed > 0 ? Math.round((this.correctAnswers / this.totalPlayed) * 100) : 0;
    }
  },
  async mounted() {
    await this.loadWords();
    this.loadScramble();
  },
  methods: {
    async loadWords() {
      try {
        const { data } = await axios.get('/api/words');
        this.words = data || [];
      } catch(e) {}
    },

    // ==================== SCRAMBLE ====================
    loadScramble() {
      if (!this.words.length) return;
      this.scrambleResult = null;
      this.selectedIndexes = [];
      const random = this.words[Math.floor(Math.random() * this.words.length)];
      this.currentWord = random;
      const letters = random.en.split('');
      // Перемешиваем буквы
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      this.scrambledLetters = letters;
    },

    toggleLetter(i) {
      if (this.scrambleResult) return;
      const idx = this.selectedIndexes.indexOf(i);
      if (idx >= 0) {
        this.selectedIndexes.splice(idx, 1);
      } else {
        this.selectedIndexes.push(i);
      }
    },

    removeLetter(i) {
      if (this.scrambleResult) return;
      const letter = this.selectedLetters[i];
      const originalIndex = this.scrambledLetters.indexOf(letter);
      this.selectedIndexes = this.selectedIndexes.filter((_, idx) => idx !== i);
    },

    checkScramble() {
      const answer = this.selectedLetters.join('').toLowerCase();
      if (answer === this.currentWord.en.toLowerCase()) {
        this.scrambleResult = 'correct';
        this.totalXP += this.games[0].xp;
        this.totalPlayed++;
        this.correctAnswers++;
        this.addToast(`🎉 +${this.games[0].xp} XP!`, 'success');
        setTimeout(() => this.loadScramble(), 1500);
      } else {
        this.scrambleResult = 'wrong';
        this.totalPlayed++;
        setTimeout(() => this.loadScramble(), 2000);
      }
    },

    skipScramble() {
      this.scrambleResult = 'wrong';
      this.totalPlayed++;
      setTimeout(() => this.loadScramble(), 1000);
    },

    // ==================== SPEED ====================
    startSpeed() {
      this.speedActive = true;
      this.speedFinished = false;
      this.speedScore = 0;
      this.speedErrors = 0;
      this.speedTime = 30;
      this.usedWords = [];
      this.nextSpeedWord();
      this.$nextTick(() => this.$refs.speedInput?.focus());
      
      this.speedTimer = setInterval(() => {
        this.speedTime--;
        if (this.speedTime <= 0) {
          this.endSpeed();
        }
      }, 1000);
    },

    nextSpeedWord() {
      if (!this.words.length) return;
      const available = this.words.filter(w => !this.usedWords.includes(w.id));
      if (!available.length) {
        this.usedWords = [];
        this.nextSpeedWord();
        return;
      }
      this.speedWord = available[Math.floor(Math.random() * available.length)];
      this.usedWords.push(this.speedWord.id);
      this.speedAnswer = '';
    },

    checkSpeed() {
      if (!this.speedAnswer.trim()) return;
      if (this.speedAnswer.trim().toLowerCase() === this.speedWord.ru.toLowerCase()) {
        this.speedScore++;
        this.correctAnswers++;
        this.totalXP += this.games[1].xp;
      } else {
        this.speedErrors++;
      }
      this.totalPlayed++;
      this.nextSpeedWord();
      this.$nextTick(() => this.$refs.speedInput?.focus());
    },

    endSpeed() {
      clearInterval(this.speedTimer);
      this.speedActive = false;
      this.speedFinished = true;
    },

    // ==================== TRUE/FALSE ====================
    startTF() {
      this.tfActive = true;
      this.tfFinished = false;
      this.tfScore = 0;
      this.tfLives = 3;
      this.nextTFWord();
    },

    nextTFWord() {
      if (!this.words.length) return;
      this.tfWord = this.words[Math.floor(Math.random() * this.words.length)];
      // 50% шанс показать правильный или неправильный перевод
      this.tfIsCorrect = Math.random() > 0.5;
      if (this.tfIsCorrect) {
        this.tfShownTranslation = this.tfWord.ru;
      } else {
        const otherWords = this.words.filter(w => w.id !== this.tfWord.id);
        if (otherWords.length) {
          this.tfShownTranslation = otherWords[Math.floor(Math.random() * otherWords.length)].ru;
        } else {
          this.tfShownTranslation = this.tfWord.ru + ' (неправильно)';
        }
      }
    },

    answerTF(answeredTrue) {
      const isCorrect = answeredTrue === this.tfIsCorrect;
      if (isCorrect) {
        this.tfScore++;
        this.correctAnswers++;
        this.totalXP += this.games[2].xp;
        this.addToast('✅ Правильно!', 'success');
      } else {
        this.tfLives--;
        this.addToast('❌ Неправильно!', 'error');
      }
      this.totalPlayed++;
      
      if (this.tfLives <= 0) {
        this.tfActive = false;
        this.tfFinished = true;
      } else {
        this.nextTFWord();
      }
    }
  },
  beforeUnmount() {
    clearInterval(this.speedTimer);
  }
};
</script>

<style scoped>
.games-hub { display: flex; flex-direction: column; gap: 20px; color: #e2e8f0; }

.page-header { margin-bottom: 4px; }
.page-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0; }
.header-line { height: 3px; width: 60px; background: linear-gradient(90deg, #f59e0b, #ef4444); border-radius: 2px; margin-top: 8px; }
.header-subtitle { color: #94a3b8; font-size: 0.85rem; margin-top: 6px; }

/* Статистика */
.game-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.game-stat { text-align: center; padding: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; }
.stat-icon { font-size: 1.3rem; display: block; margin-bottom: 4px; }
.stat-value { font-size: 1.3rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.stat-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; }

/* Вкладки */
.game-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.game-tab { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; background: rgba(255,255,255,0.03); color: #94a3b8; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; font-family: inherit; }
.game-tab:hover { border-color: rgba(245,158,11,0.3); color: #fff; }
.game-tab.active { background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1)); border-color: rgba(245,158,11,0.4); color: #fff; }
.tab-icon { font-size: 1.1rem; }
.tab-badge { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; background: rgba(245,158,11,0.15); color: #fbbf24; }

/* Карточка игры */
.game-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 28px; }
.game-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.game-header h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; color: #fff; margin: 0; }
.game-xp { padding: 4px 12px; background: rgba(245,158,11,0.15); border-radius: 10px; color: #fbbf24; font-size: 0.8rem; font-weight: 600; }

/* SCRAMBLE */
.scramble-area { display: flex; flex-direction: column; gap: 16px; align-items: center; }
.scramble-hint { display: flex; gap: 8px; align-items: center; font-size: 1rem; }
.hint-label { color: #94a3b8; }
.hint-word { color: #fff; font-weight: 600; }
.scramble-letters { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.scramble-letter { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 12px; color: #fff; font-size: 1.2rem; font-weight: 700; cursor: pointer; transition: all 0.2s; text-transform: uppercase; }
.scramble-letter:hover { background: rgba(99,102,241,0.25); }
.scramble-letter.selected { background: rgba(16,185,129,0.2); border-color: rgba(16,185,129,0.5); }
.answer-area { min-height: 56px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; padding: 8px; background: rgba(255,255,255,0.03); border: 2px dashed rgba(255,255,255,0.1); border-radius: 14px; width: 100%; }
.answer-letter { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #6366f1, #2dd4bf); border-radius: 10px; color: #fff; font-size: 1.1rem; font-weight: 700; cursor: pointer; text-transform: uppercase; }
.answer-placeholder { color: #64748b; font-size: 0.85rem; display: flex; align-items: center; }
.game-actions { display: flex; gap: 8px; }
.game-result { padding: 10px 20px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; }
.game-result.correct { background: rgba(16,185,129,0.15); color: #10b981; }
.game-result.wrong { background: rgba(239,68,68,0.15); color: #ef4444; }

/* SPEED */
.speed-area { display: flex; flex-direction: column; gap: 16px; align-items: center; }
.timer-bar { width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; position: relative; }
.timer-fill { height: 100%; background: linear-gradient(90deg, #10b981, #ef4444); border-radius: 4px; transition: width 1s linear; }
.timer-text { position: absolute; right: 8px; top: -18px; font-size: 0.8rem; color: #94a3b8; }
.speed-word { font-size: 1.6rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.speed-input-row { display: flex; gap: 8px; width: 100%; }
.speed-input { flex: 1; padding: 12px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.05); color: #fff; font-size: 1rem; outline: none; font-family: inherit; }
.speed-input:focus { border-color: #6366f1; }
.speed-start, .speed-result { text-align: center; }
.speed-start p { color: #94a3b8; margin-bottom: 12px; }
.speed-progress { display: flex; gap: 16px; font-size: 0.9rem; color: #94a3b8; }
.result-score { font-size: 1.5rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.result-xp { color: #fbbf24; font-weight: 600; font-size: 1rem; }

/* TRUE/FALSE */
.truefalse-area { display: flex; flex-direction: column; gap: 16px; align-items: center; }
.tf-lives { font-size: 1.3rem; }
.tf-card { display: flex; align-items: center; gap: 16px; padding: 24px 32px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; }
.tf-word-en { font-size: 1.5rem; font-weight: 700; color: #fff; font-family: 'Space Grotesk', sans-serif; }
.tf-equals { font-size: 1.5rem; color: #94a3b8; }
.tf-word-ru { font-size: 1.2rem; color: #cbd5e1; }
.tf-actions { display: flex; gap: 12px; }
.tf-start, .tf-result { text-align: center; }
.tf-start p { color: #94a3b8; margin-bottom: 12px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.btn-true { padding: 14px 28px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; color: #10b981; font-weight: 700; font-size: 1rem; font-family: inherit; }
.btn-true:hover { background: rgba(16,185,129,0.25); }
.btn-false { padding: 14px 28px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 16px; color: #ef4444; font-weight: 700; font-size: 1rem; font-family: inherit; }
.btn-false:hover { background: rgba(239,68,68,0.25); }
.mt-2 { margin-top: 10px; }
</style>
