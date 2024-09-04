const express = require('express');
const router = express.Router();

const serialNumberController = require('../controllers/serialNumberController');

router.post('/', serialNumberController.getSerialNumber);
router.get('/generate', serialNumberController.generate);

module.exports = router;