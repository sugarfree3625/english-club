<template>
  <div class="empty-state">
    <div class="calendar-3d">
      <div class="calendar-square">
        <div class="gradient-sphere"></div>
      </div>
    </div>

    <h2 class="empty-title">Ваш календарь свободен</h2>
    <p class="empty-subtitle">Самое время запланировать первую встречу и начать говорить.</p>

    <button class="glass-btn">
      <i class="fas fa-plus"></i>
      <span>Создать встречу</span>
      <span class="connect-line"></span>
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  background: #0f172a;
  text-align: center;
  padding: 40px 20px;
}
.calendar-3d {
  width: 120px;
  height: 120px;
  margin-bottom: 32px;
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
.empty-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 300;
  color: #94a3b8;
  margin-bottom: 12px;
}
.empty-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 32px;
  max-width: 400px;
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
  position: relative;
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
