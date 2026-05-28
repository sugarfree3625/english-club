const { auth } = require('../middleware/auth');
const { notifyUser } = require('../utils/telegram');

module.exports = (app, supabase) => {
  app.post('/api/homework', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
      const { student_id, title, description, due_date } = req.body;
      if (!student_id || !title) return res.status(400).json({ error: 'Укажите ученика и название' });
      const { error } = await supabase.from('homework').insert({ student_id, title, description, due_date, created_by: req.session.userId });
      if (error) throw error;
      notifyUser(supabase, student_id, `📝 Новое задание: ${title}`);
      res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Не удалось создать задание' }); }
  });

  app.get('/api/homework/my', auth, async (req, res) => {
    try {
      const { data } = await supabase.from('homework').select('*').eq('student_id', req.session.userId).order('created_at', { ascending: false });
      res.json(data || []);
    } catch (err) { res.json([]); }
  });
};
