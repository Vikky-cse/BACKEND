const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('./database');
const User = require('./user');
const Coupon = require('./coupon');
const Order = require('./order');
const moment = require('moment');
// const TransactionType = require('./TranscationType'); // Import the TransactionType model

const Transaction = sequelize.define('preorderTranscation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        unique: true,
    },
    Amount: {
        type: DataTypes.DECIMAL,
    },
    preorder_time: {
        type: DataTypes.DATE,
    },
    Is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    order_id: {
        type: DataTypes.UUID,
    },

    //1-recharge , 2-naturalGirls , 3-order , 4 -refundwithoutqty , 5-naturalBoys , 6-naturalDayscolarBoys , 7-naturalDayscolarGirls , 8 -refundwithqty,9-preorder
    transaction_by: {
        type: DataTypes.UUID,
    },
    createdAt: {
        type: DataTypes.DATE,
        //note here this is the guy that you are looking for                   
        get() {
            return moment(this.getDataValue('createdAt')).format('YYYY-MM-DD HH:mm:ss');
        }
    }
});

Transaction.belongsTo(User, { foreignKey: 'user_id' });
Transaction.belongsTo(Coupon, { foreignKey: 'coupon_id' });


module.exports = Transaction;
