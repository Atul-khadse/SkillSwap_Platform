const Rating = require('../models/Rating');
const User = require('../models/User');
const Session = require('../models/Session');

// @desc    Submit a rating for a user
// @route   POST /api/ratings
// @access  Private
const submitRating = async (req, res) => {
  try {
    const { ratedUserId, score, comment, sessionId } = req.body;
    const ratedBy = req.user._id;

    // Prevent rating self
    if (ratedBy.toString() === ratedUserId) {
      return res.status(400).json({ message: 'You cannot rate yourself' });
    }

    // Optional: Check if there is a completed session between the users
    if (sessionId) {
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      if (session.status !== 'completed') {
        return res.status(400).json({ message: 'Session must be completed before rating' });
      }
      if (session.teacher.toString() !== ratedBy.toString() && session.student.toString() !== ratedBy.toString()) {
        return res.status(403).json({ message: 'You are not part of this session' });
      }
    } else {
      // Alternatively, check if there exists any completed session between users
      const sessionExists = await Session.findOne({
        $or: [
          { teacher: ratedBy, student: ratedUserId },
          { teacher: ratedUserId, student: ratedBy }
        ],
        status: 'completed'
      });
      if (!sessionExists) {
        return res.status(400).json({ message: 'No completed session found between you and this user' });
      }
    }

    // Create rating (unique index prevents duplicate)
    const rating = await Rating.create({
      ratedBy,
      ratedUser: ratedUserId,
      score,
      comment,
      session: sessionId
    });

    // Update user's ratingAverage and ratingCount
    const ratedUser = await User.findById(ratedUserId);
    const newCount = ratedUser.ratingCount + 1;
    const newAvg = ((ratedUser.ratingAverage * ratedUser.ratingCount) + score) / newCount;
    ratedUser.ratingAverage = newAvg;
    ratedUser.ratingCount = newCount;
    await ratedUser.save();

    res.status(201).json({ message: 'Rating submitted successfully', rating });
  } catch (error) {
    console.error('Rating error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already rated this user' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get ratings for a user
// @route   GET /api/ratings/user/:userId
// @access  Private
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await Rating.find({ ratedUser: userId })
      .populate('ratedBy', 'name avatar')
      .sort('-createdAt')
      .limit(20);
    res.json(ratings);
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if user has rated another user
// @route   GET /api/ratings/check/:userId
// @access  Private
const checkUserRating = async (req, res) => {
  try {
    const { userId } = req.params;
    const existing = await Rating.findOne({ ratedBy: req.user._id, ratedUser: userId });
    res.json({ rated: !!existing, rating: existing });
  } catch (error) {
    console.error('Check rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitRating,
  getUserRatings,
  checkUserRating
};