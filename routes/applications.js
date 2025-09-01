const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controller/applicationController');

const router = express.Router();


router.post('/jobs/:jobId/apply', auth, ctrl.applyToJob);


router.get('/my', auth, ctrl.listMyApplications);

router.get('/:applicationId', auth, ctrl.getApplicationById);

router.get('/stats/my', auth, ctrl.getApplicationStats);

router.get('/status-summary', auth, ctrl.getApplicationStatusSummary);

module.exports = router;