const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, description, website, location } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email, password required' });

    const exists = await db.Company.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Company already exists' });

    const hash = await bcrypt.hash(password, 10);
    const company = await db.Company.create({ name, email, password: hash, description, website, location });

    const token = jwt.sign({ id: company.id, type: 'company' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '1d' });

    res.cookie('company_token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
   
    res.json({ company:token });
  } catch (err) {
    console.error('Company Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email, password required' });

    const company = await db.Company.findOne({ where: { email } });
    if (!company) return res.status(404).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, company.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: company.id, type: 'company' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '1d' });

    res.cookie('company_token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
   
    res.json({ company: token });
  } catch (err) {
    console.error('Company Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('company_token');
    res.json({ message: 'Company logged out' });
  } catch (err) {
    res.status(500).json({ error: 'Logout error' });
  }
};