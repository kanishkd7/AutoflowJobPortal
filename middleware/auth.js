const jwt = require('jsonwebtoken');
const db = require('../models');

module.exports = async (req, res, next) => {
  try {
   
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    // Check token in DB
    const session = await db.SessionToken.findOne({ where: { token } });
    if (!session) return res.status(401).json({ error: 'Session expired or invalid' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.User.findByPk(payload.id);
    if (!user) return res.status(401).json({ error: 'Invalid token user' });

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};