const auth = require('../middleware/auth');

module.exports = (app, supabase) => {
  app.get('/api/dialogs', auth, async (req, res) => {
    const uid = req.session.userId;
    const { data: msgs } = await supabase.from('msg').select('*').or(`sender_id.eq.${uid},receiver_id.eq.${uid}`).order('ts', { ascending: false });
    const seen = new Set(), result = [];
    msgs?.forEach(m => {
      const pid = m.sender_id === uid ? m.receiver_id : m.sender_id;
      if (pid && !seen.has(pid)) { seen.add(pid); result.push({ partner_id: pid, message: m.message, ts: m.ts }); }
    });
    for (let r of result) {
      const { data: u } = await supabase.from('users').select('username, avatar_url').eq('id', r.partner_id).single();
      if (u) { r.username = u.username; r.avatar_url = u.avatar_url; }
    }
    res.json(result);
  });

  app.get('/api/messages/:userId', auth, async (req, res) => {
    const { data } = await supabase.from('msg').select('*').or(`and(sender_id.eq.${req.session.userId},receiver_id.eq.${req.params.userId}),and(sender_id.eq.${req.params.userId},receiver_id.eq.${req.session.userId})`).order('ts', { ascending: true });
    res.json(data || []);
  });

  app.get('/api/unread', auth, async (req, res) => {
    const { count } = await supabase.from('msg').select('*', { count: 'exact', head: true }).eq('receiver_id', req.session.userId).is('read', false);
    res.json({ count: count || 0 });
  });

  app.post('/api/msg/:id/read', auth, async (req, res) => {
    await supabase.from('msg').update({ read: true }).eq('id', req.params.id).eq('receiver_id', req.session.userId);
    res.json({ success: true });
  });

  app.delete('/api/msg/:id', auth, async (req, res) => {
    await supabase.from('msg').delete().eq('id', req.params.id).eq('sender_id', req.session.userId);
    res.json({ success: true });
  });

  app.get('/api/users', auth, async (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const uid = req.session.userId;
    const { data: u } = await supabase.from('users').select('id,username,avatar_url,level,rating,role').neq('id', uid);
    if (!u) return res.json([]);
    let filtered = u;
    if (req.session.role === 'admin' || req.session.role === 'host') filtered = u;
    else filtered = u.filter(x => x.role === 'admin' || x.role === 'host');
    if (q.length >= 1) filtered = filtered.filter(x => x.username?.toLowerCase().includes(q));
    res.json(filtered.slice(0, 50));
  });

  app.get('/api/top', async (req, res) => {
    const { data } = await supabase.from('users').select('id, username, level, rating, avatar_url').order('rating', { ascending: false }).limit(20);
    res.json(data || []);
  });
};
