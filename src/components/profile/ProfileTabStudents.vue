<template>
  <div class="card fade-in">
    <h3>{{ title }} ({{ students.length }})</h3>
    <div v-for="s in students" :key="s.id" class="student-card" @click="$emit('view', s)">
      <AppAvatar :src="s.avatar_url" :name="s.username" :size="44" class="student-avatar" />
      <div class="student-info">
        <strong>{{ s.username }}</strong>
        <small>{{ s.level }} · {{ s.rating }}🏆 <span v-if="s.streak">· 🔥{{ s.streak }} дн.</span></small>
      </div>
      <div v-if="showActions" class="student-actions">
        <button class="btn btn-o btn-sm" @click.stop="$emit('bind', s)">👨‍👩‍👧</button>
        <button class="btn btn-o btn-sm" @click.stop="$emit('homework', s)">📝</button>
        <button class="btn btn-o btn-sm" @click.stop="$emit('feedback', s)">📊</button>
      </div>
      <i v-else class="fas fa-chevron-right"></i>
    </div>
    <p v-if="!students.length" class="empty-text">Нет учеников</p>
  </div>
</template>

<script>
import AppAvatar from '../AppAvatar.vue';
export default {
  name: 'ProfileTabStudents',
  components: { AppAvatar },
  props: ['students', 'title', 'showActions'],
  emits: ['view', 'bind', 'homework', 'feedback']
};
</script>
