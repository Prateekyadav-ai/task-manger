const Task = require("../models/task");
const mongoose = require("mongoose");

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { assignedTo, projectId } = req.body;

    if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: 'Invalid assignedTo ObjectId' });
    }

    if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid projectId ObjectId' });
    }

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo,
      projectId: req.body.projectId,
      dueDate: req.body.dueDate
    });

    res.status(201).json(task);
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// Get Tasks
exports.getTasks = async (req, res) => {
  try {
    const { status, assignedTo, projectId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (projectId) filter.projectId = projectId;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "username fullName email")
      .populate("projectId", "name");

    return res.status(200).json(tasks);
  } catch (err) {
    console.error('Error in getTasks:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get task by id
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const task = await Task.findById(id)
      .populate('assignedTo', 'username fullName email')
      .populate('projectId', 'name description');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.status(200).json(task);
  } catch (err) {
    console.error('Error in getTaskById:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update task (owner or admin)
exports.updateTask = async (req, res) => {
  try {
    const id = req.params.id;

    const { title, description, status, assignedTo, projectId, dueDate } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (projectId !== undefined) task.projectId = projectId;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    const updated = await Task.findById(id)
      .populate("assignedTo", "name email")
      .populate("projectId", "name");

    return res.status(200).json(updated);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Change task status (owner or admin)
exports.changeTaskStatus = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // normalize status input
    const s = status.toString().toLowerCase().replace(/[-_]/g, ' ').trim();
    let mapped;
    if (s === 'todo') mapped = 'Todo';
    else if (s === 'in progress' || s === 'inprogress') mapped = 'In Progress';
    else if (s === 'done') mapped = 'Done';
    else return res.status(400).json({ message: 'Invalid status value' });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const userId = req.user && req.user.id;
    if (task.assignedTo && task.assignedTo.toString() !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: only assigned user or admin can change status' });
    }

    task.status = mapped;
    await task.save();

    const updated = await Task.findById(id)
      .populate('assignedTo', 'username fullName email')
      .populate('projectId', 'name description');

    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error in changeTaskStatus:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete task (owner or admin)
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const userId = req.user && req.user.id;
    if (task.assignedTo && task.assignedTo.toString() !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: only assigned user or admin can delete the task' });
    }

    await Task.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Error in deleteTask:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks by project
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    const tasks = await Task.find({ projectId })
      .populate('assignedTo', 'username fullName email')
      .populate('projectId', 'name description');

    return res.status(200).json(tasks);
  } catch (err) {
    console.error('Error in getTasksByProject:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks by user
exports.getTasksByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const tasks = await Task.find({ assignedTo: userId })
      .populate('assignedTo', 'username fullName email')
      .populate('projectId', 'name');

    return res.status(200).json(tasks);
  } catch (err) {
    console.error('Error in getTasksByUser:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get overdue tasks
exports.getOverdueTasks = async (req, res) => {
  try {
    const now = new Date();
    const tasks = await Task.find({ dueDate: { $lt: now }, status: { $ne: 'Done' } })
      .populate('assignedTo', 'username fullName email')
      .populate('projectId', 'name');

    return res.status(200).json(tasks);
  } catch (err) {
    console.error('Error in getOverdueTasks:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};