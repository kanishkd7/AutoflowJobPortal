const db = require('../models');

exports.applyToJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;

   
    const job = await db.Job.findByPk(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    
    if (!req.user.resumePath) {
      return res.status(400).json({ error: 'Please upload your resume before applying.' });
    }

    
    const alreadyApplied = await db.Application.findOne({
      where: { userId: req.user.id, jobId }
    });
    if (alreadyApplied) return res.status(400).json({ error: 'Already applied to this job' });

  
    const application = await db.Application.create({
      userId: req.user.id,
      jobId,
      resumePath: req.user.resumePath
    });

    res.status(201).json({ message: 'Applied successfully', application });
  } catch (err) {
    res.status(500).json({ error: 'Could not apply to job' });
  }
};

exports.listMyApplications = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; 
    const offset = (page - 1) * limit;

    
    const whereClause = { userId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

   
    const applications = await db.Application.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: db.Job,
          as: 'job',
          include: [
            {
              model: db.Company,
              as: 'company',
              attributes: ['id', 'name', 'logo', 'location', 'website']
            }
          ],
          attributes: [
            'id', 'title', 'description', 'location', 'type', 'salary',
            'requirements', 'deadline', 'createdAt', 'updatedAt'
          ]
        }
      ],
      attributes: ['id', 'status', 'resumePath', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']], // Most recent applications first
      limit,
      offset
    });

  
    const totalPages = Math.ceil(applications.count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

   
    const response = {
      applications: applications.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalApplications: applications.count,
        applicationsPerPage: limit,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        status: status || 'all'
      }
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Could not fetch applications' });
  }
};

exports.getApplicationById = async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const userId = req.user.id;

   
    const application = await db.Application.findOne({
      where: { 
        id: applicationId,
        userId: userId 
      },
      include: [
        {
          model: db.Job,
          as: 'job',
          include: [
            {
              model: db.Company,
              as: 'company',
              attributes: ['id', 'name', 'logo', 'location', 'website', 'description']
            }
          ],
          attributes: [
            'id', 'title', 'description', 'location', 'type', 'salary',
            'requirements', 'deadline', 'createdAt', 'updatedAt'
          ]
        }
      ],
      attributes: ['id', 'status', 'resumePath', 'createdAt', 'updatedAt']
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (err) {
    console.error('Error fetching application:', err);
    res.status(500).json({ error: 'Could not fetch application' });
  }
};

exports.getApplicationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total applications count
    const totalApplications = await db.Application.count({
      where: { userId }
    });

    // Get applications by status
    const applicationsByStatus = await db.Application.findAll({
      where: { userId },
      attributes: [
        'status',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentApplications = await db.Application.count({
      where: {
        userId,
        createdAt: {
          [db.Sequelize.Op.gte]: thirtyDaysAgo
        }
      }
    });

    
    const statusCounts = {};
    applicationsByStatus.forEach(item => {
      statusCounts[item.status] = parseInt(item.dataValues.count);
    });

    const stats = {
      totalApplications,
      recentApplications,
      statusBreakdown: statusCounts,
      lastUpdated: new Date()
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching application stats:', err);
    res.status(500).json({ error: 'Could not fetch application statistics' });
  }
};


exports.getApplicationStatusSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    
    const applicationsByStatus = await db.Application.findAll({
      where: { userId },
      include: [
        {
          model: db.Job,
          as: 'job',
          include: [
            {
              model: db.Company,
              as: 'company',
              attributes: ['id', 'name', 'logo']
            }
          ],
          attributes: ['id', 'title', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const statusGroups = {
      applied: [],
      accepted: [],
      rejected: [],
      pending: []
    };

    applicationsByStatus.forEach(app => {
      const status = app.status || 'applied';
      if (statusGroups[status]) {
        statusGroups[status].push({
          applicationId: app.id,
          applicationDate: app.createdAt,
          jobTitle: app.job.title,
          companyName: app.job.company.name,
          companyLogo: app.job.company.logo,
          status: app.status
        });
      }
    });

    
    const summary = {
      totalApplications: applicationsByStatus.length,
      statusBreakdown: {
        applied: statusGroups.applied.length,
        accepted: statusGroups.accepted.length,
        rejected: statusGroups.rejected.length,
        pending: statusGroups.pending.length
      },
      applicationsByStatus: statusGroups,
      lastUpdated: new Date()
    };

    res.json(summary);
  } catch (err) {
    console.error('Error fetching application status summary:', err);
    res.status(500).json({ error: 'Could not fetch application status summary' });
  }
};