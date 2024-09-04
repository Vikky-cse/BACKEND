const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Import your authentication controller
const { authenticateToken, authorizeAdmin, authorizeUser } = require('../middleware/authMiddleware')

// Registration route
router.post('/register', authController.register);
router.post('/registerAdmin', authenticateToken, authorizeAdmin, authController.registerAdmin)
router.post('/logoutAdmin', authController.login);
router.post('/loginAdmin', authController.loginAdmin);
router.post('/loginRfid', authController.loginwithRfid);
router.post('/logoutRfid', authController.logoutwithRfid);

module.exports = router;