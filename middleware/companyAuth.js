const jwt = require('jsonwebtoken');
const db = require('../models');

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.company_token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'company') return res.status(401).json({ error: 'Invalid company token' });

    const company = await db.Company.findByPk(payload.id);
    if (!company) return res.status(401).json({ error: 'Invalid token company' });

    req.company = company;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};