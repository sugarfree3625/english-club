const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
  // Создать фидбек
  app.post('/api/feedback', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      const { student_id, rating, topic, good, improve } = req.body;
      if (!student_id || !rating) {
        return res.status(400).json({ error: 'Укажите ученика и оценку' });
      }
      const { error } = await supabase.from('feedbacks').insert({
        student_id,
        rating,
        topic: topic || '',
        good: good || '',
        improve: improve || '',
        created_by: req.session.userId
      });
      if (error) throw error;
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Не удалось сохранить фидбек' });
    }
  });

  // Мои фидбеки (для родителя)
  app.get('/api/feedback/my', auth, async (req, res) => {
    try {
      if (req.session.role !== 'parent') return res.json([]);
      const { data: links } = await supabase
        .from('student_parents')
        .select('student_id')
        .eq('parent_id', req.session.userId);
      if (!links?.length) return res.json([]);
      const ids = links.map(l => l.student_id);
      const { data: feedbacks } = await supabase
        .from('feedbacks')
        .select('*')
        .in('student_id', ids)
        .order('created_at', { ascending: false });
      
      const result = [];
      for (const f of (feedbacks || [])) {
        const { data: student } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', f.student_id)
          .single();
        result.push({
          ...f,
          student_name: student?.username || 'Ученик',
          student_avatar: student?.avatar_url
        });
      }
      res.json(result);
    } catch (err) {
      res.json([]);
    }
  });

  // ВСЕ фидбеки (только для админа)
  app.get('/api/feedback/all', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      const { data: feedbacks } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      
      const result = [];
      for (const f of (feedbacks || [])) {
        const [studentRes, teacherRes] = await Promise.all([
          supabase.from('users').select('username, avatar_url').eq('id', f.student_id).single(),
          supabase.from('users').select('username').eq('id', f.created_by).single()
        ]);
        
        result.push({
          ...f,
          student_name: studentRes?.data?.username || 'Ученик',
          student_avatar: studentRes?.data?.avatar_url || null,
          teacher_name: teacherRes?.data?.username || 'Репетитор'
        });
      }
      res.json(result);
    } catch (err) {
      console.error('GET /api/feedback/all error:', err);
      res.json([]);
    }
  });
};
