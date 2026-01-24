const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  searchUsers,
  getPotentialMatches,
  getUserPairs,
  getUpcomingSessions
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getUsers);
router.get('/search', protect, searchUsers);
router.get('/matches', protect, getPotentialMatches);
router.get('/me/pairs', protect, getUserPairs);
router.get('/me/sessions/upcoming', protect, getUpcomingSessions);
router.get('/:id', protect, getUserById);

module.exports = router;