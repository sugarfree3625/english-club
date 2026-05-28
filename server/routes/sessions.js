const { auth } = require('../middleware/auth');
const { updateRating } = require('../utils/telegram');
const { getLevel } = require('../utils/helpers');

module.exports = (app, supabase) => {
  app.get('/api/ses', auth, async (req, res) => {
    const { data } = await supabase.from('sessions').select('*, users!host_id(username, avatar_url)').order('date', { ascending: true });
    res.json(data || []);
  });

  app.post('/api/ses', auth, async (req, res) => {
    if (req.session.role !== 'host' && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    const ml = req.body.meeting_link || `https://meet.jit.si/english-club-${Date.now()}`;
    await supabase.from('sessions').insert({ title: req.body.title, description: req.body.description, host_id: req.session.userId, date: req.body.date, duration: req.body.duration, max_participants: req.body.max_participants, meeting_link: ml });
    await updateRating(supabase, req.session.userId, 15, getLevel);
    res.json({ success: true, meeting_link: ml });
  });

  app.get('/api/myb', auth, async (req, res) => {
    const { data } = await supabase.from('bookings').select('id, status, sessions(title, date, meeting_link)').eq('user_id', req.session.userId);
    res.json(data?.map(b => ({ bid: b.id, status: b.status, title: b.sessions?.title, date: b.sessions?.date, meeting_link: b.sessions?.meeting_link })) || []);
  });

  app.delete('/api/ses/:id', auth, async (req, res) => {
    const { data: s } = await supabase.from('sessions').select('host_id').eq('id', req.params.id).single();
    if (!s) return res.status(404).json({ error: 'Нет' });
    if (s.host_id !== req.session.userId && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    await supabase.from('sessions').delete().eq('id', req.params.id);
    res.json({ success: true });
  });
};
