const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
  // ==================== НАСТРОЙКИ САЙТА ====================
  
  // Получить настройки (для сайта)
  app.get('/api/settings', async (req, res) => {
    try {
      const { data } = await supabase.from('settings').select('*');
      const s = {}; (data||[]).forEach(r => s[r.key]=r.value);
      res.json(s);
    } catch (err) { res.json({}); }
  });

  // Сохранить настройки (старый формат)
  app.put('/api/settings', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
      for (const k in req.body) await supabase.from('settings').upsert({ key: k, value: req.body[k] });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
  });

  // 🔥 НОВОЕ: Получить настройки сайта (для админки)
  app.get('/api/site-settings', auth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      res.json(data || {});
    } catch (err) {
      console.error('GET /api/site-settings error:', err);
      res.json({});
    }
  });

  // 🔥 НОВОЕ: Сохранить настройки сайта (для админки)
  app.put('/api/site-settings', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin' && req.session.role !== 'host') {
        return res.status(403).json({ error: 'Только админ' });
      }

      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();

      const settings = {
        hero_title: req.body.hero_title || '',
        hero_subtitle: req.body.hero_subtitle || '',
        tutor_photo: req.body.tutor_photo || '',
        tutor_name: req.body.tutor_name || '',
        tutor_bio: req.body.tutor_bio || '',
        tg: req.body.tg || '',
        wa: req.body.wa || '',
        vk: req.body.vk || '',
        email: req.body.email || '',
        club_name: req.body.club_name || 'English Club',
        primary_color: req.body.primary_color || '#6366f1',
        services: req.body.services || [],
        reviews: req.body.reviews || [],
        faqs: req.body.faqs || []
      };

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update(settings)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert(settings);
        if (error) throw error;
      }

      // Обновляем и старую таблицу settings для совместимости
      for (const k in req.body) {
        if (typeof req.body[k] === 'string') {
          await supabase.from('settings').upsert({ key: k, value: req.body[k] });
        }
      }

      res.json({ success: true });
    } catch (err) {
      console.error('PUT /api/site-settings error:', err);
      res.status(500).json({ error: 'Ошибка сохранения' });
    }
  });

  // ==================== СТАТИСТИКА ====================
  
  app.get('/api/stats', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      
      const { data: homework } = await supabase.from('homework')
        .select('*').eq('student_id', uid);
      
      const totalHW = homework?.length || 0;
      const completedHW = homework?.filter(h => h.status === 'completed').length || 0;
      const overdueHW = homework?.filter(h => h.overdue).length || 0;
      const avgGrade = completedHW > 0 
        ? Math.round((homework.filter(h => h.grade).reduce((sum, h) => sum + h.grade, 0) / homework.filter(h => h.grade).length) * 10) / 10
        : 0;
      const totalXP = homework?.reduce((sum, h) => sum + (h.experience || 0), 0) || 0;
      
      const { count: wordsCount } = await supabase.from('words')
        .select('*', { count: 'exact', head: true }).eq('user_id', uid);
      
      const { count: msgsCount } = await supabase.from('msg')
        .select('*', { count: 'exact', head: true }).eq('sender_id', uid);
      
      const { data: bookings } = await supabase.from('bookings')
        .select('created_at').eq('user_id', uid)
        .order('created_at', { ascending: false });
      
      let streak = 0;
      if (bookings?.length) {
        const today = new Date(); today.setHours(0,0,0,0);
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          if (bookings.some(b => {
            const bd = new Date(b.created_at); bd.setHours(0,0,0,0);
            return bd.getTime() === d.getTime();
          })) streak++;
          else break;
        }
      }
      
      const weeklyData = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
        weekStart.setHours(0,0,0,0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23,59,59,999);
        
        const weekHW = homework?.filter(h => 
          h.completed_at && new Date(h.completed_at) >= weekStart && new Date(h.completed_at) <= weekEnd
        ).length || 0;
        
        weeklyData.push({
          week: `Нед ${8 - i}`,
          completed: weekHW,
          start: weekStart.toISOString(),
          end: weekEnd.toISOString()
        });
      }
      
      res.json({
        totalHW, completedHW, overdueHW,
        avgGrade, totalXP,
        wordsCount: wordsCount || 0,
        msgsCount: msgsCount || 0,
        streak,
        weeklyData
      });
    } catch (err) {
      console.error('GET /api/stats error:', err);
      res.json({});
    }
  });

  // ==================== ПОИСК ====================
  
  app.get('/api/search', auth, async (req, res) => {
    try {
      const q = req.query.q || '';
      if (q.length < 2) return res.json({ posts:[], sessions:[] });
      const [p, s] = await Promise.all([
        supabase.from('posts').select('id,title,content,ts').ilike('title',`%${q}%`).limit(5),
        supabase.from('sessions').select('id,title,date').ilike('title',`%${q}%`).limit(5)
      ]);
      res.json({ posts: p.data||[], sessions: s.data||[] });
    } catch (err) { res.json({ posts:[], sessions:[] }); }
  });

  // ==================== TELEGRAM ====================
  
  app.get('/api/tg-link', auth, (req, res) => {
    res.json({ link: `https://t.me/English_Language_Class_Bot?start=${req.session.userId}` });
  });

  // ==================== СТРИК ====================
  
  app.get('/api/streak', auth, async (req, res) => {
    try {
      const { data: bookings } = await supabase.from('bookings').select('created_at').eq('user_id', req.session.userId).order('created_at', { ascending: false });
      if (!bookings?.length) return res.json({ streak: 0 });
      let streak = 0; const today = new Date(); today.setHours(0,0,0,0);
      for (let i=0;i<365;i++){ const d=new Date(today);d.setDate(d.getDate()-i);if(bookings.some(b=>{const bd=new Date(b.created_at);bd.setHours(0,0,0,0);return bd.getTime()===d.getTime();}))streak++;else break; }
      res.json({ streak });
    } catch (err) { res.json({ streak:0 }); }
  });
};
