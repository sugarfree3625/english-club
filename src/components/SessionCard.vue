<template>
  <div class="session-card group cursor-pointer" @click="goToMeeting">
    <div class="card-inner">
      <div class="gradient-strip"></div>
      <div class="card-content">
        <h3 class="font-['Inter'] font-semibold text-lg text-gray-800 mb-3">{{ title }}</h3>
        <div class="flex flex-col gap-2 mb-4">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <Calendar class="w-4 h-4" />
            <span>{{ date }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <Clock class="w-4 h-4" />
            <span>{{ time }}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <Users class="w-4 h-4" />
            <span>{{ participantsCount }} участников</span>
          </div>
        </div>
        <button class="glass-btn group/btn">
          <span>{{ meetingLink ? 'Войти' : 'Записаться' }}</span>
          <ArrowRight class="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Calendar, Clock, Users, ArrowRight } from 'lucide-vue-next';

const props = defineProps({
  title: String,
  date: String,
  time: String,
  participantsCount: Number,
  meetingLink: String
});

const goToMeeting = () => {
  if (props.meetingLink) {
    window.open(props.meetingLink, '_blank');
  }
};
</script>

<style scoped>
.session-card {
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 8px 8px 16px #e2e8f0, -8px -8px 16px #ffffff;
  transition: all 0.3s ease;
  overflow: hidden;
  width: 100%;
}
.session-card:hover {
  box-shadow: inset 4px 4px 12px #e2e8f0, inset -4px -4px 12px #ffffff;
}
.card-inner {
  display: flex;
  min-height: 160px;
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
.glass-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 14px;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
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
</style>
