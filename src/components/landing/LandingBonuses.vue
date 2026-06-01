<template>
  <section class="section" id="bonuses">
    <div class="bg-orb bg-orb-5"></div>
    <div class="container">
      <h3 class="bonuses-title">Бесплатно с каждым пакетом</h3>
      <div class="bonuses-grid">
        <div v-for="(bonus, i) in bonuses" :key="i" class="bonus-card glass-card animate-on-scroll">
          <component :is="bonus.icon" class="bonus-icon" />
          <h4 class="bonus-name">{{ bonus.title }}</h4>
          <p class="bonus-desc">{{ bonus.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { BookOpen, StickyNote, Users, Award } from 'lucide-vue-next';

const bonuses = [
  { icon: BookOpen, title: '📚 Словарь', desc: 'Личный словарь с тренажёром для запоминания новых слов.' },
  { icon: StickyNote, title: '📝 Заметки', desc: 'Личный блокнот для конспектов с автосохранением.' },
  { icon: Users, title: '👥 Группы', desc: 'Закрытые разговорные группы для практики.' },
  { icon: Award, title: '🏆 Достижения', desc: 'Система достижений и наград за прогресс.' },
];
</script>

<style scoped>
.section { position: relative; padding: 80px 0; overflow: hidden; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 1; }
.bg-orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15; pointer-events: none; }
.bg-orb-5 { width: 300px; height: 300px; background: #6366f1; top: 50%; left: -100px; }
.glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; transition: all 0.3s ease; }
.glass-card:hover { box-shadow: 0 0 20px rgba(99,102,241,0.2); }
.bonuses-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.8rem; font-weight: 700; color: #fff; text-align: center; margin-bottom: 40px; }
.bonuses-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.bonus-card { padding: 28px 20px; text-align: center; }
.bonus-icon { width: 40px; height: 40px; color: #6366f1; margin: 0 auto 12px; }
.bonus-name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #fff; margin-bottom: 8px; }
.bonus-desc { font-size: 0.85rem; color: #94a3b8; line-height: 1.5; }
.animate-on-scroll { opacity: 0; transform: translateY(30px); transition: all 0.8s ease; }
.animate-on-scroll.visible { opacity: 1; transform: translateY(0); }
@media (max-width: 768px) { .bonuses-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .bonuses-grid { grid-template-columns: 1fr; } }
</style>
