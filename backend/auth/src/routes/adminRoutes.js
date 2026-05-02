const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// List all users (admin)
router.get('/', authMiddleware.authMiddleware, isAdmin, adminController.listUsers);

// Get user details (admin)
router.get('/:id', authMiddleware.authMiddleware, isAdmin, adminController.getUserById);

// Change user role (admin)
router.put('/:id/role', authMiddleware.authMiddleware, isAdmin, adminController.changeUserRole);

module.exports = router;
