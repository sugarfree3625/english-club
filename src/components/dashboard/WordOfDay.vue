<template>
  <div class="card word-of-day-card">
    <div class="wod-header">
      <h3 class="card-title">📖 Слово дня</h3>
      <span class="wod-badge" v-if="wordData.pos">{{ wordData.pos }}</span>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="wod-loading">
      <div class="loading-spinner"></div>
      <span>Загружаем слово дня...</span>
    </div>

    <!-- Слово -->
    <template v-else-if="wordData.word">
      <div class="word-main">{{ wordData.word }}</div>
      <div class="word-transcription" v-if="wordData.phonetic">{{ wordData.phonetic }}</div>
      <div class="word-translation" v-if="wordData.meaning">{{ wordData.meaning }}</div>
      
      <div class="word-example" v-if="wordData.example">
        <i class="fas fa-quote-left"></i> {{ wordData.example }}
      </div>

      <div class="word-actions">
        <button class="word-save-btn" @click="saveWord">
          <i class="fas fa-bookmark"></i> В словарь
        </button>
        <button class="word-speak-btn" @click="speakWord" v-if="wordData.audio">
          <i class="fas fa-volume-up"></i> Озвучить
        </button>
      </div>

      <div class="word-more" v-if="wordData.synonyms?.length">
        <span class="more-label">Синонимы:</span>
        <span class="more-values">{{ wordData.synonyms.slice(0, 5).join(', ') }}</span>
      </div>

      <div class="word-more" v-if="wordData.origin">
        <span class="more-label">Происхождение:</span>
        <span class="more-values">{{ wordData.origin }}</span>
      </div>
    </template>

    <!-- Ошибка → запасное слово -->
    <template v-else>
      <div class="word-main">{{ fallbackWord.en }}</div>
      <div class="word-transcription">{{ fallbackWord.transcription }}</div>
      <div class="word-translation">{{ fallbackWord.ru }}</div>
      <div class="word-example">
        <i class="fas fa-quote-left"></i> {{ fallbackWord.example }}
      </div>
      <div class="word-actions">
        <button class="word-save-btn" @click="saveFallback">
          <i class="fas fa-bookmark"></i> В словарь
        </button>
      </div>
      <div class="word-fact">
        <span>💡</span> {{ fallbackWord.fact }}
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios';

// Список запасных слов (если API недоступен)
const FALLBACK_WORDS = [
  { en: 'Serendipity', transcription: '/ˌserənˈdɪpəti/', ru: 'счастливая случайность', example: 'Finding that book was pure serendipity.', fact: 'Входит в топ-10 самых красивых английских слов.' },
  { en: 'Ephemeral', transcription: '/ɪˈfemərəl/', ru: 'мимолётный', example: 'The beauty of cherry blossoms is ephemeral.', fact: 'От греческого ephemeros — "живущий один день".' },
  { en: 'Resilience', transcription: '/rɪˈzɪliəns/', ru: 'устойчивость', example: 'Her resilience helped her overcome challenges.', fact: 'Одно из самых популярных слов 2020-х.' },
  { en: 'Euphoria', transcription: '/juːˈfɔːriə/', ru: 'эйфория', example: 'Winning filled him with euphoria.', fact: 'От греческого euphoros — "несущий здоровье".' },
  { en: 'Petrichor', transcription: '/ˈpetrɪkɔːr/', ru: 'запах после дождя', example: 'The petrichor after the storm was refreshing.', fact: 'Термин придуман в 1964 году учёными CSIRO.' },
  { en: 'Mellifluous', transcription: '/meˈlɪfluəs/', ru: 'сладкозвучный', example: 'Her mellifluous voice captivated everyone.', fact: 'От латинского mel (мёд) + fluere (течь).' },
  { en: 'Solitude', transcription: '/ˈsɒlɪtjuːd/', ru: 'уединение', example: 'He found peace in the solitude of the mountains.', fact: 'От латинского solus — "один".' },
  { en: 'Ubiquitous', transcription: '/juːˈbɪkwɪtəs/', ru: 'вездесущий', example: 'Smartphones have become ubiquitous.', fact: 'От латинского ubique — "везде".' },
  { en: 'Eloquence', transcription: '/ˈeləkwəns/', ru: 'красноречие', example: 'The president spoke with great eloquence.', fact: 'Одно из самых ценных качеств оратора.' },
  { en: 'Nostalgia', transcription: '/nɒˈstaldʒə/', ru: 'ностальгия', example: 'Old photos filled her with nostalgia.', fact: 'Раньше считалась болезнью.' },
  { en: 'Perseverance', transcription: '/ˌpɜːsɪˈvɪərəns/', ru: 'настойчивость', example: 'Success comes from perseverance.', fact: 'Ключевое качество успешных людей.' },
  { en: 'Quintessential', transcription: '/ˌkwɪntɪˈsenʃəl/', ru: 'типичный, самый существенный', example: 'This is the quintessential Parisian café.', fact: 'От латинского quinta essentia — "пятая сущность".' },
  { en: 'Ambiguous', transcription: '/æmˈbɪɡjuəs/', ru: 'двусмысленный', example: 'His answer was ambiguous.', fact: 'Противоположность — unequivocal.' },
  { en: 'Benevolent', transcription: '/bəˈnevələnt/', ru: 'доброжелательный', example: 'The benevolent king helped the poor.', fact: 'От латинского bene (хорошо) + volens (желающий).' },
  { en: 'Cacophony', transcription: '/kæˈkɒfəni/', ru: 'какофония', example: 'The construction site was a cacophony of noise.', fact: 'От греческого kakos (плохой) + phone (звук).' }
];

export default {
  name: 'WordOfDay',
  emits: ['save'],
  data() {
    return {
      loading: true,
      wordData: {},
      fallbackWord: FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)]
    };
  },
  async mounted() {
    await this.fetchWordOfDay();
  },
  methods: {
    async fetchWordOfDay() {
      this.loading = true;
      
      try {
        // Пробуем получить случайное слово через несколько попыток
        const words = await this.getRandomWords();
        
        if (words.length > 0) {
          const word = words[Math.floor(Math.random() * words.length)];
          const details = await this.fetchWordDetails(word);
          if (details.word) {
            this.wordData = details;
            this.loading = false;
            return;
          }
        }
      } catch(e) {
        console.log('API недоступен, использую запасное слово');
      }
      
      // Если API не сработал — используем запасное слово
      this.wordData = {};
      this.loading = false;
    },

    async getRandomWords() {
      // Список популярных слов для запроса
      const wordPool = [
        'happy', 'beautiful', 'serendipity', 'ephemeral', 'resilience', 'euphoria',
        'mellifluous', 'petrichor', 'solitude', 'ubiquitous', 'eloquence', 'nostalgia',
        'perseverance', 'ambiguous', 'benevolent', 'diligent', 'exquisite', 'formidable',
        'gregarious', 'inevitable', 'luminous', 'pragmatic', 'superfluous', 'curious',
        'brilliant', 'courage', 'freedom', 'harmony', 'imagine', 'journey', 'knowledge',
        'liberty', 'miracle', 'paradise', 'passion', 'rainbow', 'sunshine', 'thunder',
        'twilight', 'whisper', 'wonder', 'destiny', 'eternity', 'infinity', 'serene',
        'tranquil', 'vibrant', 'vivacious', 'wanderlust', 'zenith'
      ];
      
      // Берём 5 случайных слов и проверяем какие есть в API
      const shuffled = wordPool.sort(() => Math.random() - 0.5).slice(0, 5);
      const available = [];
      
      for (const word of shuffled) {
        try {
          const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
          if (data?.length) available.push(word);
        } catch(e) {}
      }
      
      return available;
    },

    async fetchWordDetails(word) {
      try {
        const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!data?.length) return {};
        
        const entry = data[0];
        const meaning = entry.meanings?.[0];
        const definition = meaning?.definitions?.[0];
        
        return {
          word: entry.word,
          phonetic: entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '',
          pos: meaning?.partOfSpeech || '',
          meaning: definition?.definition || '',
          example: definition?.example || '',
          synonyms: meaning?.synonyms || [],
          origin: entry.origin || '',
          audio: entry.phonetics?.find(p => p.audio)?.audio || null
        };
      } catch(e) {
        return {};
      }
    },

    speakWord() {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(this.wordData.word);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        
        // Если есть аудио от API — используем его
        if (this.wordData.audio) {
          const audio = new Audio(this.wordData.audio);
          audio.play();
        } else {
          speechSynthesis.speak(utterance);
        }
      }
    },

    saveWord() {
      this.$emit('save', {
        en: this.wordData.word,
        ru: this.wordData.meaning,
        transcription: this.wordData.phonetic,
        example: this.wordData.example
      });
    },

    saveFallback() {
      this.$emit('save', {
        en: this.fallbackWord.en,
        ru: this.fallbackWord.ru,
        transcription: this.fallbackWord.transcription,
        example: this.fallbackWord.example
      });
    }
  }
};
</script>

<style scoped>
.word-of-day-card {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 24px;
  color: #e2e8f0;
  position: relative;
  overflow: hidden;
}
.word-of-day-card::before {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
  border-radius: 50%;
}

.wod-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.card-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
  margin: 0;
}
.wod-badge {
  padding: 3px 10px;
  background: rgba(99,102,241,0.15);
  border-radius: 8px;
  font-size: 0.7rem;
  color: #818cf8;
  font-weight: 600;
  text-transform: capitalize;
}

/* Загрузка */
.wod-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 30px 0;
  color: #94a3b8;
  font-size: 0.85rem;
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,0.08);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.word-main {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}
.word-transcription {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 4px 0;
  font-style: italic;
}
.word-translation {
  font-size: 1rem;
  color: #cbd5e1;
  font-weight: 500;
  margin: 6px 0;
  line-height: 1.4;
}
.word-example {
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 10px 0;
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  border-left: 3px solid rgba(99,102,241,0.3);
  font-style: italic;
  line-height: 1.5;
}
.word-example i { color: #64748b; margin-right: 4px; }

.word-actions {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}
.word-save-btn, .word-speak-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
  font-family: inherit;
  border: 1px solid rgba(255,255,255,0.1);
}
.word-save-btn {
  background: rgba(255,255,255,0.05);
  color: #fff;
  flex: 1;
  justify-content: center;
}
.word-save-btn:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); }
.word-speak-btn {
  background: rgba(99,102,241,0.1);
  color: #818cf8;
}
.word-speak-btn:hover { background: rgba(99,102,241,0.2); }

.word-more {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  font-size: 0.8rem;
}
.more-label {
  color: #64748b;
  flex-shrink: 0;
}
.more-values {
  color: #94a3b8;
  line-height: 1.4;
}

.word-fact {
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(251,191,36,0.06);
  border-radius: 8px;
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.4;
  display: flex;
  gap: 6px;
}
</style>
