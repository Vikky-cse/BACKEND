const express = require('express');
const router = express.Router();
 
const cartController = require('../controllers/cartController');
const { authenticateToken, authorizeAdmin ,authorizeUser } = require('../middleware/authMiddleware');

router.get('/:id',authenticateToken, cartController.getCartByUserId);
router.delete('/:id',authenticateToken, cartController.deleteCart);
router.post('/:id',authenticateToken, cartController.createCartItem);
router.put('/:id',authenticateToken, cartController.updateCartItem);
router.delete('/:id/:item_id',authenticateToken, cartController.deleteCartItem);
router.post('/cruitem',authenticateToken, cartController.createOrUpdateCartItem);

module.exports = router;
