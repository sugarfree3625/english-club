const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
  // Настройки
  app.get('/api/settings', async (req, res) => {
    try {
      const { data } = await supabase.from('settings').select('*');
      const s = {}; (data||[]).forEach(r => s[r.key]=r.value);
      res.json(s);
    } catch (err) { res.json({}); }
  });

  app.put('/api/settings', auth, async (req, res) => {
    try {
      if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
      for (const k in req.body) await supabase.from('settings').upsert({ key: k, value: req.body[k] });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
  });

  // Статистика ученика
app.get('/api/stats', auth, async (req, res) => {
  try {
    const uid = req.session.userId;
    
    // Задания
    const { data: homework } = await supabase.from('homework')
      .select('*').eq('student_id', uid);
    
    const totalHW = homework?.length || 0;
    const completedHW = homework?.filter(h => h.status === 'completed').length || 0;
    const overdueHW = homework?.filter(h => h.overdue).length || 0;
    const avgGrade = completedHW > 0 
      ? Math.round((homework.filter(h => h.grade).reduce((sum, h) => sum + h.grade, 0) / homework.filter(h => h.grade).length) * 10) / 10
      : 0;
    const totalXP = homework?.reduce((sum, h) => sum + (h.experience || 0), 0) || 0;
    
    // Слова
    const { count: wordsCount } = await supabase.from('words')
      .select('*', { count: 'exact', head: true }).eq('user_id', uid);
    
    // Сообщения
    const { count: msgsCount } = await supabase.from('msg')
      .select('*', { count: 'exact', head: true }).eq('sender_id', uid);
    
    // Стрик
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
    
    // По неделям (последние 8 недель)
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

  // Поиск
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

  // Telegram
  app.get('/api/tg-link', auth, (req, res) => {
    res.json({ link: `https://t.me/English_Language_Class_Bot?start=${req.session.userId}` });
  });

  // Стрик
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
