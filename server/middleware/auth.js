function auth(req, res, next) { req.session.userId ? next() : res.status(401).json({ error: 'Войдите' }); }
module.exports = auth;
