const { auth } = require('../middleware/auth');
const { notifyUser } = require('../utils/telegram');
const multer = require('multer');

// Настройка multer для загрузки файлов в память
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = (app, supabase) => {
  // ==================== СОЗДАТЬ ЗАДАНИЕ (с файлом) ====================
  app.post('/api/homework', auth, upload.single('file'), async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      const { student_id, title, description, due_date, type, max_grade, experience } = req.body;
      if (!student_id || !title) return res.status(400).json({ error: 'Укажите ученика и название' });
      
      let attachment_url = null;
      
      // Если есть файл — загружаем в Supabase Storage
      if (req.file) {
        const fileName = `homework/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });
        
        if (uploadError) {
          console.error('Ошибка загрузки файла:', uploadError);
        } else {
          const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
          attachment_url = urlData?.publicUrl || null;
        }
      }
      
      const { data, error } = await supabase.from('homework').insert({
        student_id,
        title,
        description: description || '',
        due_date: due_date || null,
        type: type || 'homework',
        max_grade: max_grade || 10,
        experience: experience || 50,
        attachment_url,
        created_by: req.session.userId,
        status: 'assigned'
      }).select('id').single();
      
      if (error) throw error;
      
      try { notifyUser(supabase, student_id, `📝 Новое задание: ${title}`); } catch(e) {}
      
      res.status(201).json({ success: true, id: data?.id });
    } catch (err) {
      console.error('POST /api/homework error:', err);
      res.status(500).json({ error: 'Не удалось создать задание' });
    }
  });

  // ==================== МОИ ЗАДАНИЯ (ученик) ====================
  app.get('/api/homework/my', auth, async (req, res) => {
    try {
      const { data } = await supabase.from('homework')
        .select('*')
        .eq('student_id', req.session.userId)
        .order('created_at', { ascending: false });
      res.json(data || []);
    } catch (err) { res.json([]); }
  });

  // ==================== ЗАДАНИЯ ДЕТЕЙ (родитель) ====================
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

  // ==================== ВСЕ ЗАДАНИЯ (админ) ====================
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

  // ==================== ОБНОВИТЬ ЗАДАНИЕ (с логикой просрочки) ====================
  app.put('/api/homework/:id', auth, async (req, res) => {
    try {
      const updates = {};
      const allowed = ['status', 'student_answer', 'answer_attachment_url', 'grade', 'teacher_comment', 'title', 'description', 'due_date', 'type', 'max_grade', 'experience'];
      allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
      
      // Получаем текущее задание для проверки дедлайна
      const { data: hw } = await supabase.from('homework').select('*').eq('id', req.params.id).single();
      if (!hw) return res.status(404).json({ error: 'Задание не найдено' });
      
      // Проверка прав
      if (req.session.role !== 'admin' && req.session.role !== 'host' && hw.student_id !== req.session.userId) {
        return res.status(403).json({ error: 'Нет прав' });
      }
      
      // 🔥 ЛОГИКА ПРОСРОЧКИ: если задание завершается и дедлайн прошёл — XP -50%
      if (updates.status === 'completed' || (updates.grade && hw.status !== 'completed')) {
        updates.completed_at = new Date().toISOString();
        
        if (hw.due_date && new Date(hw.due_date) < new Date()) {
          // Просрочено — уменьшаем XP на 50%
          const originalXP = updates.experience || hw.experience || 50;
          updates.experience = Math.round(originalXP * 0.5);
          updates.overdue = true;
          
          // Уведомление о штрафе
          try { 
            notifyUser(supabase, hw.student_id, `⚠️ Задание "${hw.title}" просрочено! XP уменьшены на 50%: ${updates.experience} XP`); 
          } catch(e) {}
        }
      }
      
      updates.updated_at = new Date().toISOString();
      
      const { error } = await supabase.from('homework').update(updates).eq('id', req.params.id);
      if (error) throw error;
      
      // Уведомление при проверке
      if (updates.grade && hw.student_id !== req.session.userId) {
        const xpMsg = updates.overdue ? ` (с учётом штрафа за просрочку)` : '';
        notifyUser(supabase, hw.student_id, `✅ Задание проверено! Оценка: ${updates.grade}/${updates.max_grade || hw.max_grade || 10}. +${updates.experience || hw.experience || 50} XP${xpMsg}`);
      }
      
      res.json({ success: true, overdue: updates.overdue || false });
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
