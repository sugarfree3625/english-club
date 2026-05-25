<template>
  <section class="hero-new">
    <div class="hero-orb hero-orb-1"></div>
    <div class="hero-orb hero-orb-2"></div>

    <div class="hero-content-new">
      <h1 class="hero-title">
        <span class="gradient-text-animated">Speak English Freely</span>
      </h1>

      <p class="hero-subtitle fade-in-up" style="animation-delay: 0.3s">
        Разговорный клуб нового поколения
      </p>

      <button class="glass-btn fade-in-up" style="animation-delay: 0.6s">
        <i class="fas fa-comment-dots hero-icon"></i>
        <span>Начать говорить</span>
      </button>

      <div class="hero-indicators">
        <div class="glass-indicator fade-in-up" style="animation-delay: 0.8s">
          <i class="fas fa-globe" style="color: var(--p)"></i>
          <span>Онлайн встречи</span>
        </div>
        <div class="glass-indicator fade-in-up" style="animation-delay: 1.0s">
          <i class="fas fa-users" style="color: #2dd4bf"></i>
          <span>500+ учеников</span>
        </div>
        <div class="glass-indicator fade-in-up" style="animation-delay: 1.2s">
          <i class="fas fa-chart-line" style="color: var(--p)"></i>
          <span>98% довольны</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-new {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.3;
  pointer-events: none;
}
.hero-orb-1 {
  width: 600px;
  height: 600px;
  background: #6366f1;
  top: -200px;
  left: -200px;
  animation: floatOrb1 15s ease-in-out infinite;
}
.hero-orb-2 {
  width: 500px;
  height: 500px;
  background: #2dd4bf;
  bottom: -200px;
  right: -200px;
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
.hero-content-new {
  position: relative;
  z-index: 1;
  padding: 0 24px;
  max-width: 700px;
  width: 100%;
}
.hero-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 20px;
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
.hero-subtitle {
  font-size: 1.15rem;
  color: #94a3b8;
  margin-bottom: 32px;
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
  margin-bottom: 40px;
}
.glass-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(99,102,241,0.3);
  background: rgba(255,255,255,0.1);
}
.hero-icon {
  transition: all 0.3s;
}
.glass-btn:hover .hero-icon {
  transform: scale(1.2) rotate(-10deg);
}
.hero-indicators {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
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
  color: #94a3b8;
  font-size: 0.9rem;
}
.fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (max-width: 768px) {
  .hero-title { font-size: 2.5rem; }
}
</style>
