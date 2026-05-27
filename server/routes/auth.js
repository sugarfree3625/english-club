const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');

module.exports = (app, supabase) => {
  const { notifyUser, updateRating } = require('../utils/telegram');
  const { getLevel } = require('../utils/helpers');

  async function ensureTutorChat(userId) {
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').limit(1);
    if (!admins?.length) return;
    const adminId = admins[0].id;
    const { data: existing } = await supabase.from('msg').select('id').or(`and(sender_id.eq.${userId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${userId})`).limit(1);
    if (!existing?.length) {
      await supabase.from('msg').insert({ sender_id: adminId, receiver_id: userId, message: '👋 Добро пожаловать! Я ваш репетитор.', read: false });
    }
  }

  app.post('/api/reg', async (req, res) => {
    const { username, email, password, level } = req.body;
    const { data: exists } = await supabase.from('users').select('id').eq('email', email).single();
    if (exists) return res.status(400).json({ error: 'Email занят' });
    const hash = await bcrypt.hash(password, 10);
    const { data: newUser } = await supabase.from('users').insert({ username, email, password: hash, level: level || 'B1' }).select('id').single();
    if (newUser) ensureTutorChat(newUser.id);
    res.json({ success: true });
  });

  app.post('/api/login', async (req, res) => {
    const { data: u } = await supabase.from('users').select('*').eq('email', req.body.email).single();
    if (!u || !(await bcrypt.compare(req.body.password, u.password))) return res.status(400).json({ error: 'Неверно' });
    req.session.userId = u.id; req.session.role = u.role;
    ensureTutorChat(u.id);
    res.json({ success: true, user: { id: u.id, username: u.username, role: u.role, level: u.level, rating: u.rating, avatar_url: u.avatar_url, bio: u.bio } });
  });

  app.get('/api/me', async (req, res) => {
    if (!req.session.userId) return res.json({ ok: false });
    const { data: u } = await supabase.from('users').select('id,username,role,level,rating,avatar_url,bio').eq('id', req.session.userId).single();
    res.json({ ok: true, user: u });
  });

  app.put('/api/me', auth, async (req, res) => {
    const u = {};
    if (req.body.avatar_url) u.avatar_url = req.body.avatar_url;
    if (req.body.bio !== undefined) u.bio = req.body.bio;
    if (req.body.level) u.level = req.body.level;
    await supabase.from('users').update(u).eq('id', req.session.userId);
    res.json({ success: true });
  });

  app.post('/api/out', (req, res) => { req.session.destroy(); res.json({ success: true }); });
  app.post('/api/reset-password', async (req, res) => { res.json({ success: true }); });
};
