const cron = require('node-cron');
const db = require('../models');


const cleanupExpiredTokens = async () => {
  try {
    const result = await db.PasswordResetToken.destroy({
      where: {
        expires: { [db.Sequelize.Op.lt]: new Date() }
      }
    });
    
    if (result > 0) {
      console.log(`Cleaned up ${result} expired password reset tokens`);
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
};


const startCleanupScheduler = () => {
  cron.schedule('0 * * * *', cleanupExpiredTokens, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('Password reset token cleanup scheduler started');
};

module.exports = { startCleanupScheduler, cleanupExpiredTokens }; 