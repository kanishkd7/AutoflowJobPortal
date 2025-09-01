module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Company', {
    name:        { type: DataTypes.STRING, allowNull: false, unique: true },
    email:       { type: DataTypes.STRING, allowNull: false, unique: true },
    password:    { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    website:     { type: DataTypes.STRING },
    logo:        { type: DataTypes.STRING },
    location:    { type: DataTypes.STRING }
  }, { timestamps: true, freezeTableName: true });
};