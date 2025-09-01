const db = require('../models');
const { createJobMatchNotification } = require('../controller/notificationController');

class JobNotificationService {
 
  static async tableExists() {
    try {
      await db.Notification.findOne({ limit: 1 });
      return true;
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError' && 
          (error.parent?.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_NO_SUCH_TABLE')) {
        return false;
      }
      throw error;
    }
  }

  
  static async checkAndNotifyJobMatch(jobId) {
    try {
      // // Check if table exists first
      // if (!(await this.tableExists())) {
      //   console.log('Notifications table not created yet, skipping job match check');
      //   return;
      // }

      
      const job = await db.Job.findOne({
        where: { id: jobId, status: 'approved' },
        include: [{ model: db.Company, as: 'company' }]
      });

      if (!job) {
        console.error('Job not found or not approved for notification check:', jobId);
        return;
      }

      
      const usersWithSkills = await db.User.findAll({
        include: [
          {
            model: db.Skill,
            as: 'skills',
            attributes: ['name', 'level']
          }
        ]
      });

     
      for (const user of usersWithSkills) {
        if (!user.skills || user.skills.length === 0) {
          continue; 
        }

        const matchData = this.calculateJobMatch(user.skills, job);
        
        // Only create notification if there's a meaningful match (at least 25% match)
        if (matchData.matchPercentage >= 25) {
          // Check if notification already exists for this user and job
          const existingNotification = await db.Notification.findOne({
            where: { userId: user.id, jobId: jobId }
          });

          if (!existingNotification) {
            await createJobMatchNotification(user.id, jobId, matchData);
            console.log(`Created notification for user ${user.id} for job ${jobId} with ${matchData.matchPercentage.toFixed(1)}% match`);
          }
        }
      }
    } catch (error) {
      console.error('Error in job notification service:', error);
    }
  }

  // Calculate match between user skills and job
  static calculateJobMatch(userSkills, job) {
    const skillNames = userSkills.map(skill => skill.name.toLowerCase());
    let matchScore = 0;
    let matchedSkills = [];

    // Check job title (highest weight)
    if (job.title) {
      const title = job.title.toLowerCase();
      skillNames.forEach(skillName => {
        if (title.includes(skillName)) {
          matchScore += 2;
          if (!matchedSkills.includes(skillName)) {
            matchedSkills.push(skillName);
          }
        }
      });
    }

    // Check job requirements (medium weight)
    if (job.requirements) {
      const requirements = job.requirements.toLowerCase();
      skillNames.forEach(skillName => {
        if (requirements.includes(skillName) && !matchedSkills.includes(skillName)) {
          matchScore += 1;
          matchedSkills.push(skillName);
        }
      });
    }

    // Check job description (lowest weight)
    if (job.description) {
      const description = job.description.toLowerCase();
      skillNames.forEach(skillName => {
        if (description.includes(skillName) && !matchedSkills.includes(skillName)) {
          matchScore += 0.5;
          matchedSkills.push(skillName);
        }
      });
    }

    const matchPercentage = skillNames.length > 0 
      ? Math.min((matchScore / skillNames.length) * 100, 100)
      : 0;

    return {
      matchScore,
      matchedSkills,
      matchPercentage
    };
  }

 
  static async processExistingJobsForUser(userId) {
    try {
      // Check if table exists first
      // if (!(await this.tableExists())) {
      //   console.log('Notifications table not created yet, skipping existing jobs processing');
      //   return;
      // }

      const user = await db.User.findByPk(userId, {
        include: [
          {
            model: db.Skill,
            as: 'skills',
            attributes: ['name', 'level']
          }
        ]
      });

      if (!user || !user.skills || user.skills.length === 0) {
        return;
      }

     
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentJobs = await db.Job.findAll({
        where: {
          createdAt: {
            [db.Sequelize.Op.gte]: thirtyDaysAgo
          }
        },
        include: [{ model: db.Company, as: 'company' }]
      });

      for (const job of recentJobs) {
        const matchData = this.calculateJobMatch(user.skills, job);
        
        if (matchData.matchPercentage >= 25) {
          // Check if notification already exists
          const existingNotification = await db.Notification.findOne({
            where: { userId: user.id, jobId: job.id }
          });

          if (!existingNotification) {
            await createJobMatchNotification(user.id, job.id, matchData);
            console.log(`Created notification for user ${user.id} for existing job ${job.id} with ${matchData.matchPercentage.toFixed(1)}% match`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing existing jobs for user:', error);
    }
  }

  // Clean up old notifications (older than 90 days)
  static async cleanupOldNotifications() {
    try {
     
      // if (!(await this.tableExists())) {
      //   console.log('Notifications table not created yet, skipping cleanup');
      //   return;
      // }

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deletedCount = await db.Notification.destroy({
        where: {
          createdAt: {
            [db.Sequelize.Op.lt]: ninetyDaysAgo
          }
        }
      });

      console.log(`Cleaned up ${deletedCount} old notifications`);
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = JobNotificationService; 