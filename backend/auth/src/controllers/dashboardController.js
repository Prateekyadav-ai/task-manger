const Task = require('../models/task');
const Project = require('../models/project');
const User = require('../models/user.models');
const mongoose = require('mongoose');

exports.summary = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const byStatusAgg = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const usersCount = await User.countDocuments();

    const byStatus = {};
    byStatusAgg.forEach(s => { byStatus[s._id] = s.count; });

    res.json({ totalTasks, byStatus, usersCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.projectSummary = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid project id' });
  try {
    const project = await Project.findById(id).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const totalTasks = await Task.countDocuments({ projectId: id });
    const byStatusAgg = await Task.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const overdueCount = await Task.countDocuments({ projectId: id, dueDate: { $lt: new Date() }, status: { $ne: 'Done' } });

    const byStatus = {};
    byStatusAgg.forEach(s => { byStatus[s._id] = s.count; });

    res.json({ project: { _id: project._id, name: project.name }, totalTasks, byStatus, overdueCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.overdueSummary = async (req, res) => {
  try {
    const now = new Date();
    const totalOverdue = await Task.countDocuments({ dueDate: { $lt: now }, status: { $ne: 'Done' } });
    const byProjectAgg = await Task.aggregate([
      { $match: { dueDate: { $lt: now }, status: { $ne: 'Done' } } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } },
      { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
      { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
      { $project: { projectId: '$_id', count: 1, projectName: '$project.name' } }
    ]);

    res.json({ totalOverdue, byProject: byProjectAgg });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
