const Project = require("../models/project");
const mongoose = require('mongoose');
const User = require('../models/user.models');

// Create Project (Admin only)
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      description: req.body.description,
      createdBy: req.user.id
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate({
      path: 'createdBy',
      select: 'username fullName'
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get project by id (include members)
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid project id' });

    const project = await Project.findById(id)
      .populate('createdBy', 'username fullName email')
      .populate('members', 'username fullName email');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    return res.status(200).json(project);
  } catch (err) {
    console.error('Error in getProjectById:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update project (admin)
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid project id' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { name, description } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();
    const updated = await Project.findById(id).populate('createdBy', 'username fullName').populate('members', 'username fullName');
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error in updateProject:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete project (admin)
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid project id' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await Project.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Error in deleteProject:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Add member to project (admin)
exports.addProjectMember = async (req, res) => {
  try {
    const { id } = req.params; // project id
    const { userId } = req.body; // user id to add

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid project id' });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user id' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!project.members) project.members = [];
    if (project.members.some(m => m.toString() === userId)) {
      return res.status(409).json({ message: 'User already a member' });
    }

    project.members.push(userId);
    await project.save();

    const updated = await Project.findById(id).populate('members', 'username fullName email');
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error in addProjectMember:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Remove member from project (admin)
exports.removeProjectMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid project id' });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user id' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.members = (project.members || []).filter(m => m.toString() !== userId);
    await project.save();

    const updated = await Project.findById(id).populate('members', 'username fullName email');
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error in removeProjectMember:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};