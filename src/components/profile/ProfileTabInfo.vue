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
