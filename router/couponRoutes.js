const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticateToken, authorizeAdmin ,authorizeUser } = require('../middleware/authMiddleware');

// Create a new coupon
router.post('/coupons',authenticateToken,authorizeAdmin, couponController.createCoupon);

// Read all coupons
router.get('/coupons',authenticateToken,authorizeAdmin, couponController.getAllCoupons);

// Read a specific coupon by ID
router.get('/coupons/:id', authenticateToken,couponController.getCouponById);

// Update a coupon by ID
router.put('/coupons/:id',authenticateToken,authorizeAdmin, couponController.updateCoupon);

// Delete a coupon by ID
router.delete('/coupons/:id',authenticateToken,authorizeAdmin, couponController.deleteCoupon);

module.exports = router;
