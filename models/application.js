module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Application', {
    status: { type: DataTypes.STRING, defaultValue: 'applied' },
    resumePath: { type: DataTypes.STRING, allowNull: false }
  }, { timestamps: true, freezeTableName: true });
};