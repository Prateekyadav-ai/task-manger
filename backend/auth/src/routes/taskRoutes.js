const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const { createTask, getTasks, getTaskById, updateTask, changeTaskStatus } = require("../controllers/tasksControllers");

router.post("/", createTask);
router.get("/", getTasks);
router.get("/overdue", require('../controllers/tasksControllers').getOverdueTasks);
router.patch("/:id/status", authMiddleware.authMiddleware, changeTaskStatus);
router.get("/:id", getTaskById);
router.put("/:id", authMiddleware.authMiddleware, updateTask);
router.delete("/:id", authMiddleware.authMiddleware, require('../controllers/tasksControllers').deleteTask);

module.exports = router;