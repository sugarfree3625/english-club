<template>
  <div class="card word-of-day-card">
    <div class="wod-header">
      <h3 class="card-title">📖 Слово дня</h3>
      <span class="wod-badge" v-if="wordData.pos">{{ wordData.pos }}</span>
    </div>

    <div v-if="loading" class="wod-loading">
      <div class="loading-spinner"></div>
      <span>Загружаем слово дня...</span>
    </div>

    <template v-else>
      <div class="word-main">{{ wordData.word }}</div>
      <div class="word-transcription" v-if="wordData.phonetic">{{ wordData.phonetic }}</div>
      <div class="word-translation">{{ wordData.meaning }}</div>
      
      <div class="word-example" v-if="wordData.example">
        <i class="fas fa-quote-left"></i> {{ wordData.example }}
      </div>

      <div class="word-actions">
        <button class="word-save-btn" @click="saveWord">
          <i class="fas fa-bookmark"></i> В словарь
        </button>
        <button class="word-speak-btn" @click="speakWord">
          <i class="fas fa-volume-up"></i>
        </button>
      </div>

      <div class="word-more" v-if="wordData.synonyms?.length">
        <span class="more-label">Синонимы:</span>
        <span class="more-values">{{ wordData.synonyms.slice(0, 5).join(', ') }}</span>
      </div>

      <div class="word-fact">
        <span>💡</span> {{ wordData.fact }}
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios';

// 50 слов с переводами
const WORDS_DB = [
  { en: 'Serendipity', ru: 'счастливая случайность', transcription: '/ˌserənˈdɪpəti/', example: 'Finding that book was pure serendipity.', fact: 'Входит в топ-10 самых красивых английских слов.', pos: 'noun' },
  { en: 'Ephemeral', ru: 'мимолётный', transcription: '/ɪˈfemərəl/', example: 'The beauty of cherry blossoms is ephemeral.', fact: 'От греческого ephemeros — "живущий один день".', pos: 'adjective' },
  { en: 'Resilience', ru: 'устойчивость, жизнестойкость', transcription: '/rɪˈzɪliəns/', example: 'Her resilience helped her overcome all challenges.', fact: 'Одно из самых популярных слов 2020-х.', pos: 'noun' },
  { en: 'Euphoria', ru: 'эйфория, блаженство', transcription: '/juːˈfɔːriə/', example: 'Winning the championship filled him with euphoria.', fact: 'От греческого euphoros — "несущий здоровье".', pos: 'noun' },
  { en: 'Petrichor', ru: 'запах земли после дождя', transcription: '/ˈpetrɪkɔːr/', example: 'The petrichor after the summer storm was refreshing.', fact: 'Термин придуман в 1964 году австралийскими учёными.', pos: 'noun' },
  { en: 'Mellifluous', ru: 'сладкозвучный, медоточивый', transcription: '/meˈlɪfluəs/', example: 'Her mellifluous voice captivated everyone.', fact: 'От латинского mel (мёд) + fluere (течь).', pos: 'adjective' },
  { en: 'Solitude', ru: 'уединение (позитивное)', transcription: '/ˈsɒlɪtjuːd/', example: 'He found peace in the solitude of the mountains.', fact: 'От латинского solus — "один". Отличается от loneliness.', pos: 'noun' },
  { en: 'Ubiquitous', ru: 'вездесущий, повсеместный', transcription: '/juːˈbɪkwɪtəs/', example: 'Smartphones have become ubiquitous.', fact: 'От латинского ubique — "везде".', pos: 'adjective' },
  { en: 'Eloquence', ru: 'красноречие', transcription: '/ˈeləkwəns/', example: 'The president spoke with such eloquence.', fact: 'Демосфен закладывал камни в рот, чтобы улучшить дикцию.', pos: 'noun' },
  { en: 'Nostalgia', ru: 'ностальгия, тоска по прошлому', transcription: '/nɒˈstaldʒə/', example: 'Old photos filled her with nostalgia.', fact: 'Раньше считалась болезнью.', pos: 'noun' },
  { en: 'Perseverance', ru: 'настойчивость, упорство', transcription: '/ˌpɜːsɪˈvɪərəns/', example: 'Success comes from perseverance.', fact: 'Ключевое качество успешных людей.', pos: 'noun' },
  { en: 'Quintessential', ru: 'типичный, самый существенный', transcription: '/ˌkwɪntɪˈsenʃəl/', example: 'This café is the quintessential Parisian experience.', fact: 'От латинского quinta essentia — "пятая сущность".', pos: 'adjective' },
  { en: 'Ambiguous', ru: 'двусмысленный, неоднозначный', transcription: '/æmˈbɪɡjuəs/', example: 'His answer was ambiguous and left everyone confused.', fact: 'Противоположность — unequivocal.', pos: 'adjective' },
  { en: 'Benevolent', ru: 'доброжелательный, щедрый', transcription: '/bəˈnevələnt/', example: 'The benevolent billionaire donated millions to charity.', fact: 'От латинского bene (хорошо) + volens (желающий).', pos: 'adjective' },
  { en: 'Cacophony', ru: 'какофония, нестройное звучание', transcription: '/kæˈkɒfəni/', example: 'The construction site created a cacophony of noise.', fact: 'От греческого kakos (плохой) + phone (звук).', pos: 'noun' },
  { en: 'Diligent', ru: 'прилежный, старательный', transcription: '/ˈdɪlɪdʒənt/', example: 'She was a diligent student who always did her homework.', fact: 'Работодатели ценят diligence выше IQ.', pos: 'adjective' },
  { en: 'Exquisite', ru: 'изысканный, утончённый', transcription: '/ɪkˈskwɪzɪt/', example: 'The chef prepared an exquisite meal for the guests.', fact: 'От латинского exquisitus — "тщательно отобранный".', pos: 'adjective' },
  { en: 'Formidable', ru: 'внушительный, грозный', transcription: '/ˈfɔːmɪdəbl/', example: 'She was a formidable opponent in the debate.', fact: 'Может означать как восхищение, так и страх.', pos: 'adjective' },
  { en: 'Gregarious', ru: 'общительный, компанейский', transcription: '/ɡrɪˈɡeəriəs/', example: 'He was a gregarious person who loved parties.', fact: 'От латинского grex — "стадо".', pos: 'adjective' },
  { en: 'Harbinger', ru: 'предвестник, вестник', transcription: '/ˈhɑːbɪndʒər/', example: 'The first snow is a harbinger of winter.', fact: 'Изначально — человек, заказывавший жильё для армии.', pos: 'noun' },
  { en: 'Inevitable', ru: 'неизбежный, неминуемый', transcription: '/ɪnˈevɪtəbl/', example: 'Change is the only inevitable thing in life.', fact: 'Философы веками спорят о том, что действительно неизбежно.', pos: 'adjective' },
  { en: 'Juxtapose', ru: 'сопоставлять, сравнивать', transcription: '/ˈdʒʌkstəpəʊz/', example: 'The exhibition juxtaposes modern and classical art.', fact: 'Популярный приём в искусстве и литературе.', pos: 'verb' },
  { en: 'Kaleidoscope', ru: 'калейдоскоп, быстрая смена', transcription: '/kəˈlaɪdəskəʊp/', example: 'The festival was a kaleidoscope of colours and sounds.', fact: 'Прибор изобретён в 1816 году.', pos: 'noun' },
  { en: 'Luminous', ru: 'светящийся, яркий', transcription: '/ˈluːmɪnəs/', example: 'The luminous stars lit up the night sky.', fact: 'От латинского lumen — "свет".', pos: 'adjective' },
  { en: 'Metamorphosis', ru: 'превращение, метаморфоза', transcription: '/ˌmetəˈmɔːfəsɪs/', example: 'The caterpillar undergoes a metamorphosis into a butterfly.', fact: 'Знаменитая новелла Кафки использует это слово.', pos: 'noun' },
  { en: 'Nonchalant', ru: 'беззаботный, невозмутимый', transcription: '/ˈnɒnʃələnt/', example: 'He walked in with a nonchalant attitude.', fact: 'От французского nonchaloir — "не проявлять интереса".', pos: 'adjective' },
  { en: 'Oblivious', ru: 'не замечающий, неведающий', transcription: '/əˈblɪviəs/', example: 'She was oblivious to the danger around her.', fact: 'От латинского oblivisci — "забывать".', pos: 'adjective' },
  { en: 'Pragmatic', ru: 'прагматичный, практичный', transcription: '/præɡˈmætɪk/', example: 'We need a pragmatic approach to solve this problem.', fact: 'Прагматизм — философское течение из США.', pos: 'adjective' },
  { en: 'Quintessence', ru: 'квинтэссенция, самая суть', transcription: '/kwɪnˈtesəns/', example: 'This painting is the quintessence of Renaissance art.', fact: 'В средневековье — элемент, из которого состоит небо.', pos: 'noun' },
  { en: 'Rendezvous', ru: 'встреча, свидание', transcription: '/ˈrɒndɪvuː/', example: 'They had a secret rendezvous at the café.', fact: 'От французского rendez-vous — "явитесь".', pos: 'noun' },
  { en: 'Superfluous', ru: 'излишний, чрезмерный', transcription: '/suːˈpɜːfluəs/', example: 'The report contained a lot of superfluous information.', fact: 'Бритва Оккама: "Не умножай сущности сверх необходимого".', pos: 'adjective' },
  { en: 'Tenacious', ru: 'цепкий, упорный', transcription: '/tɪˈneɪʃəs/', example: 'She was tenacious in pursuing her goals.', fact: 'От латинского tenax — "держащийся крепко".', pos: 'adjective' },
  { en: 'Unprecedented', ru: 'беспрецедентный', transcription: '/ʌnˈpresɪdentɪd/', example: 'The pandemic caused unprecedented changes.', fact: 'Буквально — "не имеющий прецедента".', pos: 'adjective' },
  { en: 'Voracious', ru: 'ненасытный, жадный', transcription: '/vəˈreɪʃəs/', example: 'He was a voracious reader, finishing a book a day.', fact: 'От латинского vorare — "пожирать".', pos: 'adjective' },
  { en: 'Whimsical', ru: 'причудливый, капризный', transcription: '/ˈwɪmzɪkəl/', example: 'The garden had a whimsical design with colourful sculptures.', fact: 'От слова whim — "прихоть, каприз".', pos: 'adjective' },
  { en: 'Xenial', ru: 'гостеприимный', transcription: '/ˈziːniəl/', example: 'The xenial host made everyone feel welcome.', fact: 'От греческого xenia — "гостеприимство".', pos: 'adjective' },
  { en: 'Yearn', ru: 'тосковать, страстно желать', transcription: '/jɜːn/', example: 'She yearned to travel the world.', fact: 'От древнеанглийского giernan — "желать".', pos: 'verb' },
  { en: 'Zealous', ru: 'рьяный, усердный', transcription: '/ˈzeləs/', example: 'He was a zealous supporter of the cause.', fact: 'От греческого zelos — "рвение, зависть".', pos: 'adjective' },
  { en: 'Aberration', ru: 'отклонение, аномалия', transcription: '/ˌæbəˈreɪʃən/', example: 'The warm weather in January was an aberration.', fact: 'От латинского aberrare — "отклоняться от пути".', pos: 'noun' },
  { en: 'Brevity', ru: 'краткость, сжатость', transcription: '/ˈbrevəti/', example: 'The brevity of his speech was appreciated by everyone.', fact: 'От латинского brevis — "короткий". Сестра таланта!', pos: 'noun' },
  { en: 'Candor', ru: 'искренность, откровенность', transcription: '/ˈkændər/', example: 'I appreciated her candor about the situation.', fact: 'От латинского candere — "сиять, быть белым".', pos: 'noun' },
  { en: 'Debacle', ru: 'фиаско, провал', transcription: '/deɪˈbɑːkəl/', example: 'The product launch was a complete debacle.', fact: 'От французского débâcler — "разрушать, ломать лёд".', pos: 'noun' },
  { en: 'Enigma', ru: 'загадка, головоломка', transcription: '/ɪˈnɪɡmə/', example: 'The origin of the universe remains an enigma.', fact: 'От греческого ainigma — "загадка".', pos: 'noun' },
  { en: 'Facade', ru: 'фасад, внешняя сторона', transcription: '/fəˈsɑːd/', example: 'Behind the cheerful facade, she was deeply unhappy.', fact: 'От итальянского facciata — "передняя часть здания".', pos: 'noun' },
  { en: 'Grandiose', ru: 'грандиозный, помпезный', transcription: '/ˈɡrændiəʊs/', example: 'His grandiose plans never materialized.', fact: 'От итальянского grandioso — "величественный".', pos: 'adjective' },
  { en: 'Hubris', ru: 'высокомерие, гордыня', transcription: '/ˈhjuːbrɪs/', example: 'His hubris led to his downfall.', fact: 'В греческой трагедии — главная причина падения героя.', pos: 'noun' },
  { en: 'Incessant', ru: 'непрерывный, бесконечный', transcription: '/ɪnˈsesənt/', example: 'The incessant rain lasted for three days.', fact: 'От латинского in- (не) + cessare (прекращать).', pos: 'adjective' },
  { en: 'Juxtaposition', ru: 'сопоставление, контраст', transcription: '/ˌdʒʌkstəpəˈzɪʃən/', example: 'The juxtaposition of old and new architecture was striking.', fact: 'От латинского juxta (рядом) + position.', pos: 'noun' },
  { en: 'Kudos', ru: 'похвала, признание', transcription: '/ˈkjuːdɒs/', example: 'Kudos to the team for finishing the project early!', fact: 'От греческого kydos — "слава, честь".', pos: 'noun' },
  { en: 'Lethargic', ru: 'вялый, апатичный', transcription: '/lɪˈθɑːdʒɪk/', example: 'The hot weather made everyone feel lethargic.', fact: 'От греческого lethe — "забвение" + argos — "праздный".', pos: 'adjective' }
];

export default {
  name: 'WordOfDay',
  emits: ['save'],
  data() {
    return {
      loading: false,
      wordData: {}
    };
  },
  created() {
    this.loadWordOfDay();
  },
  methods: {
    loadWordOfDay() {
      // Получаем день года (1-365)
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start;
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      // Выбираем слово по дню года
      const index = dayOfYear % WORDS_DB.length;
      const word = WORDS_DB[index];
      
      // Проверяем кэш
      const cacheKey = `wod_${now.toDateString()}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        this.wordData = JSON.parse(cached);
        return;
      }
      
      // Сохраняем на сегодня
      this.wordData = {
        word: word.en,
        meaning: word.ru,
        phonetic: word.transcription,
        example: word.example,
        fact: word.fact,
        pos: word.pos,
        synonyms: []
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(this.wordData));
      
      // Пробуем получить дополнительные данные из API (синонимы)
      this.fetchExtraData(word.en.toLowerCase());
    },
    
    async fetchExtraData(word) {
      try {
        const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
          withCredentials: false
        });
        if (data?.length) {
          const entry = data[0];
          const meaning = entry.meanings?.[0];
          if (meaning?.synonyms?.length) {
            this.wordData.synonyms = meaning.synonyms;
            // Обновляем кэш
            const now = new Date();
            const cacheKey = `wod_${now.toDateString()}`;
            localStorage.setItem(cacheKey, JSON.stringify(this.wordData));
          }
        }
      } catch(e) {
        // API недоступен — ничего страшного
      }
    },

    speakWord() {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(this.wordData.word);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        speechSynthesis.speak(utterance);
      }
    },

    saveWord() {
      this.$emit('save', {
        en: this.wordData.word,
        ru: this.wordData.meaning,
        transcription: this.wordData.phonetic,
        example: this.wordData.example
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

.wod-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0; }
.wod-badge { padding: 3px 10px; background: rgba(99,102,241,0.15); border-radius: 8px; font-size: 0.7rem; color: #818cf8; font-weight: 600; text-transform: capitalize; }

.wod-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 30px 0; color: #94a3b8; font-size: 0.85rem; }
.loading-spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.08); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.word-main { font-family: 'Space Grotesk', sans-serif; font-size: 2.2rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.2; }
.word-transcription { font-size: 0.9rem; color: #94a3b8; margin: 4px 0; font-style: italic; }
.word-translation { font-size: 1rem; color: #cbd5e1; font-weight: 500; margin: 6px 0; line-height: 1.4; }
.word-example { color: #94a3b8; font-size: 0.85rem; margin: 10px 0; padding: 10px 14px; background: rgba(255,255,255,0.03); border-radius: 10px; border-left: 3px solid rgba(99,102,241,0.3); font-style: italic; line-height: 1.5; }
.word-example i { color: #64748b; margin-right: 4px; }

.word-actions { display: flex; gap: 8px; margin: 12px 0; }
.word-save-btn, .word-speak-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s; font-family: inherit; border: 1px solid rgba(255,255,255,0.1); }
.word-save-btn { background: rgba(255,255,255,0.05); color: #fff; flex: 1; justify-content: center; }
.word-save-btn:hover { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); }
.word-speak-btn { background: rgba(99,102,241,0.1); color: #818cf8; }
.word-speak-btn:hover { background: rgba(99,102,241,0.2); }

.word-more { display: flex; gap: 6px; margin-top: 6px; font-size: 0.8rem; }
.more-label { color: #64748b; flex-shrink: 0; }
.more-values { color: #94a3b8; line-height: 1.4; }

.word-fact { margin-top: 10px; padding: 8px 12px; background: rgba(251,191,36,0.06); border-radius: 8px; font-size: 0.75rem; color: #94a3b8; line-height: 1.4; display: flex; gap: 6px; }
</style>
