const { DataTypes , Sequelize } = require('sequelize');
const sequelize = require('./database');
const Item = require('./Item');
const Cart = require('./cart');

const CartItem = sequelize.define('Cart_Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
   // autoIncrement: true,
  },
  Count: {
    type: DataTypes.INTEGER,
  },
});

CartItem.belongsTo(Item, { foreignKey: 'Item_id' });
CartItem.belongsTo(Cart, { foreignKey: 'Cart_id' });

module.exports = CartItem;
