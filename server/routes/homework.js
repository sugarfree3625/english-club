const { auth } = require('../middleware/auth');
const { notifyUser } = require('../utils/telegram');
const multer = require('multer');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = (app, supabase) => {
  // ==================== СОЗДАТЬ ЗАДАНИЕ ====================
  app.post('/api/homework', auth, upload.single('file'), async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      const { student_id, title, description, due_date, type, max_grade, experience } = req.body;
      if (!student_id || !title) return res.status(400).json({ error: 'Укажите ученика и название' });
      
      let attachment_url = null;
      if (req.file) {
        const fileName = `homework/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('uploads').upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
          attachment_url = urlData?.publicUrl || null;
        }
      }
      
      const { data, error } = await supabase.from('homework').insert({
        student_id, title, description: description || '',
        due_date: due_date || null, type: type || 'homework',
        max_grade: max_grade || 10, experience: experience || 50,
        attachment_url, created_by: req.session.userId, status: 'assigned'
      }).select('id').single();
      
      if (error) throw error;
      try { notifyUser(supabase, student_id, `📝 Новое задание: ${title}`); } catch(e) {}
      res.status(201).json({ success: true, id: data?.id });
    } catch (err) {
      console.error('POST /api/homework error:', err);
      res.status(500).json({ error: 'Не удалось создать задание' });
    }
  });

  // ==================== МОИ ЗАДАНИЯ ====================
  app.get('/api/homework/my', auth, async (req, res) => {
    try {
      const { data } = await supabase.from('homework')
        .select('*').eq('student_id', req.session.userId)
        .order('created_at', { ascending: false });
      res.json(data || []);
    } catch (err) { res.json([]); }
  });

  // ==================== ЗАДАНИЯ ДЕТЕЙ ====================
  app.get('/api/homework/children', auth, async (req, res) => {
    try {
      if (req.session.role !== 'parent') return res.json([]);
      const { data: links } = await supabase.from('student_parents')
        .select('student_id').eq('parent_id', req.session.userId);
      if (!links?.length) return res.json([]);
      const ids = links.map(l => l.student_id);
      const { data } = await supabase.from('homework')
        .select('*, users!homework_student_id_fkey(username, avatar_url)')
        .in('student_id', ids).order('created_at', { ascending: false });
      const result = (data || []).map(h => ({
        ...h, student_name: h.users?.username || 'Ученик', student_avatar: h.users?.avatar_url
      }));
      res.json(result);
    } catch (err) { res.json([]); }
  });

  // ==================== ВСЕ ЗАДАНИЯ ====================
  app.get('/api/homework/all', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      const { data } = await supabase.from('homework')
        .select('*, student:student_id(username, avatar_url), teacher:created_by(username)')
        .order('created_at', { ascending: false });
      const result = (data || []).map(h => ({
        ...h, student_name: h.student?.username || 'Ученик',
        student_avatar: h.student?.avatar_url, teacher_name: h.teacher?.username || 'Репетитор'
      }));
      res.json(result);
    } catch (err) { res.json([]); }
  });

  // ==================== ОБНОВИТЬ ЗАДАНИЕ ====================
  app.put('/api/homework/:id', auth, async (req, res) => {
    try {
      const updates = {};
      const allowed = ['status', 'student_answer', 'answer_attachment_url', 'grade', 'teacher_comment', 'title', 'description', 'due_date', 'type', 'max_grade', 'experience'];
      allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
      
      const { data: hw } = await supabase.from('homework').select('*').eq('id', req.params.id).single();
      if (!hw) return res.status(404).json({ error: 'Задание не найдено' });
      
      if (req.session.role !== 'admin' && req.session.role !== 'host' && hw.student_id !== req.session.userId) {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      const { getLevel } = require('../utils/helpers');
      const { updateRating } = require('../utils/telegram');
      
      // 🔥 ЗАВЕРШЕНИЕ ЗАДАНИЯ
      if (updates.status === 'completed' || (updates.grade && hw.status !== 'completed')) {
        updates.completed_at = new Date().toISOString();
        const maxXP = updates.experience || hw.experience || 50;
        
        if (hw.due_date && new Date(hw.due_date) < new Date()) {
          const penalty = -Math.round(maxXP * 0.5);
          updates.experience = 0;
          updates.overdue = true;
          try { await updateRating(supabase, hw.student_id, penalty, getLevel); } catch(e) {}
          try { notifyUser(supabase, hw.student_id, `⚠️ Задание "${hw.title}" просрочено! Штраф: ${penalty} XP`); } catch(e) {}
        } else {
          updates.experience = maxXP;
          try { await updateRating(supabase, hw.student_id, maxXP, getLevel); } catch(e) {}
          try { notifyUser(supabase, hw.student_id, `✅ Задание проверено! +${maxXP} XP. Оценка: ${updates.grade || '—'}/${updates.max_grade || hw.max_grade || 10}`); } catch(e) {}
        }
      }
      
      // 🔄 ВОЗВРАТ НА ДОРАБОТКУ: сброс оценки + фидбек
      if (updates.status === 'in_progress' && hw.status === 'submitted') {
        const penaltyXP = -10;
        updates.grade = null;
        
        try { await updateRating(supabase, hw.student_id, penaltyXP, getLevel); } catch(e) {}
        
        // Создаём фидбек
        try {
          await supabase.from('feedbacks').insert({
            student_id: hw.student_id,
            rating: 3,
            topic: `🔄 Возврат: ${hw.title}`,
            good: 'Требуется доработка',
            improve: req.body.teacher_comment || 'Не указано',
            created_by: req.session.userId
          });
        } catch(e) {}
        
        try { notifyUser(supabase, hw.student_id, `🔄 Задание "${hw.title}" возвращено. ${penaltyXP} XP`); } catch(e) {}
      }
      
      updates.updated_at = new Date().toISOString();
      const { error } = await supabase.from('homework').update(updates).eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('PUT /api/homework error:', err);
      res.status(500).json({ error: 'Не удалось обновить задание' });
    }
  });

  // ==================== УДАЛИТЬ ЗАДАНИЕ ====================
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
