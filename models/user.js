module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email:    { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },

    resumePath:     { type: DataTypes.STRING },
    profilePicture: { type: DataTypes.STRING },

    headline: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    phone:    { type: DataTypes.STRING },
    country:  { type: DataTypes.STRING },

    sociallinks: { type: DataTypes.JSON },   
    lastReminderAt: { type: DataTypes.DATE } 
  }, {
    timestamps: true,
    freezeTableName: true
  });

  return User;
};
