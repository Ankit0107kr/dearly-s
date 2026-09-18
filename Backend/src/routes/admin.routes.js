const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const authorizeAdmin = require('../middlewares/admin.middleware');
const validate = require('../middlewares/validation.middleware');
const { imageUpload } = require('../middlewares/upload.middleware');

const adminController = require('../controllers/admin.controller');
const categoryController = require('../controllers/category.controller');
const productController = require('../controllers/product.controller');
const couponController = require('../controllers/coupon.controller');
const orderController = require('../controllers/order.controller');
const uploadController = require('../controllers/upload.controller');

const { createProductSchema, updateProductSchema } = require('../validators/product.validator');
const { createCouponSchema, updateCouponSchema } = require('../validators/coupon.validator');

const router = express.Router();

router.use(authenticate, authorizeAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.listUsers);

router.post('/uploads', imageUpload.single('image'), uploadController.uploadImage);

router.post('/categories', categoryController.createCategory);
router.patch('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

router.get('/products', productController.adminListProducts);
router.post(
  '/products',
  imageUpload.array('images', 10),
  validate(createProductSchema),
  productController.createProduct
);
router.patch(
  '/products/:id',
  imageUpload.array('images', 10),
  validate(updateProductSchema),
  productController.updateProduct
);
router.delete('/products/:id', productController.deleteProduct);

router.post('/coupons', validate(createCouponSchema), couponController.createCoupon);
router.get('/coupons', couponController.listCoupons);
router.patch('/coupons/:id', validate(updateCouponSchema), couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

router.get('/orders', orderController.adminListOrders);
router.patch('/orders/:id/status', orderController.adminUpdateOrderStatus);

module.exports = router;
