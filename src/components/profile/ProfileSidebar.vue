<template>
  <div class="profile-sidebar">
    <div class="profile-avatar-section">
      <div class="avatar-wrapper" @click="$refs.avatarInput.click()" title="Сменить фото">
        <AppAvatar :src="user?.avatar_url" :name="user?.username || 'U'" :size="80" class="profile-avatar" />
        <span class="level-badge">{{ user?.level }}</span>
        <div class="avatar-overlay"><i class="fas fa-camera"></i></div>
      </div>
      <input type="file" ref="avatarInput" @change="$emit('upload-avatar', $event)" accept="image/*" style="display:none">
      <h3>{{ user?.username }}</h3>
      <span class="profile-rating">{{ user?.rating }}🏆</span>
    </div>
    <button class="btn btn-p btn-sm w-100" @click="$emit('link-telegram')"><i class="fab fa-telegram"></i> Telegram</button>
    <button class="btn btn-o btn-sm w-100" @click="$emit('export-pdf')">📊 Экспорт прогресса</button>
    <nav class="sidebar-nav">
      <button v-for="btn in visibleButtons" :key="btn.tab" class="sidebar-btn" :class="{ active: currentTab === btn.tab }" @click="$emit('switch-tab', btn)">
        <i :class="btn.icon"></i> {{ btn.label }}
      </button>
    </nav>
    <div class="sidebar-footer">
      <button class="sidebar-btn" @click="$router.push('/messages')"><i class="fas fa-comments"></i> Чат</button>
      <button class="sidebar-btn" @click="$router.push('/dashboard')"><i class="fas fa-arrow-left"></i> Назад</button>
    </div>
  </div>
</template>

<script>
import AppAvatar from '../AppAvatar.vue';

export default {
  name: 'ProfileSidebar',
  components: { AppAvatar },
  props: {
    user: Object,
    currentTab: String,
    isStudent: Boolean,
    isParent: Boolean,
    isTutor: Boolean
  },
  emits: ['switch-tab', 'upload-avatar', 'link-telegram', 'export-pdf'],
  computed: {
    visibleButtons() {
      const btns = [
        { tab: 'info', icon: 'fas fa-user', label: 'Инфо' },
        { tab: 'achievements', icon: 'fas fa-trophy', label: 'Достижения', load: 'loadAchievements' },
        { tab: 'myschedule', icon: 'fas fa-calendar-check', label: 'Расписание', load: 'loadMySlots' },
        { tab: 'words', icon: 'fas fa-book', label: 'Словарь', show: this.isStudent || this.isTutor },
        { tab: 'notes', icon: 'fas fa-sticky-note', label: 'Блокнот', show: this.isStudent },
        { tab: 'myhomework', icon: 'fas fa-tasks', label: 'Задания', show: this.isStudent, load: 'loadMyHomework' },
        { tab: 'children', icon: 'fas fa-child', label: 'Мои дети', show: this.isParent, load: 'loadMyStudents' },
        { tab: 'feedbacks', icon: 'fas fa-star', label: 'Мои фидбеки', show: this.isParent, load: 'loadFeedbacks' },
        { tab: 'allfeedbacks', icon: 'fas fa-star', label: 'Все фидбеки', show: this.isTutor, load: 'loadAllFeedbacks' },
        { tab: 'students', icon: 'fas fa-users', label: 'Ученики', show: this.isTutor, load: 'loadAllStudents' },
        { tab: 'homework', icon: 'fas fa-tasks', label: 'Задания', show: this.isTutor },
        { tab: 'history', icon: 'fas fa-history', label: 'История' }
      ];
      return btns.filter(b => b.show !== false);
    }
  }
};
</script>

<style scoped>
.profile-sidebar { width: 260px; flex-shrink: 0; background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 6px; }
.profile-avatar-section { text-align: center; padding: 20px 0; }
.avatar-wrapper { position: relative; display: inline-block; cursor: pointer; padding: 3px; background: linear-gradient(135deg, #6366f1, #2dd4bf); border-radius: 50%; }
.profile-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #0b1120; }
.avatar-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; color: #fff; font-size: 1.5rem; border-radius: 50%; background: rgba(0,0,0,0.5); transition: opacity 0.3s; }
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.level-badge { position: absolute; bottom: 0; right: -4px; background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; }
.profile-rating { color: #f59e0b; font-weight: 700; }
h3 { color: #fff; font-family: 'Space Grotesk', sans-serif; }
.sidebar-nav { flex: 1; }
.sidebar-btn { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-radius: 14px; border: none; background: transparent; cursor: pointer; font-weight: 500; font-size: 0.85rem; color: #94a3b8; width: 100%; text-align: left; transition: all 0.2s; }
.sidebar-btn:hover, .sidebar-btn.active { background: rgba(99,102,241,0.15); color: #fff; }
.sidebar-footer { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, #6366f1, #2dd4bf); color: #fff; }
.btn-o { border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; background: rgba(255,255,255,0.05); }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.w-100 { width: 100%; justify-content: center; }
</style>
