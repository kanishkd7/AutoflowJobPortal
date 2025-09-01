const express = require('express');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controller/authController');

const router = express.Router();

router.post('/register',
  body('email').isEmail().withMessage('Valid email required'),
  body('username').notEmpty().withMessage('Username required'),
  body('password').isLength({ min: 6 }).withMessage('Min 6 chars'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  ctrl.register
);

router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  ctrl.login
);

router.post('/logout', ctrl.logout);

router.post('/forgot-password',
  body('email').isEmail().withMessage('Valid email required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  ctrl.forgotPassword
);

router.post('/reset-password',
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  ctrl.resetPassword
);

module.exports = router;
