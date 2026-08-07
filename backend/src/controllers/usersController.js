const User = require('../models/User');
const Attendance = require('../models/Attendance');
const logger = require('../config/logger');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private (admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, department, page = 1, limit = 20, search } = req.query;

    let query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (admin)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('managerId', 'name email department');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user (admin)
// @route   PUT /api/users/:id
// @access  Private (admin)
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, department, managerId, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, managerId, isActive },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.info(`User ${user.email} updated by admin ${req.user.email}`);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete / Deactivate user (admin)
// @route   DELETE /api/users/:id
// @access  Private (admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    logger.warn(`User ${user.email} deactivated by ${req.user.email}`);
    res.status(200).json({ success: true, message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get team members (manager)
// @route   GET /api/users/team
// @access  Private (manager, admin)
const getTeam = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'manager') {
      query.managerId = req.user._id;
    }

    const team = await User.find(query).select('-password').populate('managerId', 'name email');
    res.status(200).json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getTeam };
