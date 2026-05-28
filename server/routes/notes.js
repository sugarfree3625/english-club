const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
  app.get('/api/notes', auth, async (req, res) => {
    try {
      const { data, error } = await supabase.from('notes').select('note').eq('user_id', req.session.userId).maybeSingle();
      if (error) throw error;
      res.json({ note: data?.note || '' });
    } catch (err) { res.json({ note: '' }); }
  });

  app.put('/api/notes', auth, async (req, res) => {
    try {
      const { error } = await supabase.from('notes').upsert({ user_id: req.session.userId, note: req.body.note });
      if (error) throw error;
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Не удалось сохранить заметку' }); }
  });
};
