<template>
  <section class="section" id="faq" v-if="faqs.length">
    <div class="container">
      <h2 class="section-title"><span class="gradient-text">Частые вопросы</span></h2>
      
      <!-- Поиск по FAQ -->
      <div class="faq-search">
        <i class="fas fa-search"></i>
        <input 
          class="faq-search-input" 
          v-model="searchQuery" 
          placeholder="Поиск по вопросам..." 
        />
        <button 
          v-if="searchQuery" 
          class="faq-search-clear" 
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>
      
      <!-- Список FAQ -->
      <div class="faq-list" v-if="filteredFaqs.length">
        <div 
          v-for="(f, i) in filteredFaqs" 
          :key="i" 
          class="faq-item glass-card animate-on-scroll" 
          @click="toggle(i)"
        >
          <div class="faq-header">
            <h4 v-html="highlight(f.q)"></h4>
            <span class="faq-arrow" :class="{ open: open[i] }">▾</span>
          </div>
          <transition name="faq-slide">
            <p v-show="open[i]" class="faq-answer" v-html="highlight(f.a)"></p>
          </transition>
        </div>
      </div>
      
      <!-- Ничего не найдено -->
      <div v-else class="faq-empty">
        <span class="empty-icon">🔍</span>
        <p>Ничего не найдено по запросу "{{ searchQuery }}"</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const props = defineProps({ 
  faqs: { type: Array, default: () => [] } 
});

const open = reactive({});
const searchQuery = ref('');

const toggle = (i) => { 
  open[i] = !open[i]; 
};

// Фильтрация FAQ по поиску
const filteredFaqs = computed(() => {
  if (!searchQuery.value.trim()) return props.faqs;
  const q = searchQuery.value.toLowerCase().trim();
  return props.faqs.filter(f => 
    f.q.toLowerCase().includes(q) || 
    f.a.toLowerCase().includes(q)
  );
});

// Подсветка найденного текста
const highlight = (text) => {
  if (!searchQuery.value.trim()) return text;
  const q = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${q})`, 'gi'), 
    '<mark style="background:rgba(99,102,241,0.3);color:#fff;padding:1px 4px;border-radius:4px">$1</mark>'
  );
};
</script>

<style scoped>
.section { 
  position: relative; 
  padding: 80px 0; 
}

.container { 
  max-width: 1100px; 
  margin: 0 auto; 
  padding: 0 24px; 
}

.glass-card { 
  background: rgba(255,255,255,0.05); 
  backdrop-filter: blur(20px); 
  -webkit-backdrop-filter: blur(20px); 
  border: 1px solid rgba(255,255,255,0.1); 
  border-radius: 20px; 
  transition: all 0.3s ease; 
}

.glass-card:hover { 
  box-shadow: 0 0 20px rgba(99,102,241,0.2); 
}

.section-title { 
  font-family: 'Space Grotesk', sans-serif; 
  font-size: 2.5rem; 
  font-weight: 800; 
  text-align: center; 
  margin-bottom: 40px; 
}

.gradient-text { 
  background: linear-gradient(135deg, #6366f1, #2dd4bf); 
  -webkit-background-clip: text; 
  -webkit-text-fill-color: transparent; 
  background-clip: text; 
}

/* Поиск */
.faq-search { 
  position: relative; 
  max-width: 700px; 
  margin: 0 auto 32px; 
}

.faq-search i { 
  position: absolute; 
  left: 16px; 
  top: 50%; 
  transform: translateY(-50%); 
  color: #64748b; 
  font-size: 0.9rem; 
}

.faq-search-input { 
  width: 100%; 
  padding: 14px 40px 14px 44px; 
  border: 2px solid rgba(255,255,255,0.08); 
  border-radius: 14px; 
  background: rgba(255,255,255,0.03); 
  color: #fff; 
  font-size: 0.9rem; 
  outline: none; 
  font-family: inherit; 
  transition: border-color 0.3s; 
}

.faq-search-input:focus { 
  border-color: #6366f1; 
  box-shadow: 0 0 20px rgba(99,102,241,0.1); 
}

.faq-search-input::placeholder { 
  color: #64748b; 
}

.faq-search-clear { 
  position: absolute; 
  right: 12px; 
  top: 50%; 
  transform: translateY(-50%); 
  background: rgba(255,255,255,0.08); 
  border: none; 
  color: #94a3b8; 
  width: 28px; 
  height: 28px; 
  border-radius: 50%; 
  cursor: pointer; 
  font-size: 0.8rem; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.2s; 
}

.faq-search-clear:hover { 
  background: rgba(239,68,68,0.2); 
  color: #ef4444; 
}

/* Список */
.faq-list { 
  max-width: 700px; 
  margin: 0 auto; 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
}

.faq-item { 
  padding: 18px 24px; 
  cursor: pointer; 
}

.faq-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  gap: 12px; 
}

.faq-header h4 { 
  margin: 0; 
  color: #fff; 
  font-size: 0.95rem; 
  font-weight: 600; 
  flex: 1; 
}

.faq-arrow { 
  color: #94a3b8; 
  transition: transform 0.3s ease; 
  font-size: 1.2rem; 
  flex-shrink: 0; 
}

.faq-arrow.open { 
  transform: rotate(180deg); 
  color: #6366f1; 
}

.faq-answer { 
  color: #94a3b8; 
  font-size: 0.9rem; 
  line-height: 1.6; 
  margin-top: 12px; 
  padding-top: 12px; 
  border-top: 1px solid rgba(255,255,255,0.06); 
}

/* Пустой результат */
.faq-empty { 
  text-align: center; 
  padding: 40px; 
  color: #94a3b8; 
}

.empty-icon { 
  font-size: 3rem; 
  display: block; 
  margin-bottom: 12px; 
}

.faq-empty p { 
  font-size: 0.9rem; 
}

/* Анимации */
.faq-slide-enter-active, 
.faq-slide-leave-active { 
  transition: all 0.3s ease; 
}

.faq-slide-enter-from, 
.faq-slide-leave-to { 
  opacity: 0; 
  max-height: 0; 
  margin-top: 0; 
  padding-top: 0; 
}

.animate-on-scroll { 
  opacity: 0; 
  transform: translateY(20px); 
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); 
}

.animate-on-scroll.visible { 
  opacity: 1; 
  transform: translateY(0); 
}

/* Адаптив */
@media (max-width: 768px) {
  .section-title { 
    font-size: 1.8rem; 
  }
  
  .faq-item { 
    padding: 14px 18px; 
  }
  
  .faq-header h4 { 
    font-size: 0.85rem; 
  }
}
</style>
