const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorizeAdmin ,authorizeUser } = require('../middleware/authMiddleware');
// Create a new category
router.post('/',authenticateToken,authorizeAdmin, categoryController.Upload, categoryController.createCategory);
// router.post('/', categoryController.createCategory);

// Read all categories
router.get('/',authenticateToken, categoryController.getAllCategories);

// Read a specific category by ID
router.get('/:id',authenticateToken, categoryController.getCategoryById);
router.get('/byname/:name',authenticateToken, categoryController.getCategoryByName);

// Update a category by ID
// router.put('/:id', categoryController.updateCategory);
router.put('/:id',authenticateToken,authorizeAdmin, categoryController.Upload, categoryController.updateCategory);
router.get('/byshop/:id',authenticateToken, categoryController.getAllCategoriesByShopId);


// Delete a category by ID
router.delete('/:id',authenticateToken,authorizeAdmin, categoryController.deleteCategory);

module.exports = router;
