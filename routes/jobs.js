const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controller/jobController');

const router = express.Router();


router.get('/', ctrl.listAllJobs);


router.get('/personalized/suggestions', auth, ctrl.getPersonalizedJobs);


router.get('/:id', ctrl.getJob);

module.exports = router;