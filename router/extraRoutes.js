const express = require('express');
const router = express.Router();
const Controller = require('../controllers/extraController')
const { authenticateToken, authorizeAdmin, authorizeUser } = require('../middleware/authMiddleware')
router.get('/TotalAmountOnId', authenticateToken, authorizeAdmin, Controller.TotalAmountOnAccount)
router.post('/AddNaturalAmount', authenticateToken, authorizeAdmin, Controller.AddNaturalAmount)
router.post('/setNaturalAmount', authenticateToken, authorizeAdmin, Controller.setNaturalAmount)
router.get('/getAllDebitOrCredit', authenticateToken, authorizeAdmin, Controller.getAllDebitOrCredit)
router.get('/getAllTranscationAmount', authenticateToken, authorizeAdmin, Controller.AllTransactionsAmount)
router.get('/DatabaseBackup', Controller.DatabaseBackup)
router.get("/totalCredit", authenticateToken, authorizeAdmin, Controller.totalCredit)
router.post("/updatePin", authenticateToken, authorizeAdmin, Controller.updatePin);
router.post("/setPin", authenticateToken, authorizeUser, Controller.setPin)
router.post("/search", Controller.search)
router.get('/allItemList', Controller.allItemList)
module.exports = router