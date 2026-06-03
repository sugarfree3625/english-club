const { auth } = require('../middleware/auth');
const { updateRating } = require('../utils/telegram');
const { getLevel } = require('../utils/helpers');

module.exports = (app, supabase) => {
  
  // ==================== ПОЛУЧИТЬ СЛОВА (с правами + имена учеников) ====================
  app.get('/api/words', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      const role = req.session.role;
      
      // JOIN с users для получения имени ученика
      let query = supabase.from('words').select('*, users!words_user_id_fkey(username)');
      
      // Админ видит ВСЕ слова
      if (role === 'admin' || role === 'host') {
        if (req.query.user_id) {
          query = query.eq('user_id', req.query.user_id);
        }
      }
      // Родитель видит слова своих детей
      else if (role === 'parent') {
        const { data: children } = await supabase
          .from('student_parents')
          .select('student_id')
          .eq('parent_id', uid);
        
        const childIds = (children || []).map(c => c.student_id);
        childIds.push(uid);
        
        query = query.in('user_id', childIds);
        
        if (req.query.user_id) {
          query = query.eq('user_id', req.query.user_id);
        }
      }
      // Ученик видит только свои
      else {
        query = query.eq('user_id', uid);
      }
      
      // Поиск по дате
      if (req.query.date_from) {
        query = query.gte('created_at', req.query.date_from);
      }
      if (req.query.date_to) {
        query = query.lte('created_at', req.query.date_to + 'T23:59:59');
      }
      
      // Сортировка
      const sortBy = req.query.sort || 'created_at';
      const sortOrder = req.query.order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Добавляем _student_name из JOIN
      const result = (data || []).map(w => ({
        ...w,
        _student_name: w.users?.username || null
      }));
      
      res.json(result);
    } catch (err) {
      console.error('GET /api/words error:', err);
      res.status(500).json({ error: 'Ошибка загрузки словаря' });
    }
  });

  // ==================== ДОБАВИТЬ СЛОВО ====================
  app.post('/api/words', auth, async (req, res) => {
    try {
      const { en, ru, transcription, part_of_speech, category, example, user_id } = req.body;
      
      if (!en || !ru || !en.trim() || !ru.trim()) {
        return res.status(400).json({ error: 'Заполните оба поля' });
      }
      
      let targetUserId = req.session.userId;
      
      // Админ может добавлять слова другим ученикам
      if ((req.session.role === 'admin' || req.session.role === 'host') && user_id) {
        targetUserId = user_id;
      }
      // Родитель может добавлять только детям
      else if (req.session.role === 'parent' && user_id) {
        const { data: children } = await supabase
          .from('student_parents')
          .select('student_id')
          .eq('parent_id', req.session.userId)
          .eq('student_id', user_id)
          .maybeSingle();
        
        if (!children) {
          return res.status(403).json({ error: 'Нет доступа к этому ученику' });
        }
        targetUserId = user_id;
      }
      
      // Проверка на дубликат
      const { data: existing } = await supabase
        .from('words')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('en', en.trim())
        .maybeSingle();
      
      if (existing) {
        return res.status(409).json({ error: 'Такое слово уже есть' });
      }
      
      // Добавляем слово
      const { data: newWord, error } = await supabase.from('words').insert({
        user_id: targetUserId,
        en: en.trim(),
        ru: ru.trim(),
        transcription: transcription || null,
        part_of_speech: part_of_speech || null,
        category: category || null,
        example: example || null,
        created_at: new Date().toISOString()
      }).select().single();
      
      if (error) throw error;
      
      // Начисляем XP
      try { await updateRating(supabase, targetUserId, 3, getLevel); } catch(e) {}
      
      // Проверяем достижения
      const { count } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);
      
      const { data: earned } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', targetUserId);
      
      const earnedIds = (earned || []).map(e => e.achievement_id);
      const { data: achs } = await supabase
        .from('achievements')
        .select('*')
        .eq('condition_field', 'words_count')
        .lte('condition_value', count || 0);
      
      const unlocked = [];
      if (achs) {
        for (const a of achs) {
          if (!earnedIds.includes(a.id)) {
            const { error: ie } = await supabase.from('user_achievements').insert({
              user_id: targetUserId,
              achievement_id: a.id
            });
            if (!ie) unlocked.push(a);
          }
        }
      }
      
      res.status(201).json({ 
        success: true, 
        word: newWord,
        newAchievements: unlocked 
      });
    } catch (err) {
      console.error('POST /api/words error:', err);
      res.status(500).json({ error: 'Не удалось добавить слово' });
    }
  });

  // ==================== ОБНОВИТЬ СЛОВО ====================
  app.put('/api/words/:id', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      const role = req.session.role;
      
      const { data: word } = await supabase
        .from('words')
        .select('user_id')
        .eq('id', req.params.id)
        .single();
      
      if (!word) return res.status(404).json({ error: 'Слово не найдено' });
      
      // Права на редактирование
      if (word.user_id !== uid && role !== 'admin' && role !== 'host') {
        if (role === 'parent') {
          const { data: child } = await supabase
            .from('student_parents')
            .select('id')
            .eq('parent_id', uid)
            .eq('student_id', word.user_id)
            .maybeSingle();
          if (!child) return res.status(403).json({ error: 'Нет доступа' });
        } else {
          return res.status(403).json({ error: 'Нет доступа' });
        }
      }
      
      const u = {};
      ['status', 'next_review', 'repeat_count', 'correct_count', 'wrong_count', 'last_reviewed', 'en', 'ru', 'transcription', 'part_of_speech', 'category', 'example'].forEach(k => {
        if (req.body[k] !== undefined) u[k] = req.body[k];
      });
      
      if (Object.keys(u).length === 0) return res.json({ success: true });
      
      const { error } = await supabase.from('words').update(u).eq('id', req.params.id);
      if (error) throw error;
      
      res.json({ success: true });
    } catch (err) {
      console.error('PUT /api/words error:', err);
      res.status(500).json({ error: 'Не удалось обновить слово' });
    }
  });

  // ==================== УДАЛИТЬ СЛОВО ====================
  app.delete('/api/words/:id', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      const role = req.session.role;
      
      const { data: word } = await supabase
        .from('words')
        .select('user_id')
        .eq('id', req.params.id)
        .single();
      
      if (!word) return res.status(404).json({ error: 'Слово не найдено' });
      
      if (word.user_id !== uid && role !== 'admin' && role !== 'host') {
        return res.status(403).json({ error: 'Нет доступа' });
      }
      
      const { error } = await supabase.from('words').delete().eq('id', req.params.id);
      if (error) throw error;
      
      res.json({ success: true });
    } catch (err) {
      console.error('DELETE /api/words error:', err);
      res.status(500).json({ error: 'Не удалось удалить слово' });
    }
  });

  // ==================== СПИСОК УЧЕНИКОВ (для админа) ====================
  app.get('/api/students-list', auth, async (req, res) => {
    try {
      const role = req.session.role;
      if (role !== 'admin' && role !== 'host') {
        return res.status(403).json({ error: 'Только для админа' });
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, level, avatar_url')
        .in('role', ['user', 'student'])
        .order('username');
      
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      res.status(500).json({ error: 'Ошибка' });
    }
  });
};
