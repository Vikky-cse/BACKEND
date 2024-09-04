const { DataTypes,Sequelize } = require('sequelize');
const sequelize = require('./database');

const Shop = sequelize.define('Shop', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
   // autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  Hide: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, 
  },
  isSpecial: { 
    type: DataTypes.BOOLEAN,
    defaultValue: false, 
  },
});

module.exports = Shop;
