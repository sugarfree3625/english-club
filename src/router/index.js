import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import DashboardPage from '../views/DashboardPage.vue';
import ProfilePage from '../views/ProfilePage.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/dashboard', component: DashboardPage },
  { path: '/profile', component: ProfilePage }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;