module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Skill', {
    name:  { type: DataTypes.STRING, allowNull: false },
    level: { type: DataTypes.STRING } // Beginner/Intermediate/Advanced
  }, { timestamps: true, freezeTableName: true });
};
