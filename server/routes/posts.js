const auth = require('../middleware/auth');
const { sanitizeHtml } = require('../utils/helpers');
const { updateRating } = require('../utils/telegram');
const { getLevel } = require('../utils/helpers');

module.exports = (app, supabase) => {
  app.get('/api/posts', auth, async (req, res) => {
    const page = parseInt(req.query.page) || 0; const limit = 20;
    const { data } = await supabase.from('posts').select('*, users!author_id(username, avatar_url), categories(name)').order('pinned', { ascending: false }).order('ts', { ascending: false }).range(page*limit, (page+1)*limit-1);
    res.json(data?.map(p => ({ ...p, an: p.users?.username, aa: p.users?.avatar_url, category: p.categories?.name })) || []);
  });

  app.post('/api/posts', auth, async (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    await supabase.from('posts').insert({ author_id: req.session.userId, title: sanitizeHtml(req.body.title), content: sanitizeHtml(req.body.content), items: req.body.items || '[]', category_id: req.body.category_id || null });
    await updateRating(supabase, req.session.userId, 10, getLevel);
    res.json({ success: true });
  });

  app.post('/api/posts/:id/like', auth, async (req, res) => {
    const { data: ex } = await supabase.from('likes').select('id').eq('post_id', req.params.id).eq('user_id', req.session.userId).single();
    if (ex) await supabase.from('likes').delete().eq('id', ex.id);
    else await supabase.from('likes').insert({ post_id: parseInt(req.params.id), user_id: req.session.userId });
    const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', req.params.id);
    res.json({ liked: !ex, count: count || 0 });
  });

  app.get('/api/posts/:id/comments', auth, async (req, res) => {
    const { data } = await supabase.from('comments').select('*, users!user_id(username, avatar_url)').eq('post_id', req.params.id).order('ts', { ascending: true });
    res.json(data || []);
  });

  app.post('/api/posts/:id/comments', auth, async (req, res) => {
    await supabase.from('comments').insert({ post_id: parseInt(req.params.id), user_id: req.session.userId, message: req.body.msg });
    res.json({ success: true });
  });

  app.get('/api/categories', async (req, res) => {
    const { data } = await supabase.from('categories').select('*').order('name');
    res.json(data || []);
  });
};
