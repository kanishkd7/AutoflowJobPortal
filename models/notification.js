module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      }
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Job',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('job_match', 'application_status', 'general'),
      defaultValue: 'job_match',
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    matchScore: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    matchPercentage: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    matchedSkills: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    freezeTableName: true
  });

  return Notification;
}; 