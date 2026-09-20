const express = require('express');
const categoryController = require('../controllers/category.controller');

const router = express.Router();

router.get('/', categoryController.listCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/occasions', categoryController.listOccasions);

module.exports = router;
