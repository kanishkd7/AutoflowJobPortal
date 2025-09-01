const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const ctrl = require('../controller/adminController');

const router = express.Router();


router.post('/login', ctrl.login);


router.post('/logout', ctrl.logout);


router.use(adminAuth);


router.get('/jobs/pending', ctrl.getPendingJobs);


router.put('/jobs/:jobId/approve', ctrl.approveJob);


router.put('/jobs/:jobId/reject', ctrl.rejectJob);


router.get('/jobs/stats', ctrl.getJobStats);

module.exports = router; 