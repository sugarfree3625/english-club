<template>
  <div class="card">
    <h3 class="card-title">🏆 Таблица лидеров</h3>
    <div class="leader-list">
      <div v-for="(u, i) in users" :key="u.id" class="leader-item" :class="{ me: u.id === currentUserId }">
        <div class="leader-rank" :class="rankClass(i + 1)">{{ i + 1 }}</div>
        <AppAvatar :src="u.avatar_url" :name="u.username" :size="36" class="leader-avatar" />
        <div class="leader-info">
          <div class="leader-name">{{ u.username }}</div>
          <div class="leader-level">{{ u.level }}</div>
        </div>
        <div class="leader-rating">{{ u.rating }} 🏆</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import AppAvatar from '../AppAvatar.vue';

export default {
  name: 'Leaderboard',
  components: { AppAvatar },
  props: ['currentUserId'],
  data() {
    return { users: [] };
  },
  async mounted() {
    try {
      const r = await axios.get('/api/top');
      this.users = (r.data || []).slice(0, 10);
    } catch(e) {}
  },
  methods: {
    rankClass(rank) {
      if (rank === 1) return 'gold';
      if (rank === 2) return 'silver';
      if (rank === 3) return 'bronze';
      return '';
    }
  }
};
</script>

<style scoped>
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 14px; }
.leader-list { display: flex; flex-direction: column; gap: 4px; }
.leader-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; transition: all 0.2s; }
.leader-item:hover { background: rgba(255,255,255,0.03); }
.leader-item.me { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); }
.leader-rank { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; border-radius: 8px; background: rgba(255,255,255,0.05); color: #94a3b8; }
.leader-rank.gold { background: rgba(255,215,0,0.2); color: #ffd700; }
.leader-rank.silver { background: rgba(192,192,192,0.2); color: #c0c0c0; }
.leader-rank.bronze { background: rgba(205,127,50,0.2); color: #cd7f32; }
.leader-avatar { border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); }
.leader-info { flex: 1; }
.leader-name { font-size: 0.85rem; font-weight: 600; color: #fff; }
.leader-level { font-size: 0.7rem; color: #94a3b8; }
.leader-rating { font-size: 0.85rem; font-weight: 700; color: #f59e0b; }
</style>
