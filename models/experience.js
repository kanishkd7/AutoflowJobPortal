module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Experience', {
    company:     { type: DataTypes.STRING, allowNull: false },
    role:        { type: DataTypes.STRING, allowNull: false },
    startDate:   { type: DataTypes.DATE, allowNull: false },
    endDate:     { type: DataTypes.DATE },
    description: { type: DataTypes.TEXT }
  }, { timestamps: true, freezeTableName: true });
};
