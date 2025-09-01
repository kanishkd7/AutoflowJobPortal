const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const ctrl = require('../controller/skillController');

const router = express.Router();

// Validation middleware
const validateSkill = [
  body('name').trim().notEmpty().withMessage('Skill name is required'),
  body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Level must be Beginner, Intermediate, or Advanced'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];


router.get('/', auth, ctrl.getUserSkills);


router.post('/', auth, validateSkill, ctrl.addSkill);


router.post('/bulk', auth, ctrl.addMultipleSkills);


router.put('/:id', auth, validateSkill, ctrl.updateSkill);


router.delete('/:id', auth, ctrl.deleteSkill);

module.exports = router; 