const express = require('express');
const auth = require('../middleware/auth');
const userCtrl = require('../controller/userController');
const { uploadResume, uploadPhoto } = require('../utils/upload');

const router = express.Router();

router.get('/me', auth, userCtrl.me);
router.put('/me', auth, userCtrl.updateProfile);

router.post('/resume',
  auth,
  (req, res, next) => uploadResume(req, res, err => err ? res.status(400).json({ error: err.message }) : next()),
  userCtrl.uploadResume
);

router.post('/photo',
  auth,
  (req, res, next) => uploadPhoto(req, res, err => err ? res.status(400).json({ error: err.message }) : next()),
  userCtrl.uploadPhoto
);

module.exports = router;
