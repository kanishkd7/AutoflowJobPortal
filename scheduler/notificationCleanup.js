const JobNotificationService = require('../utils/jobNotificationService');


const startNotificationCleanupScheduler = () => {
  console.log('Starting notification cleanup scheduler...');
  
  
  const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  const runCleanup = async () => {
    try {
      console.log('Running notification cleanup...');
      await JobNotificationService.cleanupOldNotifications();
      console.log('Notification cleanup completed');
    } catch (error) {
      console.error('Error in notification cleanup:', error);
    }
  };


  setTimeout(() => {
    runCleanup();
  }, 5000);

 
  setInterval(runCleanup, cleanupInterval);
};

module.exports = { startNotificationCleanupScheduler }; 