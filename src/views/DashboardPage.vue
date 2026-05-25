<template>
  <div class="container">
    <div class="dash-hero fade-in-up">
      <h2>👋 Добро пожаловать, {{ user?.username }}!</h2>
      <p class="hero-sub">{{ user?.level }} · {{ user?.rating }}🏆 <span v-if="streak > 0" class="streak-badge">🔥 {{ streak }} дн.</span></p>
      <div class="dash-btns">
        <button class="btn btn-o btn-sm interactive-btn" @click="showTop = true">🏆 Топ</button>
        <button class="btn btn-o btn-sm interactive-btn" @click="showSearch = true">🔍 Поиск</button>
        <button class="btn btn-o btn-sm interactive-btn" @click="$router.push('/groups')">👥 Группы</button>
        <button class="btn btn-p btn-sm btn-pulse interactive-btn" @click="showPostForm = true" v-if="isTutor">📰 Пост</button>
      </div>
      <div v-if="streak > 0" class="streak-info"><span class="streak-fire">🔥</span> Ты посещаешь клуб <strong>{{ streak }} {{ streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней' }}</strong> подряд!</div>
    </div>

    <section style="margin-top:24px">
      <h2 class="section-title">📰 Лента</h2>
      <div v-if="loadingPosts" style="text-align:center;padding:40px;color:var(--t2)">⏳ Загрузка...</div>
      <div v-else class="feed">
        <div class="feed-card tilt-card fade-in-up" v-for="(p, idx) in posts" :key="p.id" :class="{ pinned: p.pinned }" :style="{ animationDelay: `${idx * 0.06}s` }">
          <div v-if="p.pinned" class="pinned-badge">📌 Закреплено</div>
          <div class="feed-header">
            <img :src="p.aa || 'https://ui-avatars.com/api/?name=' + (p.an || 'U')" class="feed-avatar">
            <div><strong>{{ p.an }}</strong><small>{{ new Date(p.ts).toLocaleString('ru') }}</small></div>
            <div v-if="isTutor" class="feed-actions">
              <button v-if="user?.role === 'admin'" class="btn btn-o btn-sm interactive-btn" @click="togglePin(p)">{{ p.pinned ? '📌' : '📍' }}</button>
              <button class="btn btn-o btn-sm interactive-btn" @click="editPost(p)">✏️</button>
              <button class="btn btn-o btn-sm interactive-btn" style="color:#ef4444" @click="deletePost(p.id)">🗑</button>
            </div>
          </div>
          <h3 class="feed-title">{{ p.title }}</h3>
          <div class="feed-text" v-html="p.content"></div>
          <div class="post-actions">
            <button class="btn btn-o btn-sm interactive-btn" @click="likePost(p)">❤️ {{ p.likes_count || 0 }}</button>
            <button class="btn btn-o btn-sm interactive-btn" @click="showComments(p)">💬 {{ p.comments_count || 0 }}</button>
            <div class="quick-reactions">
              <button class="quick-reaction-btn" @click="quickReact(p, '👍')">👍</button>
              <button class="quick-reaction-btn" @click="quickReact(p, '❤️')">❤️</button>
              <button class="quick-reaction-btn" @click="quickReact(p, '😂')">😂</button>
              <button class="quick-reaction-btn" @click="quickReact(p, '😮')">😮</button>
              <button class="quick-reaction-btn" @click="quickReact(p, '🔥')">🔥</button>
            </div>
          </div>
          <div v-if="commentPost?.id === p.id" class="comments-section">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <img :src="c.users?.avatar_url || 'https://ui-avatars.com/api/?name='+(c.users?.username||'U')" class="comment-avatar">
              <div><strong>{{ c.users?.username }}</strong><small>{{ c.message }}</small></div>
            </div>
            <div class="comment-input"><input class="input" v-model="commentText" placeholder="Комментарий..." @keydown.enter="addComment"><button class="btn btn-p btn-sm" @click="addComment">➤</button></div>
          </div>
        </div>
        <div v-if="hasMorePosts" class="load-more-wrapper"><button class="btn btn-o load-more-btn" @click="loadMorePosts">📜 Показать ещё</button></div>
        <p v-if="!posts.length" class="empty-text">Нет публикаций</p>
      </div>
    </section>

    <div class="modal-overlay" v-if="showTop" @click.self="showTop = false"><div class="modal"><h3>🏆 Топ</h3><div v-for="(u,i) in topUsers" :key="u.id" class="top-item"><span class="top-rank">{{ i+1 }}</span><div><strong>{{ u.username }}</strong><small>{{ u.rating }}🏆 · {{ u.level }}</small></div></div><button class="btn btn-o w-100 mt-2" @click="showTop=false">Закрыть</button></div></div>

    <div class="modal-overlay" v-if="showSearch" @click.self="showSearch = false"><div class="modal" style="max-width:500px"><h3>🔍 Поиск</h3><input class="input" v-model="searchQuery" @input="searchSite"><div v-if="searchResults.posts?.length"><h4>Посты</h4><div v-for="p in searchResults.posts" :key="p.id" class="search-item" @click="showSearch=false">{{ p.title }}</div></div><button class="btn btn-o w-100 mt-2" @click="showSearch=false">Закрыть</button></div></div>

    <PostForm :show="showPostForm" :editId="editingPostId" @close="showPostForm = false; editingPostId = null" @saved="loadPosts" />
  </div>
</template>

<script>
import axios from 'axios';
import PostForm from '../components/PostForm.vue';

export default {
  name: 'DashboardPage',
  components: { PostForm },
  props: ['user', 'settings'],
  inject: ['addToast'],
  data() {
    return {
      streak: 0, posts: [], loadingPosts: true, hasMorePosts: false, postsPage: 0,
      showTop: false, topUsers: [], showSearch: false, searchQuery: '', searchResults: { posts: [], sessions: [] },
      showPostForm: false, editingPostId: null,
      commentPost: null, comments: [], commentText: ''
    };
  },
  computed: {
    isTutor() { return this.user?.role === 'admin' || this.user?.role === 'host'; },
  },
  async mounted() {
    await Promise.all([this.loadPosts(), this.loadTop(), this.loadStreak()]);
  },
  methods: {
    async loadPosts() { this.loadingPosts = true; try { const r = await axios.get('/api/posts?page=0'); this.posts = r.data || []; this.hasMorePosts = r.data?.length === 20; this.postsPage = 0; } catch(e) {} finally { this.loadingPosts = false; } },
    async loadMorePosts() { try { const r = await axios.get(`/api/posts?page=${this.postsPage + 1}`); if (r.data?.length) { this.posts = [...this.posts, ...r.data]; this.postsPage++; this.hasMorePosts = r.data.length === 20; } else this.hasMorePosts = false; } catch(e) {} },
    async loadTop() { try { const r = await axios.get('/api/top'); this.topUsers = r.data || []; } catch(e) {} },
    async loadStreak() { try { const r = await axios.get('/api/streak'); this.streak = r.data?.streak || 0; } catch(e) {} },
    async searchSite() { if (this.searchQuery.length < 2) return; try { const r = await axios.get(`/api/search?q=${this.searchQuery}`); this.searchResults = r.data; } catch(e) {} },
    async likePost(p) { try { const r = await axios.post(`/api/posts/${p.id}/like`); p.likes_count = r.data.count; } catch(e) {} },
    quickReact(p, e) { this.addToast(`${e}`, 'info', 1000); },
    async togglePin(p) { try { await axios.post(`/api/posts/${p.id}/${p.pinned?'unpin':'pin'}`); this.loadPosts(); } catch(e) {} },
    async deletePost(id) { if (confirm('Удалить пост?')) { await axios.delete(`/api/posts/${id}`); this.loadPosts(); } },
    editPost(p) { this.editingPostId = p.id; this.showPostForm = true; },
    async showComments(p) { if (this.commentPost?.id === p.id) { this.commentPost = null; return; } this.commentPost = p; try { const r = await axios.get(`/api/posts/${p.id}/comments`); this.comments = r.data || []; p.comments_count = this.comments.length; } catch(e) {} },
    async addComment() { if (!this.commentText.trim()) return; await axios.post(`/api/posts/${this.commentPost.id}/comments`,{msg:this.commentText}); this.commentText=''; this.showComments(this.commentPost); }
  }
};
</script>

<style scoped>
.container { max-width: 1280px; margin: 0 auto; padding: 32px 24px; }
.dash-hero { background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04)); border-radius: 24px; padding: 32px; margin-bottom: 32px; text-align: center; }
.dash-hero h2 { font-weight: 800; font-size: 1.5rem; }
.hero-sub { color: var(--t2); margin-top: 6px; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 8px; }
.streak-badge { background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; }
.streak-info { margin-top: 12px; padding: 10px 16px; background: rgba(251,191,36,0.08); border-radius: 14px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; }
.streak-fire { font-size: 1.5rem; animation: pulse 1.5s infinite; }
.dash-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
.section-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 0; }
.feed { display: flex; flex-direction: column; gap: 24px; max-width: 720px; margin: 0 auto; }
.feed-card { background: var(--surface); border-radius: 22px; padding: 28px; box-shadow: var(--shadow); border: 1px solid var(--b); animation: fadeInUp 0.6s ease both; }
.feed-card.pinned { border-color: var(--p); border-width: 2px; background: rgba(99,102,241,0.02); }
.pinned-badge { background: linear-gradient(135deg, var(--p), var(--p2)); color: #fff; padding: 5px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: inline-block; margin-bottom: 12px; }
.feed-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.feed-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid var(--b); }
.feed-actions { margin-left: auto; display: flex; gap: 6px; }
.feed-title { font-weight: 700; font-size: 1.2rem; margin-bottom: 8px; }
.feed-text { color: var(--t2); font-size: 0.95rem; line-height: 1.7; margin-bottom: 14px; }
.post-actions { display: flex; gap: 8px; align-items: center; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--b); flex-wrap: wrap; }
.quick-reactions { display: flex; gap: 4px; margin-left: auto; }
.quick-reaction-btn { background: none; border: 1px solid var(--b); border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.quick-reaction-btn:hover { transform: scale(1.2); border-color: var(--p); }
.comments-section { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--b); }
.comment-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; }
.comment-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.comment-input { display: flex; gap: 8px; margin-top: 10px; }
.comment-input .input { flex: 1; padding: 8px 12px; }
.load-more-wrapper { display: flex; justify-content: center; padding: 20px 0; }
.load-more-btn { padding: 10px 32px; }
.empty-text { text-align: center; color: var(--t2); padding: 40px; }
.input { width: 100%; padding: 10px 14px; border: 2px solid var(--b); border-radius: 12px; font-family: inherit; font-size: 0.9rem; background: var(--bg); color: var(--t); outline: none; margin-bottom: 8px; }
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; cursor: pointer; border: none; font-family: inherit; transition: all 0.2s; }
.btn-p { background: linear-gradient(135deg, var(--p), var(--p2)); color: #fff; }
.btn-o { border: 2px solid var(--b); color: var(--t); background: transparent; }
.btn-sm { padding: 7px 16px; font-size: 0.8rem; }
.w-100 { width: 100%; justify-content: center; }
.interactive-btn { transition: all 0.2s; }
.interactive-btn:hover { transform: translateY(-1px); }
.fade-in-up { animation: fadeInUp 0.6s ease both; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
.modal-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.modal { background: var(--surface); border-radius: 24px; padding: 28px; max-width: 90vw; max-height: 80vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
.modal h3 { font-weight: 700; margin-bottom: 16px; }
.top-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--b); }
.search-item { padding: 10px 14px; cursor: pointer; border-radius: 10px; }
.search-item:hover { background: rgba(99,102,241,0.05); }
@media (max-width: 768px) { .feed { max-width: 100%; } .container { padding: 20px 14px; } }
</style>
