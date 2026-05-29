const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
  app.get('/api/notes', auth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('note')
        .eq('user_id', req.session.userId)
        .maybeSingle();
      if (error) throw error;
      res.json({ note: data?.note || '' });
    } catch (err) { res.json({ note: '' }); }
  });

  app.put('/api/notes', auth, async (req, res) => {
    try {
      // Проверяем, есть ли заметка
      const { data: existing } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', req.session.userId)
        .maybeSingle();

      if (existing) {
        // Обновляем существующую
        const { error } = await supabase
          .from('notes')
          .update({ note: req.body.note })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Создаём новую
        const { error } = await supabase
          .from('notes')
          .insert({ user_id: req.session.userId, note: req.body.note });
        if (error) throw error;
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error('PUT /api/notes error:', err);
      res.status(500).json({ error: 'Не удалось сохранить заметку' });
    }
  });
};
