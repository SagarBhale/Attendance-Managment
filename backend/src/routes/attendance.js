const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  punchIn,
  punchOut,
  getAttendance,
  getTodayAttendance,
  getAttendanceById,
  validateAttendance,
  getStats,
} = require('../controllers/attendanceController');

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/today', getTodayAttendance);
router.get('/', getAttendance);
router.get('/:id', getAttendanceById);

router.post('/punch-in', authorize('employee', 'manager', 'admin'), punchIn);
router.post('/punch-out', authorize('employee', 'manager', 'admin'), punchOut);

router.put('/:id/validate', authorize('manager', 'admin'), validateAttendance);

module.exports = router;
