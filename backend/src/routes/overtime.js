const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createOvertimeRequest, getOvertimeRequests, reviewOvertimeRequest } = require('../controllers/overtimeController');

const router = express.Router();

router.use(protect);

router.get('/', getOvertimeRequests);
router.post('/', authorize('employee', 'manager', 'admin'), createOvertimeRequest);
router.put('/:id', authorize('manager', 'admin'), reviewOvertimeRequest);

module.exports = router;
