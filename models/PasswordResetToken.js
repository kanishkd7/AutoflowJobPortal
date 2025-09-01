module.exports = (sequelize, DataTypes) => {
  return sequelize.define('PasswordResetToken', {
    token: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    expires: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, { 
    timestamps: true, 
    freezeTableName: true 
  });
}; 