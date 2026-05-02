const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksControllers');

// GET /api/users/:userId/tasks
router.get('/:userId/tasks', tasksController.getTasksByUser);

module.exports = router;
