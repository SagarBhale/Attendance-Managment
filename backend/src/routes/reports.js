const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getDailyReport, getSummary } = require('../controllers/reportsController');

const router = express.Router();

router.use(protect);

router.get('/daily', getDailyReport);
router.get('/summary', authorize('manager', 'admin'), getSummary);

module.exports = router;
