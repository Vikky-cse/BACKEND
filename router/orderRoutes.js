const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeAdmin ,authorizeUser } = require('../middleware/authMiddleware');
// const isAdmin = require('../middleware/authorization').isAdmin;
// const isUser = require('../middleware/authorization').isUser;
// Create a new order
router.post('/orders',authenticateToken, orderController.createOrder);

// Read all orders
router.get('/orders',authenticateToken,authorizeAdmin, orderController.getAllOrders);

// Read a specific order by ID
router.get('/orders/:id',authenticateToken, orderController.getOrderById);

// Update an order by ID
router.put('/orders/:id',authenticateToken, orderController.updateOrder);

// Delete an order by ID
router.delete('/orders/:id',authenticateToken,authorizeAdmin, orderController.deleteOrder);

module.exports = router;
