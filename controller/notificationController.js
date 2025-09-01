const db = require('../models');


exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const notifications = await db.Notification.findAndCountAll({
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
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(notifications.count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      notifications: notifications.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalNotifications: notifications.count,
        notificationsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Could not fetch notifications' });
  }
};


exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await db.Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.update({ isRead: true });
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Could not mark notification as read' });
  }
};


exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Could not mark notifications as read' });
  }
};


exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await db.Notification.count({
      where: { userId, isRead: false }
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Could not get unread count' });
  }
};


exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await db.Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.destroy();
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Could not delete notification' });
  }
};


exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.Notification.destroy({
      where: { userId }
    });

    res.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Could not delete notifications' });
  }
};


exports.createJobMatchNotification = async (userId, jobId, matchData) => {
  try {
    const job = await db.Job.findByPk(jobId, {
      include: [{ model: db.Company, as: 'company' }]
    });

    if (!job) {
      console.error('Job not found for notification:', jobId);
      return null;
    }

    const title = `New Job Match: ${job.title}`;
    const message = `A new job at ${job.company.name} matches your skills! Match percentage: ${matchData.matchPercentage.toFixed(1)}%`;

    const notification = await db.Notification.create({
      userId,
      jobId,
      type: 'job_match',
      title,
      message,
      matchScore: matchData.matchScore,
      matchPercentage: matchData.matchPercentage,
      matchedSkills: matchData.matchedSkills
    });

    return notification;
  } catch (error) {
    console.error('Error creating job match notification:', error);
    return null;
  }
}; 