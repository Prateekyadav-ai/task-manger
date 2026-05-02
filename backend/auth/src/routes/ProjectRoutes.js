const express = require("express");
const router = express.Router();

const { createProject, getProjects } = require("../controllers/projectControllers");
const authMiddleware = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/roleMiddleware");

router.post("/", authMiddleware.authMiddleware, isAdmin, createProject);

router.get("/", getProjects);

// tasks by project
const tasksController = require('../controllers/tasksControllers');
router.get('/:projectId/tasks', tasksController.getTasksByProject);

// project detail
const projectController = require('../controllers/projectControllers');
router.get('/:id', projectController.getProjectById);

// admin operations
router.put('/:id', authMiddleware.authMiddleware, isAdmin, projectController.updateProject);
router.delete('/:id', authMiddleware.authMiddleware, isAdmin, projectController.deleteProject);
router.post('/:id/members', authMiddleware.authMiddleware, isAdmin, projectController.addProjectMember);
router.delete('/:id/members/:userId', authMiddleware.authMiddleware, isAdmin, projectController.removeProjectMember);

module.exports = router;