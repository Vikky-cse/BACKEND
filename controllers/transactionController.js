const Transaction = require('../models/Transaction');
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const User = require('../models/user');
const Cart = require('../models/cart');
const CartItem = require('../models/Cart_Items');
const { Op, Sequelize } = require('sequelize');
const Item = require('../models/Item');
const sequelize = require('../models/database');
const Naturals = require('../models/naturals');
const currentDate = new Date();
const Shop = require('../models/shop');
const moment = require('moment');
const Category = require('../models/category');
const { QueryTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const createTransaction = async (req, res) => {
    const {
        Amount,
        Transaction_Time,
        user_id,
        coupon_id,
        ipaddress
    } = req.body;


    try {
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (user.Amount < Amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        await sequelize.transaction(async (t) => {
            user.Amount -= Amount;
            await user.save({ transaction: t });

            const newOrder = await Order.create({ transaction: t });
            const cart = await Cart.findOne({ where: { user_id: user.id } });

            const transaction = await Transaction.create({
                Amount,
                Transaction_Time,
                Is_completed: 0,
                user_id,
                coupon_id,
                order_id: newOrder.id,
                Type: 3,
                ipaddress,

            }, { transaction: t });

            const cartItems = await CartItem.findAll({ where: { Cart_id: cart.id } });

            const orderItems = cartItems.map(cartItem => ({
                Item_id: cartItem.Item_id,
                Count: cartItem.Count,
                orderId: newOrder.id
            }));

            await OrderItem.bulkCreate(orderItems, { transaction: t });

            await CartItem.destroy({ where: { Cart_id: cart.id }, transaction: t });
            await Cart.destroy({ where: { user_id }, transaction: t });

            res.status(201).json(transaction);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating the transaction' });
    }
};


// const createTransactionByAdmin = async (req, res) => {
//   const {
//     Amount,
//     Transaction_Time,
//     Is_completed,
//     user_id,
//     coupon_id,
//     Type,
//     items // An array of objects containing item_id and quantity
//   } = req.body;

//   try {
//     const user = await User.findByPk(user_id);
//     if (!user) {
//       return res.status(400).json({ error: 'User not found' });
//     }
//     if (user.Amount < Amount) {
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }

//     await sequelize.transaction(async (t) => {
//       user.Amount -= Amount;
//       await user.save({ transaction: t });

//       const newOrder = await Order.create({ transaction: t });

//       const orderItems = items.map(item => ({
//         Item_id: item.item_id,
//         Count: item.quantity,
//         orderId: newOrder.id
//       }));

//       await OrderItem.bulkCreate(orderItems, { transaction: t });

//       const transaction = await Transaction.create({
//         Amount,
//         Transaction_Time ,
//         Is_completed,
//         user_id,
//         coupon_id,
//         order_id: newOrder.id,
//         Type
//       }, { transaction: t });

//       res.status(201).json(transaction);
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error creating the transaction' });
//   }
// };

const checkQuantity = async (req, res) => {
    try {
        const { cartItems } = req.body;

        // const availableItems = [];
        const insufficientItems = [];

        for (const cartItem of cartItems) {
            const { itemId, quantity } = cartItem;
            const item = await Item.findByPk(itemId);

            if (!item) {
                insufficientItems.push({ itemId, name: 'Item not found', availableQuantity: 0, quantity });
            } else if (item.quantity < quantity) {
                insufficientItems.push({ itemId, name: item.name, availableQuantity: item.quantity, quantity });
            }
            // else {
            //   availableItems.push({ itemId, name: item.name, availableQuantity: item.quantity, quantity });
            // }
        }

        res.status(200).json({ insufficientItems });
    } catch (error) {
        console.error('Error checking item availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

}

const createTransactionByAdmin = async (req, res) => {
    const {
        user_id,
        coupon_id,
        cartItems,
        transaction_by,
        ipaddress
    } = req.body;

    console.log(req.body);
    try {
        

        const AllTransactions = [];

        await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (t) => {
            // Calculate the total quantity and price for the items being ordered
            let totalQuantity = 0;
            let totalPrice = 0;
            // Create a new order

            let user = await User.findByPk(user_id,{ transaction: t });
            if (!user) {
            return res.status(201).json({ error: 'User not found' });
            }

            // Deduct the quantities from available items
            for (const item of cartItems) {
                const { itemId, quantity } = item;

                // Check if the item exists and if its available quantity is sufficient
                const availableItem = await Item.findByPk(itemId, { transaction: t });
                if (!availableItem || availableItem.quantity < quantity) {
                    throw new Error('Insufficient quantity for one or more items');
                }

                totalQuantity += quantity;
                totalPrice += availableItem.price * quantity;

                // Deduct the ordered quantity from the available item quantity
                availableItem.quantity -= quantity;
                await availableItem.save({ transaction: t });
            }

            if (user.amount < totalPrice) {
                throw new Error('Insufficient balance');
            }

            user.amount -= totalPrice;
            await user.save({ transaction: t });

            const newOrder = await Order.create({ transaction: t });
            // Create order items associated with the new order
            const orderItems = cartItems.map(item => ({
                Item_id: item.itemId,
                Quantity: item.quantity,
                orderId: newOrder.id,
                cost: item.cost
            }));

            await OrderItem.bulkCreate(orderItems, { transaction: t });

            // Create a new transaction record
            const currentDate = new Date();
            const transactionitem = await Transaction.create({
                Amount: totalPrice,
                Transaction_Time: currentDate,
                Is_completed: true,
                user_id: user.id,
                coupon_id,
                order_id: newOrder.id,
                transactiontype: 3,
                transaction_by: transaction_by,
            }, { transaction: t });
            AllTransactions.push(transactionitem);

            // console.log("jgdfugifdsifg");
            res.status(201).json(AllTransactions);
        });
    } catch (error) {
        console.error(error);
        await t.rollback();
        res.status(201).json({ error: error.message });
    }
};

const createNaturalTransactionByAdmin = async (req, res) => {
    const {
        Amount,
        user_id,
        coupon_id,
        NaturalItems,
        biller

    } = req.body;
    const Iscompleted = 1
    const currenDate = new Date();

    try {
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(200).json({ error: 'User not found' });
        }

        const AllTransactions = [];

        await sequelize.transaction(async (t) => {



            if (NaturalItems.length == 1) {
                const availableItem = await Item.findByPk(NaturalItems[0])
                console.log(availableItem)
                if (user.isHosteller == false && user.amount < availableItem.price) {
                    return res.status(200).json({ error: 'Insufficient balance' });
                }

                if (availableItem == null) {
                    return res.status(200).json({ error: 'Item Not Found' });

                }

                if (user.isHosteller != true) {

                    if (user.amount < Amount) {
                        return res.status(200).json({ error: 'Insufficient balance' });
                    } else {

                        const Natorder = await Order.create({ transaction: t });
                        const NaturalItem = {
                            Item_id: availableItem.id,
                            Quantity: 1,
                            orderId: Natorder.id,
                            cost: availableItem.price
                        };
                        await OrderItem.create(NaturalItem, { transaction: t });
                        await Naturals.create({ user_id, time: currenDate, Amount: availableItem.price }, { transaction: t });

                        const naturaldayscolarTransaction = await Transaction.create({
                            transaction_by: biller,
                            Amount: availableItem.price,
                            Transaction_Time: currenDate,
                            Is_completed: Iscompleted,
                            order_id: Natorder.id,
                            transactiontype: user.gender == 0 ? 7 : 6,
                            user_id: user.id,
                            ipaddress:''
                        }, { transaction: t });
                        AllTransactions.push(naturaldayscolarTransaction)
                        user.amount -= availableItem.price;
                        await user.save({ transaction: t });
                    }
                } else {

                    if (user.gender == 0) {

                        if (user.natural_amt < availableItem.price) {
                            return res.status(200).json({ error: 'Insufficient balance' });
                        }
                        user.natural_amt -= availableItem.price;
                        await user.save({ transaction: t });

                        const Natorder = await Order.create({ transaction: t });
                        const NaturalItem = {
                            Item_id: availableItem.id,
                            Quantity: 1,
                            orderId: Natorder.id,
                            cost: availableItem.price
                        };


                        await OrderItem.create(NaturalItem, { transaction: t });

                        await Naturals.create({ user_id, time: currenDate, Amount: availableItem.price }, { transaction: t });

                        const naturalWomanTransaction = await Transaction.create({
                            transaction_by: biller,
                            Amount: availableItem.price,
                            Transaction_Time: currenDate,
                            Is_completed: Iscompleted,
                            order_id: Natorder.id,
                            transactiontype: 2,
                            user_id,
                            ipaddress: ''
                        }, { transaction: t });

                        AllTransactions.push(naturalWomanTransaction)
                    } else {
                        // const currentDate = new Date();
                        const lastEntry = await Naturals.findOne({
                            where: {
                                user_id,
                                time: {
                                    [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                                    [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
                                },
                            },
                        });

                        console.log(lastEntry, "---------------------------------------------------")

                        if (!lastEntry) {


                            const Natorder = await Order.create({ transaction: t });
                            const NaturalItem = {
                                Item_id: availableItem.id,
                                Quantity: 1,
                                orderId: Natorder.id,
                                cost: availableItem.price
                            };
                            await OrderItem.create(NaturalItem, { transaction: t });

                            await Naturals.create({ user_id, time: currenDate, Amount: availableItem.price }, { transaction: t });
                            const createdTransaction = await Transaction.create({
                                transaction_by: biller,
                                Amount: availableItem.price,
                                Transaction_Time: currenDate,
                                Is_completed: true,
                                order_id: Natorder.id,
                                transactiontype: 5,
                                user_id,
                                ipaddress:''
                            }, { transaction: t });
                            AllTransactions.push(createdTransaction)
                        } else {
                            return res.status(200).json({ error: 'Boys can only have one Naturals entry per month' });
                        }
                    }
                }
            }
            res.status(201).json(AllTransactions);
        });
    } catch (error) {

        console.error(error);
        res.status(200).json({ error: 'Error creating the transaction' });
    }
};



const createTransactionByUser = async (req, res) => {
    const {
        Amount,
        user_id,
        coupon_id,
        cartItems,
        NaturalItems,
        Iscompleted,
        ipaddress
    } = req.body;
    const currenDate = new Date();

    try {


        const insufficientItems = [];
        const AllTransactions = [];

        await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE },async (t) => {
            // Calculate the total quantity and price for the items being ordered
            let totalQuantity = 0;
            let totalPrice = 0;
            // Create a new order
            if (!(req.user.id == user_id)) {
                console.log("illegal try")
                return res.status(200).json({ error: 'user not found' });
    
            }
            const user = await User.findByPk(user_id , { transaction: t });
            if (!user) {
                return res.status(200).json({ error: 'User not found' });
            }

            const newOrder = await Order.create({ transaction: t });

            if (NaturalItems.length == 1) {
                const availableItem = await Item.findByPk(NaturalItems[0].itemId, { transaction: t })


                if (availableItem == null) {
                    return res.status(200).json({ error: 'Item Not Found' });

                }

                if (user.isHosteller != 1) {

                    if (user.amount < Amount) {
                        return res.status(200).json({ error: 'Insufficient balance' });
                    } else {

                        const Natorder = await Order.create({ transaction: t });
                        const NaturalItem = {
                            Item_id: availableItem.id,
                            Quantity: 1,
                            orderId: Natorder.id,
                            cost: availableItem.price
                        };
                        await OrderItem.create(NaturalItem, { transaction: t });
                        await Naturals.create({ user_id, time: currenDate, Amount: availableItem.price }, { transaction: t });

                        const naturaldayscolarTransaction = await Transaction.create({
                            Amount: availableItem.price,
                            Transaction_Time: currenDate,
                            Is_completed: Iscompleted,
                            order_id: Natorder.id,
                            transactiontype: user.gender == 0 ? 7 : 6,
                            user_id,
                            ipaddress,
                            transaction_by: user_id,
                        }, { transaction: t });
                        AllTransactions.push(naturaldayscolarTransaction)
                        user.amount -= availableItem.price;
                        await user.save({ transaction: t });
                    }
                } else {

                    if (user.gender == 0) {

                        if (user.natural_amt < availableItem.price) {
                            return res.status(200).json({ error: 'Insufficient balance' });
                        }
                        user.natural_amt -= availableItem.price;
                        await user.save({ transaction: t });

                        const Natorder = await Order.create({ transaction: t });
                        const NaturalItem = {
                            Item_id: availableItem.id,
                            Quantity: 1,
                            orderId: Natorder.id,
                            cost: availableItem.price
                        };


                        await OrderItem.create(NaturalItem, { transaction: t });

                        await Naturals.create({ user_id, time: currenDate, Amount: availableItem.price }, { transaction: t });

                        const naturalWomanTransaction = await Transaction.create({
                            Amount: availableItem.price,
                            Transaction_Time: currenDate,
                            Is_completed: Iscompleted,
                            order_id: Natorder.id,
                            transactiontype: 2,
                            user_id,
                            transaction_by: user_id,
                            ipaddress
                        }, { transaction: t });

                        AllTransactions.push(naturalWomanTransaction)
                    } else {
                        // const currentDate = new Date();
                        const lastEntry = await Naturals.findOne({
                            where: {
                                user_id,
                                time: {
                                    [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                                    [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
                                },
                            },
                        });

                        if (!lastEntry) {


                            const Natorder = await Order.create({ transaction: t });
                            const NaturalItem = {
                                Item_id: availableItem.id,
                                Quantity: 1,
                                orderId: Natorder.id,
                                cost: availableItem.price
                            };
                            await OrderItem.create(NaturalItem, { transaction: t });

                            await Naturals.create({ user_id, time: currenDate, Amount: availableItem.price }, { transaction: t });
                            const createdTransaction = await Transaction.create({
                                Amount: availableItem.price,
                                Transaction_Time: currenDate,
                                Is_completed: true,
                                order_id: Natorder.id,
                                transactiontype: 5,
                                user_id,
                                transaction_by: user_id,
                                ipaddress
                            }, { transaction: t });
                            AllTransactions.push(createdTransaction)
                        } else {
                            return res.status(200).json({ error: 'Boys can only have one Naturals entry per month' });
                        }
                    }
                }
            }

            if (cartItems.length >= 1) {



                for (const item of cartItems) {
                    const { itemId, quantity, cost } = item;

                    // Check if the item exists and if its available quantity is sufficient
                    const availableItem = await Item.findByPk(itemId, { transaction: t });
                    if (!availableItem || availableItem.quantity < quantity) {
                        // If insufficient quantity, add details to the insufficientItems array
                        insufficientItems.push({
                            itemId,
                            name: availableItem ? availableItem.name : 'Item not found',
                            available_quantity: availableItem ? availableItem.quantity : 0,
                            ordered_quantity: quantity,
                        });

                        throw new Error('Insufficient quantity for one or more items');

                    } else {
                        totalQuantity += quantity;
                        totalPrice += availableItem.price * quantity;

                        // Deduct the ordered quantity from the available item quantity
                        availableItem.quantity -= quantity;
                        await availableItem.save({ transaction: t });
                    }
                }

                if (insufficientItems.length > 0) {
                    // Respond with details of insufficient quantity items
                    return res.status(200).json({
                        error: 'Insufficient quantity for one or more items',
                        insufficientItems,
                    });
                } else if (user.amount < totalPrice) {
                    return res.status(200).json({ error: 'Insufficient balance' });
                } else {
                    user.amount -= totalPrice;
                    await user.save({ transaction: t });



                    // Create order items associated with the new order
                    const orderItems = cartItems.map(item => ({
                        Item_id: item.itemId,
                        Quantity: item.quantity,
                        orderId: newOrder.id,
                        cost: item.cost
                    }));

                    await OrderItem.bulkCreate(orderItems, { transaction: t });

                    // Create a new transaction record
                    const transactionitem = await Transaction.create({
                        Amount: totalPrice,
                        Transaction_Time: currentDate,
                        Is_completed: Iscompleted,
                        user_id,
                        coupon_id,
                        order_id: newOrder.id,
                        transactiontype: 3,
                        transaction_by: user_id,
                        ipaddress
                    }, { transaction: t });
                    AllTransactions.push(transactionitem)
                }
            }

            res.status(201).json(AllTransactions);
        });
    } catch (error) {

        console.error(error);
        await t.rollback();
        res.status(200).json({ error: 'Error creating the transaction' });
    }
};

const createTransactionWithMobile = async (req, res) => {
    const {
        Amount,
        user_id,
        coupon_id,
        cartItems,
        NaturalItems,
        Iscompleted,
        ipaddress,
        pin
    } = req.body;
    const currenDate = new Date();

    try {
        if (!(req.user.id == user_id)) {
            console.log("illegal try")
            return res.status(200).json({ error: 'user not found' });

        }
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(200).json({ error: 'User not found' });
        }
        if (user.pin == null) {
            return res.status(404).json({ error: 'Please set pin number' });
        }
        if (user.attempts == 0) {
            return res.status(403).json({ error: `you have no remaining attempts ${moment().endOf('day').format("DD-MM-YYYY HH:mm:ss")}` });
        }
        if (!await bcrypt.compare(pin, user.pin)) {

            user.attempts -= 1;
            await user.save();
            return res.status(202).json({ error: `invalid pin number! remaining attempt  ${user.attempts}` })
        }

        const insufficientItems = [];
        const AllTransactions = [];

        await sequelize.transaction(async (t) => {
            // Calculate the total quantity and price for the items being ordered
            let totalQuantity = 0;
            let totalPrice = 0;
            // Create a new order

            const newOrder = await Order.create({ transaction: t });

            if (NaturalItems.length == 1) {
                const availableItem = await Item.findByPk(NaturalItems[0].itemId)


                if (availableItem == null) {
                    return res.status(200).json({ error: 'Item Not Found' });

                }

                if (user.isHosteller != 1) {

                    if (user.amount < Amount) {
                        return res.status(200).json({ error: 'Insufficient balance' });
                    } else {

                        const Natorder = await Order.create({ transaction: t });
                        const NaturalItem = {
                            Item_id: availableItem.id,
                            Quantity: 1,
                            orderId: Natorder.id,
                            cost: availableItem.price
                        };
                        await OrderItem.create(NaturalItem, { transaction: t });
                        await Naturals.create({ user_id, time: currenDate, Amount: availableItem.price }, { transaction: t });

                        const naturaldayscolarTransaction = await Transaction.create({
                            Amount: availableItem.price,
                            Transaction_Time: currenDate,
                            Is_completed: Iscompleted,
                            order_id: Natorder.id,
                            transactiontype: user.gender == 0 ? 7 : 6,
                            user_id,
                            transaction_by: user_id,
                            ipaddress:ipaddress || ""
                        }, { transaction: t });
                        AllTransactions.push(naturaldayscolarTransaction)
                        user.amount -= availableItem.price;
                        await user.save({ transaction: t });
                    }
                } else {

                    if (user.gender == 0) {

                        if (user.natural_amt < availableItem.price) {
                            return res.status(200).json({ error: 'Insufficient balance' });
                        }
                        user.natural_amt -= availableItem.price;
                        await user.save({ transaction: t });

                        const Natorder = await Order.create({ transaction: t });
                        const NaturalItem = {
                            Item_id: availableItem.id,
                            Quantity: 1,
                            orderId: Natorder.id,
                            cost: availableItem.price
                        };


                        await OrderItem.create(NaturalItem, { transaction: t });

                        await Naturals.create({ user_id, time: currenDate, Amount: availableItem.price }, { transaction: t });

                        const naturalWomanTransaction = await Transaction.create({
                            Amount: availableItem.price,
                            Transaction_Time: currenDate,
                            Is_completed: Iscompleted,
                            order_id: Natorder.id,
                            transactiontype: 2,
                            user_id,
                            transaction_by: user_id,
                            ipaddress: ipaddress || ""
                        }, { transaction: t });

                        AllTransactions.push(naturalWomanTransaction)
                    } else {
                        // const currentDate = new Date();
                        const lastEntry = await Naturals.findOne({
                            where: {
                                user_id,
                                time: {
                                    [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                                    [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
                                },
                            },
                        });

                        if (!lastEntry) {


                            const Natorder = await Order.create({ transaction: t });
                            const NaturalItem = {
                                Item_id: availableItem.id,
                                Quantity: 1,
                                orderId: Natorder.id,
                                cost: availableItem.price
                            };
                            await OrderItem.create(NaturalItem, { transaction: t });

                            await Naturals.create({ user_id, time: currenDate, Amount: availableItem.price }, { transaction: t });
                            const createdTransaction = await Transaction.create({
                                Amount: availableItem.price,
                                Transaction_Time: currenDate,
                                Is_completed: true,
                                order_id: Natorder.id,
                                transactiontype: 5,
                                user_id,
                                transaction_by: user_id,
                                ipaddress: ipaddress || ""
                            }, { transaction: t });
                            AllTransactions.push(createdTransaction)
                        } else {
                            return res.status(200).json({ error: 'Boys can only have one Naturals entry per month' });
                        }
                    }
                }
            }

            if (cartItems.length >= 1) {



                for (const item of cartItems) {
                    const { itemId, quantity, cost } = item;

                    // Check if the item exists and if its available quantity is sufficient
                    const availableItem = await Item.findByPk(itemId);
                    if (!availableItem || availableItem.quantity < quantity) {
                        // If insufficient quantity, add details to the insufficientItems array
                        insufficientItems.push({
                            itemId,
                            name: availableItem ? availableItem.name : 'Item not found',
                            available_quantity: availableItem ? availableItem.quantity : 0,
                            ordered_quantity: quantity,
                        });
                    } else {
                        totalQuantity += quantity;
                        totalPrice += availableItem.price * quantity;

                        // Deduct the ordered quantity from the available item quantity
                        availableItem.quantity -= quantity;
                        await availableItem.save({ transaction: t });
                    }
                }

                if (insufficientItems.length > 0) {
                    // Respond with details of insufficient quantity items
                    return res.status(200).json({
                        error: 'Insufficient quantity for one or more items',
                        insufficientItems,
                    });
                } else if (user.amount < totalPrice) {
                    return res.status(200).json({ error: 'Insufficient balance' });
                } else {
                    user.amount -= totalPrice;
                    await user.save({ transaction: t });



                    // Create order items associated with the new order
                    const orderItems = cartItems.map(item => ({
                        Item_id: item.itemId,
                        Quantity: item.quantity,
                        orderId: newOrder.id,
                        cost: item.cost
                    }));

                    await OrderItem.bulkCreate(orderItems, { transaction: t });

                    // Create a new transaction record
                    const transactionitem = await Transaction.create({
                        Amount: totalPrice,
                        Transaction_Time: currentDate,
                        Is_completed: Iscompleted,
                        user_id,
                        coupon_id,
                        order_id: newOrder.id,
                        transactiontype: 3,
                        transaction_by: user_id,
                        ipaddress: ipaddress || ""
                    }, { transaction: t });
                    AllTransactions.push(transactionitem)
                }
            }

            res.status(201).json(AllTransactions);
        });
    } catch (error) {

        console.error(error);
        res.status(200).json({ error: 'Error creating the transaction' });
    }
};


const getAllTransactions = async (req, res) => {
    try {
        const { transactionType, date } = req.query
        const whereClause = {}
        if (transactionType) {
            whereClause.transactionType = transactionType
        }
        if (date) {
            whereClause.createdAt = {
                [Op.and]: {
                    [Op.gt]: moment(date, "YYYY-MM-DD").startOf("day").format("YYYY-MM-DD HH:mm:ss"),
                    [Op.lt]: moment(date, "YYYY-MM-DD").endOf("day").format("YYYY-MM-DD HH:mm:ss")
                }
            }
        }
        // console.log(whereClause)
        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [{
                model: User,
                attributes: ['name', 'rollNo']
            }],
            order: [
                ['createdAt', 'DESC']
            ]
        });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(200).json({ error: error.message });
    }
};

const getAllTransactionsbyUser = async (req, res) => {
    try {
        const userid = req.params.id;
        const transactions = await Transaction.findAll({
            where: { user_id: userid },
            order: [
                ['updatedAt', 'DESC'],
            ],
        });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllTransactionsbyUserWithRfid = async (req, res) => {
    try {
        const rfid = req.params.id;
        const { date } = req.query
        const whereClause = {}
        if (date) {
            whereClause.createdAt = {
                [Op.gte]: moment(date, "YYYY-MM-DD").startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                [Op.lte]: moment(date, "YYYY-MM-DD").endOf('day').format('YYYY-MM-DD HH:mm:ss')
            }
        }
        let user = await User.findOne({ where: { 'rfid': rfid } });
        if (!user) {


            user = await User.findOne({ where: { 'rollNo': rfid } });

            if (!user) {

                return res.status(201).json({ error: 'User not found' });
            }
        }

        const transactions = await Transaction.findAll({
            where: { user_id: user.id, ...whereClause, transactiontype: 3 },
            order: [
                ['updatedAt', 'DESC'],
            ],
        });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getIncompleteTransactionsbyUser = async (req, res) => {
    try {
        const userid = req.params.id;
        const transactions = await Transaction.findAll({
            where: {
                user_id: userid,
                Is_completed: 0
            }
        });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching transactions' });
    }
};


const getTransactionById = async (req, res) => {
    const transactionId = req.params.id;

    try {
        const transaction = await Transaction.findByPk(transactionId);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.status(200).json(transaction);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching transaction by ID' });
    }
};





const updateTransaction = async (req, res) => {
    const transactionId = req.params.id;
    const {
        Amount,
        Transaction_Time,
        Is_completed,
        user_id,
        coupon_id,
        cart_item_id,
        Type
    } = req.body;

    try {
        await Transaction.update({ Amount, Transaction_Time, Is_completed, user_id, coupon_id, cart_item_id, Type }, { where: { id: transactionId } });
        res.status(200).json({ message: 'Transaction updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating the transaction' });
    }
};

const deleteTransaction = async (req, res) => {
    const transactionId = req.params.id;

    try {
        await Transaction.destroy({ where: { id: transactionId } });
        res.status(204).end(); // 204 No Content - Successfully deleted
    } catch (error) {
        res.status(500).json({ error: 'Error deleting the transaction' });
    }
};
const refund = async (req, res) => {
    const { transactionId, itemId } = req.body;

    try {
        await sequelize.transaction(async (t) => {
            const transaction = await Transaction.findByPk(transactionId, { transaction: t });

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            if (itemId) {
                const orderItem = await OrderItem.findOne({
                    where: { orderId: transaction.order_id, Item_id: itemId },
                    transaction: t,
                });

                if (!orderItem) {
                    return res.status(404).json({ error: 'Item not found in the transaction' });
                }

                if (orderItem.refunded == true) {
                    return res.status(200).json({ error: 'Already Refunded' });
                }

                const item = await Item.findByPk(itemId, { transaction: t });

                if (!item) {
                    return res.status(404).json({ error: 'Item not found' });
                }

                // Refund the item
                const refundedAmount = orderItem.Count * item.price;
                const user = await User.findByPk(transaction.user_id, { transaction: t });
                user.Amount += refundedAmount;
                await user.save({ transaction: t });

                // Update item quantity
                item.quantity += orderItem.Count;
                await item.save({ transaction: t });

                // Remove the order item
                await orderItem.update({ refunded: true }, { transaction: t });


                return res.status(200).json({ message: 'Item refunded successfully' });
            }

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing refund' });
    }
};


const refundWithQuantity = async (req, res) => {
    const { transactionId, itemId, biller } = req.body;
    const currenDate = new Date();
    try {
        await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (t) => {
            const transaction = await Transaction.findByPk(transactionId, { transaction: t });

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            if (itemId) {
                const orderItem = await OrderItem.findOne({
                    where: { orderId: transaction.order_id, Item_id: itemId },
                    transaction: t,
                });


                if (!orderItem) {
                    return res.status(404).json({ error: 'Item not found in the transaction' });
                }
                if (orderItem.refunded == true) {
                    return res.status(200).json({ error: 'Already Refunded' });
                }


                const item = await Item.findByPk(itemId, { transaction: t });

                if (!item) {
                    return res.status(404).json({ error: 'Item not found' });
                }

                // Refund the item
                const refundedAmount = orderItem.Quantity * item.price;
                const user = await User.findByPk(transaction.user_id, { transaction: t });
                user.amount += refundedAmount;
                await user.save({ transaction: t });

                // Update item quantity
                item.quantity += orderItem.Quantity;
                await item.save({ transaction: t });

                // Remove the order item
                await orderItem.update({ refunded: true }, { transaction: t });





                await Transaction.create({
                    Amount: refundedAmount,
                    Transaction_Time: currenDate,
                    Is_completed: 1,
                    transaction_by: biller,
                    order_id: orderItem.id,
                    transactiontype: 8,
                    user_id: user.id,
                }, { transaction: t });

                await orderItem.update({ refunded: true }, { transaction: t });

                return res.status(200).json({ message: 'Item refunded successfully' });
            }

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing refund' });
    }
};
const refundWithoutQuantity = async (req, res) => {
    const { transactionId, itemId, biller } = req.body;
    const currenDate = new Date();
    try {
        await sequelize.transaction({ isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (t) => {
            const transaction = await Transaction.findByPk(transactionId, { transaction: t });

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            if (itemId) {
                const orderItem = await OrderItem.findOne({
                    where: { orderId: transaction.order_id, Item_id: itemId },
                    transaction: t,
                });

                if (!orderItem) {
                    return res.status(404).json({ error: 'Item not found in the transaction' });
                }

                if (orderItem.refunded == true) {
                    return res.status(200).json({ error: 'Already Refunded' });
                }


                const item = await Item.findByPk(itemId, { transaction: t });

                if (!item) {
                    return res.status(404).json({ error: 'Item not found' });
                }

                // Refund the item
                const refundedAmount = orderItem.Quantity * item.price;
                const user = await User.findByPk(transaction.user_id, { transaction: t });
                user.amount += refundedAmount;
                await user.save({ transaction: t });


                // Remove the order item
                await orderItem.update({ refunded: true }, { transaction: t });

                await Transaction.create({
                    Amount: refundedAmount,
                    Transaction_Time: currenDate,
                    Is_completed: 1,
                    transaction_by: biller,
                    order_id: orderItem.id,
                    transactiontype: 4,
                    user_id: user.id,
                }, { transaction: t });


                return res.status(200).json({ message: 'Item refunded successfully' });
            }

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing refund' });
    }
};





const getOrderItemsByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params; // Assuming you pass orderId as a parameter
        // console.log(orderId)
        // Find all order items with the specified orderId
        const orderItems = await OrderItem.findAll({
            include: [{
                model: Item,
                attributes: ['name', "id","Shop_id"],
            },],
            where: { orderId: orderId },
            attributes: ["Item.name", "cost", "Quantity", "Item_id", "refunded","Item.Shop_id"]
        });

        // Check if any order items were found
        if (orderItems.length == 0) {
            return res.status(200).json({ message: 'No order items found for the specified order.' });
        }

        // Return the found order items
        res.status(200).json(orderItems);
    } catch (error) {
        console.error('Error fetching order items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



// Controller to fetch data by Item ID
async function fetchDataByItemId(req, res) {
    try {
        const itemId = req.params.itemId;

        const orders = await OrderItem.findAll({
            where: {
                Item_id: itemId,
            },
        });

        res.status(200).json({ data: orders });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to fetch data by date
async function fetchDataByDate(req, res) {
    try {
        const date = req.params.date;

        const orders = await OrderItem.findAll({
            where: {
                createdAt: {
                    [Op.between]: [new Date(date), new Date(date + ' 23:59:59')],
                },
            },
        });

        res.status(200).json({ data: orders });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


async function fetchDataWithinDateSpan(req, res) {
    try {
        const { startDate, endDate } = req.query;

        const orders = await OrderItem.findAll({
            where: {
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)],
                },
            },
        });

        res.status(200).json({ data: orders });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


// Controller to fetch data within a particular date span for a specific item
async function fetchDataByItemAndDateSpan(req, res) {
    try {
        const { itemId, startDate, endDate } = req.query;

        const orders = await OrderItem.findAll({
            where: {
                Item_id: itemId,
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)],
                },
            },
        });

        res.status(200).json({ data: orders });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


// async function fetchItemByDateSpan(req, res) {
//   try {
//     const { startDate, endDate } = req.query;

//     const orders = await OrderItem.findAll({
//       where: {
//         createdAt: {
//           [Op.between]: [new Date(startDate), new Date(endDate)],
//         },
//         refunded:0
//       },
//     });



//     res.status(200).json({ data: orders });
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }



async function fetchItemDataByDateSpan(req, res) {
    try {

        console.log("entering")
        const { startdate, enddate, itemName, categoryName, shopName } = req.body;
        // console.log(req.body.shopName);
        const whereClause = [];

        if (startdate && enddate) {
            const startDate = moment(startdate, "YYYY-MM-DD");
            const endDate = moment(enddate, "YYYY-MM-DD")
            const startDateTime = startDate.startOf('day').format("YYYY-MM-DD HH:mm:ss");
            const endDateTime = endDate.endOf('day').format("YYYY-MM-DD HH:mm:ss");
            whereClause.push(`OrderItem.createdAt BETWEEN '${startDateTime}' AND '${endDateTime}'`);
        }
        if (itemName) {
            const itemId = (await Item.findOne({ where: { name: itemName } })).id;
            // console.log(itemId);
            whereClause.push(`Item_id IN ('${itemId}')`);
        }
        if (categoryName) {
            const CategoryId = (await Category.findOne({ where: { name: categoryName } })).id;
            const itemIds = await Item.findAll({ where: { category_id: CategoryId }, attributes: ['id'], raw: true });

            const itemIdsArray = itemIds.map((e) => `"${e.id}"`);
            if (itemIdsArray.length == 0) {
                whereClause.push(`Item_id IN ('')`);
            } else {
                whereClause.push(`Item_id IN (${itemIdsArray.join(',')})`);
            }
        }
        if (shopName) {

            //console.log("ShopName", shopName)
            const ShopId = (await Shop.findOne({ where: { name: shopName } })).id;
            const itemIds = await Item.findAll({ where: { Shop_id: ShopId }, attributes: ['id'], raw: true });
            const itemIdsArray = itemIds.map((e) => `"${e.id}"`);
            if (itemIdsArray.length == 0) {

                res.send(JSON.stringify({ data: [] }))
                return
                whereClause.push(`Item_id IN ('')`);
            } else {
                whereClause.push(`Item_id IN (${itemIdsArray.join(',')})`);
            }
        }

        const whereClauseString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

        const query = `
        SELECT
        Item.name AS itemName,
        MAX(s.name) as ShopName,
        MAX(c.name) as CategoryName,
        MAX(Item.price) AS itemPrice,
        SUM(OrderItem.cost) AS totalcost,
        SUM(OrderItem.Quantity) AS totalQuantity
    FROM
        OrderItems AS OrderItem
    INNER JOIN
        Items AS Item
    ON
        OrderItem.Item_id = Item.id
    INNER JOIN Categories c ON c.id = Item.category_id
    INNER JOIN Shops s ON s.id = Item.shop_id
    ${whereClauseString}
    AND
        OrderItem.refunded = 0
    GROUP BY
    Item.name
    ORDER BY ShopName ASC, CategoryName ASC, itemName ASC;
    
        `;
        // console.log(query)
        console.log(query)
        const orders = await sequelize.query(query, {
            type: QueryTypes.SELECT,
        });

        res.status(200).json({ data: orders });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message });
    }
}

async function fetchItemDataForDate(req, res) {
    try {
        const { date, itemName, categoryName, shopName } = req.body;
        // console.log(req.body.shopName);
        const whereClause = [];

        if (date) {
            const fetchDate = moment(date, "YYYY-MM-DD");
            const startDateTime = fetchDate.startOf('day').format("YYYY-MM-DD HH:mm:ss");
            const endDateTime = fetchDate.endOf('day').format("YYYY-MM-DD HH:mm:ss");
            whereClause.push(`OrderItem.createdAt BETWEEN '${startDateTime}' AND '${endDateTime}'`);
        }
        if (itemName) {
            const itemId = (await Item.findOne({ where: { name: itemName } })).id;
            //console.log(itemId);
            whereClause.push(`Item_id IN ('${itemId}')`);
        }
        if (categoryName) {
            const CategoryId = (await Category.findOne({ where: { name: categoryName } })).id;
            const itemIds = await Item.findAll({ where: { category_id: CategoryId }, attributes: ['id'], raw: true });

            const itemIdsArray = itemIds.map((e) => `"${e.id}"`);
            if (itemIdsArray.length == 0) {
                whereClause.push(`Item_id IN ('')`);
            } else {
                whereClause.push(`Item_id IN (${itemIdsArray.join(',')})`);
            }
        }
        if (shopName) {

            //console.log("ShopName", shopName)
            const ShopId = (await Shop.findOne({ where: { name: shopName } })).id;
            const itemIds = await Item.findAll({ where: { Shop_id: ShopId }, attributes: ['id'], raw: true });
            const itemIdsArray = itemIds.map((e) => `"${e.id}"`);
            if (itemIdsArray.length == 0) {

                res.send(JSON.stringify({ data: [] }))
                return
                whereClause.push(`Item_id IN ('')`);
            } else {
                whereClause.push(`Item_id IN (${itemIdsArray.join(',')})`);
            }
        }

        const whereClauseString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

        const query = `
        SELECT
        Item.name AS itemName,
        MAX(s.name) as ShopName,
        MAX(c.name) as CategoryName,
        MAX(Item.price) AS itemPrice,
        SUM(OrderItem.cost) AS totalcost,
        SUM(OrderItem.Quantity) AS totalQuantity
    FROM
        OrderItems AS OrderItem
    INNER JOIN
        Items AS Item
    ON
        OrderItem.Item_id = Item.id
    INNER JOIN Categories c ON c.id = Item.category_id
    INNER JOIN Shops s ON s.id = Item.shop_id
    ${whereClauseString}
    AND
        OrderItem.refunded = 0
    GROUP BY
    Item.name
    ORDER BY ShopName ASC, CategoryName ASC, itemName ASC;
    `;

        console.log(query)
        const orders = await sequelize.query(query, {
            type: QueryTypes.SELECT,
        });

        res.status(200).json({ data: orders });
    } catch (error) {
        // console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message });
    }
}

// Example usage in an Express route
// app.get('/api/items', fetchItemDataForDate);
// Please make sure to replace 'your-sequelize-models' with the actual path to your Sequelize models and adjust the code according to your application's specific requirements and routing structure.







const Transactioncompletion = async (req, res) => {
    const transactionId = req.params.id;
    try {
        // Check if the transaction is already completed
        const existingTransaction = await Transaction.findOne({
            where: { id: transactionId, Is_completed: 1 },
        });

        if (existingTransaction) {
            return res.status(200).json({ completed: 'Transaction is already completed' });
        }


        await Transaction.update({ Is_completed: 1 }, { where: { id: transactionId } });

        res.status(200).json({ message: 'Transaction updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating the transaction' });
    }
};

const getItemForBill = async (req, res) => {
    console.log("enter");
    const NaturalShopId = await Shop.findOne({
        where: {
            name: "Naturals"
        }
    })
    const storeId = await Shop.findOne({
        where: {
            name: "Store"
        }
    })

    const whereClause = {}
    if (NaturalShopId) {
        whereClause.Shop_id = {
            [Op.notIn]: [NaturalShopId.id, storeId.id],
        }
    }

    try {
        const availableItem = await Item.findAll({
            include: [{
                model: Shop,
                attributes: ['id', 'Hide'],

                required: true
            },
            {
                model: Category,
                attributes: ['id', 'Hide'],

                required: true
            }

            ],
            where: {

                Quantity: {
                    [Op.gt]: 0
                },
                ...whereClause

            },
            attributes: ['id', 'name', 'price', 'quantity', 'Shop_id'],
        });

        const result = await Promise.all(availableItem.map(async (ele) => {

            const shopname = (await Shop.findByPk(ele.Shop_id)).name;
            const data = { ...ele.dataValues, shopname };
            return data;
        }));

        res.send(JSON.stringify(result));
    } catch (err) {
        res.send(JSON.stringify({ error: err.message }));
    }
};
const getStoreItemForBill = async (req, res) => {

    const storeId = await Shop.findOne({
        where: {
            name: "Store"
        }
    })

    const whereClause = {}
    if (storeId) {
        whereClause.Shop_id = {
            [Op.in]: [storeId.id],
        }
    }

    try {
        const availableItem = await Item.findAll({
            include: [{
                model: Shop,
                attributes: ['id', 'Hide'],

                required: true
            },
            {
                model: Category,
                attributes: ['id', 'Hide'],

                required: true
            }

            ],
            where: {

                Quantity: {
                    [Op.gt]: 0
                },
                ...whereClause

            },
            attributes: ['id', 'name', 'price', 'quantity', 'Shop_id'],
        });

        const result = await Promise.all(availableItem.map(async (ele) => {

            const shopname = (await Shop.findByPk(ele.Shop_id)).name;
            const data = { ...ele.dataValues, shopname };
            return data;
        }));

        res.send(JSON.stringify(result));
    } catch (err) {
        res.send(JSON.stringify({ error: err.message }));
    }
};



async function fetchTotalTransactionByTypeAndDate(req, res) {
    try {
        const { transactionType, date } = req.query;

        const totalTransactions = await Transaction.findAll({
            attributes: [
                'transactiontype', [sequelize.fn('sum', sequelize.col('Amount')), 'totalAmount'],
            ],
            where: {
                Transaction_Time: {
                    [Op.gte]: new Date(date + "T00:00:00Z"), // Start of the day
                    [Op.lte]: new Date(date + "T23:59:59Z"), // End of the day
                },
                transactiontype: transactionType,
                Is_completed: 1, // Assuming you want to consider only completed transactions
            },
            group: ['transactiontype'], // Group by transactiontype
            order: [
                ['Transaction_Time', 'DESC']
            ], // Sort by Transaction_Time in descending order (latest first)
        });

        res.status(200).json({ data: totalTransactions });
    } catch (error) {
        console.error('Error fetching total transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}








module.exports = {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    refund,
    createTransactionByAdmin,
    createTransactionByUser,
    checkQuantity,
    getAllTransactionsbyUser,
    getOrderItemsByOrderId,
    fetchDataByItemId,
    fetchDataByDate,
    fetchDataWithinDateSpan,
    fetchDataByItemAndDateSpan,
    getIncompleteTransactionsbyUser,
    createNaturalTransactionByAdmin,
    refundWithQuantity,
    refundWithoutQuantity,
    Transactioncompletion,
    getItemForBill,
    fetchItemDataByDateSpan,
    fetchItemDataForDate,
    fetchTotalTransactionByTypeAndDate,
    getAllTransactionsbyUserWithRfid,
    getStoreItemForBill,
    createTransactionWithMobile
};