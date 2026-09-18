const express = require('express');
const authenticate = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.get('/me', authenticate, userController.getProfile);
router.patch('/me', authenticate, userController.updateProfile);

module.exports = router;
