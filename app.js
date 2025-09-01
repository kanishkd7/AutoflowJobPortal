require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('./middleware/logger');
const { startCleanupScheduler } = require('./scheduler/cleanupTokens');
const { startNotificationCleanupScheduler } = require('./scheduler/notificationCleanup');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const companyAuthRoutes = require('./routes/companyAuth');
const companyRoutes = require('./routes/companies');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const skillRoutes = require('./routes/skills');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(express.json());

app.use(cookieParser());
app.use(logger);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use('/api/company/auth', companyAuthRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);


app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});


app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});


startCleanupScheduler();
startNotificationCleanupScheduler();

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, _next) {
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

module.exports = app;
