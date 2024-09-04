const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorizeAdmin, authorizeUser } = require('../middleware/authMiddleware');

// Create a new transaction
router.post('/', authenticateToken,authorizeAdmin, transactionController.createTransaction);

router.get('/getStoreItemForBill', authenticateToken, authorizeAdmin, transactionController.getStoreItemForBill)
router.post('/createTransactionByAdmin', authenticateToken, authorizeAdmin, transactionController.createTransactionByAdmin);

router.post('/createTransactionByUser', authenticateToken, transactionController.createTransactionByUser);


router.get('/orders/:orderId', authenticateToken, transactionController.getOrderItemsByOrderId);
router.post('/checkQuantity', authenticateToken, transactionController.checkQuantity);
router.get('/getItemForBill', authenticateToken,transactionController.getItemForBill)

router.post('/createNaturalTransactionByAdmin', authenticateToken, authorizeAdmin, transactionController.createNaturalTransactionByAdmin);

// Read all transactions
router.get('/', authenticateToken,authorizeAdmin, transactionController.getAllTransactions);



// Read a specific transaction by ID
// router.get('/:id', transactionController.getTransactionById);
router.get('/:id', authenticateToken, transactionController.getAllTransactionsbyUser);
router.get('/forrfid/:id', authenticateToken, transactionController.getAllTransactionsbyUserWithRfid);
router.get('/notcompleted/:id', authenticateToken, transactionController.getIncompleteTransactionsbyUser);

// Update a transaction by ID
router.put('/:id', authenticateToken, authorizeAdmin, transactionController.updateTransaction);

router.put('/complete/:id', authenticateToken, transactionController.Transactioncompletion);

// Delete a transaction by ID
router.delete('/:id', authenticateToken, authorizeAdmin, transactionController.deleteTransaction);

//refund a transaction
router.post('/refund', authenticateToken, authorizeAdmin, transactionController.refund);
router.post('/refundwithQty', authenticateToken, authorizeAdmin, transactionController.refundWithQuantity);
router.post('/refundwithoutQty', authenticateToken, authorizeAdmin, transactionController.refundWithoutQuantity);
// Fetch data by Item ID
router.get('/fetchDataByItemId/:itemId',authenticateToken, transactionController.fetchDataByItemId);

// Fetch data by Date
router.get('/fetchDataByDate/:date',authenticateToken,authorizeAdmin, transactionController.fetchDataByDate);

// Fetch data within a Date Span
router.get('/fetchDataWithinDateSpan',authenticateToken,authorizeAdmin, transactionController.fetchDataWithinDateSpan);

// Fetch data by Item and within a Date Span
router.get('/fetchDataByItemAndDateSpan',authenticateToken,authorizeAdmin, transactionController.fetchDataByItemAndDateSpan);


// ---------------------------------------- ITEM WISE REPORT --------------------------
router.post('/SingledayItemwiseReport', authenticateToken,authorizeAdmin, transactionController.fetchItemDataForDate);
router.post('/MultipleDatyItemwiseReport', authenticateToken,authorizeAdmin, transactionController.fetchItemDataByDateSpan);

router.get('/transactions', authenticateToken,authorizeAdmin, transactionController.fetchTotalTransactionByTypeAndDate);


//RAHU
router.post('/createTransactionWithMobile', authenticateToken, transactionController.createTransactionWithMobile);

module.exports = router;