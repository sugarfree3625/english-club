const { auth } = require('../middleware/auth');
const { notifyUser, updateRating } = require('../utils/telegram');
const { getLevel } = require('../utils/helpers');

module.exports = (app, supabase) => {
  // ==================== СЛОВАРЬ ====================
  app.get('/api/words', auth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('user_id', req.session.userId)
        .order('id', { ascending: false });
      
      if (error) throw error;
      res.json(data || []);
    } catch (err) {
      console.error('GET /api/words error:', err);
      res.status(500).json({ error: 'Ошибка загрузки словаря' });
    }
  });

  app.post('/api/words', auth, async (req, res) => {
    try {
      const { en, ru } = req.body;
      
      if (!en || !ru || !en.trim() || !ru.trim()) {
        return res.status(400).json({ error: 'Заполните оба поля' });
      }
      
      const { data: existing } = await supabase
        .from('words')
        .select('id')
        .eq('user_id', req.session.userId)
        .eq('en', en.trim())
        .maybeSingle();
      
      if (existing) {
        return res.status(409).json({ error: 'Такое слово уже есть в словаре' });
      }
      
      const { error } = await supabase
        .from('words')
        .insert({
          user_id: req.session.userId,
          en: en.trim(),
          ru: ru.trim()
        });
      
      if (error) throw error;
      
      try {
        await updateRating(supabase, req.session.userId, 3, getLevel);
      } catch (ratingErr) {
        console.error('Rating update error:', ratingErr);
      }
      
      res.status(201).json({ success: true });
    } catch (err) {
      console.error('POST /api/words error:', err);
      res.status(500).json({ error: 'Не удалось добавить слово' });
    }
  });

  app.delete('/api/words/:id', auth, async (req, res) => {
    try {
      const { error } = await supabase
        .from('words')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.session.userId);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('DELETE /api/words error:', err);
      res.status(500).json({ error: 'Не удалось удалить слово' });
    }
  });

  // ==================== ЗАМЕТКИ ====================
  app.get('/api/notes', auth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('note')
        .eq('user_id', req.session.userId)
        .maybeSingle();
      
      if (error) throw error;
      res.json({ note: data?.note || '' });
    } catch (err) {
      res.json({ note: '' });
    }
  });

  app.put('/api/notes', auth, async (req, res) => {
    try {
      const { error } = await supabase
        .from('notes')
        .upsert({ user_id: req.session.userId, note: req.body.note });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Не удалось сохранить заметку' });
    }
  });

  // ==================== НАСТРОЙКИ ====================
  app.get('/api/settings', async (req, res) => {
    try {
      const { data } = await supabase.from('settings').select('*');
      const s = {};
      data?.forEach(r => s[r.key] = r.value);
      res.json(s);
    } catch (err) { res.json({}); }
  });

  app.put('/api/settings', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
      for (const k in req.body) await supabase.from('settings').upsert({ key: k, value: req.body[k] });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Ошибка сохранения настроек' }); }
  });

  // ==================== ПОИСК ====================
  app.get('/api/search', auth, async (req, res) => {
    try {
      const q = req.query.q || '';
      if (q.length < 2) return res.json({ posts: [], sessions: [] });
      const [p, s] = await Promise.all([
        supabase.from('posts').select('id,title,content,ts').ilike('title', `%${q}%`).limit(5),
        supabase.from('sessions').select('id,title,date').ilike('title', `%${q}%`).limit(5)
      ]);
      res.json({ posts: p.data || [], sessions: s.data || [] });
    } catch (err) { res.json({ posts: [], sessions: [] }); }
  });

  // ==================== TELEGRAM ====================
  app.get('/api/tg-link', auth, (req, res) => {
    res.json({ link: `https://t.me/English_Language_Class_Bot?start=${req.session.userId}` });
  });

  // ==================== ДОМАШНИЕ ЗАДАНИЯ ====================
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

  // ==================== ФИДБЕКИ ====================
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

  // ==================== СТРИК ====================
  app.get('/api/streak', auth, async (req, res) => {
    try {
      const { data: bookings } = await supabase.from('bookings').select('created_at').eq('user_id', req.session.userId).order('created_at', { ascending: false });
      if (!bookings?.length) return res.json({ streak: 0 });
      let streak = 0; const today = new Date(); today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) { const d = new Date(today); d.setDate(d.getDate() - i); if (bookings.some(b => { const bd = new Date(b.created_at); bd.setHours(0,0,0,0); return bd.getTime() === d.getTime(); })) streak++; else break; }
      res.json({ streak });
    } catch (err) { res.json({ streak: 0 }); }
  });

  // ==================== ДОСТИЖЕНИЯ ====================
  app.get('/api/achievements', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      const [bookings, msgs, words] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('msg').select('*', { count: 'exact', head: true }).eq('sender_id', uid),
        supabase.from('words').select('*', { count: 'exact', head: true }).eq('user_id', uid)
      ]);
      const { data: topUsers } = await supabase.from('users').select('id').order('rating', { ascending: false }).limit(50);
      const rank = topUsers?.findIndex(u => u.id === uid) + 1 || 51;
      const { data: userData } = await supabase.from('users').select('created_at').eq('id', uid).single();
      const ageDays = userData?.created_at ? Math.floor((Date.now() - new Date(userData.created_at).getTime()) / 86400000) : 0;
      const stats = { meetings_count: bookings?.count || 0, messages_count: msgs?.count || 0, words_count: words?.count || 0, rating_rank: rank, account_age_days: ageDays };
      const { data: allAchievements } = await supabase.from('achievements').select('*');
      const { data: earned } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', uid);
      const earnedIds = earned?.map(e => e.achievement_id) || [];
      for (const a of (allAchievements || [])) {
        if (earnedIds.includes(a.id)) continue;
        let ok = false;
        switch (a.condition_field) { case 'meetings_count': ok = stats.meetings_count >= a.condition_value; break; case 'messages_count': ok = stats.messages_count >= a.condition_value; break; case 'words_count': ok = stats.words_count >= a.condition_value; break; case 'rating_rank': ok = stats.rating_rank <= a.condition_value && stats.rating_rank > 0; break; case 'account_age_days': ok = stats.account_age_days >= a.condition_value; break; }
        if (ok) { const { error } = await supabase.from('user_achievements').insert({ user_id: uid, achievement_id: a.id }); if (!error) earnedIds.push(a.id); }
      }
      const { data: fresh } = await supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', uid);
      const earnedMap = {}; fresh?.forEach(e => { earnedMap[e.achievement_id] = e.earned_at; });
      const result = (allAchievements || []).map(a => { const earned = !!earnedMap[a.id]; let cv = 0; switch (a.condition_field) { case 'meetings_count': cv = stats.meetings_count; break; case 'messages_count': cv = stats.messages_count; break; case 'words_count': cv = stats.words_count; break; case 'rating_rank': cv = stats.rating_rank; break; case 'account_age_days': cv = stats.account_age_days; break; } return { ...a, earned, earned_at: earnedMap[a.id] || null, current_value: cv, condition_value: a.condition_value, progressPercent: earned ? 100 : Math.min(100, Math.round((cv / a.condition_value) * 100)) }; });
      res.json(result);
    } catch (err) { console.error('GET /api/achievements error:', err); res.json([]); }
  });

  // ==================== РОДИТЕЛЬСКИЙ КАБИНЕТ ====================

  // Все связи (для админа)
  app.get('/api/admin/links', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Нет прав' });
      }
      const { data } = await supabase
        .from('student_parents')
        .select('student_id, parent_id');
      res.json(data || []);
    } catch (err) {
      res.json([]);
    }
  });

  // Дети родителя (убрана проверка роли)
  app.get('/api/parent/students', auth, async (req, res) => {
    try {
      const { data: links } = await supabase
        .from('student_parents')
        .select('student_id')
        .eq('parent_id', req.session.userId);
      
      if (!links?.length) return res.json([]);
      
      const ids = links.map(l => l.student_id);
      const { data: students } = await supabase
        .from('users')
        .select('id, username, level, rating, avatar_url')
        .in('id', ids);
      
      res.json(students || []);
    } catch (err) {
      res.status(500).json({ error: 'Ошибка загрузки списка детей' });
    }
  });

  // Привязать родителя
  app.post('/api/parent/bind', auth, async (req, res) => {
    try {
      const { student_id, parent_id } = req.body;
      if (!student_id || !parent_id) return res.status(400).json({ error: 'Нет данных' });
      const { data: existing } = await supabase.from('student_parents').select('id').eq('student_id', student_id).eq('parent_id', parent_id).maybeSingle();
      if (existing) return res.status(409).json({ error: 'Этот родитель уже привязан к ученику' });
      const { error } = await supabase.from('student_parents').insert({ student_id, parent_id });
      if (error) { if (error.code === '23505') return res.status(409).json({ error: 'Связь уже существует' }); throw error; }
      res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Не удалось привязать родителя' }); }
  });

  // Отвязать родителя
  app.delete('/api/parent/unbind/:studentId/:parentId', auth, async (req, res) => {
    try {
      const { error } = await supabase.from('student_parents').delete().eq('student_id', req.params.studentId).eq('parent_id', req.params.parentId);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Не удалось отвязать родителя' }); }
  });
};
