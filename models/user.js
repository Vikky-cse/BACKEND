const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  User_name: {
    type: DataTypes.STRING,
    unique: true,
  },
  rfid: {
    type: DataTypes.STRING,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.FLOAT,
  },
  usertype: {
    type: DataTypes.INTEGER(1),
    allowNull: false,
    defaultValue: 0,
  },
  gender: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isHosteller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  natural_amt: {
    type: DataTypes.FLOAT,
  },
  rollNo: {
    type: DataTypes.STRING,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pin: {
    type: DataTypes.STRING,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  }
});

module.exports = User;
