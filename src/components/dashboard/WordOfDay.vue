<template>
  <div class="card">
    <h3 class="card-title">📖 Слово дня</h3>
    <div class="word-main">{{ word.en }}</div>
    <div class="word-transcription">[{{ word.transcription }}]</div>
    <div class="word-translation">{{ word.ru }}</div>
    <div class="word-example">"{{ word.example }}"</div>
    <button class="word-save-btn" @click="$emit('save', word)">
      <Bookmark :size="16" /> Добавить в словарь
    </button>
    <div class="word-fact">💡 {{ word.fact }}</div>
  </div>
</template>

<script>
import { Bookmark } from 'lucide-vue-next';

const WORDS = [
  { en: 'Serendipity', transcription: 'ˌserənˈdɪpəti', ru: 'счастливая случайность', example: 'It was pure serendipity that we met.', fact: 'Входит в топ-10 самых красивых английских слов по версии British Council.' },
  { en: 'Ephemeral', transcription: 'ɪˈfemərəl', ru: 'мимолётный', example: 'The beauty of cherry blossoms is ephemeral.', fact: 'От греческого ephemeros — "живущий один день".' },
  { en: 'Resilience', transcription: 'rɪˈzɪliəns', ru: 'устойчивость', example: 'Her resilience helped her overcome challenges.', fact: 'Одно из самых популярных слов 2020-х.' },
  { en: 'Euphoria', transcription: 'juːˈfɔːriə', ru: 'эйфория', example: 'Winning the match filled him with euphoria.', fact: 'От греческого euphoros — "несущий здоровье".' },
  { en: 'Mellifluous', transcription: 'meˈlɪfluəs', ru: 'сладкозвучный', example: 'Her mellifluous voice captivated the audience.', fact: 'От латинского mel (мёд) + fluere (течь).' },
  { en: 'Petrichor', transcription: 'ˈpetrɪkɔːr', ru: 'запах после дождя', example: 'The petrichor after the storm was refreshing.', fact: 'Термин придуман в 1964 году учёными CSIRO.' },
  { en: 'Solitude', transcription: 'ˈsɒlɪtjuːd', ru: 'уединение', example: 'He enjoyed the solitude of the mountains.', fact: 'От латинского solus — "один".' }
];

export default {
  name: 'WordOfDay',
  components: { Bookmark },
  emits: ['save'],
  computed: {
    word() {
      const day = new Date().getDate();
      return WORDS[day % WORDS.length];
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 16px; }
.word-main { font-family: 'Space Grotesk', sans-serif; font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.word-transcription { font-size: 0.85rem; color: #94a3b8; margin: 4px 0; }
.word-translation { font-size: 1rem; color: #cbd5e1; font-weight: 500; margin: 4px 0; }
.word-example { font-style: italic; color: #94a3b8; font-size: 0.85rem; margin: 8px 0; }
.word-save-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; cursor: pointer; font-size: 0.8rem; margin: 12px 0; transition: all 0.2s; }
.word-save-btn:hover { background: rgba(99,102,241,0.15); }
.word-fact { font-size: 0.7rem; color: #64748b; margin-top: 8px; line-height: 1.4; }
</style>
