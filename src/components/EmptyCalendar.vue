<template>
  <div class="flex items-center justify-center min-h-[70vh] bg-[#0f172a]">
    <div class="text-center">
      <!-- 3D-календарь -->
      <div class="calendar-3d mx-auto mb-8">
        <div class="calendar-square">
          <div class="gradient-sphere"></div>
        </div>
      </div>

      <!-- Текст -->
      <h2 class="font-['Space_Grotesk'] text-2xl font-light text-gray-300 mb-3">
        Ваш календарь свободен
      </h2>
      <p class="font-['Inter'] text-base text-gray-500 mb-8 max-w-md mx-auto">
        Самое время запланировать первую встречу и начать говорить.
      </p>

      <!-- Кнопка с соединительной линией -->
      <button class="glass-btn group relative mx-auto">
        <Plus class="w-5 h-5" />
        <span>Создать встречу</span>
        <span class="connect-line"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Plus } from 'lucide-vue-next';
</script>

<style scoped>
.calendar-3d {
  width: 120px;
  height: 120px;
}
.calendar-square {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.gradient-sphere {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  animation: slowSpin 20s linear infinite;
}
@keyframes slowSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  box-shadow: 0 0 20px rgba(99,102,241,0.3);
  background: rgba(255,255,255,0.1);
}
.connect-line {
  position: absolute;
  top: -40px;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #2dd4bf);
  transition: width 0.6s ease;
  transform: translateX(-50%);
}
.glass-btn:hover .connect-line {
  width: 80px;
}
</style>
