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
<style scoped>
.card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 22px; padding: 28px; margin-bottom: 18px; color: #cbd5e1; }
.card h3 { font-weight: 700; margin-bottom: 18px; color: #fff; }
.student-card { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; cursor: pointer; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px; transition: background 0.2s; }
.student-card:hover { background: rgba(99,102,241,0.05); }
.student-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.student-info { flex: 1; }
.student-info strong { display: block; font-size: 0.9rem; color: #fff; }
.student-info small { color: #94a3b8; }
.student-actions { display: flex; gap: 6px; }
.empty-text { text-align: center; color: #64748b; padding: 30px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.fade-in { animation: fadeIn 0.35s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
