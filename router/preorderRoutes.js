const preorder = require('../controllers/preorderController')
const express = require('express');
const router = express.Router();


router.get('/shops', preorder.preorderShops)
router.get('/category', preorder.preorderCategory)
router.get('/item', preorder.preorderItem)
router.post('/createTransaction', preorder.preorderCreateTransaction)


module.exports = router