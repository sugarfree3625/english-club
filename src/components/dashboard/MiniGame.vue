<template>
  <div class="card mini-game-card">
    <div class="mg-header">
      <h3 class="card-title">🎮 Угадай слово</h3>
      <span class="mg-xp">+25 XP</span>
    </div>

    <!-- Сетка -->
    <div class="wordle-grid">
      <div v-for="(row, ri) in displayGuesses" :key="ri" class="wordle-row">
        <div v-for="(cell, ci) in row" :key="ci" class="wordle-cell" :class="cell.status">
          {{ cell.letter }}
        </div>
      </div>
    </div>

    <!-- Ввод -->
    <div class="wordle-input" v-if="!solved && currentRow < 5">
      <input 
        ref="wordInput"
        v-model="input" 
        maxlength="5" 
        placeholder="5 букв..." 
        @keydown.enter="checkWord" 
        @input="onInput"
        class="wordle-field" 
        :disabled="solved"
        autocomplete="off"
      />
      <button @click="checkWord" class="wordle-check-btn" :disabled="input.length !== 5">
        ✓
      </button>
    </div>

    <!-- Результат -->
    <div v-if="solved" class="wordle-result success">
      🎉 Угадал! +25 XP!
      <button class="wordle-replay-btn" @click="resetGame">🔄 Ещё раз</button>
    </div>
    <div v-if="!solved && currentRow >= 5" class="wordle-result fail">
      😞 Слово: <strong>{{ word }}</strong>
      <button class="wordle-replay-btn" @click="resetGame">🔄 Попробовать снова</button>
    </div>
  </div>
</template>

<script>
const WORDS = ['HOUSE', 'PLANE', 'DREAM', 'LIGHT', 'MUSIC', 'BEACH', 'CLOUD', 'HEART', 'STORM', 'TIGER', 'BRAIN', 'WORLD', 'SMILE', 'WATER', 'EARTH', 'FLAME', 'QUEEN', 'PIANO', 'BREAD', 'HORSE'];

export default {
  name: 'MiniGame',
  inject: ['addToast'],
  data() {
    return {
      word: '',
      guesses: [],
      input: '',
      solved: false,
      currentRow: 0
    };
  },
  computed: {
    displayGuesses() {
      const rows = [];
      for (let i = 0; i < 5; i++) {
        if (i < this.guesses.length) {
          rows.push(this.guesses[i]);
        } else {
          rows.push(Array(5).fill({ letter: '', status: '' }));
        }
      }
      return rows;
    }
  },
  created() {
    this.resetGame();
  },
  methods: {
    resetGame() {
      this.word = WORDS[Math.floor(Math.random() * WORDS.length)];
      this.guesses = [];
      this.input = '';
      this.solved = false;
      this.currentRow = 0;
      this.$nextTick(() => this.$refs.wordInput?.focus());
    },

    onInput() {
      // Только буквы, до 5 символов, в верхнем регистре
      this.input = this.input.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
    },

    checkWord() {
      if (this.input.length !== 5 || this.solved) return;

      const guess = this.input.toUpperCase();
      const wordLetters = this.word.split('');
      const guessLetters = guess.split('');
      
      // Сначала отмечаем правильные
      const row = guessLetters.map((letter, i) => {
        if (letter === wordLetters[i]) {
          wordLetters[i] = null; // убираем, чтобы не посчитать дважды
          return { letter, status: 'correct' };
        }
        return { letter, status: 'absent' };
      });

      // Потом отмечаем присутствующие
      row.forEach((cell, i) => {
        if (cell.status === 'absent' && wordLetters.includes(cell.letter)) {
          const idx = wordLetters.indexOf(cell.letter);
          wordLetters[idx] = null;
          cell.status = 'present';
        }
      });

      this.guesses.push(row);
      this.currentRow++;

      if (guess === this.word) {
        this.solved = true;
        this.addToast?.('🎉 +25 XP! Отличная работа!', 'success');
      }

      this.input = '';
    }
  }
};
</script>

<style scoped>
.mini-game-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 20px;
  color: #e2e8f0;
}
.mg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.card-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
  margin: 0;
}
.mg-xp {
  padding: 3px 10px;
  background: rgba(245,158,11,0.15);
  border-radius: 8px;
  font-size: 0.7rem;
  color: #fbbf24;
  font-weight: 700;
}

/* Сетка */
.wordle-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
}
.wordle-row {
  display: flex;
  gap: 5px;
  justify-content: center;
}
.wordle-cell {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.05rem;
  text-transform: uppercase;
  background: rgba(255,255,255,0.04);
  color: #94a3b8;
  border: 2px solid rgba(255,255,255,0.06);
  transition: all 0.3s;
}
.wordle-cell.correct {
  background: rgba(16,185,129,0.2);
  border-color: #10b981;
  color: #10b981;
  animation: popIn 0.3s ease;
}
.wordle-cell.present {
  background: rgba(251,191,36,0.2);
  border-color: #fbbf24;
  color: #fbbf24;
  animation: popIn 0.3s ease;
}
.wordle-cell.absent {
  background: rgba(255,255,255,0.02);
  color: #475569;
  border-color: rgba(255,255,255,0.04);
}
@keyframes popIn {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Ввод */
.wordle-input {
  display: flex;
  gap: 8px;
}
.wordle-field {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  text-transform: uppercase;
  outline: none;
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: 4px;
  text-align: center;
}
.wordle-field:focus {
  border-color: #6366f1;
  box-shadow: 0 0 10px rgba(99,102,241,0.15);
}
.wordle-check-btn {
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99,102,241,0.2);
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.1rem;
  transition: all 0.2s;
}
.wordle-check-btn:hover:not(:disabled) {
  background: rgba(99,102,241,0.3);
}
.wordle-check-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Результат */
.wordle-result {
  text-align: center;
  padding: 10px;
  border-radius: 10px;
  font-weight: 600;
  margin-top: 10px;
  font-size: 0.85rem;
}
.wordle-result.success {
  background: rgba(16,185,129,0.1);
  color: #10b981;
}
.wordle-result.fail {
  background: rgba(239,68,68,0.08);
  color: #ef4444;
}
.wordle-result strong {
  color: #fff;
}
.wordle-replay-btn {
  display: block;
  margin: 8px auto 0;
  padding: 6px 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
  font-family: inherit;
}
.wordle-replay-btn:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
</style>
