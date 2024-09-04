const Transaction = require('../models/preordertranscation');
const Order = require('../models/preorder');
const OrderItem = require('../models/preOrderItem');
const User = require('../models/user');
const { Op, Sequelize } = require('sequelize');
const Item = require('../models/Item');
const sequelize = require('../models/database');
const moment = require('moment');
const { QueryTypes } = require('sequelize');


const preorderShops = async (req, res) => {
    const t = await sequelize.transaction();

    try {

        const query = `SELECT distinct(s.name) AS shop_name, s.image AS shop_image, s.id as id
        FROM Items i
        INNER JOIN Shops s ON i.shop_id = s.id
        WHERE i.availableForPreorder = true;
        `
        const shops = await sequelize.query(query, {
            type: QueryTypes.SELECT,
        });
        res.send(shops);
        await t.commit();
    } catch (error) {
        res.send(error);
        if (t) {
            await t.rollback();
        }
    }
};



const preorderCategory = async (req, res) => {
    const t = await sequelize.transaction()
    try {
        const { shop_id } = req.body
        if (!shop_id) {
            res.send({ error: "null shopId" }).status(202)
            return
        }
        const query = ` select distinct(c.name),c.image,c.id  from categories c inner join items i on c.id = i.category_id where availableForPreorder = true and i.shop_id = "${shop_id}"`
        const category = await sequelize.query(query, {
            type: QueryTypes.SELECT
        })
        res.send(category)
        await t.commit();

    } catch (error) {

        res.send(error);
        await t.rollback();
    }
}
const preorderItem = async (req, res) => {
    try {

        const { category_id } = req.body

        if (!category_id) {
            res.send({ "error": "error in categoryId" }).status(202)
            return
        }
        const item = await Item.findAll({
            where: {
                availableForPreorder: true,
                category_id
            },
            attributes: ["name", "image", "preorderQuantity"]
        })

        res.send(item).status(200)

    } catch (error) {
        res.send(error).status(400)
    }
}
const preorderCreateTransaction = async (req, res) => {
    const t = await sequelize.transaction(); // Use await to ensure that the transaction is properly awaited
    try {
        const { user_id, cartItems, date } = req.body;
        const unavailableItems = [];
        const orderItems = [];
        const order = await Order.create();
        let totalPrice = 0;

        for (const item of cartItems) {
            const { id, quantity } = item;
            const currItem = await Item.findByPk(id); // Use findByPk instead of findByPK

            if (!currItem) {
                unavailableItems.push({ name: "Item Not Found" }); // Remove quotes around property names
            } else if (currItem.preorderQuantity < quantity) {
                unavailableItems.push({ name: currItem.name });
            } else {
                totalPrice += currItem.price * quantity;
                currItem.preorderQuantity -= quantity;
                await currItem.save();
                orderItems.push({
                    Item_id: currItem.id, // Use currItem.id instead of currItem.itemId
                    Quantity: quantity,
                    orderId: order.id,
                    cost: currItem.cost
                });
            }
        }


        if (unavailableItems.length > 0) {
            await t.rollback(); // Use rollback instead of rollBack
            return res.status(203).json({ error: "Insufficient items quantity" }); // Add a return statement
        }

        const user = await User.findByPk(user_id); // Use findByPk instead of findByPK
        if (totalPrice > user.amount) {
            await t.rollback();
            return res.status(202).json({ error: "Insufficient balance" }); // Add a return statement
        }

        user.amount -= totalPrice;
        await user.save();
        const res = await OrderItem.bulkCreate(orderItems, { validate: true });
        if (res.length <= 0) {
            await t.rollback();
            return res.status(201).json({ error: "preorder cart Error" })
        }

        const transactionItem = await Transaction.create({
            Amount: totalPrice,
            Transaction_Time: moment(date),
            Is_completed: true,
            user_id: user.id,
            coupon_id: null, // You can add a coupon ID if needed
            order_id: order.id
        });
        await t.commit(); // Commit the transaction

        return res.status(200).json(transactionItem); // Add a return statement
    } catch (error) {
        console.error(error);
        await t.rollback();
        return res.status(400).json({ error: "Error in preorder" }); // Add a return statement
    }
};


module.exports = {
    preorderShops,
    preorderCategory,
    preorderItem,
    preorderCreateTransaction
}