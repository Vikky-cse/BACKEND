const { DataTypes,Sequelize } = require('sequelize');
const sequelize = require('./database');
const User = require('./user');

const Naturals = sequelize.define('Naturals', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey:true,
   // autoIncrement: true,
  },
  time: {
    type: DataTypes.DATE,
  },
  Amount: {
    type: DataTypes.INTEGER,
  },
});

Naturals.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Naturals;
