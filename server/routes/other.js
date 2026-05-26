const auth = require('../middleware/auth');
const { notifyUser, updateRating } = require('../utils/telegram');
const { getLevel } = require('../utils/helpers');

module.exports = (app, supabase) => {
  // Слова
  app.get('/api/words', auth, async (req, res) => { const { data } = await supabase.from('words').select('*').eq('user_id', req.session.userId).order('id', { ascending: false }); res.json(data || []); });
  app.post('/api/words', auth, async (req, res) => { await supabase.from('words').insert({ user_id: req.session.userId, en: req.body.en, ru: req.body.ru }); await updateRating(supabase, req.session.userId, 3, getLevel); res.json({ success: true }); });
  app.delete('/api/words/:id', auth, async (req, res) => { await supabase.from('words').delete().eq('id', req.params.id).eq('user_id', req.session.userId); res.json({ success: true }); });

  // Заметки
  app.get('/api/notes', auth, async (req, res) => { const { data } = await supabase.from('notes').select('note').eq('user_id', req.session.userId).single(); res.json({ note: data?.note || '' }); });
  app.put('/api/notes', auth, async (req, res) => { await supabase.from('notes').upsert({ user_id: req.session.userId, note: req.body.note }); res.json({ success: true }); });

  // Настройки
  app.get('/api/settings', async (req, res) => { const { data } = await supabase.from('settings').select('*'); const s = {}; data?.forEach(r => s[r.key]=r.value); res.json(s); });
  app.put('/api/settings', auth, async (req, res) => { if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' }); for (const k in req.body) await supabase.from('settings').upsert({ key: k, value: req.body[k] }); res.json({ success: true }); });

  // Поиск
  app.get('/api/search', auth, async (req, res) => { const q = req.query.q || ''; if (q.length < 2) return res.json({ posts:[], sessions:[] }); const [p, s] = await Promise.all([supabase.from('posts').select('id,title,content,ts').ilike('title',`%${q}%`).limit(5), supabase.from('sessions').select('id,title,date').ilike('title',`%${q}%`).limit(5)]); res.json({ posts: p.data||[], sessions: s.data||[] }); });

  // Telegram
  app.get('/api/tg-link', auth, (req, res) => { res.json({ link: `https://t.me/English_Language_Class_Bot?start=${req.session.userId}` }); });

  // ДЗ
  app.post('/api/homework', auth, async (req, res) => { if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' }); const { student_id, title, description, due_date } = req.body; await supabase.from('homework').insert({ student_id, title, description, due_date, created_by: req.session.userId }); notifyUser(supabase, student_id, `📝 Новое задание!`); res.json({ success: true }); });
  app.get('/api/homework/my', auth, async (req, res) => { const { data } = await supabase.from('homework').select('*').eq('student_id', req.session.userId).order('created_at', { ascending: false }); res.json(data || []); });

  // Фидбеки
  app.post('/api/feedback', auth, async (req, res) => { if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' }); await supabase.from('feedbacks').insert({ ...req.body, created_by: req.session.userId }); res.json({ success: true }); });

  // Достижения
  app.get('/api/achievements', auth, async (req, res) => { try { const uid = req.session.userId; const [b, m, w] = await Promise.all([supabase.from('bookings').select('*',{count:'exact',head:true}).eq('user_id',uid), supabase.from('msg').select('*',{count:'exact',head:true}).eq('sender_id',uid), supabase.from('words').select('*',{count:'exact',head:true}).eq('user_id',uid)]); const { data: top } = await supabase.from('users').select('id').order('rating',{ascending:false}).limit(50); const rank = top?.findIndex(u=>u.id===uid)+1||50; const { data: ud } = await supabase.from('users').select('created_at').eq('id',uid).single(); const age = ud?.created_at?Math.floor((Date.now()-new Date(ud.created_at).getTime())/86400000):0; const { data: all } = await supabase.from('achievements').select('*'); const { data: earned } = await supabase.from('user_achievements').select('achievement_id').eq('user_id',uid); const ids = earned?.map(e=>e.achievement_id)||[]; for (const a of all||[]) { if (ids.includes(a.id)) continue; let ok=false; switch(a.condition_field){case'meetings_count':ok=b.count>=a.condition_value;break;case'messages_count':ok=m.count>=a.condition_value;break;case'words_count':ok=w.count>=a.condition_value;break;case'rating_rank':ok=rank<=a.condition_value;break;case'account_age_days':ok=age>=a.condition_value;break;} if(ok){await supabase.from('user_achievements').insert({user_id:uid,achievement_id:a.id});ids.push(a.id);} } const { data: fresh } = await supabase.from('user_achievements').select('achievement_id,earned_at').eq('user_id',uid); const map = {}; fresh?.forEach(e=>{map[e.achievement_id]=e.earned_at;}); const result = (all||[]).map(a=>{const earned=!!map[a.id];let cv=0;switch(a.condition_field){case'meetings_count':cv=b.count||0;break;case'messages_count':cv=m.count||0;break;case'words_count':cv=w.count||0;break;case'rating_rank':cv=rank;break;case'account_age_days':cv=age;break;} return{...a,earned,earned_at:map[a.id]||null,current_value:cv,condition_value:a.condition_value,progress_percent:earned?100:Math.round((cv/a.condition_value)*100)};}); res.json(result); } catch(e) { res.json([]); } });

  // Родительский кабинет
  app.get('/api/parent/students', auth, async (req, res) => { if (req.session.role !== 'parent') return res.json([]); const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', req.session.userId); if (!links?.length) return res.json([]); const ids = links.map(l => l.student_id); const { data: students } = await supabase.from('users').select('id, username, level, rating, avatar_url').in('id', ids); res.json(students || []); });
  app.post('/api/parent/bind', auth, async (req, res) => { const { student_id, parent_id } = req.body; if (!student_id || !parent_id) return res.status(400).json({ error: 'Нет данных' }); await supabase.from('student_parents').insert({ student_id, parent_id }); res.json({ success: true }); });
};
