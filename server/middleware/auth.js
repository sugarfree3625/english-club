const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'english-club-jwt-secret-2026';

// Проверка токена (защита роутов)
const auth = (req, res, next) => {
  try {
    // Достаём токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    
    // Если токена нет — проверяем старую сессию (для обратной совместимости)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback: используем сессию, если она есть
      if (req.session && req.session.userId) {
        req.userId = req.session.userId;
        req.userRole = req.session.role;
        return next();
      }
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    // Проверяем JWT токен
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    
    // Fallback: пробуем сессию
    if (req.session && req.session.userId) {
      req.userId = req.session.userId;
      req.userRole = req.session.role;
      return next();
    }
    
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

// Создание токена при входе
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '30d' });
};

module.exports = { auth, generateToken };
