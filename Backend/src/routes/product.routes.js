const express = require('express');
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { reviewSchema } = require('../validators/order.validator');

const router = express.Router();

router.get('/', productController.listProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:productId/reviews', reviewController.listProductReviews);
router.post(
  '/:productId/reviews',
  authenticate,
  validate(reviewSchema),
  reviewController.createReview
);
router.get('/:id', productController.getProductById);

module.exports = router;
