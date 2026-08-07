const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Generate daily/range attendance report
// @route   GET /api/reports/daily
// @access  Private
const getDailyReport = async (req, res, next) => {
  try {
    const { date, startDate, endDate, userId, page = 1, limit = 50 } = req.query;

    let query = {};
    const today = new Date().toISOString().split('T')[0];

    // Date filtering
    if (date) {
      query.date = date;
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    } else {
      query.date = today;
    }

    // Role-based user filtering
    if (req.user.role === 'employee') {
      query.userId = req.user._id;
    } else if (req.user.role === 'manager') {
      const team = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = team.map((m) => m._id);
      teamIds.push(req.user._id);
      query.userId = userId ? userId : { $in: teamIds };
    } else if (req.user.role === 'admin') {
      if (userId) query.userId = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(query);

    const records = await Attendance.find(query)
      .populate('userId', 'name email department role')
      .populate('validatedBy', 'name')
      .populate({
        path: 'overtimeRequest',
        populate: { path: 'reviewedBy', select: 'name' },
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Build report rows
    const report = records.map((r) => ({
      id: r._id,
      employee: r.userId?.name || 'Unknown',
      email: r.userId?.email,
      department: r.userId?.department,
      date: r.date,
      punchIn: r.punchIn?.time || null,
      punchOut: r.punchOut?.time || null,
      punchInSelfie: r.punchIn?.selfie || null,
      punchOutSelfie: r.punchOut?.selfie || null,
      punchInLocation: r.punchIn?.location || null,
      punchOutLocation: r.punchOut?.location || null,
      withinGeofence: r.punchIn?.withinGeofence,
      totalHours: r.totalHours,
      status: r.status,
      validationStatus: r.validationStatus,
      remarks: r.remarks,
      validatedBy: r.validatedBy?.name || null,
      validatedAt: r.validatedAt,
      overtime: r.overtimeRequest
        ? {
            requestedHours: r.overtimeRequest.requestedHours,
            status: r.overtimeRequest.status,
            reason: r.overtimeRequest.reason,
            reviewNote: r.overtimeRequest.reviewNote,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      data: report,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get summary stats for reports
// @route   GET /api/reports/summary
// @access  Private (manager, admin)
const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let dateQuery = {};
    if (startDate || endDate) {
      if (startDate) dateQuery.$gte = startDate;
      if (endDate) dateQuery.$lte = endDate;
    } else {
      dateQuery = today;
    }

    let userIds;
    if (req.user.role === 'manager') {
      const team = await User.find({ managerId: req.user._id }).select('_id');
      userIds = [...team.map((m) => m._id), req.user._id];
    } else {
      const all = await User.find({}).select('_id');
      userIds = all.map((u) => u._id);
    }

    const agg = await Attendance.aggregate([
      { $match: { userId: { $in: userIds }, date: typeof dateQuery === 'string' ? dateQuery : { ...dateQuery } } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          incomplete: { $sum: { $cond: [{ $eq: ['$status', 'incomplete'] }, 1, 0] } },
          valid: { $sum: { $cond: [{ $eq: ['$validationStatus', 'valid'] }, 1, 0] } },
          invalid: { $sum: { $cond: [{ $eq: ['$validationStatus', 'invalid'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$validationStatus', 'pending'] }, 1, 0] } },
          avgHours: { $avg: '$totalHours' },
        },
      },
    ]);

    res.status(200).json({ success: true, data: agg[0] || {} });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDailyReport, getSummary };
