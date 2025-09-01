const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await db.Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

  
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Admin logged in successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};


exports.logout = async (req, res) => {
  try {
    
    res.clearCookie('adminToken');
    res.json({ message: 'Admin logged out successfully' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};


exports.getPendingJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const jobs = await db.Job.findAndCountAll({
      where: { status: 'pending' },
      include: [
        {
          model: db.Company,
          as: 'company',
          attributes: ['id', 'name', 'logo', 'location']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(jobs.count / limit);

    res.json({
      jobs: jobs.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalJobs: jobs.count,
        jobsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching pending jobs:', error);
    res.status(500).json({ error: 'Could not fetch pending jobs' });
  }
};


exports.approveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const adminId = req.admin.id;

    const job = await db.Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({ error: 'Job is not pending approval' });
    }

    await job.update({ 
      status: 'approved', 
      adminId: adminId 
    });

     const JobNotificationService = require('../utils/jobNotificationService');
    JobNotificationService.checkAndNotifyJobMatch(jobId)
      .then(() => {
        console.log(`Notifications sent for approved job ${jobId}`);
      })
      .catch(error => {
        console.error('Error sending notifications for approved job:', error);
      });

    res.json({ message: 'Job approved successfully', job });
  } catch (error) {
    console.error('Error approving job:', error);
    res.status(500).json({ error: 'Could not approve job' });
  }
};


exports.rejectJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const adminId = req.admin.id;

    const job = await db.Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({ error: 'Job is not pending approval' });
    }

    await job.update({ 
      status: 'rejected', 
      adminId: adminId 
    });

    res.json({ message: 'Job rejected successfully', job });
  } catch (error) {
    console.error('Error rejecting job:', error);
    res.status(500).json({ error: 'Could not reject job' });
  }
};


exports.getJobStats = async (req, res) => {
  try {
    const totalJobs = await db.Job.count();
    const pendingJobs = await db.Job.count({ where: { status: 'pending' } });
    const approvedJobs = await db.Job.count({ where: { status: 'approved' } });
    const rejectedJobs = await db.Job.count({ where: { status: 'rejected' } });

    res.json({
      totalJobs,
      pendingJobs,
      approvedJobs,
      rejectedJobs
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ error: 'Could not fetch job statistics' });
  }
}; 