<template>
  <div class="about-page">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="container">
      <h1 class="about-title"><span class="gradient-text">О нашем клубе</span></h1>
      
      <div class="about-grid">
        <div class="about-card glass-card">
          <span class="about-icon">🎯</span>
          <h3>Наша миссия</h3>
          <p>Сделать изучение английского увлекательным и эффективным. Мы создаём среду, где каждый начинает говорить свободно.</p>
        </div>
        <div class="about-card glass-card">
          <span class="about-icon">👥</span>
          <h3>Кто мы</h3>
          <p>Команда профессиональных преподавателей с опытом работы в ведущих языковых школах.</p>
        </div>
        <div class="about-card glass-card">
          <span class="about-icon">📊</span>
          <h3>Результаты</h3>
          <p>500+ учеников, 1500+ проведённых занятий, средний результат IELTS — 7.0.</p>
        </div>
      </div>
      
      <div class="about-cta">
        <button class="btn btn-p" @click="$router.push('/')">На главную</button>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.about-page { min-height: 100vh; background: #0b1120; position: relative; overflow: hidden; padding: 60px 20px; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.15; pointer-events: none; }
.bg-orb-1 { width: 600px; height: 600px; background: #6366f1; top: -200px; left: -200px; }
.bg-orb-2 { width: 500px; height: 500px; background: #2dd4bf; bottom: -200px; right: -200px; }
.container { max-width: 900px; margin: 0 auto; position: relative; z-index: 1; }
.about-title { text-align: center; margin-bottom: 50px; font-size: 2.5rem; font-weight: 800; font-family: 'Space Grotesk', sans-serif; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.about-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
.about-card { padding: 30px; text-align: center; }
.glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; transition: all 0.3s; }
.glass-card:hover { box-shadow: 0 0 30px rgba(99,102,241,0.2); transform: translateY(-3px); }
.about-icon { font-size: 3rem; display: block; margin-bottom: 16px; }
.about-card h3 { color: #fff; font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem; margin-bottom: 10px; }
.about-card p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; }
.about-cta { text-align: center; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; border-radius: 50px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
</style>