import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import DashboardPage from '../views/DashboardPage.vue';
import ProfilePage from '../views/ProfilePage.vue';
import MessagesPage from '../views/MessagesPage.vue';
import AdminPanel from '../components/AdminPanel.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/dashboard', component: DashboardPage },
  { path: '/profile', component: ProfilePage },
  { path: '/messages', component: MessagesPage },
  { path: '/admin', component: AdminPanel }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
