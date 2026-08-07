const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getAllUsers, getUserById, updateUser, deleteUser, getTeam } = require('../controllers/usersController');

const router = express.Router();

router.use(protect);

router.get('/team', authorize('manager', 'admin'), getTeam);
router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
