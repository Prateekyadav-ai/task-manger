const userModel = require('../models/user.models');
const mongoose = require('mongoose');

exports.listUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user id' });
  try {
    const user = await userModel.findById(id, '-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.changeUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const allowedRoles = ['user', 'seller', 'Admin'];
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user id' });
  if (!role || !allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
  try {
    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = role;
    await user.save();
    const updated = await userModel.findById(id, '-password');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
