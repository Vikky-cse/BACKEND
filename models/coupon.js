const { DataTypes,Sequelize } = require('sequelize');
const sequelize = require('./database');
const User = require('./user');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey:true,
    //autoIncrement: true,
    unique: true,
  },
  coupon_name: {
    type: DataTypes.STRING,
  },
  Expire_date: {
    type: DataTypes.DATE,
    allowNull: true,
  }, 
  isoffer: { 
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  amt: {
    type: DataTypes.INTEGER,
  },
});

Coupon.belongsToMany(User, { through: 'User_Coupon', foreignKey: 'coupon_id' });

module.exports = Coupon;
