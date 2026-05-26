<template>
  <div class="card fade-in">
    <h3>Информация</h3>
    <div class="info-grid">
      <div class="info-item"><strong>Уровень</strong><span>{{ user?.level }}</span></div>
      <div class="info-item"><strong>Рейтинг</strong><span>{{ user?.rating }}🏆</span></div>
      <div class="info-item full-width"><strong>Роль</strong><span>{{ roleLabel }}</span></div>
      <div class="info-item full-width"><strong>О себе</strong><span>{{ user?.bio || 'Не указано' }}</span></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabInfo',
  props: ['user'],
  computed: {
    roleLabel() {
      const role = this.user?.role;
      if (role === 'parent') return 'Родитель';
      if (role === 'admin' || role === 'host') return 'Репетитор';
      return 'Ученик';
    }
  }
};
</script>
<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.info-item { display: flex; flex-direction: column; gap: 6px; }
.info-item strong { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }
.info-item span { font-size: 1rem; font-weight: 500; color: #e2e8f0; }
.full-width { grid-column: 1 / -1; }
.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
