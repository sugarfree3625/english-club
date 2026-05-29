<template>
  <div class="profile-sidebar">
    <!-- Аватар-секция -->
    <div class="sidebar-avatar-section">
      <div class="avatar-glow"></div>
      <div class="avatar-wrapper" @click="$refs.avatarInput.click()" title="Сменить фото">
        <AppAvatar :src="user?.avatar_url" :name="user?.username || 'U'" :size="80" class="profile-avatar" />
        <span class="level-badge">{{ user?.level }}</span>
        <div class="avatar-overlay"><i class="fas fa-camera"></i></div>
      </div>
      <input type="file" ref="avatarInput" @change="$emit('upload-avatar', $event)" accept="image/*" style="display:none">
      <h3 class="sidebar-username">{{ user?.username }}</h3>
      <div class="sidebar-rating">
        <i class="fas fa-star"></i>
        <span>{{ user?.rating }}</span>
      </div>
      <div class="sidebar-role" :class="roleClass">{{ roleLabel }}</div>
    </div>

    <!-- Быстрые действия -->
    <div class="sidebar-actions">
      <button class="action-btn telegram-btn" @click="$emit('link-telegram')">
        <i class="fab fa-telegram"></i>
        <span>Telegram</span>
      </button>
      <button class="action-btn export-btn" @click="$emit('export-pdf')">
        <i class="fas fa-file-export"></i>
        <span>PDF</span>
      </button>
    </div>

    <!-- Разделитель -->
    <div class="sidebar-divider">
      <span>Меню</span>
    </div>

    <!-- Навигация -->
    <nav class="sidebar-nav">
      <button 
        v-for="btn in visibleButtons" 
        :key="btn.tab" 
        class="nav-btn"
        :class="{ active: currentTab === btn.tab }"
        @click="$emit('switch-tab', btn)"
      >
        <span class="nav-icon-wrap" :class="btn.tab">
          <i :class="btn.icon"></i>
        </span>
        <span class="nav-label">{{ btn.label }}</span>
        <span v-if="btn.badge" class="nav-badge">{{ btn.badge }}</span>
      </button>
    </nav>

    <!-- Разделитель -->
    <div class="sidebar-divider">
      <span>Быстрый доступ</span>
    </div>

    <!-- Футер -->
    <div class="sidebar-footer">
      <button class="nav-btn" @click="$router.push('/messages')">
        <span class="nav-icon-wrap messages">
          <i class="fas fa-comments"></i>
        </span>
        <span class="nav-label">Чат</span>
      </button>
      <button class="nav-btn" @click="$router.push('/dashboard')">
        <span class="nav-icon-wrap back">
          <i class="fas fa-arrow-left"></i>
        </span>
        <span class="nav-label">Дашборд</span>
      </button>
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
    roleLabel() {
      const r = this.user?.role;
      if (r === 'parent') return '👨‍👩‍👧 Родитель';
      if (r === 'admin' || r === 'host') return '👨‍🏫 Репетитор';
      return '👨‍🎓 Ученик';
    },
    roleClass() {
      if (this.user?.role === 'parent') return 'role-parent';
      if (this.user?.role === 'admin' || this.user?.role === 'host') return 'role-tutor';
      return 'role-student';
    },
    visibleButtons() {
      const btns = [
        { tab: 'info', icon: 'fas fa-id-card', label: 'Инфо' },
        { tab: 'achievements', icon: 'fas fa-trophy', label: 'Достижения', load: 'loadAchievements' },
        { tab: 'myschedule', icon: 'fas fa-calendar-alt', label: 'Расписание', load: 'loadMySlots' },
        { tab: 'games', icon: 'fas fa-gamepad', label: 'Игры', show: this.isStudent || this.isTutor, load: 'loadGames' },
        { tab: 'words', icon: 'fas fa-book-open', label: 'Словарь', show: this.isStudent || this.isTutor },
        { tab: 'notes', icon: 'fas fa-sticky-note', label: 'Блокнот', show: this.isStudent },
        { tab: 'progress', icon: 'fas fa-chart-line', label: 'Прогресс', show: this.isStudent, load: 'loadProgress' },
        { tab: 'myhomework', icon: 'fas fa-clipboard-list', label: 'Мои задания', show: this.isStudent, load: 'loadMyHomework' },
        { tab: 'children', icon: 'fas fa-child', label: 'Мои дети', show: this.isParent, load: 'loadMyStudents' },
        { tab: 'feedbacks', icon: 'fas fa-star', label: 'Фидбеки', show: this.isParent, load: 'loadFeedbacks' },
        { tab: 'allfeedbacks', icon: 'fas fa-star-half-alt', label: 'Все фидбеки', show: this.isTutor, load: 'loadAllFeedbacks' },
        { tab: 'students', icon: 'fas fa-users', label: 'Ученики', show: this.isTutor, load: 'loadAllStudents' },
        { tab: 'allhomework', icon: 'fas fa-clipboard-check', label: 'Все задания', show: this.isTutor, load: 'loadMyHomework' },
        { tab: 'homework', icon: 'fas fa-plus-circle', label: 'Создать задание', show: this.isTutor },
        { tab: 'history', icon: 'fas fa-history', label: 'История' }
      ];
      return btns.filter(b => b.show !== false);
    }
  }
};
</script>

<style scoped>
.profile-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(15,15,30,0.95) 0%, rgba(11,17,32,0.98) 100%);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 28px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
}

/* АВАТАР-СЕКЦИЯ */
.sidebar-avatar-section {
  text-align: center;
  padding: 28px 24px 20px;
  position: relative;
  background: linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%);
}
.avatar-glow {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(15px);
  animation: glowPulse 3s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.15); }
}
.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  padding: 3px;
  background: linear-gradient(135deg, #6366f1, #2dd4bf, #f59e0b);
  border-radius: 50%;
  animation: borderRotate 4s linear infinite;
  z-index: 1;
}
@keyframes borderRotate {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #0b1120;
  display: block;
}
.avatar-overlay {
  position: absolute;
  inset: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  color: #fff;
  font-size: 1.5rem;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  transition: opacity 0.3s;
  z-index: 2;
}
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.level-badge {
  position: absolute;
  bottom: 2px;
  right: -2px;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  color: #fff;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  z-index: 3;
  box-shadow: 0 4px 10px rgba(99,102,241,0.4);
}
.sidebar-username {
  color: #fff;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 12px 0 4px;
}
.sidebar-rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  background: rgba(251,191,36,0.12);
  border: 1px solid rgba(251,191,36,0.25);
  border-radius: 20px;
  color: #fbbf24;
  font-weight: 700;
  font-size: 0.85rem;
}
.sidebar-rating i { font-size: 0.7rem; }
.sidebar-role {
  margin-top: 8px;
  padding: 4px 14px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}
.sidebar-role.role-student { background: rgba(99,102,241,0.12); color: #818cf8; }
.sidebar-role.role-parent { background: rgba(251,191,36,0.12); color: #fbbf24; }
.sidebar-role.role-tutor { background: rgba(16,185,129,0.12); color: #10b981; }

/* КНОПКИ ДЕЙСТВИЙ */
.sidebar-actions {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
}
.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.25s;
  font-family: inherit;
  color: #cbd5e1;
  background: rgba(255,255,255,0.03);
}
.action-btn:hover { transform: translateY(-2px); }
.telegram-btn:hover { background: rgba(0,136,204,0.15); border-color: rgba(0,136,204,0.3); color: #08c; }
.export-btn:hover { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); color: #818cf8; }

/* РАЗДЕЛИТЕЛЬ */
.sidebar-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
}
.sidebar-divider::before,
.sidebar-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
}
.sidebar-divider span {
  font-size: 0.65rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
}

/* НАВИГАЦИЯ */
.sidebar-nav {
  flex: 1;
  padding: 4px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  color: #94a3b8;
  width: 100%;
  text-align: left;
  transition: all 0.25s;
  font-family: inherit;
  position: relative;
}
.nav-btn:hover {
  background: rgba(255,255,255,0.04);
  color: #fff;
  transform: translateX(3px);
}
.nav-btn.active {
  background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(45,212,191,0.08));
  color: #fff;
  box-shadow: 0 4px 15px rgba(99,102,241,0.15);
  border: 1px solid rgba(99,102,241,0.2);
}
.nav-btn.active::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, #6366f1, #2dd4bf);
  border-radius: 3px;
}

.nav-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  background: rgba(255,255,255,0.04);
  transition: all 0.25s;
  flex-shrink: 0;
}
.nav-btn:hover .nav-icon-wrap { background: rgba(255,255,255,0.08); }
.nav-btn.active .nav-icon-wrap {
  background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(45,212,191,0.1));
  box-shadow: 0 4px 12px rgba(99,102,241,0.2);
}

/* Цвета иконок по вкладкам */
.nav-icon-wrap.info { color: #60a5fa; }
.nav-icon-wrap.achievements { color: #fbbf24; }
.nav-icon-wrap.myschedule { color: #34d399; }
.nav-icon-wrap.games { color: #f472b6; }
.nav-icon-wrap.words { color: #818cf8; }
.nav-icon-wrap.notes { color: #fbbf24; }
.nav-icon-wrap.progress { color: #10b981; }
.nav-icon-wrap.myhomework { color: #a78bfa; }
.nav-icon-wrap.children { color: #fb923c; }
.nav-icon-wrap.feedbacks { color: #facc15; }
.nav-icon-wrap.allfeedbacks { color: #facc15; }
.nav-icon-wrap.students { color: #38bdf8; }
.nav-icon-wrap.allhomework { color: #a78bfa; }
.nav-icon-wrap.homework { color: #4ade80; }
.nav-icon-wrap.history { color: #94a3b8; }
.nav-icon-wrap.messages { color: #60a5fa; }
.nav-icon-wrap.back { color: #94a3b8; }

.nav-label { flex: 1; }
.nav-badge {
  padding: 2px 8px;
  background: rgba(239,68,68,0.15);
  color: #ef4444;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
}

/* ФУТЕР */
.sidebar-footer {
  padding: 8px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 1px solid rgba(255,255,255,0.05);
  margin-top: 4px;
}
</style>
