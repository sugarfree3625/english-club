import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import DashboardPage from '../views/DashboardPage.vue';
import ProfilePage from '../views/ProfilePage.vue';
import MessagesPage from '../views/MessagesPage.vue';
import GroupChatPage from '../views/GroupChatPage.vue';
import NotFound from '../views/NotFound.vue';
import Welcome from '../views/Welcome.vue';
import ResetPassword from '../views/ResetPassword.vue';
import SiteEditor from '../views/SiteEditor.vue';
import FullCalendar from '../views/FullCalendar.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/welcome', component: Welcome },
  { path: '/dashboard', component: DashboardPage, meta: { requiresAuth: true } },
  { path: '/profile', component: ProfilePage, meta: { requiresAuth: true } },
  { path: '/messages', component: MessagesPage, meta: { requiresAuth: true } },
  { path: '/groups', component: GroupChatPage, meta: { requiresAuth: true } },
  { path: '/admin', component: SiteEditor, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/reset-password', component: ResetPassword },
  { path: '/calendar', component: FullCalendar, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', component: NotFound }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  if (typeof window !== 'undefined' && window.NProgress) window.NProgress.start();
  
  if (to.meta.requiresAuth) {
    try {
      const axios = (await import('axios')).default;
      const r = await axios.get('/api/me');
      if (!r.data.ok) return next('/');
      if (to.meta.requiresAdmin && r.data.user?.role !== 'admin') return next('/dashboard');
    } catch(e) {
      return next('/');
    }
  }
  next();
});

router.afterEach(() => {
  if (typeof window !== 'undefined' && window.NProgress) window.NProgress.done();
});

export default router;
