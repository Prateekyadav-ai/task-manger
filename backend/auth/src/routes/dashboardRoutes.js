const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// Dashboard summaries (admin only)
router.get('/summary', authMiddleware.authMiddleware, isAdmin, dashboardController.summary);
router.get('/project/:id/summary', authMiddleware.authMiddleware, isAdmin, dashboardController.projectSummary);
router.get('/overdue', authMiddleware.authMiddleware, isAdmin, dashboardController.overdueSummary);

module.exports = router;
