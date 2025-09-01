const db = require('../models');

exports.me = async (req, res) => {
  const user = await db.User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] },
    include: ['skills','experiences','educations','certifications','projects']
  });
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const fields = ['headline','location','phone','country','sociallinks'];
  for (const f of fields) if (req.body[f] !== undefined) req.user[f] = req.body[f];
  await req.user.save();

  const user = await db.User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
  res.json(user);
};

exports.uploadResume = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No resume uploaded' });
  req.user.resumePath = '/uploads/' + req.file.filename;
  await req.user.save();
  res.json({ message: 'Resume uploaded', path: req.user.resumePath });
};

exports.uploadPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
  req.user.profilePicture = '/uploads/' + req.file.filename;
  await req.user.save();
  res.json({ message: 'Photo uploaded', path: req.user.profilePicture });
};
