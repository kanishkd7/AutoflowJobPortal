const express = require('express');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controller/companyAuthController');

const router = express.Router();

const validate = [
  body('email').isEmail().withMessage('Valid email required'),
  body('name').notEmpty().withMessage('Company name required'),
  body('password').isLength({ min: 6 }).withMessage('Min 6 chars')
];

router.post('/register', validate, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}, ctrl.register);

router.post('/login',
  [body('email').isEmail(), body('password').notEmpty()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  ctrl.login
);

router.post('/logout', ctrl.logout);

module.exports = router;