const { DataTypes,Sequelize } = require('sequelize');
const sequlize = require('./database');
const User = require('./user');

const Cart = sequlize.define('Cart', {
    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
       // autoIncrement: true,
    }
});
Cart.belongsTo(User,{ foreignKey: 'user_id' })

module.exports = Cart;
