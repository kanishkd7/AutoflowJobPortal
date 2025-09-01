require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: 'mysql', logging: false }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.User          = require('./user')(sequelize, DataTypes);
db.Skill         = require('./skill')(sequelize, DataTypes);
db.Experience    = require('./experience')(sequelize, DataTypes);
db.Education     = require('./education')(sequelize, DataTypes);
db.Certification = require('./certification')(sequelize, DataTypes);
db.Project       = require('./project')(sequelize, DataTypes);
db.SessionToken  = require('./sessionToken')(sequelize, DataTypes);
db.PasswordResetToken = require('./PasswordResetToken')(sequelize, DataTypes);
db.Company = require('./company')(sequelize, DataTypes);
db.Job     = require('./job')(sequelize, DataTypes);
db.Application = require('./application')(sequelize, DataTypes);
db.Notification = require('./notification')(sequelize, DataTypes);
db.Admin = require('./admin')(sequelize, DataTypes);


// Associations
db.User.hasMany(db.Skill, { foreignKey: 'userId', as: 'skills' });
db.Skill.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Experience, { foreignKey: 'userId', as: 'experiences' });
db.Experience.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Education, { foreignKey: 'userId', as: 'educations' });
db.Education.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Certification, { foreignKey: 'userId', as: 'certifications' });
db.Certification.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Project, { foreignKey: 'userId', as: 'projects' });
db.Project.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.Company.hasMany(db.Job, { foreignKey: 'companyId', as: 'jobs' });
db.Job.belongsTo(db.Company, { foreignKey: 'companyId', as: 'company' });

db.User.hasMany(db.SessionToken, { foreignKey: 'userId', as: 'tokens' });
db.SessionToken.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.PasswordResetToken, { foreignKey: 'userId', as: 'resetTokens' });
db.PasswordResetToken.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.User.hasMany(db.Application, { foreignKey: 'userId', as: 'applications' });
db.Application.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.Job.hasMany(db.Application, { foreignKey: 'jobId', as: 'applications' });
db.Application.belongsTo(db.Job, { foreignKey: 'jobId', as: 'job' });

// Notification associations
db.User.hasMany(db.Notification, { foreignKey: 'userId', as: 'notifications' });
db.Notification.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.Job.hasMany(db.Notification, { foreignKey: 'jobId', as: 'notifications' });
db.Notification.belongsTo(db.Job, { foreignKey: 'jobId', as: 'job' });

// Admin associations
db.Admin.hasMany(db.Job, { foreignKey: 'adminId', as: 'approvedJobs' });
db.Job.belongsTo(db.Admin, { foreignKey: 'adminId', as: 'admin' });

// ...existing code...

db.sequelize.sync()
  .then(() => console.log('Database & tables synced!'))
  .catch(err => {
    // Don't log sync errors for notifications table during first startup
    if (err.message && err.message.includes('notifications')) {
      console.log('Notifications table will be created on first use');
    } else {
      console.error('Sync error:', err);
    }
  });

module.exports = db;
