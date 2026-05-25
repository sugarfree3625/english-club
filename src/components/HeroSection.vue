<template>
  <section class="relative min-h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden">
    <!-- Анимированные шары -->
    <div class="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#6366f1] blur-[120px] opacity-30 floating-orb-1"></div>
    <div class="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-[#2dd4bf] blur-[120px] opacity-30 floating-orb-2"></div>

    <div class="relative z-10 text-center px-6 max-w-4xl mx-auto">
      <!-- Заголовок -->
      <h1 class="font-['Space_Grotesk'] text-5xl md:text-7xl font-bold mb-6 leading-tight">
        <span class="gradient-text-animated">Speak English Freely</span>
      </h1>

      <!-- Подзаголовок -->
      <p class="fade-in-up font-['Inter'] text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto" style="animation-delay: 0.3s">
        Разговорный клуб нового поколения
      </p>

      <!-- Кнопка -->
      <button class="glass-btn group fade-in-up mx-auto" style="animation-delay: 0.6s">
        <MessageCircle class="w-5 h-5 group-hover:scale-120 group-hover:-rotate-12 transition-all duration-500" />
        <span>Начать говорить</span>
      </button>

      <!-- Индикаторы -->
      <div class="flex justify-center gap-6 mt-12 flex-wrap">
        <div class="glass-indicator fade-in-up" style="animation-delay: 0.8s">
          <Globe class="w-5 h-5 text-[#6366f1]" />
          <span class="text-sm text-gray-300">Онлайн встречи</span>
        </div>
        <div class="glass-indicator fade-in-up" style="animation-delay: 1.0s">
          <Users class="w-5 h-5 text-[#2dd4bf]" />
          <span class="text-sm text-gray-300">500+ учеников</span>
        </div>
        <div class="glass-indicator fade-in-up" style="animation-delay: 1.2s">
          <TrendingUp class="w-5 h-5 text-[#6366f1]" />
          <span class="text-sm text-gray-300">98% довольны</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Globe, MessageCircle, TrendingUp, Users } from 'lucide-vue-next';
</script>

<style scoped>
.floating-orb-1 {
  animation: floatOrb1 15s ease-in-out infinite;
}
.floating-orb-2 {
  animation: floatOrb2 15s ease-in-out infinite;
}
@keyframes floatOrb1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(60px, -40px) scale(1.08); }
  50% { transform: translate(-20px, 50px) scale(0.94); }
  75% { transform: translate(-50px, -30px) scale(1.03); }
}
@keyframes floatOrb2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(-50px, 30px) scale(1.08); }
  50% { transform: translate(30px, -40px) scale(0.94); }
  75% { transform: translate(25px, 50px) scale(1.03); }
}
.gradient-text-animated {
  background: linear-gradient(90deg, #6366f1, #2dd4bf, #6366f1);
  background-size: 200% 100%;
  animation: gradientMove 4s ease-in-out infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
@keyframes gradientMove {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.glass-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.glass-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(99,102,241,0.3);
  background: rgba(255,255,255,0.1);
}
.glass-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.08);
}
.fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
