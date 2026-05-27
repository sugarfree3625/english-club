<template>
  <div class="dashboard-wrapper">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="container">
      <DashboardHero :user="user" :streak="streak" />
      <DashboardStats :messages="stats.messages" :meetings="stats.meetings" :words="stats.words" :achievements="stats.achievements" />
      
      <div class="dashboard-grid">
        <div class="main-col">
          <UpcomingLesson :lesson="upcomingLesson" />
          <WordOfDay @save="saveWord" />
          <WeeklyChallenge :progress="challengeProgress" />
        </div>
        <div class="side-col">
          <GoalProgress :percent="goalPercent" :remaining="goalRemaining" />
          <Leaderboard :currentUserId="user?.id" />
          <div class="card achievements-mini">
            <h3>🏆 Ближайшая ачивка</h3>
            <div v-if="nextAchievement" class="next-ach">
              <span class="next-ach-icon">{{ nextAchievement.icon || '🏆' }}</span>
              <div class="next-ach-name">{{ nextAchievement.name }}</div>
              <div class="ach-mini-track">
                <div class="ach-mini-fill" :style="{ width: nextAchievement.progressPercent + '%' }"></div>
              </div>
              <span class="ach-mini-nums">{{ nextAchievement.current_value || 0 }}/{{ nextAchievement.condition_value }}</span>
            </div>
            <p v-else class="empty-text">Все ачивки получены! 🎉</p>
          </div>
          <MiniGame />
        </div>
      </div>

      <WeeklySchedule :slots="weeklySlots" />
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import DashboardHero from '../components/dashboard/DashboardHero.vue';
import DashboardStats from '../components/dashboard/DashboardStats.vue';
import UpcomingLesson from '../components/dashboard/UpcomingLesson.vue';
import WordOfDay from '../components/dashboard/WordOfDay.vue';
import WeeklyChallenge from '../components/dashboard/WeeklyChallenge.vue';
import GoalProgress from '../components/dashboard/GoalProgress.vue';
import MiniGame from '../components/dashboard/MiniGame.vue';
import WeeklySchedule from '../components/dashboard/WeeklySchedule.vue';
import Leaderboard from '../components/dashboard/Leaderboard.vue';
  
export default {
  name: 'DashboardPage',
  components: { DashboardHero, DashboardStats, UpcomingLesson, WordOfDay, WeeklyChallenge, GoalProgress, MiniGame, WeeklySchedule, Leaderboard },
  props: ['user'],
  inject: ['addToast'],
  data() {
    return {
      streak: 0,
      stats: { messages: 0, meetings: 0, words: 0, achievements: 0 },
      upcomingLesson: null,
      weeklySlots: [],
      allAchievements: [],
      challengeProgress: 0
    };
  },
  computed: {
    goalPercent() { return Math.min(100, Math.round((this.stats.meetings / 50) * 100)); },
    goalRemaining() { return Math.max(0, 50 - this.stats.meetings); },
    nextAchievement() {
      return this.allAchievements.filter(a => !a.earned)[0] || null;
    }
  },
  async mounted() {
    try {
      const [streakRes, achRes, slotsRes] = await Promise.all([
        axios.get('/api/streak'),
        axios.get('/api/achievements'),
        axios.get('/api/slots')
      ]);
      this.streak = streakRes.data?.streak || 0;
      this.allAchievements = achRes.data || [];
      const earned = this.allAchievements.filter(a => a.earned);
      this.stats.achievements = earned.length;
      this.stats.messages = this.allAchievements.find(a => a.condition_field === 'messages_count')?.current_value || 0;
      this.stats.meetings = this.allAchievements.find(a => a.condition_field === 'meetings_count')?.current_value || 0;
      this.stats.words = this.allAchievements.find(a => a.condition_field === 'words_count')?.current_value || 0;
      
      const slots = slotsRes.data || [];
      const now = new Date();
      this.upcomingLesson = slots.filter(s => new Date(s.start_time) >= now).sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || null;
      this.weeklySlots = slots;
    } catch(e) {}
  },
  methods: {
    saveWord(word) {
      axios.post('/api/words', { en: word.en, ru: word.ru }).then(() => {
        this.addToast(`"${word.en}" добавлено в словарь! 📖`, 'success');
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.dashboard-wrapper { min-height: 100vh; background: #0b1120; position: relative; overflow: hidden; }
.bg-orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.15; pointer-events: none; }
.bg-orb-1 { width: 600px; height: 600px; background: #6366f1; top: -200px; left: -200px; animation: floatOrb 15s ease-in-out infinite; }
.bg-orb-2 { width: 500px; height: 500px; background: #2dd4bf; bottom: -200px; right: -200px; animation: floatOrb 18s ease-in-out infinite reverse; }
@keyframes floatOrb { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -30px) scale(1.05); } }
.container { max-width: 1100px; margin: 0 auto; padding: 32px 24px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 20px; }
.dashboard-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
@media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
.main-col, .side-col { display: flex; flex-direction: column; gap: 16px; }
.card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; color: #e2e8f0; }
.card h3 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; color: #fff; margin: 0 0 12px; }
.achievements-mini { text-align: center; }
.next-ach { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.next-ach-icon { font-size: 2rem; }
.next-ach-name { font-size: 0.85rem; font-weight: 600; color: #fff; }
.ach-mini-track { width: 100%; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
.ach-mini-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #2dd4bf); border-radius: 2px; }
.ach-mini-nums { font-size: 0.7rem; color: #94a3b8; }
.empty-text { font-size: 0.85rem; color: #94a3b8; }
</style>
