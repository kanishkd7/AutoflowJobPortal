module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Education', {
    school:       { type: DataTypes.STRING, allowNull: false },
    degree:       { type: DataTypes.STRING },
    fieldOfStudy: { type: DataTypes.STRING },
    startDate:    { type: DataTypes.DATE },
    endDate:      { type: DataTypes.DATE },
    grade:        { type: DataTypes.STRING }
  }, { timestamps: true, freezeTableName: true });
};
