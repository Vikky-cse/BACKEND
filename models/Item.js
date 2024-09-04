const { DataTypes,Sequelize } = require('sequelize');
const sequelize = require('./database');
const Category = require('./category');
const Shop = require('./shop');
  
const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey:true,
    //autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  veg: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
  } ,
  availableForPreorder: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, 
  },
  Hide: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, 
  },
  AvlMrng: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, 
  },
  AvlAn: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, 
  },
  AvlEve: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, 
  },
  preorderQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0, 
  },
});

Item.belongsTo(Category, { foreignKey: 'category_id' });
Item.belongsTo(Shop,{ foreignKey: 'Shop_id' })

module.exports = Item;
