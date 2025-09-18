const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getFeaturedProducts,
    getCategories,
    getAllProductsAdmin
} = require('../controllers/productController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes - accessible to all users
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Admin only routes - require authentication and admin role
router.use(protect); // All routes below require authentication
router.use(requireAdmin); // All routes below require admin role

router.route('/')
    .get(getAllProducts)
    .post(upload.array('images', 5), createProduct);
router.route('/:id')
    .get(getProductById)
    .put(upload.array('images', 5), updateProduct)
    .delete(deleteProduct);
router.get('/admin/all', getAllProductsAdmin);

module.exports = router;
