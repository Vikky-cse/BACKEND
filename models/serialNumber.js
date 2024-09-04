const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('./database');

const transcation = require('./Transaction')
const shop = require('./shop');



const serialNumber = sequelize.define('serialNumber', {



    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    serialNumber: {
        type: DataTypes.INTEGER,
    },

})

serialNumber.belongsTo(transcation, { foreignKey: 'Transaction_id' });
serialNumber.belongsTo(shop, { foreignKey: 'Shop_id' });

module.exports = serialNumber;
