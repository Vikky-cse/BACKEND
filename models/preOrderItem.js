const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('./database');
const Item = require('./Item');
const Order = require('./order');

const OrderItem = sequelize.define('preorderitem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        // autoIncrement: true,
    },
    Quantity: {
        type: DataTypes.INTEGER,
    },
    cost: {
        type: DataTypes.INTEGER,
    },
    refunded: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }

    //refund -1 - item with qty   2- item without qty
});

// Create associations
OrderItem.belongsTo(Item, { foreignKey: 'Item_id' }); // Adds the foreign key "ItemId" to the OrderItem table
OrderItem.belongsTo(Order, { foreignKey: 'orderId' }); // Adds the foreign key "OrderId" to the OrderItem table

module.exports = OrderItem;
