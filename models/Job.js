module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Job', {
    title:        { type: DataTypes.STRING, allowNull: false },
    description:  { type: DataTypes.TEXT, allowNull: false },
    location:     { type: DataTypes.STRING },
    salary:       { type: DataTypes.STRING },
    type:         { type: DataTypes.STRING }, // Full-time, Part-time, etc.
    requirements: { type: DataTypes.TEXT },
    deadline:     { type: DataTypes.DATE },
    status:       { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    adminId:      { type: DataTypes.INTEGER, allowNull: true }
  }, { timestamps: true, freezeTableName: true });
};