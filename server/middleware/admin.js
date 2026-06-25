const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

module.exports = async function adminMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }

  const user = (await db.execute({ sql: 'SELECT is_admin FROM users WHERE id = ?', args: [payload.userId] })).rows[0];
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  req.user = { userId: payload.userId, username: payload.username, isAdmin: true };
  next();
};
