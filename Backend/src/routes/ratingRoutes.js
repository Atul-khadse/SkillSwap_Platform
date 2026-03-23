const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  submitRating,
  getUserRatings,
  checkUserRating
} = require('../controllers/ratingController');

router.post('/', protect, submitRating);
router.get('/user/:userId', protect, getUserRatings);
router.get('/check/:userId', protect, checkUserRating);

module.exports = router;