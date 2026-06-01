<template>
  <div class="card mini-game-card">
    <div class="mg-header">
      <h3 class="card-title">🎮 Угадай слово</h3>
      <span class="mg-xp">+25 XP</span>
    </div>

    <!-- Награда уже получена -->
    <div v-if="rewardClaimed" class="mg-reward-claimed">
      <span class="reward-icon">✅</span>
      <span>Награда получена. Приходи завтра!</span>
    </div>

    <!-- Игра -->
    <template v-else>
      <div class="mg-hint" v-if="hint">
        <span class="hint-label">💡 Подсказка:</span>
        <span class="hint-text">{{ hint }}</span>
      </div>

      <div class="wordle-grid">
        <div v-for="(row, ri) in displayGuesses" :key="ri" class="wordle-row">
          <div v-for="(cell, ci) in row" :key="ci" class="wordle-cell" :class="cell.status">
            {{ cell.letter }}
          </div>
        </div>
      </div>

      <div class="wordle-input" v-if="!solved && currentRow < 6">
        <input ref="wordInput" v-model="input" :maxlength="word.length" :placeholder="word.length + ' букв...'" @keydown.enter="checkWord" @input="onInput" class="wordle-field" :disabled="solved" autocomplete="off" />
        <button @click="checkWord" class="wordle-check-btn" :disabled="input.length !== word.length">✓</button>
      </div>

      <div v-if="solved" class="wordle-result success">
        🎉 Угадал! +25 XP!
        <button class="wordle-replay-btn" @click="claimReward">🎁 Забрать награду</button>
      </div>
      <div v-if="!solved && currentRow >= 6" class="wordle-result fail">
        😞 Слово: <strong>{{ word }}</strong> — {{ currentMeaning }}
        <button class="wordle-replay-btn" @click="resetGame">🔄 Попробовать снова</button>
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'MiniGame',
  inject: ['addToast'],
  data() {
    return {
      word: '',
      currentMeaning: '',
      hint: '',
      guesses: [],
      input: '',
      solved: false,
      currentRow: 0,
      allWords: [],
      rewardClaimed: false
    };
  },
  computed: {
    displayGuesses() {
      const rows = [];
      for (let i = 0; i < 6; i++) {
        if (i < this.guesses.length) rows.push(this.guesses[i]);
        else rows.push(Array(this.word.length).fill({ letter: '', status: '' }));
      }
      return rows;
    }
  },
  async mounted() {
    this.checkDailyReward();
    if (!this.rewardClaimed) {
      await this.loadWords();
      this.resetGame();
    }
  },
  methods: {
    checkDailyReward() {
      const today = new Date().toDateString();
      const lastClaim = localStorage.getItem('mini_game_reward_date');
      this.rewardClaimed = lastClaim === today;
    },

    claimReward() {
      const today = new Date().toDateString();
      localStorage.setItem('mini_game_reward_date', today);
      this.rewardClaimed = true;
      this.addToast?.('🎁 +25 XP! Награда получена!', 'success');
    },

    async loadWords() {
      try {
        const { data } = await axios.get('/api/words');
        this.allWords = (data || []).filter(w => w.en && w.en.length >= 3 && w.en.length <= 7);
      } catch(e) {
        // Запасные слова
        this.allWords = [
          { en: 'HOUSE', ru: 'дом' }, { en: 'DREAM', ru: 'мечта' }, { en: 'LIGHT', ru: 'свет' },
          { en: 'MUSIC', ru: 'музыка' }, { en: 'BEACH', ru: 'пляж' }, { en: 'HEART', ru: 'сердце' },
          { en: 'STORM', ru: 'шторм' }, { en: 'BRAIN', ru: 'мозг' }, { en: 'WORLD', ru: 'мир' },
          { en: 'SMILE', ru: 'улыбка' }, { en: 'WATER', ru: 'вода' }, { en: 'EARTH', ru: 'земля' },
          { en: 'CLOUD', ru: 'облако' }, { en: 'PLANE', ru: 'самолёт' }, { en: 'TIGER', ru: 'тигр' },
          { en: 'HORSE', ru: 'лошадь' }, { en: 'QUEEN', ru: 'королева' }, { en: 'PIANO', ru: 'пианино' },
          { en: 'BREAD', ru: 'хлеб' }, { en: 'FLAME', ru: 'пламя' }, { en: 'STONE', ru: 'камень' },
          { en: 'RIVER', ru: 'река' }, { en: 'NIGHT', ru: 'ночь' }, { en: 'PEACE', ru: 'мир' },
          { en: 'MAGIC', ru: 'магия' }, { en: 'SPACE', ru: 'космос' }, { en: 'DANCE', ru: 'танец' },
          { en: 'HAPPY', ru: 'счастливый' }, { en: 'GREEN', ru: 'зелёный' }, { en: 'PHONE', ru: 'телефон' }
        ];
      }
      if (!this.allWords.length) {
        this.allWords = [{ en: 'HOUSE', ru: 'дом' }];
      }
    },

    resetGame() {
      const random = this.allWords[Math.floor(Math.random() * this.allWords.length)];
      this.word = (random.en || 'HOUSE').toUpperCase().replace(/[^A-Z]/g, '');
      this.currentMeaning = random.ru || '';
      this.hint = this.currentMeaning;
      this.guesses = [];
      this.input = '';
      this.solved = false;
      this.currentRow = 0;
      this.$nextTick(() => this.$refs.wordInput?.focus());
    },

    onInput() {
      this.input = this.input.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, this.word.length);
    },

    checkWord() {
      if (this.input.length !== this.word.length || this.solved) return;
      const guess = this.input.toUpperCase();
      const wordLetters = this.word.split('');
      const guessLetters = guess.split('');
      
      const row = guessLetters.map((letter, i) => {
        if (letter === wordLetters[i]) { wordLetters[i] = null; return { letter, status: 'correct' }; }
        return { letter, status: 'absent' };
      });
      row.forEach((cell, i) => {
        if (cell.status === 'absent' && wordLetters.includes(cell.letter)) {
          wordLetters[wordLetters.indexOf(cell.letter)] = null;
          cell.status = 'present';
        }
      });

      this.guesses.push(row);
      this.currentRow++;
      if (guess === this.word) { this.solved = true; }
      this.input = '';
      this.$nextTick(() => this.$refs.wordInput?.focus());
    }
  }
};
</script>

<style scoped>
.mini-game-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px; color: #e2e8f0; }
.mg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0; }
.mg-xp { padding: 3px 10px; background: rgba(245,158,11,0.15); border-radius: 8px; font-size: 0.7rem; color: #fbbf24; font-weight: 700; }

.mg-reward-claimed { display: flex; align-items: center; gap: 8px; padding: 16px; background: rgba(16,185,129,0.08); border-radius: 12px; color: #10b981; font-size: 0.85rem; text-align: center; justify-content: center; }
.reward-icon { font-size: 1.2rem; }

.mg-hint { display: flex; gap: 6px; align-items: center; margin-bottom: 10px; padding: 8px 12px; background: rgba(99,102,241,0.08); border-radius: 10px; }
.hint-label { font-size: 0.75rem; color: #94a3b8; flex-shrink: 0; }
.hint-text { font-size: 0.8rem; color: #cbd5e1; font-weight: 500; }

.wordle-grid { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.wordle-row { display: flex; gap: 5px; justify-content: center; }
.wordle-cell { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: 700; font-size: 1.1rem; text-transform: uppercase; background: rgba(255,255,255,0.04); color: #94a3b8; border: 2px solid rgba(255,255,255,0.06); transition: all 0.3s; }
.wordle-cell.correct { background: rgba(16,185,129,0.2); border-color: #10b981; color: #10b981; animation: popIn 0.3s ease; }
.wordle-cell.present { background: rgba(251,191,36,0.2); border-color: #fbbf24; color: #fbbf24; animation: popIn 0.3s ease; }
.wordle-cell.absent { background: rgba(255,255,255,0.02); color: #475569; border-color: rgba(255,255,255,0.04); }
@keyframes popIn { 0% { transform: scale(0.8); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }

.wordle-input { display: flex; gap: 8px; }
.wordle-field { flex: 1; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 1rem; text-transform: uppercase; outline: none; font-family: 'Space Grotesk', sans-serif; letter-spacing: 4px; text-align: center; }
.wordle-field:focus { border-color: #6366f1; box-shadow: 0 0 10px rgba(99,102,241,0.15); }
.wordle-check-btn { width: 44px; display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; color: #fff; cursor: pointer; font-weight: 700; font-size: 1.1rem; transition: all 0.2s; }
.wordle-check-btn:hover:not(:disabled) { background: rgba(99,102,241,0.3); }
.wordle-check-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.wordle-result { text-align: center; padding: 10px; border-radius: 10px; font-weight: 600; margin-top: 10px; font-size: 0.85rem; }
.wordle-result.success { background: rgba(16,185,129,0.1); color: #10b981; }
.wordle-result.fail { background: rgba(239,68,68,0.08); color: #ef4444; }
.wordle-result strong { color: #fff; }
.wordle-replay-btn { display: block; margin: 8px auto 0; padding: 6px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #cbd5e1; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: all 0.2s; font-family: inherit; }
.wordle-replay-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
</style>
