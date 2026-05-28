const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');

module.exports = (app, supabase) => {
  const { notifyUser, updateRating } = require('../utils/telegram');
  const { getLevel } = require('../utils/helpers');

  async function ensureTutorChat(userId) {
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').limit(1);
    if (!admins?.length) return;
    const adminId = admins[0].id;
    const { data: existing } = await supabase.from('msg').select('id').or(`and(sender_id.eq.${userId},receiver_id.eq.${adminId}),and(sender_id.eq.${adminId},receiver_id.eq.${userId})`).limit(1);
    if (!existing?.length) {
      await supabase.from('msg').insert({ sender_id: adminId, receiver_id: userId, message: '👋 Добро пожаловать! Я ваш репетитор.', read: false });
    }
  }

  app.post('/api/reg', async (req, res) => {
    const { username, email, password, level } = req.body;
    const { data: exists } = await supabase.from('users').select('id').eq('email', email).single();
    if (exists) return res.status(400).json({ error: 'Email занят' });
    const hash = await bcrypt.hash(password, 10);
    const { data: newUser } = await supabase.from('users').insert({ username, email, password: hash, level: level || 'B1' }).select('id').single();
    if (newUser) ensureTutorChat(newUser.id);
    res.json({ success: true });
  });

  // Вход (обновлённый — с JWT токеном)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }
    
    // Ищем пользователя
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    
    // Проверяем пароль (поддерживаем и хэшированные, и обычные)
    let validPassword = false;
    
    if (user.password && user.password.startsWith('$2')) {
      // Пароль захэширован через bcrypt
      const bcrypt = require('bcryptjs');
      validPassword = await bcrypt.compare(password, user.password);
    } else {
      // Простое сравнение (для старых пользователей)
      validPassword = user.password === password;
    }
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    
    // Генерируем JWT токен
    const { generateToken } = require('../middleware/auth');
    const token = generateToken(user.id, user.role);
    
    // Сохраняем в сессии (для обратной совместимости)
    req.session.userId = user.id;
    req.session.role = user.role;
    
    // Не отправляем пароль клиенту
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка входа' });
  }
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
  app.post('/api/reset-password', async (req, res) => { res.json({ success: true }); });
};
