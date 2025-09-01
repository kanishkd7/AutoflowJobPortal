const express = require('express');
const auth = require('../middleware/companyAuth');
const ctrl = require('../controller/companyController');
const { uploadLogo } = require('../utils/upload');

const router = express.Router();

router.get('/me', auth, ctrl.me);
router.put('/me', auth, ctrl.updateProfile);
router.post('/logo', auth, (req, res, next) => uploadLogo(req, res, err => err ? res.status(400).json({ error: err.message }) : next()), ctrl.uploadLogo);


router.post('/jobs', auth, ctrl.createJob);
router.get('/jobs', auth, ctrl.listMyJobs);


router.get('/jobs/:jobId/applicants', auth, ctrl.getJobApplicants);


router.get('/applicants', auth, ctrl.getAllApplicants);


router.put('/applications/:applicationId/accept', auth, ctrl.acceptApplicant);


router.put('/applications/:applicationId/reject', auth, ctrl.rejectApplicant);

module.exports = router;