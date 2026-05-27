<template>
  <div class="card">
    <h3 class="card-title">🎮 Угадай слово</h3>
    <div class="wordle-grid">
      <div v-for="(row, ri) in guesses" :key="ri" class="wordle-row">
        <div v-for="(cell, ci) in row" :key="ci" class="wordle-cell" :class="cell.status">
          {{ cell.letter }}
        </div>
      </div>
    </div>
    <div class="wordle-input" v-if="!solved && guesses.length < 5">
      <input v-model="input" maxlength="5" placeholder="5 букв..." @keydown.enter="checkWord" class="wordle-field" />
      <button @click="checkWord" class="wordle-check-btn">Проверить</button>
    </div>
    <div v-if="solved" class="wordle-solved">🎉 Угадал! +25 XP!</div>
    <div v-if="!solved && guesses.length >= 5" class="wordle-failed">
      Слово: <strong>{{ word }}</strong>
    </div>
  </div>
</template>

<script>
const WORDS = ['HOUSE', 'PLANE', 'DREAM', 'LIGHT', 'MUSIC', 'BEACH', 'CLOUD', 'HEART', 'STORM', 'TIGER'];

export default {
  name: 'MiniGame',
  data() {
    return {
      word: '',
      guesses: [],
      input: '',
      solved: false
    };
  },
  created() {
    const day = new Date().getDate();
    this.word = WORDS[day % WORDS.length];
    this.guesses = Array(5).fill(null).map(() => []);
  },
  methods: {
    checkWord() {
      if (this.input.length !== 5) return;
      const guess = this.input.toUpperCase();
      const row = guess.split('').map((letter, i) => {
        if (letter === this.word[i]) return { letter, status: 'correct' };
        if (this.word.includes(letter)) return { letter, status: 'present' };
        return { letter, status: 'absent' };
      });
      this.guesses[this.guesses.findIndex(r => !r.length)] = row;
      if (guess === this.word) this.solved = true;
      this.input = '';
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 14px; }
.wordle-grid { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.wordle-row { display: flex; gap: 6px; justify-content: center; }
.wordle-cell { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-weight: 700; font-size: 1rem; text-transform: uppercase; background: rgba(255,255,255,0.05); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); }
.wordle-cell.correct { background: rgba(16,185,129,0.2); border-color: #10b981; color: #10b981; }
.wordle-cell.present { background: rgba(251,191,36,0.2); border-color: #fbbf24; color: #fbbf24; }
.wordle-cell.absent { background: rgba(255,255,255,0.03); color: #475569; }
.wordle-input { display: flex; gap: 8px; }
.wordle-field { flex: 1; padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 0.9rem; text-transform: uppercase; outline: none; }
.wordle-check-btn { padding: 8px 16px; background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; color: #fff; cursor: pointer; font-weight: 600; }
.wordle-solved { text-align: center; padding: 10px; background: rgba(16,185,129,0.1); border-radius: 10px; color: #10b981; font-weight: 600; margin-top: 8px; }
.wordle-failed { text-align: center; color: #94a3b8; margin-top: 8px; }
</style>
