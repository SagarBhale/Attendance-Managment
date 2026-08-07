const Attendance = require('../models/Attendance');
const User = require('../models/User');
const logger = require('../config/logger');
const { isWithinGeofence, getTodayDate } = require('../utils/helpers');

// @desc    Punch In
// @route   POST /api/attendance/punch-in
// @access  Private (employee)
const punchIn = async (req, res, next) => {
  try {
    const { selfie, latitude, longitude, address } = req.body;

    if (!selfie) return res.status(400).json({ success: false, message: 'Selfie is required' });
    if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'Location is required' });

    const today = getTodayDate();

    // Check if already punched in today
    const existing = await Attendance.findOne({ userId: req.user._id, date: today });
    if (existing && existing.punchIn?.time) {
      return res.status(400).json({ success: false, message: 'Already punched in today' });
    }

    const withinGeofence = isWithinGeofence(parseFloat(latitude), parseFloat(longitude));

    let attendance;
    if (existing) {
      existing.punchIn = { time: new Date(), selfie, location: { latitude, longitude, address }, withinGeofence };
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({
        userId: req.user._id,
        date: today,
        punchIn: { time: new Date(), selfie, location: { latitude, longitude, address }, withinGeofence },
      });
    }

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`role_admin`).emit('attendance:punchIn', { userId: req.user._id, name: req.user.name, time: new Date() });
      io.to(`role_manager`).emit('attendance:punchIn', { userId: req.user._id, name: req.user.name, time: new Date() });
    }

    logger.info(`Punch in: ${req.user.email} at ${new Date().toISOString()}`);

    res.status(200).json({ success: true, message: 'Punched in successfully', data: attendance });
  } catch (err) {
    next(err);
  }
};

// @desc    Punch Out
// @route   POST /api/attendance/punch-out
// @access  Private (employee)
const punchOut = async (req, res, next) => {
  try {
    const { selfie, latitude, longitude, address } = req.body;

    if (!selfie) return res.status(400).json({ success: false, message: 'Selfie is required' });
    if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'Location is required' });

    const today = getTodayDate();

    const attendance = await Attendance.findOne({ userId: req.user._id, date: today });
    if (!attendance || !attendance.punchIn?.time) {
      return res.status(400).json({ success: false, message: 'Please punch in first' });
    }
    if (attendance.punchOut?.time) {
      return res.status(400).json({ success: false, message: 'Already punched out today' });
    }

    const withinGeofence = isWithinGeofence(parseFloat(latitude), parseFloat(longitude));

    attendance.punchOut = { time: new Date(), selfie, location: { latitude, longitude, address }, withinGeofence };
    await attendance.save();

    logger.info(`Punch out: ${req.user.email} at ${new Date().toISOString()}, hours: ${attendance.totalHours}`);

    res.status(200).json({ success: true, message: 'Punched out successfully', data: attendance });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance records (role-filtered)
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, userId, page = 1, limit = 20 } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    } else if (req.user.role === 'manager') {
      // Get team members managed by this manager
      const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = teamMembers.map((m) => m._id);
      teamIds.push(req.user._id);
      query.userId = userId ? userId : { $in: teamIds };
    } else if (req.user.role === 'admin') {
      if (userId) query.userId = userId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(query);

    const records = await Attendance.find(query)
      .populate('userId', 'name email department role')
      .populate('validatedBy', 'name email')
      .populate('overtimeRequest')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get today's attendance for current user
// @route   GET /api/attendance/today
// @access  Private
const getTodayAttendance = async (req, res, next) => {
  try {
    const today = getTodayDate();
    const record = await Attendance.findOne({ userId: req.user._id, date: today })
      .populate('overtimeRequest');
    res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
// @access  Private
const getAttendanceById = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id)
      .populate('userId', 'name email department role')
      .populate('validatedBy', 'name email')
      .populate('overtimeRequest');

    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // Employees can only view their own records
    if (req.user.role === 'employee' && record.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// @desc    Validate attendance (manager/admin)
// @route   PUT /api/attendance/:id/validate
// @access  Private (manager, admin)
const validateAttendance = async (req, res, next) => {
  try {
    const { validationStatus, remarks } = req.body;

    if (!['valid', 'invalid'].includes(validationStatus)) {
      return res.status(400).json({ success: false, message: 'Status must be valid or invalid' });
    }

    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    record.validationStatus = validationStatus;
    record.remarks = remarks || null;
    record.validatedBy = req.user._id;
    record.validatedAt = new Date();
    await record.save();

    // Notify the employee
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${record.userId}`).emit('attendance:validated', {
        attendanceId: record._id,
        date: record.date,
        validationStatus,
        remarks,
        validatedBy: req.user.name,
      });
    }

    logger.info(`Attendance ${record._id} validated as ${validationStatus} by ${req.user.email}`);

    res.status(200).json({ success: true, message: 'Attendance validated', data: record });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance stats for dashboard
// @route   GET /api/attendance/stats
// @access  Private
const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startOfMonth = `${year}-${month}-01`;
    const endOfMonth = `${year}-${month}-31`;

    let userIds = [req.user._id];

    if (req.user.role === 'manager') {
      const team = await User.find({ managerId: req.user._id }).select('_id');
      userIds = team.map((m) => m._id);
      userIds.push(req.user._id);
    } else if (req.user.role === 'admin') {
      const allUsers = await User.find({}).select('_id');
      userIds = allUsers.map((u) => u._id);
    }

    const [total, completed, incomplete, pending] = await Promise.all([
      Attendance.countDocuments({ userId: { $in: userIds }, date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Attendance.countDocuments({ userId: { $in: userIds }, date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'completed' }),
      Attendance.countDocuments({ userId: { $in: userIds }, date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'incomplete' }),
      Attendance.countDocuments({ userId: { $in: userIds }, date: { $gte: startOfMonth, $lte: endOfMonth }, validationStatus: 'pending' }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, completed, incomplete, pendingValidation: pending },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { punchIn, punchOut, getAttendance, getTodayAttendance, getAttendanceById, validateAttendance, getStats };
