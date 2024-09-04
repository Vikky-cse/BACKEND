const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('./database');
const Transaction = require('./Transaction');
const Item = require('./Item');

const preorder = sequelize.define('preorder', {
    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        // autoIncrement: true,
    },
});

//Order.hasOne(Transaction, { foreignKey: 'orderId' });
// Order.hasMany(Item, { foreignKey: 'orderId' });
module.exports = preorder;
