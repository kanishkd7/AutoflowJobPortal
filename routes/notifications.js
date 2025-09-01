const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controller/notificationController');

const router = express.Router();

router.use(auth);

router.get('/', ctrl.getUserNotifications);

router.get('/unread-count', ctrl.getUnreadCount);

router.put('/:id/read', ctrl.markAsRead);

router.put('/mark-all-read', ctrl.markAllAsRead);

router.delete('/:id', ctrl.deleteNotification);

router.delete('/', ctrl.deleteAllNotifications);

module.exports = router; 