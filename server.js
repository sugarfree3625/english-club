const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ['websocket', 'polling']
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const TG_TOKEN = process.env.TG_TOKEN || '';
const TG_BOT = 'English_Language_Class_Bot';

console.log('📊 [SERVER] Supabase инициализирован');

// ==================== КОНФИГУРАЦИЯ ====================
const upNw = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('dist'));
app.use(session({
  secret: 'sp-club-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 3600000, sameSite: 'lax', secure: false }
}));

// ==================== УТИЛИТЫ ====================
function sanitizeHtml(str) {
  if (!str) return '';
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '').replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '').replace(/javascript\s*:/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

function auth(req, res, next) { req.session.userId ? next() : res.status(401).json({ error: 'Войдите' }); }

function getLevel(rating) {
  if (rating >= 5000) return 'C2'; if (rating >= 3000) return 'C1'; if (rating >= 1500) return 'B2';
  if (rating >= 700) return 'B1'; if (rating >= 300) return 'A2'; return 'A1';
}

// ==================== TELEGRAM ====================
function sendTelegram(chatId, text, extra = {}) {
  if (!TG_TOKEN) return;
  let message = text;
  if (extra.homework) message += `\n\n📝 <b>Задание:</b> ${extra.homework}`;
  if (extra.feedback) message += `\n\n📊 <b>Фидбек:</b>\n⭐ ${'⭐'.repeat(extra.feedback.rating || 0)}\n📌 ${extra.feedback.topic || 'Урок'}`;
  if (extra.student) message += `\n👨‍🎓 <b>Ученик:</b> ${extra.student}`;
  if (extra.lesson) message += `\n📅 <b>Занятие:</b> ${extra.lesson.title}\n🕐 ${extra.lesson.time}\n📍 ${extra.lesson.type}`;
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=HTML`).catch(() => {});
}

async function notifyUser(userId, text, extra = {}) {
  const { data } = await supabase.from('tg_users').select('chat_id').eq('user_id', userId).single();
  if (data) sendTelegram(data.chat_id, text, extra);
}

// ==================== РЕЙТИНГ И СТРИК ====================
async function updateRating(userId, points) {
  const { data: user } = await supabase.from('users').select('rating, level').eq('id', userId).single();
  if (!user) return;
  const newRating = (user.rating || 0) + points;
  const newLevel = getLevel(newRating);
  await supabase.from('users').update({ rating: newRating, level: newLevel }).eq('id', userId);
  if (newLevel !== user.level && newLevel > user.level) notifyUser(userId, `🎉 Уровень повышен до ${newLevel}!`);
}

async function getStreak(userId) {
  const { data: bookings } = await supabase.from('bookings').select('created_at').eq('user_id', userId).order('created_at', { ascending: false });
  if (!bookings?.length) return 0;
  let streak = 0; const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (bookings.some(b => new Date(b.created_at).setHours(0,0,0,0) === d.getTime())) streak++; else break;
  }
  return streak;
}

async function ensureTutorChat(userId) {
  const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').limit(1);
  if (!admins?.length) return;
  const adminId = admins[0].id;
  const { data: existing } = await supabase.from('msg').select('id').or(`and(sender_id.eq.${userId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${userId})`).limit(1);
  if (!existing?.length) {
    await supabase.from('msg').insert({ sender_id: adminId, receiver_id: userId, message: '👋 Добро пожаловать! Я ваш репетитор.', read: false });
  }
}

// ==================== ЗАПУСК ====================
(async () => {
  // Админ по умолчанию
  const { data: admin } = await supabase.from('users').select('id').eq('role', 'admin').single();
  if (!admin) {
    const hash = await bcrypt.hash('changeme123', 10);
    await supabase.from('users').insert({ username: 'Admin', email: 'admin@club.com', password: hash, role: 'admin', level: 'C1', rating: 9999 });
    console.log('✅ [SERVER] Админ создан');
  }

  // Настройки по умолчанию
  const { data: settings } = await supabase.from('settings').select('key').eq('key', 'hero_title').single();
  if (!settings) {
    await supabase.from('settings').insert([
      { key: 'hero_title', value: 'Speak English Freely' },
      { key: 'hero_subtitle', value: 'Разговорный клуб' },
      { key: 'primary_color', value: '#6366f1' },
      { key: 'club_name', value: 'English Club' }
    ]);
  }

  // ==================== AUTH ====================
  app.post('/api/reg', async (req, res) => {
    const { username, email, password, level } = req.body;
    const { data: exists } = await supabase.from('users').select('id').eq('email', email).single();
    if (exists) return res.status(400).json({ error: 'Email занят' });
    const hash = await bcrypt.hash(password, 10);
    const { data: newUser } = await supabase.from('users').insert({ username, email, password: hash, level: level || 'B1' }).select('id').single();
    if (newUser) ensureTutorChat(newUser.id);
    res.json({ success: true });
  });

  app.post('/api/login', async (req, res) => {
    const { data: u } = await supabase.from('users').select('*').eq('email', req.body.email).single();
    if (!u || !(await bcrypt.compare(req.body.password, u.password))) return res.status(400).json({ error: 'Неверно' });
    req.session.userId = u.id;
    req.session.role = u.role;
    ensureTutorChat(u.id);
    res.json({ success: true, user: { id: u.id, username: u.username, role: u.role, level: u.level, rating: u.rating, avatar_url: u.avatar_url, bio: u.bio } });
  });

  app.get('/api/me', async (req, res) => {
    if (!req.session.userId) return res.json({ ok: false });
    const { data: u } = await supabase.from('users').select('id,username,role,level,rating,avatar_url,bio').eq('id', req.session.userId).single();
    res.json({ ok: true, user: u });
  });

  app.put('/api/me', auth, async (req, res) => {
    const u = {};
    if (req.body.avatar_url) u.avatar_url = req.body.avatar_url;
    if (req.body.bio !== undefined) u.bio = req.body.bio;
    if (req.body.level) u.level = req.body.level;
    await supabase.from('users').update(u).eq('id', req.session.userId);
    res.json({ success: true });
  });

  app.post('/api/out', (req, res) => { req.session.destroy(); res.json({ success: true }); });
  app.post('/api/reset-password', async (req, res) => { console.log(`🔑 [SERVER] Сброс для ${req.body.email}`); res.json({ success: true }); });

  // ==================== FILES ====================
  app.post('/api/nimg', auth, upNw.single('img'), async (req, res) => {
    console.log('📤 [UPLOAD] Получен:', req.file?.originalname, 'размер:', req.file?.size);
    if (!req.file) return res.status(400).json({ error: 'Нет файла' });
    try {
      const name = `nw-${Date.now()}${path.extname(req.file.originalname)}`;
      const { error } = await supabase.storage.from('uploads').upload(name, req.file.buffer, {
        contentType: req.file.mimetype, upsert: true
      });
      if (error) {
        console.log('❌ [UPLOAD] Supabase:', error.message);
        return res.status(500).json({ error: error.message });
      }
      const publicUrl = supabase.storage.from('uploads').getPublicUrl(name).data.publicUrl;
      console.log('✅ [UPLOAD] Готово:', publicUrl);
      res.json({ success: true, url: publicUrl });
    } catch(e) {
      console.log('💥 [UPLOAD] Крах:', e.message);
      res.status(500).json({ error: 'Ошибка загрузки' });
    }
  });

  // Прокси файлов — сервер скачивает и отдаёт (обход блокировок)
  app.get('/api/file/:filename', async (req, res) => {
    console.log('📁 [FILE] Запрошен:', req.params.filename);
    try {
      const { data, error } = await supabase.storage.from('uploads').download(req.params.filename);
      if (error) {
        console.log('❌ [FILE] Ошибка:', error.message);
        return res.status(404).json({ error: 'Файл не найден' });
      }
      console.log('✅ [FILE] Отдаю:', data.type, data.size);
      res.setHeader('Content-Type', data.type);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      const buffer = Buffer.from(await data.arrayBuffer());
      res.send(buffer);
    } catch(e) {
      console.log('💥 [FILE] Крах:', e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ==================== POSTS ====================
  app.get('/api/posts', auth, async (req, res) => { const page = parseInt(req.query.page) || 0; const limit = 20; const { data } = await supabase.from('posts').select('*, users!author_id(username, avatar_url), categories(name)').order('pinned', { ascending: false }).order('ts', { ascending: false }).range(page*limit, (page+1)*limit-1); res.json(data?.map(p => ({ ...p, an: p.users?.username, aa: p.users?.avatar_url, category: p.categories?.name })) || []); });
  app.post('/api/posts', auth, async (req, res) => { if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' }); await supabase.from('posts').insert({ author_id: req.session.userId, title: sanitizeHtml(req.body.title), content: sanitizeHtml(req.body.content), items: req.body.items || '[]', category_id: req.body.category_id || null }); await updateRating(req.session.userId, 10); res.json({ success: true }); });
  app.put('/api/posts/:id', auth, async (req, res) => { if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' }); const { data: p } = await supabase.from('posts').select('author_id').eq('id', req.params.id).single(); if (!p) return res.status(404).json({ error: 'Не найден' }); if (p.author_id !== req.session.userId && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' }); const u = {}; if (req.body.title) u.title = sanitizeHtml(req.body.title); if (req.body.content !== undefined) u.content = sanitizeHtml(req.body.content); if (req.body.items !== undefined) u.items = req.body.items; await supabase.from('posts').update(u).eq('id', req.params.id); res.json({ success: true }); });
  app.post('/api/posts/:id/pin', auth, async (req, res) => { if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' }); await supabase.from('posts').update({ pinned: true }).eq('id', req.params.id); res.json({ success: true }); });
  app.post('/api/posts/:id/unpin', auth, async (req, res) => { if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' }); await supabase.from('posts').update({ pinned: false }).eq('id', req.params.id); res.json({ success: true }); });
  app.delete('/api/posts/:id', auth, async (req, res) => { const { data: p } = await supabase.from('posts').select('author_id').eq('id', req.params.id).single(); if (!p) return res.status(404).json({ error: 'Не найден' }); if (p.author_id !== req.session.userId && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' }); await supabase.from('posts').delete().eq('id', req.params.id); res.json({ success: true }); });
  app.post('/api/posts/:id/like', auth, async (req, res) => { const { data: ex } = await supabase.from('likes').select('id').eq('post_id', req.params.id).eq('user_id', req.session.userId).single(); if (ex) await supabase.from('likes').delete().eq('id', ex.id); else await supabase.from('likes').insert({ post_id: parseInt(req.params.id), user_id: req.session.userId }); const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', req.params.id); res.json({ liked: !ex, count: count || 0 }); });
  app.post('/api/posts/:id/react', auth, async (req, res) => { const { emoji } = req.body; if (!['👍','❤️','😂','😮','🔥'].includes(emoji)) return res.status(400).json({ error: 'Неверно' }); const pid = parseInt(req.params.id); const uid = req.session.userId; const { data: ex } = await supabase.from('reactions').select('id').eq('post_id', pid).eq('user_id', uid).eq('emoji', emoji).single(); if (ex) await supabase.from('reactions').delete().eq('id', ex.id); else await supabase.from('reactions').insert({ post_id: pid, user_id: uid, emoji }); const { data: cnt } = await supabase.from('reactions').select('emoji').eq('post_id', pid); const rc = {}; cnt?.forEach(r => { rc[r.emoji] = (rc[r.emoji]||0)+1; }); res.json({ success: true, reactions: rc }); });
  app.get('/api/posts/:id/reactions', auth, async (req, res) => { const { data: cnt } = await supabase.from('reactions').select('emoji').eq('post_id', parseInt(req.params.id)); const rc = {}; cnt?.forEach(r => { rc[r.emoji] = (rc[r.emoji]||0)+1; }); res.json({ reactions: rc }); });
  app.get('/api/posts/:id/comments', auth, async (req, res) => { const { data } = await supabase.from('comments').select('*, users!user_id(username, avatar_url)').eq('post_id', req.params.id).order('ts', { ascending: true }); res.json(data || []); });
  app.post('/api/posts/:id/comments', auth, async (req, res) => { await supabase.from('comments').insert({ post_id: parseInt(req.params.id), user_id: req.session.userId, message: req.body.msg }); await updateRating(req.session.userId, 5); res.json({ success: true }); });
  app.get('/api/categories', async (req, res) => { const { data } = await supabase.from('categories').select('*').order('name'); res.json(data || []); });

  // ==================== SESSIONS ====================
  app.get('/api/ses', auth, async (req, res) => { const { data } = await supabase.from('sessions').select('*, users!host_id(username, avatar_url)').order('date', { ascending: true }); res.json(data || []); });
  app.post('/api/ses', auth, async (req, res) => { if (req.session.role !== 'host' && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' }); const ml = req.body.meeting_link || `https://meet.jit.si/english-club-${Date.now()}`; await supabase.from('sessions').insert({ title: req.body.title, description: req.body.description, host_id: req.session.userId, date: req.body.date, duration: req.body.duration, max_participants: req.body.max_participants, meeting_link: ml }); await updateRating(req.session.userId, 15); res.json({ success: true, meeting_link: ml }); });
  app.get('/api/ses/:id/ics', auth, async (req, res) => { const { data: s } = await supabase.from('sessions').select('*').eq('id', req.params.id).single(); if (!s) return res.status(404).json({ error: 'Нет' }); const st = new Date(s.date).toISOString().replace(/[-:]/g,'').substring(0,15)+'Z'; const en = new Date(new Date(s.date).getTime()+(s.duration||60)*60000).toISOString().replace(/[-:]/g,'').substring(0,15)+'Z'; res.setHeader('Content-Type','text/calendar'); res.send(`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${st}\nDTEND:${en}\nSUMMARY:${s.title}\nDESCRIPTION:${s.description||''}\nLOCATION:${s.meeting_link||''}\nEND:VEVENT\nEND:VCALENDAR`); });
  app.get('/api/myb', auth, async (req, res) => { const { data } = await supabase.from('bookings').select('id, status, sessions(title, date, meeting_link)').eq('user_id', req.session.userId); res.json(data?.map(b => ({ bid: b.id, status: b.status, title: b.sessions?.title, date: b.sessions?.date, meeting_link: b.sessions?.meeting_link })) || []); });
  app.get('/api/my-ses', auth, async (req, res) => { if (req.session.role !== 'host' && req.session.role !== 'admin') return res.json([]); const { data } = await supabase.from('sessions').select('*').eq('host_id', req.session.userId).order('date', { ascending: false }); res.json(data || []); });
  app.post('/api/ses/:id/book', auth, async (req, res) => { await supabase.from('bookings').insert({ user_id: req.session.userId, session_id: parseInt(req.params.id) }); await updateRating(req.session.userId, 20); res.json({ success: true }); });
  app.delete('/api/ses/:id', auth, async (req, res) => { const { data: s } = await supabase.from('sessions').select('host_id').eq('id', req.params.id).single(); if (!s) return res.status(404).json({ error: 'Нет' }); if (s.host_id !== req.session.userId && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' }); await supabase.from('sessions').delete().eq('id', req.params.id); res.json({ success: true }); });

  // ==================== GROUPS ====================
  app.post('/api/groups', auth, async (req, res) => { const { data: g } = await supabase.from('groups').insert({ name: req.body.name, created_by: req.session.userId }).select('id').single(); if (!g) return res.status(500).json({ error: 'Ошибка' }); await supabase.from('group_members').insert({ group_id: g.id, user_id: req.session.userId, role: 'admin' }); res.json({ success: true, id: g.id }); });
  app.get('/api/groups', auth, async (req, res) => { const { data: gm } = await supabase.from('group_members').select('group_id').eq('user_id', req.session.userId); const ids = gm?.map(d => d.group_id) || []; if (!ids.length) return res.json([]); const { data: gr } = await supabase.from('groups').select('*').in('id', ids); res.json(gr || []); });
  app.get('/api/groups/:id/messages', auth, async (req, res) => { const { data } = await supabase.from('group_messages').select('*, users!sender_id(username, avatar_url)').eq('group_id', req.params.id).order('ts', { ascending: true }).limit(50); res.json(data || []); });
  app.post('/api/groups/:id/members', auth, async (req, res) => { await supabase.from('group_members').insert({ group_id: parseInt(req.params.id), user_id: req.body.user_id }); res.json({ success: true }); });

  // ==================== CHAT ====================
  app.get('/api/dialogs', auth, async (req, res) => { const uid = req.session.userId; const { data: msgs } = await supabase.from('msg').select('*').or(`sender_id.eq.${uid},receiver_id.eq.${uid}`).order('ts', { ascending: false }); const seen = new Set(), result = []; msgs?.forEach(m => { const pid = m.sender_id === uid ? m.receiver_id : m.sender_id; if (pid && !seen.has(pid)) { seen.add(pid); result.push({ partner_id: pid, message: m.message, ts: m.ts }); } }); for (let r of result) { const { data: u } = await supabase.from('users').select('username, avatar_url').eq('id', r.partner_id).single(); if (u) { r.username = u.username; r.avatar_url = u.avatar_url; } } res.json(result); });
  app.get('/api/messages/:userId', auth, async (req, res) => { const { data } = await supabase.from('msg').select('*').or(`and(sender_id.eq.${req.session.userId},receiver_id.eq.${req.params.userId}),and(sender_id.eq.${req.params.userId},receiver_id.eq.${req.session.userId})`).order('ts', { ascending: true }); res.json(data || []); });
  app.get('/api/unread', auth, async (req, res) => { const { count } = await supabase.from('msg').select('*', { count: 'exact', head: true }).eq('receiver_id', req.session.userId).eq('read', false); res.json({ count: count || 0 }); });
  app.post('/api/msg/:id/read', auth, async (req, res) => { await supabase.from('msg').update({ read: true }).eq('id', req.params.id).eq('receiver_id', req.session.userId); res.json({ success: true }); });
  app.delete('/api/msg/:id', auth, async (req, res) => { await supabase.from('msg').delete().eq('id', req.params.id).eq('sender_id', req.session.userId); res.json({ success: true }); });
  app.get('/api/users', auth, async (req, res) => { const q = (req.query.q || '').toLowerCase(); const uid = req.session.userId; const { data: u } = await supabase.from('users').select('id,username,avatar_url,level,rating,role').neq('id', uid); if (!u) return res.json([]); let filtered = u; if (req.session.role !== 'admin' && req.session.role !== 'host') filtered = u.filter(x => x.role === 'admin' || x.role === 'host'); if (q.length >= 1) filtered = filtered.filter(x => x.username?.toLowerCase().includes(q)); res.json(filtered.slice(0, 50)); });
  app.get('/api/top', async (req, res) => { const { data } = await supabase.from('users').select('id, username, level, rating, avatar_url').order('rating', { ascending: false }).limit(20); res.json(data || []); });
  app.get('/api/search', auth, async (req, res) => { const q = req.query.q || ''; if (q.length < 2) return res.json({ posts:[], sessions:[] }); const [p, s] = await Promise.all([supabase.from('posts').select('id,title,content,ts').ilike('title',`%${q}%`).limit(5), supabase.from('sessions').select('id,title,date').ilike('title',`%${q}%`).limit(5)]); res.json({ posts: p.data||[], sessions: s.data||[] }); });
  app.get('/api/settings', async (req, res) => { const { data } = await supabase.from('settings').select('*'); const s = {}; data?.forEach(r => s[r.key]=r.value); res.json(s); });
  app.put('/api/settings', auth, async (req, res) => { if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' }); for (const k in req.body) await supabase.from('settings').upsert({ key: k, value: req.body[k] }); res.json({ success: true }); });
  app.get('/api/services', async (req, res) => { const { data } = await supabase.from('services').select('*').order('id'); res.json(data || []); });
  app.get('/api/words', auth, async (req, res) => { const { data } = await supabase.from('words').select('*').eq('user_id', req.session.userId).order('id', { ascending: false }); res.json(data || []); });
  app.post('/api/words', auth, async (req, res) => { await supabase.from('words').insert({ user_id: req.session.userId, en: req.body.en, ru: req.body.ru }); await updateRating(req.session.userId, 3); res.json({ success: true }); });
  app.delete('/api/words/:id', auth, async (req, res) => { await supabase.from('words').delete().eq('id', req.params.id).eq('user_id', req.session.userId); res.json({ success: true }); });
  app.get('/api/notes', auth, async (req, res) => { const { data } = await supabase.from('notes').select('note').eq('user_id', req.session.userId).single(); res.json({ note: data?.note || '' }); });
  app.put('/api/notes', auth, async (req, res) => { await supabase.from('notes').upsert({ user_id: req.session.userId, note: req.body.note }); res.json({ success: true }); });
  app.get('/api/tg-link', auth, (req, res) => { res.json({ link: `https://t.me/${TG_BOT}?start=${req.session.userId}` }); });
  app.get('/api/streak', auth, async (req, res) => { res.json({ streak: await getStreak(req.session.userId) }); });

  // ==================== ACHIEVEMENTS ====================
  app.get('/api/achievements', auth, async (req, res) => {
    try { const uid = req.session.userId; const [b, m, w] = await Promise.all([supabase.from('bookings').select('*',{count:'exact',head:true}).eq('user_id',uid), supabase.from('msg').select('*',{count:'exact',head:true}).eq('sender_id',uid), supabase.from('words').select('*',{count:'exact',head:true}).eq('user_id',uid)]); const { data: top } = await supabase.from('users').select('id').order('rating',{ascending:false}).limit(50); const rank = top?.findIndex(u=>u.id===uid)+1||50; const { data: ud } = await supabase.from('users').select('created_at').eq('id',uid).single(); const age = ud?.created_at?Math.floor((Date.now()-new Date(ud.created_at).getTime())/86400000):0; const { data: all } = await supabase.from('achievements').select('*'); const { data: earned } = await supabase.from('user_achievements').select('achievement_id').eq('user_id',uid); const ids = earned?.map(e=>e.achievement_id)||[]; for (const a of all||[]) { if (ids.includes(a.id)) continue; let ok=false; switch(a.condition_field){case'meetings_count':ok=b.count>=a.condition_value;break;case'messages_count':ok=m.count>=a.condition_value;break;case'words_count':ok=w.count>=a.condition_value;break;case'rating_rank':ok=rank<=a.condition_value;break;case'account_age_days':ok=age>=a.condition_value;break;} if(ok){await supabase.from('user_achievements').insert({user_id:uid,achievement_id:a.id});ids.push(a.id);} } const { data: fresh } = await supabase.from('user_achievements').select('achievement_id,earned_at').eq('user_id',uid); const map = {}; fresh?.forEach(e=>{map[e.achievement_id]=e.earned_at;}); const result = (all||[]).map(a=>{const earned=!!map[a.id];let cv=0;switch(a.condition_field){case'meetings_count':cv=b.count||0;break;case'messages_count':cv=m.count||0;break;case'words_count':cv=w.count||0;break;case'rating_rank':cv=rank;break;case'account_age_days':cv=age;break;} return{...a,earned,earned_at:map[a.id]||null,current_value:cv,condition_value:a.condition_value,progress_percent:earned?100:Math.round((cv/a.condition_value)*100)};}); res.json(result); } catch(e) { res.json([]); }
  });

  // ==================== РОДИТЕЛЬСКИЙ КАБИНЕТ ====================
  app.get('/api/parent/students', auth, async (req, res) => {
    if (req.session.role !== 'parent') return res.json([]);
    const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', req.session.userId);
    if (!links?.length) return res.json([]);
    const ids = links.map(l => l.student_id);
    const { data: students } = await supabase.from('users').select('id, username, level, rating, avatar_url').in('id', ids);
    for (let s of (students||[])) { s.streak = await getStreak(s.id); const { count: wc } = await supabase.from('words').select('*',{count:'exact',head:true}).eq('user_id',s.id); s.words = wc||0; }
    res.json(students || []);
  });

  // ==================== ДЗ ====================
  app.post('/api/homework', auth, async (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    const { student_id, title, description, due_date, files, voice_url, links } = req.body;
    await supabase.from('homework').insert({ student_id, title, description, due_date, files, voice_url, links, created_by: req.session.userId });
    notifyUser(student_id, `📝 Новое задание!`, { homework: title });
    res.json({ success: true });
  });

  // ==================== ФИДБЕКИ ====================
  app.post('/api/feedback', auth, async (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    await supabase.from('feedbacks').insert({ ...req.body, created_by: req.session.userId });
    res.json({ success: true });
  });

  // ==================== КАЛЕНДАРЬ (SLOTS) ====================
  app.get('/api/slots', auth, async (req, res) => {
    try {
      const uid = req.session.userId;
      let query = supabase.from('schedule_slots').select('*, users!student_id(username, avatar_url, level)');
      if (req.session.role === 'admin' || req.session.role === 'host') query = query.eq('tutor_id', parseInt(uid));
      else if (req.session.role === 'parent') {
        const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_id', uid);
        const ids = (links || []).map(l => l.student_id);
        if (ids.length > 0) query = query.in('student_id', ids); else return res.json([]);
      } else query = query.eq('student_id', uid);
      const { data, error } = await query.order('start_time', { ascending: true });
      if (error) return res.json([]);
      res.json(data || []);
    } catch(e) { res.json([]); }
  });

  app.post('/api/slots', auth, async (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    const { student_id, start_time, end_time, lesson_type, title, notes, meeting_link, group_students } = req.body;
    let st = new Date(start_time), et = new Date(end_time);
    if (et <= st) et = new Date(st.getTime() + 30 * 60000);
    const slot = { tutor_id: req.session.userId, student_id: lesson_type?.startsWith('group') ? null : student_id, start_time: st.toISOString(), end_time: et.toISOString(), lesson_type: lesson_type || 'online', title: title || 'Занятие', notes, meeting_link: meeting_link || ((lesson_type === 'online' || lesson_type === 'group-online') ? `https://meet.jit.si/english-club-${Date.now()}` : null), group_students: group_students || [] };
    await supabase.from('schedule_slots').insert(slot);
    res.json({ success: true });
  });

  app.put('/api/slots/:id/move', auth, async (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    const { start_time, end_time } = req.body;
    await supabase.from('schedule_slots').update({ start_time: new Date(start_time).toISOString(), end_time: new Date(end_time).toISOString() }).eq('id', req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/slots/:id', auth, async (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    await supabase.from('schedule_slots').delete().eq('id', req.params.id);
    res.json({ success: true });
  });

  // ==================== SOCKET.IO ====================
  const onlineUsers = new Map();
  io.on('connection', s => {
    console.log('🔌 [SOCKET] Подключение');
    s.on('join', d => {
      console.log('👤 [SOCKET] join:', d.uid, d.uname);
      s.uid = d.uid; s.uname = d.uname;
      s.join(`u:${d.uid}`);
      onlineUsers.set(d.uid, true);
      supabase.from('msg').select('*', { count: 'exact', head: true }).eq('receiver_id', d.uid).eq('read', false).then(({ count }) => { s.emit('unread', { count: count || 0 }); });
    });
    s.on('disconnect', () => {
      console.log('🔌 [SOCKET] Отключение:', s.uid);
      if (s.uid) onlineUsers.delete(s.uid);
    });
    s.on('dm', async d => {
      console.log('💬 [SOCKET] dm:', s.uid, '→', d.to, (d.msg || '').substring(0, 30));
      if (!s.uid) return;
      const files = d.files || null;
      const msg = { id: Date.now(), from: s.uid, fn: s.uname, msg: d.msg || '', files, reply_to: d.replyTo || null, ts: new Date().toISOString() };
      io.to(`u:${d.to}`).emit('dm', msg);
      s.emit('dm', msg);
      const { data, error } = await supabase.from('msg').insert({ 
  sender_id: s.uid, receiver_id: d.to, message: d.msg || '', 
  files: files ? JSON.stringify(files) : null, read: false, reply_to: d.replyTo || null 
}).select();

if (error) {
  console.log('❌ [DB] Ошибка вставки:', JSON.stringify(error));
} else {
  console.log('✅ [DB] Сохранено, id:', data?.[0]?.id);
}
      await updateRating(s.uid, 2);
      if (!onlineUsers.has(d.to)) notifyUser(d.to, `💬 ${s.uname}: ${(d.msg || '📎 Файл').substring(0, 50)}`);
    });
    s.on('groupMsg', async d => {
      if (!s.uid) return;
      const msg = { id: Date.now(), from: s.uid, fn: s.uname, msg: d.msg || '', ts: new Date().toISOString() };
      io.to(`group:${d.groupId}`).emit('groupMsg', msg);
      await supabase.from('group_messages').insert({ group_id: d.groupId, sender_id: s.uid, message: d.msg || '' });
    });
  });

  // ==================== ЗАПУСК СЕРВЕРА ====================
  app.get('*', (req, res) => { if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io')) return res.status(404).json({ error: 'Not found' }); res.sendFile(path.join(__dirname, 'dist', 'index.html')); });
  server.listen(process.env.PORT || 3000, () => { console.log('🚀 [SERVER] Запущен на порту', process.env.PORT || 3000); });

  // ==================== TELEGRAM BOT ====================
  if (TG_TOKEN) {
    let lastUpdateId = 0;
    const mainKeyboard = { keyboard: [['📅 Расписание', '📝 Задания'], ['📊 Статистика', '👤 Профиль'], ['🏆 Топ', '❓ Помощь']], resize_keyboard: true };
    setInterval(async () => {
      try {
        const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
        const d = await r.json();
        for (const up of d.result || []) {
          lastUpdateId = up.update_id;
          const msg = up.message; if (!msg?.text) continue;
          const chatId = msg.chat.id; const text = msg.text.trim();
          if (text.startsWith('/start')) {
            const [_, userId] = text.split(' ');
            if (userId) {
              await supabase.from('tg_users').upsert({ user_id: parseInt(userId), chat_id: chatId.toString() });
              const { data: user } = await supabase.from('users').select('username').eq('id', parseInt(userId)).single();
              await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: `✅ Привет, ${user?.username || 'друг'}!`, parse_mode: 'HTML', reply_markup: mainKeyboard }) });
            }
          }
        }
      } catch(e) {}
    }, 2000);
    console.log('🤖 [SERVER] Telegram бот запущен');
  }
})();
