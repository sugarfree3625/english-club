const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
  app.get('/api/admin/links', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
      const { data } = await supabase.from('student_parents').select('student_id, parent_id');
      res.json(data || []);
    } catch (err) { res.json([]); }
  });

  app.put('/api/users/:id/role', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
      const { role } = req.body;
      if (!role || !['student', 'parent'].includes(role)) return res.status(400).json({ error: 'Неверная роль' });
      const { error } = await supabase.from('users').update({ role }).eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Не удалось сменить роль' }); }
  });

  app.get('/api/parent/students', auth, async (req, res) => {
    try {
      const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', req.session.userId);
      if (!links?.length) return res.json([]);
      const ids = links.map(l => l.student_id);
      const { data: students } = await supabase.from('users').select('id, username, level, rating, avatar_url').in('id', ids);
      res.json(students || []);
    } catch (err) { res.status(500).json({ error: 'Ошибка загрузки списка детей' }); }
  });

  app.post('/api/parent/bind', auth, async (req, res) => {
    try {
      const { student_id, parent_id } = req.body;
      if (!student_id || !parent_id) return res.status(400).json({ error: 'Нет данных' });
      const { data: existing } = await supabase.from('student_parents').select('id').eq('student_id', student_id).eq('parent_id', parent_id).maybeSingle();
      if (existing) return res.status(409).json({ error: 'Уже привязан' });
      const { error } = await supabase.from('student_parents').insert({ student_id, parent_id });
      if (error) { if (error.code === '23505') return res.status(409).json({ error: 'Связь уже существует' }); throw error; }
      res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Не удалось привязать' }); }
  });

  app.delete('/api/parent/unbind/:studentId/:parentId', auth, async (req, res) => {
    try {
      const { error } = await supabase.from('student_parents').delete().eq('student_id', req.params.studentId).eq('parent_id', req.params.parentId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Не удалось отвязать' }); }
  });
};
