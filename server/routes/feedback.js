const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
  app.post('/api/feedback', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
      const { student_id, rating } = req.body;
      if (!student_id || !rating) return res.status(400).json({ error: 'Укажите ученика и оценку' });
      const { error } = await supabase.from('feedbacks').insert({ ...req.body, created_by: req.session.userId });
      if (error) throw error;
      res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Не удалось сохранить фидбек' }); }
  });

  app.get('/api/feedback/my', auth, async (req, res) => {
    try {
      if (req.session.role !== 'parent') return res.json([]);
      const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', req.session.userId);
      if (!links?.length) return res.json([]);
      const ids = links.map(l => l.student_id);
      const { data: feedbacks } = await supabase.from('feedbacks').select('*').in('student_id', ids).order('created_at', { ascending: false });
      const result = [];
      for (const f of (feedbacks || [])) {
        const { data: student } = await supabase.from('users').select('username, avatar_url').eq('id', f.student_id).single();
        result.push({ ...f, student_name: student?.username || 'Ученик', student_avatar: student?.avatar_url });
      }
      res.json(result);
    } catch (err) { res.json([]); }
  });
};
