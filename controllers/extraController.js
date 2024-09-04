const { Op, where } = require("sequelize");
const Transaction = require("../models/Transaction");
const User = require("../models/user");
require('dotenv').config();
const { QueryTypes } = require('sequelize');
const moment = require("moment");
const dateFormat = "YYYY-MM-DD"
const requiredFormat = "YYYY-MM-DD HH:mm:ss"
const mysqldump = require('mysqldump');
const sequelize = require("../models/database");
const bcrypt = require('bcrypt');
const Item = require('../models/Item');
const Shop = require('../models/shop');
const Category = require('../models/category');
const writeXlsxFile = require('write-excel-file/node')
const fs = require('fs')
async function TotalAmountOnAccount(req, res) {
    try {

        const amt = await User.findAll({
            attributes: [
                [sequelize.fn("sum", sequelize.col("amount")), "total"]

            ]
        })
        res.send(JSON.stringify(amt));
    } catch (error) {
        res.send(JSON.stringify(error));
    }
}
async function DatabaseBackup(req, res) {
    try {
        // or const mysqldump = require('mysqldump')

        // dump the result straight to a file
        mysqldump({
            connection: {
                host: 'localhost',
                user: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: 'billsmart',
            },
            dumpToFile: `backup/BillBuddyDB.sql`,
        });
        res.send(JSON.stringify("Database Backup"))
    } catch (error) {
        res.send(error.message)
    }
}

async function AddNaturalAmount(req, res) {
    try {
        const { amount } = req.body;
        const useramt = await User.increment('natural_amt', { by: amount, where: { gender: 0, isHosteller: 1 } })
        // const userupdate =
        res.send(JSON.stringify(useramt));

    } catch (error) {
        res.send(JSON.stringify(error));
    }
}
async function setNaturalAmount(req, res) {
    try {
        const { amount } = req.body;
        const userAmt = await User.update({
            "natural_amt": amount
        }, { where: { gender: 0, isHosteller: 1 } })
        res.send(JSON.stringify(userAmt));
    } catch (error) {
        res.send(JSON.stringify(error));
    }

}


async function getAllDebitOrCredit(req, res) {
    try {
        const { transactionType, date } = req.query;

        const transactionAmount = await Transaction.sum('amount', {
            where: {
                transactiontype: transactionType,
                createdAt: {
                    [Op.and]: {
                        [Op.gt]: moment(date, "YYYY-MM-DD").startOf("day").format("YYYY-MM-DD HH:mm:ss"),
                        [Op.lt]: moment(date, "YYYY-MM-DD").endOf("day").format("YYYY-MM-DD HH:mm:ss")
                    }
                }
            }
        });


        res.json({ totalAmount: transactionAmount || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


async function AllTransactionsAmount(req, res) {
    const { date } = req.query
    const whereClause = {}

    if (date) {
        whereClause.createdAt = {
            [Op.gte]: moment(date, dateFormat).startOf('day').format(requiredFormat),
            [Op.lte]: moment(date, dateFormat).endOf('day').format(requiredFormat)
        }
    } else {
        whereClause.createdAt = {
            [Op.gte]: moment().startOf('day').format(requiredFormat),
            [Op.lte]: moment().endOf('day').format(requiredFormat)
        }
    }
    try {
        const result = await Transaction.findAll({
            where: whereClause,
            group: "transactiontype",
            attributes: ["transactiontype", [sequelize.fn("sum", sequelize.col("amount")), "totalAmount"]],
        })
        res.send(result)
    } catch (error) {
        res.send(JSON.stringify(error.message));
    }
}
async function totalCredit(req, res) {
    try {
        const { date } = req.query

        const fetchDate = moment(date, "YYYY-MM-DD");
        const startDateTime = fetchDate.startOf('day').format("YYYY-MM-DD HH:mm:ss");
        const endDateTime = fetchDate.endOf('day').format("YYYY-MM-DD HH:mm:ss");
        const result = await Transaction.findAll({
            where: {
                transactionType: 1,
                transaction_by: {
                    [Op.notIn]: ["sowraj.m2021csec@sece.ac.in", "adminbillbuddy@sece.ac.in"]
                },
                createdAt: {
                    [Op.gte]: startDateTime,
                    [Op.lte]: endDateTime
                }
            },
            group: "transaction_by",
            attributes: ["transaction_by", [sequelize.fn("sum", sequelize.col("Amount")), "amount"]]

        })
        res.send(result)
    } catch (error) {
        res.send(error)
    }
}
async function setPin(req, res) {
    try {
        console.log("entering")
        const { pin } = req.body;
        const userid = req.user.id;
        const user = await User.findByPk(userid);
        console.log(user.User_name, user.pin)
        if (user.pin) {
            return res.status(202).json({ message: "pin already exists" })
        }
        const hashedPin = await bcrypt.hash(pin.toString(), 10);
        user.set({
            "pin": hashedPin,
            "attempts": 3
        })
        await user.save();
        return res.status(200).json({ message: "success" })

    } catch (error) {
        return res.status(404).json({ error: error.message })
    }
}
async function updatePin(req, res) {
    try {
        const { pin, userid } = req.body;

        const user = await User.findByPk(userid);
        const hashedPin = await bcrypt.hash(pin.toString(), 10);
        user.set({
            "pin": hashedPin,
            "attempts": 3
        })
        await user.save();
        return res.status(200).json({ message: "success" })


    } catch (error) {
        return res.status(404).json({ error: error.messsage })

    }
}
async function search(req, res) {
    try {
        const { search } = req.body;

        const query = `
    SELECT i.name
    FROM items i
    INNER JOIN categories c ON c.id = i.category_id
    INNER JOIN shops s ON s.id = i.shop_id
    WHERE s.hide = false
    AND c.hide = false
    AND i.hide = false
    AND s.name NOT LIKE '%atural%'
    AND (
    LOWER(i.name) LIKE LOWER('%${search}%')
     OR SOUNDEX(i.name) = SOUNDEX('${search}'));
`;




        const results = await sequelize.query(query,
            { type: QueryTypes.SELECT })

        res.status(200).json(results)

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}
const ExcelJS = require('exceljs');

const generateExcelSheet = async (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ItemList');

    // Add header row
    worksheet.addRow(["Shop Name", "Category Name", "Item Name"]).font = { bold: true };

    // Add data rows
    data.forEach(item => {
        worksheet.addRow([item[0].value, item[1].value, item[2].value]);
    });

    // Save the workbook
    const filePath = 'ItemList.xlsx';
    let path = __dirname + "/" + filePath
    await workbook.xlsx.writeFile(path);

    console.log(`Excel sheet generated successfully: ${filePath}`);
    return path;
};

// Assuming you have the 'data' variable from your existing code


const allItemList = async (req, res) => {
    try {
        const result = await Item.findAll({
            raw: true,
            include: [
                {
                    model: Category,
                }, {
                    model: Shop,
                }
            ]
        })
        console.log(result)
        const rowHeader = [{ value: "shop Name", fontWeight: "bold" }, { value: "category Name", fontWeight: "bold" }, { value: "Item Name", fontWeight: "bold" }]
        let data = [rowHeader]
        for (let i = 0; i < result.length; i++) {
            data.push([{ value: result[i]["Shop.name"], type: String }, { value: result[i]["Category.name"], type: String }, { value: result[i]["name"], type: String }])
        }
        //console.log(data)


        let path = await generateExcelSheet(data);
        res.sendFile(path)

    } catch (error) {
        res.json(JSON.stringify(error.message))
    }
}
module.exports = {
    allItemList,
    TotalAmountOnAccount,
    AddNaturalAmount,
    setNaturalAmount,
    getAllDebitOrCredit,
    AllTransactionsAmount,
    DatabaseBackup,
    totalCredit,
    updatePin,
    setPin,
    search
}