const { auth } = require('../middleware/auth');
const { notifyUser } = require('../utils/telegram');

module.exports = (app, supabase) => {
  // Создать задание (админ/репетитор)
  app.post('/api/homework', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      const { student_id, title, description, due_date, type, max_grade, experience, attachment_url } = req.body;
      if (!student_id || !title) return res.status(400).json({ error: 'Укажите ученика и название' });
      
      const { data, error } = await supabase.from('homework').insert({
        student_id, title, description: description || '',
        due_date: due_date || null,
        type: type || 'homework',
        max_grade: max_grade || 10,
        experience: experience || 50,
        attachment_url: attachment_url || null,
        created_by: req.session.userId,
        status: 'assigned'
      }).select('id').single();
      
      if (error) throw error;
      notifyUser(supabase, student_id, `📝 Новое задание: ${title}`);
      res.status(201).json({ success: true, id: data?.id });
    } catch (err) {
      res.status(500).json({ error: 'Не удалось создать задание' });
    }
  });

  // Мои задания (ученик)
  app.get('/api/homework/my', auth, async (req, res) => {
    try {
      const { data } = await supabase.from('homework')
        .select('*')
        .eq('student_id', req.session.userId)
        .order('created_at', { ascending: false });
      res.json(data || []);
    } catch (err) { res.json([]); }
  });

  // Задания детей (родитель)
  app.get('/api/homework/children', auth, async (req, res) => {
    try {
      if (req.session.role !== 'parent') return res.json([]);
      const { data: links } = await supabase.from('student_parents')
        .select('student_id').eq('parent_id', req.session.userId);
      if (!links?.length) return res.json([]);
      const ids = links.map(l => l.student_id);
      const { data } = await supabase.from('homework')
        .select('*, users!homework_student_id_fkey(username, avatar_url)')
        .in('student_id', ids)
        .order('created_at', { ascending: false });
      
      const result = (data || []).map(h => ({
        ...h,
        student_name: h.users?.username || 'Ученик',
        student_avatar: h.users?.avatar_url
      }));
      res.json(result);
    } catch (err) { res.json([]); }
  });

  // Все задания (админ)
  app.get('/api/homework/all', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      const { data } = await supabase.from('homework')
        .select('*, student:student_id(username, avatar_url), teacher:created_by(username)')
        .order('created_at', { ascending: false });
      
      const result = (data || []).map(h => ({
        ...h,
        student_name: h.student?.username || 'Ученик',
        student_avatar: h.student?.avatar_url,
        teacher_name: h.teacher?.username || 'Репетитор'
      }));
      res.json(result);
    } catch (err) { console.error('GET /api/homework/all error:', err); res.json([]); }
  });

  // Обновить задание (статус, ответ, оценка)
  app.put('/api/homework/:id', auth, async (req, res) => {
    try {
      const updates = {};
      const allowed = ['status', 'student_answer', 'answer_attachment_url', 'grade', 'teacher_comment', 'title', 'description', 'due_date', 'type', 'max_grade', 'experience'];
      allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
      
      if (updates.status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      updates.updated_at = new Date().toISOString();
      
      // Проверка прав: ученик может менять только свои, админ — все
      const { data: hw } = await supabase.from('homework').select('student_id').eq('id', req.params.id).single();
      if (!hw) return res.status(404).json({ error: 'Задание не найдено' });
      
      if (req.session.role !== 'admin' && req.session.role !== 'host' && hw.student_id !== req.session.userId) {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      const { error } = await supabase.from('homework').update(updates).eq('id', req.params.id);
      if (error) throw error;
      
      // Уведомление при проверке
      if (updates.grade && hw.student_id !== req.session.userId) {
        notifyUser(supabase, hw.student_id, `✅ Задание проверено! Оценка: ${updates.grade}/${updates.max_grade || 10}`);
      }
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Не удалось обновить задание' });
    }
  });

  // Удалить задание
  app.delete('/api/homework/:id', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      const { error } = await supabase.from('homework').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Не удалось удалить задание' });
    }
  });
};
