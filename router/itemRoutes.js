const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticateToken, authorizeAdmin ,authorizeUser } = require('../middleware/authMiddleware');

// Create a new item
router.post('/create', authenticateToken,authorizeAdmin, itemController.imgupload,itemController.createItem);
// router.post('/create-shop', shopController.upload, shopController.createShop);


// Read all
router.get('/',authenticateToken, itemController.getAllItems);
router.get('/:id',authenticateToken, itemController.getAllItemsWithCategory);
// Read a specific item by ID
router.get('/byid/:id',authenticateToken, itemController.getItemById);

// Update an item by ID
// router.put('/:id', itemController.updateItem);
router.put('/:id',authenticateToken,authorizeAdmin, itemController.imgupload, itemController.updateItem);
    
// Delete an item by ID
router.delete('/:id',authenticateToken,authorizeAdmin, itemController.deleteItem);

module.exports = router;
