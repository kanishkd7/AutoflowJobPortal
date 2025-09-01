module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Certification', {
    name:               { type: DataTypes.STRING, allowNull: false },
    issuingOrganization:{ type: DataTypes.STRING },
    issueDate:          { type: DataTypes.DATE },
    expirationDate:     { type: DataTypes.DATE },
    credentialID:       { type: DataTypes.STRING }
  }, { timestamps: true, freezeTableName: true });
};
