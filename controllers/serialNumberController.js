const serialNumber = require('../models/serialNumber');
const moment = require('moment-timezone');
const shop = require('../models/shop');
let todayDate = moment().tz('Asia/Kolkata').format();
let number;
const generate = async (req, res) => {
    let result = await shop.findAll({
        attributes: ['id'],
        raw: true

    });
    number = {}
    result.forEach((element) => {
        number[element.id] = 0
    });
    if (res)
        return res.json({ message: "done" });
}

const getSerialNumber = async (req, res) => {

    // console.log(number)
    // let date = moment().tz('Asia/Kolkata').format();
    // if (date !== todayDate) {
    //     todayDate = date;
    //     number = {}
    //     await generate()
    // }
    if (!number) {
        await generate()
        // console.log("generate")
    }
    let { shop_id, transaction_id } = req.body;
    let serial = await serialNumber.findOne({ where: { Shop_id: shop_id, Transaction_id: transaction_id } });
    if (serial) {
        // console.log("found")
        return res.json({ serialnumber: serial.serialNumber });
    }
    number[shop_id] += 1
    let result = await serialNumber.create({ serialNumber: number[shop_id], Shop_id: shop_id, Transaction_id: transaction_id });
    // console.log("after", number)
    return res.json({ serialnumber: result.serialNumber });
}

module.exports = { getSerialNumber, generate };