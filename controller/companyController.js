const db = require('../models');
const JobNotificationService = require('../utils/jobNotificationService');
const mailer = require('../utils/mailer');

exports.me = async (req, res) => {
  const company = await db.Company.findByPk(req.company.id, {
    attributes: { exclude: ['password'] },
    include: [{ model: db.Job, as: 'jobs' }]
  });
  res.json(company);
};

exports.updateProfile = async (req, res) => {
  const fields = ['name', 'description', 'website', 'location'];
  for (const f of fields) if (req.body[f] !== undefined) req.company[f] = req.body[f];
  await req.company.save();
  
 
};

exports.uploadLogo = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No logo uploaded' });
  req.company.logo = '/uploads/' + req.file.filename;
  await req.company.save();
  res.json({ message: 'Logo uploaded', path: req.company.logo });
};

exports.createJob = async (req, res) => {
  const { title, description, location, salary, type, requirements, deadline } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: 'title and description required' });

  const job = await db.Job.create({
    title, description, location, salary, type, requirements, deadline,
    companyId: req.company.id
  });

 
  JobNotificationService.checkAndNotifyJobMatch(job.id)
    .then(() => {
      console.log(`Notification check completed for new job ${job.id}`);
    })
    .catch(error => {
      console.error('Error in notification service for new job:', error);
    });

  res.status(201).json(job);
};

exports.listMyJobs = async (req, res) => {
  const jobs = await db.Job.findAll({ 
    where: { companyId: req.company.id },
    order: [['createdAt', 'DESC']]
  });
  res.json(jobs);
};

// Get applicants for a specific job
exports.getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const companyId = req.company.id;

    
    const job = await db.Job.findOne({
      where: { id: jobId, companyId: companyId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or you do not have access to it' });
    }

    
    const applications = await db.Application.findAll({
      where: { jobId: jobId },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'headline', 'location', 'resumePath', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']] 
    });

    
    const applicants = applications.map(app => ({
      applicationId: app.id,
      applicationDate: app.createdAt,
      applicationStatus: app.status,
      user: {
        id: app.user.id,
        username: app.user.username,
        email: app.user.email,
        headline: app.user.headline,
        location: app.user.location,
        resumePath: app.user.resumePath,
        profilePicture: app.user.profilePicture
      }
    }));

    res.json({
      job: {
        id: job.id,
        title: job.title,
        status: job.status
      },
      totalApplicants: applicants.length,
      applicants: applicants
    });

  } catch (error) {
    console.error('Error fetching job applicants:', error);
    res.status(500).json({ error: 'Could not fetch applicants' });
  }
};


exports.getAllApplicants = async (req, res) => {
  try {
    const companyId = req.company.id;

    
    const companyJobs = await db.Job.findAll({
      where: { companyId: companyId },
      attributes: ['id', 'title', 'status']
    });

    
    const allApplications = await db.Application.findAll({
      where: { 
        jobId: companyJobs.map(job => job.id) 
      },
      include: [
        {
          model: db.Job,
          as: 'job',
          attributes: ['id', 'title', 'status']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'headline', 'location', 'resumePath', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']] 
    });

  
    const applicantsByJob = {};
    
    allApplications.forEach(app => {
      const jobTitle = app.job.title;
      
      if (!applicantsByJob[jobTitle]) {
        applicantsByJob[jobTitle] = {
          jobId: app.job.id,
          jobTitle: jobTitle,
          jobStatus: app.job.status,
          applicants: []
        };
      }

      applicantsByJob[jobTitle].applicants.push({
        applicationId: app.id,
        applicationDate: app.createdAt,
        applicationStatus: app.status,
        user: {
          id: app.user.id,
          username: app.user.username,
          email: app.user.email,
          headline: app.user.headline,
          location: app.user.location,
          resumePath: app.user.resumePath,
          profilePicture: app.user.profilePicture
        }
      });
    });

    res.json({
      totalJobs: companyJobs.length,
      totalApplications: allApplications.length,
      applicantsByJob: Object.values(applicantsByJob)
    });

  } catch (error) {
    console.error('Error fetching all applicants:', error);
    res.status(500).json({ error: 'Could not fetch applicants' });
  }
};

exports.acceptApplicant = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const companyId = req.company.id;

    
    const application = await db.Application.findOne({
      where: { id: applicationId },
      include: [
        {
          model: db.Job,
          as: 'job',
          where: { companyId: companyId },
          attributes: ['id', 'title', 'companyId']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found or you do not have access to it' });
    }

    
    await application.update({ status: 'accepted' });

    
    try {
      const user = await db.User.findByPk(application.userId);
      if (user && user.email) {
        const emailSubject = `🎉 Congratulations! Your application has been accepted`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">🎉 Application Accepted!</h2>
            <p>Dear <strong>${user.username}</strong>,</p>
            <p>Great news! Your application for the position of <strong>${application.job.title}</strong> at <strong>${req.company.name}</strong> has been accepted!</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057;">Application Details:</h3>
              <p><strong>Job Title:</strong> ${application.job.title}</p>
              <p><strong>Company:</strong> ${req.company.name}</p>
              <p><strong>Application Date:</strong> ${new Date(application.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">ACCEPTED</span></p>
            </div>
            
            <p>We will contact you soon with next steps for the hiring process.</p>
            <p>Best regards,<br><strong>${req.company.name} HR Team</strong></p>
          </div>
        `;
        
        await mailer(user.email, emailSubject, null, emailHtml);
        console.log(`Acceptance email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Error sending acceptance email:', emailError);
      
    }

    res.json({
      message: 'Applicant accepted successfully',
      application: {
        id: application.id,
        status: application.status,
        jobTitle: application.job.title,
        applicantName: application.user?.username || 'Unknown'
      }
    });

  } catch (error) {
    console.error('Error accepting applicant:', error);
    res.status(500).json({ error: 'Could not accept applicant' });
  }
};

// Reject an applicant
exports.rejectApplicant = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const companyId = req.company.id;

   
    const application = await db.Application.findOne({
      where: { id: applicationId },
      include: [
        {
          model: db.Job,
          as: 'job',
          where: { companyId: companyId },
          attributes: ['id', 'title', 'companyId']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found or you do not have access to it' });
    }

    
    await application.update({ status: 'rejected' });

  
    try {
      const user = await db.User.findByPk(application.userId);
      if (user && user.email) {
        const emailSubject = `Application Update: ${application.job.title}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6c757d;">Application Update</h2>
            <p>Dear <strong>${user.username}</strong>,</p>
            <p>Thank you for your interest in the position of <strong>${application.job.title}</strong> at <strong>${req.company.name}</strong>.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057;">Application Details:</h3>
              <p><strong>Job Title:</strong> ${application.job.title}</p>
              <p><strong>Company:</strong> ${req.company.name}</p>
              <p><strong>Application Date:</strong> ${new Date(application.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">NOT SELECTED</span></p>
            </div>
            
            <p>After careful consideration, we regret to inform you that we have decided to move forward with other candidates for this position.</p>
            <p>We appreciate your interest in joining our team and encourage you to apply for future opportunities that match your skills and experience.</p>
            <p>Best regards,<br><strong>${req.company.name} HR Team</strong></p>
          </div>
        `;
        
        await mailer(user.email, emailSubject, null, emailHtml);
        console.log(`Rejection email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      
    }

    res.json({
      message: 'Applicant rejected successfully',
      application: {
        id: application.id,
        status: application.status,
        jobTitle: application.job.title,
        applicantName: application.user?.username || 'Unknown'
      }
    });

  } catch (error) {
    console.error('Error rejecting applicant:', error);
    res.status(500).json({ error: 'Could not reject applicant' });
  }
};


async function sendApplicationStatusEmail(userId, jobTitle, companyName, status, applicationDate) {
  try {
    const user = await db.User.findByPk(userId);
    if (!user || !user.email) return;

    let emailSubject, emailHtml;

    if (status === 'accepted') {
      emailSubject = `🎉 Congratulations! Your application has been accepted`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">🎉 Application Accepted!</h2>
          <p>Dear <strong>${user.username}</strong>,</p>
          <p>Great news! Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been accepted!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057;">Application Details:</h3>
            <p><strong>Job Title:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Application Date:</strong> ${new Date(applicationDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">ACCEPTED</span></p>
          </div>
          
          <p>We will contact you soon with next steps for the hiring process.</p>
          <p>Best regards,<br><strong>${companyName} HR Team</strong></p>
        </div>
      `;
    } else if (status === 'rejected') {
      emailSubject = `Application Update: ${jobTitle}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6c757d;">Application Update</h2>
          <p>Dear <strong>${user.username}</strong>,</p>
          <p>Thank you for your interest in the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057;">Application Details:</h3>
            <p><strong>Job Title:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Application Date:</strong> ${new Date(applicationDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">NOT SELECTED</span></p>
          </div>
          
          <p>After careful consideration, we regret to inform you that we have decided to move forward with other candidates for this position.</p>
          <p>We appreciate your interest in joining our team and encourage you to apply for future opportunities that match your skills and experience.</p>
          <p>Best regards,<br><strong>${companyName} HR Team</strong></p>
        </div>
      `;
    }

    if (emailSubject && emailHtml) {
      await mailer(user.email, emailSubject, null, emailHtml);
      console.log(`${status} email sent to ${user.email} for job: ${jobTitle}`);
    }
  } catch (error) {
    console.error(`Error sending ${status} email:`, error);
  }
}