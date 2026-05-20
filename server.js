const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const { createEvent: icsEvent } = require('ics');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Telegram Bot — токен из переменных окружения (Render)
const TG_TOKEN = process.env.TG_TOKEN || '';
const TG_BOT = 'English_Language_Class_Bot';

const avStorage = multer.diskStorage({
  destination: 'public/avatars',
  filename: (r, f, cb) => cb(null, `av-${r.session.userId}-${Date.now()}${path.extname(f.originalname)}`)
});
const upAv = multer({ storage: avStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const nwStorage = multer.diskStorage({
  destination: (r, f, cb) => { const d = 'public/uploads'; if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); cb(null, d); },
  filename: (r, f, cb) => cb(null, `nw-${Date.now()}${path.extname(f.originalname)}`)
});
const upNw = multer({ storage: nwStorage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('dist'));
app.use(session({
  secret: 'sp-club-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 3600000, sameSite: 'lax', secure: false }
}));

let db;
const DB = path.join(__dirname, 'db.db');
['public/avatars', 'public/calendars', 'public/uploads'].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

function save() { fs.writeFileSync(DB, Buffer.from(db.export())); }
function all(sql) { const r = db.exec(sql); if (!r.length || !r[0].values.length) return []; return r[0].values.map(row => { const o = {}; r[0].columns.forEach((c, i) => o[c] = row[i]); return o; }); }
function one(sql) { const rows = all(sql); return rows.length ? rows[0] : null; }
function run(sql) { db.run(sql); save(); }
function esc(s) { return typeof s !== 'string' ? s : s.replace(/'/g, "''"); }

async function init() {
  const SQL = await initSqlJs();
  db = fs.existsSync(DB) ? new SQL.Database(fs.readFileSync(DB)) : new SQL.Database();
  run(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE,email TEXT UNIQUE,password TEXT,role TEXT DEFAULT'user',level TEXT DEFAULT'B1',rating INTEGER DEFAULT 0,avatar_url TEXT,bio TEXT DEFAULT'')`);
  run(`CREATE TABLE IF NOT EXISTS sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,description TEXT,host_id INTEGER,date TEXT,duration INTEGER DEFAULT 60,max_participants INTEGER DEFAULT 10,meeting_link TEXT,meeting_type TEXT DEFAULT'google',created_by INTEGER)`);
  run(`CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,session_id INTEGER,status TEXT DEFAULT'active')`);
  run(`CREATE TABLE IF NOT EXISTS msg(id INTEGER PRIMARY KEY AUTOINCREMENT,sender_id INTEGER,receiver_id INTEGER,message TEXT,ts DATETIME DEFAULT CURRENT_TIMESTAMP,file_url TEXT,file_type TEXT)`);
  run(`CREATE TABLE IF NOT EXISTS rh(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,points INTEGER,reason TEXT,ts DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  run(`CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY AUTOINCREMENT,author_id INTEGER,title TEXT,content TEXT,img TEXT,vid TEXT,sched TEXT,ts DATETIME DEFAULT CURRENT_TIMESTAMP,images TEXT,audio TEXT,file_url TEXT,file_name TEXT,video_url TEXT,items TEXT)`);
  run(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT)`);
  run(`CREATE TABLE IF NOT EXISTS services(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,desc TEXT,price TEXT,icon TEXT)`);
  run(`CREATE TABLE IF NOT EXISTS words(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,en TEXT,ru TEXT)`);
  run(`CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER UNIQUE,note TEXT)`);
  run(`CREATE TABLE IF NOT EXISTS tg_users(user_id INTEGER UNIQUE, chat_id TEXT)`);
  
  try { run(`ALTER TABLE msg ADD COLUMN file_url TEXT`); } catch(e) {}
  try { run(`ALTER TABLE msg ADD COLUMN file_type TEXT`); } catch(e) {}
  try { run(`ALTER TABLE posts ADD COLUMN items TEXT`); } catch(e) {}
}

function auth(req, res, next) { req.session.userId ? next() : res.status(401).json({ error: 'Войдите' }); }

function sendTelegram(chatId, text) {
  if (!TG_TOKEN) return;
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;
  fetch(url).catch(() => {});
}

function notifyUser(userId, text) {
  const tg = one(`SELECT chat_id FROM tg_users WHERE user_id=${userId}`);
  if (tg) sendTelegram(tg.chat_id, text);
}

init().then(() => {
  const adminExists = one("SELECT id FROM users WHERE role='admin'");
  if (!adminExists) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@club.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'changeme123';
    const hash = require('bcrypt').hashSync(adminPass, 10);
    run(`INSERT INTO users(username,email,password,role,level,rating)VALUES('Admin','${esc(adminEmail)}','${hash}','admin','C1',9999)`);
    console.log('✅ Админ создан');
  }

  if (!one("SELECT key FROM settings WHERE key='hero_title'")) {
    run(`INSERT INTO settings(key,value)VALUES('hero_title','Speak English Freely')`);
    run(`INSERT INTO settings(key,value)VALUES('hero_subtitle','Разговорный клуб')`);
    run(`INSERT INTO settings(key,value)VALUES('primary_color','#6366f1')`);
    run(`INSERT INTO settings(key,value)VALUES('club_name','English Club')`);
  }

  // АВТОРИЗАЦИЯ
  app.post('/api/reg', async (req, res) => {
    const { username, email, password, level } = req.body;
    if (one(`SELECT id FROM users WHERE email='${esc(email)}'`)) return res.status(400).json({ error: 'Email занят' });
    const hash = await bcrypt.hash(password, 10);
    run(`INSERT INTO users(username,email,password,level)VALUES('${esc(username)}','${esc(email)}','${hash}','${esc(level||'B1')}')`);
    const u = one(`SELECT id FROM users WHERE email='${esc(email)}'`);
    run(`INSERT INTO rh(user_id,points,reason)VALUES(${u.id},50,'Регистрация')`);
    run(`UPDATE users SET rating=rating+50 WHERE id=${u.id}`);
    res.json({ success: true });
  });

  app.post('/api/login', async (req, res) => {
    const u = one(`SELECT * FROM users WHERE email='${esc(req.body.email)}'`);
    if (!u || !(await bcrypt.compare(req.body.password, u.password))) return res.status(400).json({ error: 'Неверно' });
    req.session.userId = u.id; req.session.role = u.role;
    res.json({ success: true, user: { id: u.id, username: u.username, role: u.role, level: u.level, rating: u.rating, avatar_url: u.avatar_url, bio: u.bio } });
  });

  app.get('/api/me', (req, res) => {
    if (!req.session.userId) return res.json({ ok: false });
    res.json({ ok: true, user: one(`SELECT id,username,role,level,rating,avatar_url,bio FROM users WHERE id=${req.session.userId}`) });
  });

  app.post('/api/out', (req, res) => { req.session.destroy(); res.json({ success: true }); });

  app.get('/api/tg-link', auth, (req, res) => {
    res.json({ link: `https://t.me/${TG_BOT}?start=${req.session.userId}` });
  });

  app.post('/api/tg-webhook', (req, res) => {
    const msg = req.body.message;
    if (msg && msg.text && msg.text.startsWith('/start')) {
      const chatId = msg.chat.id;
      const userId = msg.text.split(' ')[1];
      if (userId) {
        run(`INSERT OR REPLACE INTO tg_users(user_id, chat_id) VALUES(${parseInt(userId)}, '${esc(chatId)}')`);
        sendTelegram(chatId, '✅ Ты привязан к English Club!');
      }
    }
    res.json({ ok: true });
  });

  app.post('/api/av', auth, upAv.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Нет файла' });
    const url = `/avatars/${req.file.filename}`;
    run(`UPDATE users SET avatar_url='${esc(url)}' WHERE id=${req.session.userId}`);
    res.json({ success: true, url });
  });

  app.put('/api/me', auth, (req, res) => {
    run(`UPDATE users SET bio='${esc(req.body.bio||'')}',level='${esc(req.body.level||'B1')}' WHERE id=${req.session.userId}`);
    res.json({ success: true });
  });

  // ВСТРЕЧИ
  app.post('/api/ses', auth, (req, res) => {
    if (req.session.role !== 'host' && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    const { title, desc, date, dur, max, type, zlink } = req.body;
    const mt = type || 'google';
    let ml = 'NULL';
    if (mt === 'zoom' && zlink) ml = `'${esc(zlink)}'`;
    run(`INSERT INTO sessions(title,description,host_id,date,duration,max_participants,meeting_type,meeting_link,created_by)VALUES('${esc(title)}','${esc(desc||'')}',${req.session.userId},'${date}',${dur||60},${max||10},'${mt}',${ml},${req.session.userId})`);
    const s = one('SELECT id FROM sessions ORDER BY id DESC LIMIT 1');
    if (mt === 'google' && !zlink) {
      createGMeet(title, desc, date, dur || 60).then(l => { if (l) run(`UPDATE sessions SET meeting_link='${esc(l)}' WHERE id=${s.id}`); });
    }
    const ics = genICS({ id: s.id, title, description: desc, date, duration: dur || 60, meeting_link: zlink || null });
    notifyUser(req.session.userId, `📅 Встреча создана: "${title}"\n📅 ${new Date(date).toLocaleString('ru')}\n⏱ ${dur||60} мин`);
    res.json({ success: true, id: s.id, ics });
  });

  app.get('/api/ses', auth, (req, res) => {
    res.json(all(`SELECT s.*,u.username as host,u.avatar_url as hav,(SELECT COUNT(*)FROM bookings WHERE session_id=s.id AND status!='cancelled')as cnt FROM sessions s JOIN users u ON s.host_id=u.id ORDER BY s.date ASC`));
  });

  app.get('/api/cal', auth, (req, res) => {
    res.json({ s: all(`SELECT id,title,date,duration,meeting_link FROM sessions ORDER BY date ASC`), p: all(`SELECT id,title,content as description,sched as date FROM posts WHERE sched IS NOT NULL`) });
  });

  app.post('/api/ses/:id/book', auth, (req, res) => {
    const sid = parseInt(req.params.id), uid = req.body.userId || req.session.userId;
    const s = one(`SELECT * FROM sessions WHERE id=${sid}`);
    if (!s) return res.status(404).json({ error: 'Не найдена' });
    if (uid !== req.session.userId && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    if (all(`SELECT COUNT(*)as c FROM bookings WHERE session_id=${sid} AND status!='cancelled'`)[0].c >= s.max_participants) return res.status(400).json({ error: 'Мест нет' });
    if (one(`SELECT id FROM bookings WHERE user_id=${uid} AND session_id=${sid} AND status!='cancelled'`)) return res.status(400).json({ error: 'Уже записан' });
    run(`INSERT INTO bookings(user_id,session_id)VALUES(${uid},${sid})`);
    run(`INSERT INTO rh(user_id,points,reason)VALUES(${uid},5,'Запись')`);
    run(`UPDATE users SET rating=rating+5 WHERE id=${uid}`);
    notifyUser(uid, `✅ Ты записан на "${s.title}"\n📅 ${new Date(s.date).toLocaleString('ru')}\n🔗 ${s.meeting_link || 'Ссылка будет позже'}`);
    if (s.host_id && s.host_id !== uid) notifyUser(s.host_id, `👤 ${req.session.username || 'Участник'} записался на "${s.title}"`);
    res.json({ success: true, link: s.meeting_link, ics: genICS(s) });
  });

  app.post('/api/book/:id/cancel', auth, (req, res) => {
    const b = one(`SELECT * FROM bookings WHERE id=${parseInt(req.params.id)} AND user_id=${req.session.userId}`);
    if (!b) return res.status(404).json({ error: 'Нет' });
    run(`UPDATE bookings SET status='cancelled' WHERE id=${b.id}`);
    run(`INSERT INTO rh(user_id,points,reason)VALUES(${req.session.userId},-5,'Отмена')`);
    run(`UPDATE users SET rating=rating-5 WHERE id=${req.session.userId}`);
    res.json({ success: true });
  });

  app.post('/api/ses/:sid/att/:uid', auth, (req, res) => {
    const sid = parseInt(req.params.sid), uid = parseInt(req.params.uid);
    const s = one(`SELECT * FROM sessions WHERE id=${sid}`);
    if (!s || (s.host_id !== req.session.userId && req.session.role !== 'admin')) return res.status(403).json({ error: 'Нет прав' });
    const b = one(`SELECT * FROM bookings WHERE session_id=${sid} AND user_id=${uid} AND status='active'`);
    if (!b) return res.status(400).json({ error: 'Нет' });
    run(`UPDATE bookings SET status='attended' WHERE id=${b.id}`);
    run(`INSERT INTO rh(user_id,points,reason)VALUES(${uid},10,'Посещение')`);
    run(`UPDATE users SET rating=rating+10 WHERE id=${uid}`);
    res.json({ success: true });
  });

  app.get('/api/ses/:id/part', auth, (req, res) => {
    const sid = parseInt(req.params.id), s = one(`SELECT * FROM sessions WHERE id=${sid}`);
    if (!s) return res.status(404).json({ error: 'Не найдена' });
    if (s.host_id !== req.session.userId && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    res.json(all(`SELECT b.id,b.status,u.id as uid,u.username,u.avatar_url FROM bookings b JOIN users u ON b.user_id=u.id WHERE b.session_id=${sid}`));
  });

  app.delete('/api/ses/:sid/part/:uid/remove', auth, (req, res) => {
    const sid = parseInt(req.params.sid), uid = parseInt(req.params.uid), s = one(`SELECT * FROM sessions WHERE id=${sid}`);
    if (!s) return res.status(404).json({ error: 'Не найдена' });
    if (s.host_id !== req.session.userId && req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    run(`DELETE FROM bookings WHERE session_id=${sid} AND user_id=${uid}`);
    res.json({ success: true });
  });

  app.get('/api/my-ses', auth, (req, res) => {
    if (req.session.role !== 'host' && req.session.role !== 'admin') return res.json([]);
    res.json(all(`SELECT s.*,(SELECT COUNT(*)FROM bookings WHERE session_id=s.id AND status='active')as ac,(SELECT COUNT(*)FROM bookings WHERE session_id=s.id AND status='attended')as at FROM sessions s WHERE s.host_id=${req.session.userId} ORDER BY s.date DESC LIMIT 20`));
  });

  app.put('/api/ses/:id', auth, (req, res) => {
    const s = one(`SELECT * FROM sessions WHERE id=${parseInt(req.params.id)}`);
    if (!s || (s.host_id !== req.session.userId && req.session.role !== 'admin')) return res.status(403).json({ error: 'Нет прав' });
    const { title, desc, date, dur, max } = req.body;
    run(`UPDATE sessions SET title='${esc(title||s.title)}',description='${esc(desc||s.description||'')}',date='${esc(date||s.date)}',duration=${dur||s.duration},max_participants=${max||s.max_participants} WHERE id=${s.id}`);
    res.json({ success: true });
  });

  app.delete('/api/ses/:id', auth, (req, res) => {
    const s = one(`SELECT * FROM sessions WHERE id=${parseInt(req.params.id)}`);
    if (!s || (s.host_id !== req.session.userId && req.session.role !== 'admin')) return res.status(403).json({ error: 'Нет прав' });
    run(`DELETE FROM bookings WHERE session_id=${s.id}`); run(`DELETE FROM sessions WHERE id=${s.id}`);
    res.json({ success: true });
  });

  app.get('/api/users', auth, (req, res) => {
    const q = req.query.q || '';
    if (q.length < 2) return res.json([]);
    res.json(all(`SELECT id,username,avatar_url,level,rating FROM users WHERE username LIKE'%${esc(q)}%' AND id!=${req.session.userId} LIMIT 10`));
  });

  app.get('/api/dialogs', auth, (req, res) => {
    const uid = req.session.userId;
    const dialogs = all(`
      SELECT DISTINCT 
        CASE WHEN m.sender_id = ${uid} THEN m.receiver_id ELSE m.sender_id END as partner_id,
        u.username, u.avatar_url,
        (SELECT message FROM msg WHERE 
          (sender_id = ${uid} AND receiver_id = partner_id) OR 
          (sender_id = partner_id AND receiver_id = ${uid})
        ORDER BY ts DESC LIMIT 1) as last_msg,
        (SELECT ts FROM msg WHERE 
          (sender_id = ${uid} AND receiver_id = partner_id) OR 
          (sender_id = partner_id AND receiver_id = ${uid})
        ORDER BY ts DESC LIMIT 1) as last_ts
      FROM msg m
      JOIN users u ON u.id = CASE WHEN m.sender_id = ${uid} THEN m.receiver_id ELSE m.sender_id END
      WHERE (m.sender_id = ${uid} OR m.receiver_id = ${uid})
        AND CASE WHEN m.sender_id = ${uid} THEN m.receiver_id ELSE m.sender_id END != 0
      ORDER BY last_ts DESC
    `);
    res.json(dialogs);
  });

  app.get('/api/messages/:userId', auth, (req, res) => {
    const partnerId = parseInt(req.params.userId);
    const uid = req.session.userId;
    res.json(all(`SELECT * FROM msg WHERE 
      (sender_id = ${uid} AND receiver_id = ${partnerId}) OR 
      (sender_id = ${partnerId} AND receiver_id = ${uid})
    ORDER BY ts ASC`));
  });

  app.post('/api/nimg', auth, upNw.single('img'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Нет' });
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  });

  app.get('/api/posts', auth, (req, res) => res.json(all(`SELECT p.*,u.username as an,u.avatar_url as aa FROM posts p JOIN users u ON p.author_id=u.id ORDER BY p.ts DESC LIMIT 20`)));

  app.post('/api/posts', auth, (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    const { title, content, items } = req.body;
    run(`INSERT INTO posts(author_id, title, content, items) VALUES(${req.session.userId}, '${esc(title)}', '${esc(content)}', '${esc(items || '[]')}')`);
    res.json({ success: true });
  });

  app.put('/api/posts/:id', auth, (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    const p = one(`SELECT * FROM posts WHERE id=${parseInt(req.params.id)}`);
    if (!p || (p.author_id !== req.session.userId && req.session.role !== 'admin')) return res.status(403).json({ error: 'Нет прав' });
    const { title, content, items } = req.body;
    run(`UPDATE posts SET title='${esc(title)}', content='${esc(content)}', items='${esc(items || '[]')}' WHERE id=${p.id}`);
    res.json({ success: true });
  });

  app.delete('/api/posts/:id', auth, (req, res) => {
    if (req.session.role !== 'admin' && req.session.role !== 'host') return res.status(403).json({ error: 'Нет прав' });
    const p = one(`SELECT * FROM posts WHERE id=${parseInt(req.params.id)}`);
    if (!p || (p.author_id !== req.session.userId && req.session.role !== 'admin')) return res.status(403).json({ error: 'Нет прав' });
    run(`DELETE FROM posts WHERE id=${parseInt(req.params.id)}`);
    res.json({ success: true });
  });

  app.get('/api/rh', auth, (req, res) => res.json(all(`SELECT points,reason,ts FROM rh WHERE user_id=${req.session.userId} ORDER BY ts DESC LIMIT 10`)));
  app.get('/api/myb', auth, (req, res) => res.json(all(`SELECT b.id as bid,b.status,s.title,s.date,s.meeting_link FROM bookings b JOIN sessions s ON b.session_id=s.id WHERE b.user_id=${req.session.userId} ORDER BY s.date DESC`)));
  app.get('/api/top', (req, res) => res.json(all('SELECT id,username,level,rating,avatar_url FROM users ORDER BY rating DESC LIMIT 10')));

  app.post('/api/admin/prom', auth, (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    run(`UPDATE users SET role='host' WHERE id=${req.body.uid}`);
    res.json({ success: true });
  });

  app.get('/api/admin/users', auth, (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    res.json(all('SELECT id,username,role,level,rating,avatar_url FROM users ORDER BY rating DESC'));
  });

  app.get('/api/settings', (req, res) => {
    const rows = all("SELECT * FROM settings"), s = {};
    rows.forEach(r => s[r.key] = r.value);
    res.json(s);
  });

  app.put('/api/settings', auth, (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    const s = req.body;
    for (const k in s) {
      if (one(`SELECT key FROM settings WHERE key='${esc(k)}'`)) run(`UPDATE settings SET value='${esc(s[k])}' WHERE key='${esc(k)}'`);
      else run(`INSERT INTO settings(key,value)VALUES('${esc(k)}','${esc(s[k])}')`);
    }
    res.json({ success: true });
  });

  app.get('/api/services', (req, res) => res.json(all("SELECT * FROM services ORDER BY id ASC")));
  app.post('/api/services', auth, (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    run(`INSERT INTO services(title,desc,price,icon)VALUES('${esc(req.body.title)}','${esc(req.body.desc||'')}','${esc(req.body.price||'')}','${esc(req.body.icon||'')}')`);
    res.json({ success: true });
  });
  app.put('/api/services/:id', auth, (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    run(`UPDATE services SET title='${esc(req.body.title)}',desc='${esc(req.body.desc||'')}',price='${esc(req.body.price||'')}',icon='${esc(req.body.icon||'')}' WHERE id=${parseInt(req.params.id)}`);
    res.json({ success: true });
  });
  app.delete('/api/services/:id', auth, (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Нет прав' });
    run(`DELETE FROM services WHERE id=${parseInt(req.params.id)}`);
    res.json({ success: true });
  });

  app.get('/api/words', auth, (req, res) => res.json(all(`SELECT * FROM words WHERE user_id=${req.session.userId} ORDER BY id DESC`)));
  app.post('/api/words', auth, (req, res) => { const { en, ru } = req.body; run(`INSERT INTO words(user_id,en,ru)VALUES(${req.session.userId},'${esc(en)}','${esc(ru)}')`); res.json({ success: true }); });
  app.delete('/api/words/:id', auth, (req, res) => { run(`DELETE FROM words WHERE id=${parseInt(req.params.id)} AND user_id=${req.session.userId}`); res.json({ success: true }); });

  app.get('/api/notes', auth, (req, res) => { const n = one(`SELECT note FROM notes WHERE user_id=${req.session.userId}`); res.json({ note: n ? n.note : '' }); });
  app.put('/api/notes', auth, (req, res) => {
    if (one(`SELECT id FROM notes WHERE user_id=${req.session.userId}`)) run(`UPDATE notes SET note='${esc(req.body.note)}' WHERE user_id=${req.session.userId}`);
    else run(`INSERT INTO notes(user_id,note)VALUES(${req.session.userId},'${esc(req.body.note)}')`);
    res.json({ success: true });
  });

  async function createGMeet(title, desc, date, dur) {
    try {
      const auth = new google.auth.GoogleAuth({ keyFile: 'google-credentials.json', scopes: ['https://www.googleapis.com/auth/calendar'] });
      const cal = google.calendar({ version: 'v3', auth });
      const sd = new Date(date), ed = new Date(sd.getTime() + dur * 60000);
      const r = await cal.events.insert({ calendarId: 'primary', resource: { summary: `[Club] ${title}`, description: desc, start: { dateTime: sd.toISOString(), timeZone: 'Europe/Moscow' }, end: { dateTime: ed.toISOString(), timeZone: 'Europe/Moscow' }, conferenceData: { createRequest: { requestId: `m${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } } }, conferenceDataVersion: 1 });
      return r.data.hangoutLink || null;
    } catch (e) { return null; }
  }

  function genICS(s) {
    const st = new Date(s.date), en = new Date(st.getTime() + (s.duration || 60) * 60000);
    const { error, value } = icsEvent({ start: [st.getFullYear(), st.getMonth()+1, st.getDate(), st.getHours(), st.getMinutes()], end: [en.getFullYear(), en.getMonth()+1, en.getDate(), en.getHours(), en.getMinutes()], title: `[Club] ${s.title}`, location: s.meeting_link || 'Онлайн', url: s.meeting_link, status: 'CONFIRMED' });
    if (error) return null;
    const fn = `s-${s.id}-${Date.now()}.ics`; fs.writeFileSync(`public/calendars/${fn}`, value); return `/calendars/${fn}`;
  }

  io.on('connection', s => {
    s.on('join', d => { s.uid = d.uid; s.uname = d.uname; s.role = d.role; s.join(`u:${d.uid}`); });
    s.on('dm', d => {
      if (!s.uid) return;
      const m = { from: s.uid, fn: s.uname, msg: d.msg || '', file_url: d.fileUrl || null, file_type: d.fileType || null, ts: new Date().toISOString() };
      io.to(`u:${d.to}`).emit('dm', m);
      s.emit('dm', m);
      run(`INSERT INTO msg(sender_id,receiver_id,message,file_url,file_type) VALUES(${s.uid},${d.to},'${esc(d.msg||'')}',${d.fileUrl?`'${esc(d.fileUrl)}'`:'NULL'},${d.fileType?`'${esc(d.fileType)}'`:'NULL'})`);
      if (d.to !== 0) {
        const receiver = one(`SELECT username FROM users WHERE id=${d.to}`);
        notifyUser(d.to, `💬 Новое сообщение от ${s.uname}: ${(d.msg||'').substring(0, 100)}`);
      }
    });
    s.on('hist', d => { if (!s.uid) return; s.emit('hist', all(`SELECT m.*,u.username as fn FROM msg m JOIN users u ON m.sender_id=u.id WHERE(m.sender_id=${s.uid} AND m.receiver_id=0)OR(m.sender_id=0 AND m.receiver_id=${s.uid})ORDER BY m.ts ASC`)); });
    s.on('dmhist', d => { if (!s.uid) return; s.emit('dmhist', { with: d.with, msgs: all(`SELECT m.*,u.username as fn FROM msg m JOIN users u ON m.sender_id=u.id WHERE(m.sender_id=${s.uid} AND m.receiver_id=${d.with})OR(m.sender_id=${d.with} AND m.receiver_id=${s.uid})ORDER BY m.ts ASC`) }); });
    s.on('jadmin', () => { if (s.role === 'admin') s.join('admin'); });
  });

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  server.listen(process.env.PORT || 3000, () => console.log('🚀 Сервер запущен'));

  if (TG_TOKEN) {
    let lastUpdateId = 0;
    setInterval(async () => {
      try {
        const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
        const d = await r.json();
        if (d.result && d.result.length) {
          d.result.forEach(up => {
            lastUpdateId = up.update_id;
            if (up.message && up.message.text && up.message.text.startsWith('/start')) {
              const chatId = up.message.chat.id;
              const userId = up.message.text.split(' ')[1];
              if (userId) {
                run(`INSERT OR REPLACE INTO tg_users(user_id, chat_id) VALUES(${parseInt(userId)}, '${esc(chatId)}')`);
                sendTelegram(chatId, '✅ Ты привязан к English Club!');
              }
            }
          });
        }
      } catch(e) {}
    }, 3000);
  }

}).catch(e => console.error(e));
