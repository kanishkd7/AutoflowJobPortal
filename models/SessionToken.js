module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SessionToken', {
    token:    { type: DataTypes.STRING, allowNull: false },
    userId:   { type: DataTypes.INTEGER, allowNull: false },
    expires:  { type: DataTypes.DATE, allowNull: false }
  }, { timestamps: true, freezeTableName: true });
};