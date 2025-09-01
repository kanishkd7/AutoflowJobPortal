module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Project', {
    title:       { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    link:        { type: DataTypes.STRING }
  }, { timestamps: true, freezeTableName: true });
};
