const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const { startTelegramBot } = require('./server/utils/telegram');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] }, transports: ['websocket', 'polling'] });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

console.log('📊 Supabase инициализирован');

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('body-parser').json());
app.use(express.static('dist'));
app.use(session({ secret: 'sp-club-2026', resave: false, saveUninitialized: false, cookie: { maxAge: 30 * 24 * 3600000, sameSite: 'lax', secure: false } }));

// Роуты
require('./server/routes/auth')(app, supabase);
require('./server/routes/files')(app, supabase);
require('./server/routes/payments')(app, supabase);
require('./server/routes/chat')(app, supabase);
require('./server/routes/posts')(app, supabase);
require('./server/routes/sessions')(app, supabase);
require('./server/routes/slots')(app, supabase);
require('./server/routes/other')(app, supabase);

// Socket.IO
require('./server/socket/chat')(io, supabase);

// Telegram бот
startTelegramBot(supabase);

// ВК Бот
if (process.env.VK_TOKEN && process.env.VK_GROUP_ID) {
  const { bot } = require('./server/utils/vkbot');
  bot.startPolling();
  console.log('🤖 ВК бот запущен');
}

app.get('*', (req, res) => { if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io')) return res.status(404).json({ error: 'Not found' }); res.sendFile(path.join(__dirname, 'dist', 'index.html')); });
server.listen(process.env.PORT || 3000, () => { console.log('🚀 Сервер запущен'); });
