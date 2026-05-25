<template>
  <div class="session-card" @click="goToMeeting">
    <div class="gradient-strip"></div>
    <div class="card-content">
      <h3 class="card-title">{{ title }}</h3>
      <div class="card-info">
        <div class="info-row">
          <i class="fas fa-calendar"></i>
          <span>{{ date }}</span>
        </div>
        <div class="info-row">
          <i class="fas fa-clock"></i>
          <span>{{ time }}</span>
        </div>
        <div class="info-row">
          <i class="fas fa-users"></i>
          <span>{{ participantsCount }} участников</span>
        </div>
      </div>
      <button class="glass-btn">
        <span>{{ meetingLink ? 'Войти' : 'Записаться' }}</span>
        <i class="fas fa-arrow-right arrow-icon"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    date: String,
    time: String,
    participantsCount: Number,
    meetingLink: String
  },
  methods: {
    goToMeeting() {
      if (this.meetingLink) window.open(this.meetingLink, '_blank');
    }
  }
};
</script>

<style scoped>
.session-card {
  display: flex;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 8px 8px 16px #e2e8f0, -8px -8px 16px #ffffff;
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: pointer;
  min-height: 160px;
}
.session-card:hover {
  box-shadow: inset 4px 4px 12px #e2e8f0, inset -4px -4px 12px #ffffff;
}
.gradient-strip {
  width: 4px;
  background: linear-gradient(135deg, #6366f1 0%, #2dd4bf 100%);
  transition: all 0.3s ease;
}
.session-card:hover .gradient-strip {
  animation: hologramPulse 0.6s ease-in-out;
}
@keyframes hologramPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; box-shadow: 0 0 12px rgba(99,102,241,0.6); }
}
.card-content {
  flex: 1;
  padding: 20px 24px;
}
.card-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 12px;
}
.card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #64748b;
}
.glass-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 14px;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(99,102,241,0.2);
  color: #6366f1;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}
.glass-btn:hover {
  box-shadow: 0 0 20px rgba(99,102,241,0.3);
  transform: scale(1.02);
}
.arrow-icon {
  transition: transform 0.3s;
}
.glass-btn:hover .arrow-icon {
  transform: translateX(4px);
}
body.dark .session-card {
  background: #1e293b;
  box-shadow: 8px 8px 16px #0f172a, -8px -8px 16px #1e293b;
}
body.dark .session-card:hover {
  box-shadow: inset 4px 4px 12px #0f172a, inset -4px -4px 12px #1e293b;
}
body.dark .card-title { color: #e2e8f0; }
body.dark .info-row { color: #94a3b8; }
body.dark .glass-btn {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.1);
  color: #818cf8;
}
</style>
