const express = require('express');
const router = express.Router();
const validators = require('../middlewares/validator.middleware');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', validators.registerValidations, authController.registerUser);
router.post('/login', validators.loginValidations, authController.loginUser);

router.get('/me', authMiddleware.authMiddleware, authController.getCurrentUser);

router.get('/logout', authMiddleware.authMiddleware, authController.logoutUser);

router.get('/users/me/addresses', authMiddleware.authMiddleware, authController.getUserAddresses);

router.post('/users/me/addresses', authMiddleware.authMiddleware, authController.addAddress);

router.delete('/users/me/addresses/:addressId', authMiddleware.authMiddleware, authController.deleteAddress);

module.exports = router;
