const OvertimeRequest = require('../models/OvertimeRequest');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const logger = require('../config/logger');

// @desc    Create overtime request
// @route   POST /api/overtime
// @access  Private (employee)
const createOvertimeRequest = async (req, res, next) => {
  try {
    const { attendanceId, requestedHours, reason } = req.body;

    if (!attendanceId || !requestedHours || !reason) {
      return res.status(400).json({ success: false, message: 'attendanceId, requestedHours, and reason are required' });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found' });

    // Ensure it belongs to the requesting employee
    if (attendance.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check no existing request for this attendance
    if (attendance.overtimeRequest) {
      return res.status(400).json({ success: false, message: 'Overtime request already exists for this day' });
    }

    const overtimeReq = await OvertimeRequest.create({
      employeeId: req.user._id,
      attendanceId,
      requestedHours,
      reason,
    });

    // Link to attendance
    attendance.overtimeRequest = overtimeReq._id;
    await attendance.save();

    // Notify manager/admin
    const io = req.app.get('io');
    if (io) {
      io.to('role_manager').emit('overtime:newRequest', {
        requestId: overtimeReq._id,
        employeeName: req.user.name,
        requestedHours,
        date: attendance.date,
      });
      io.to('role_admin').emit('overtime:newRequest', {
        requestId: overtimeReq._id,
        employeeName: req.user.name,
        requestedHours,
        date: attendance.date,
      });
    }

    logger.info(`Overtime request created by ${req.user.email} for ${requestedHours} hours`);

    res.status(201).json({ success: true, message: 'Overtime request submitted', data: overtimeReq });
  } catch (err) {
    next(err);
  }
};

// @desc    Get overtime requests (role-filtered)
// @route   GET /api/overtime
// @access  Private
const getOvertimeRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {};

    if (req.user.role === 'employee') {
      query.employeeId = req.user._id;
    } else if (req.user.role === 'manager') {
      const team = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = team.map((m) => m._id);
      teamIds.push(req.user._id);
      query.employeeId = { $in: teamIds };
    }
    // admin sees all

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await OvertimeRequest.countDocuments(query);

    const requests = await OvertimeRequest.find(query)
      .populate('employeeId', 'name email department')
      .populate('attendanceId', 'date totalHours status')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: requests,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Review overtime request (approve/reject)
// @route   PUT /api/overtime/:id
// @access  Private (manager, admin)
const reviewOvertimeRequest = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const request = await OvertimeRequest.findById(req.params.id)
      .populate('employeeId', 'name email');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already reviewed' });
    }

    request.status = status;
    request.reviewNote = reviewNote || null;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Notify the employee
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${request.employeeId._id}`).emit('overtime:reviewed', {
        requestId: request._id,
        status,
        reviewNote,
        reviewedBy: req.user.name,
      });
    }

    logger.info(`Overtime request ${request._id} ${status} by ${req.user.email}`);

    res.status(200).json({ success: true, message: `Overtime request ${status}`, data: request });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOvertimeRequest, getOvertimeRequests, reviewOvertimeRequest };
